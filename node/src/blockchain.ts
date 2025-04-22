import { sha256 } from "js-sha256"
import * as ecc from "tiny-secp256k1"
import { Buffer } from "buffer"
import { Wallet } from "./wallet"

export const MIN_REVIEWERS_PER_ACHIEVEMENT = 3

export interface ChainConfig {
  name: string
  version: string
  genesisTime: number
  awesomeComPeriod: number
  achievementSubmissionPhase: [number, number]
  achievementReviewPhase: [number, number]
  blockCreationPhase: [number, number]
  wrapUpPhase: [number, number]
  themes: string[]
}

export interface ChainHead {
  name: string
  latestBlockHeight: number
  latestBlockHash: string
}

export interface Block {
  height: number
  previousHash: string
  transactions: Transaction[]
  transactionsMerkleRoot: string
  achievements: Achievement[]
  achievementsMerkleRoot: string
  reviews: Review[]
  reviewsMerkleRoot: string
  timestamp: number
  hash: string
}

export interface Transaction {
  senderAddress: string
  recipientAddress: string
  amount: number
  timestamp: number
  senderPublicKey: string
  signature: string
}

export interface Achievement {
  edition: number
  creatorName: string
  creatorAddress: string
  title: string
  description: string
  attachments: string[]
  timestamp: number
  creatorPublicKey: string
  signature: string
}

export interface Review {
  edition: number
  achievementSignature: string
  reviewerName: string
  reviewerAddress: string
  score: number
  comment: string
  reviewerPublicKey: string
  timestamp: number
  signature: string
}

export function isChainHead(payload: unknown): payload is ChainHead {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "name" in payload &&
    "latestBlockHeight" in payload &&
    "latestBlockHash" in payload
  )
}

export function isBlock(payload: unknown): payload is Block {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "height" in payload &&
    "previousHash" in payload &&
    "transactions" in payload &&
    "transactionsMerkleRoot" in payload &&
    "achievements" in payload &&
    "achievementsMerkleRoot" in payload &&
    "reviews" in payload &&
    "reviewsMerkleRoot" in payload &&
    "timestamp" in payload &&
    "hash" in payload
  )
}

export function isTransaction(payload: unknown): payload is Transaction {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "senderAddress" in payload &&
    "recipientAddress" in payload &&
    "amount" in payload &&
    "timestamp" in payload &&
    "senderPublicKey" in payload &&
    "signature" in payload
  )
}

export function isAchievement(payload: unknown): payload is Achievement {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "edition" in payload &&
    "creatorName" in payload &&
    "creatorAddress" in payload &&
    "title" in payload &&
    "description" in payload &&
    "attachments" in payload &&
    "timestamp" in payload &&
    "creatorPublicKey" in payload &&
    "signature" in payload
  )
}

export function isReview(payload: unknown): payload is Review {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "edition" in payload &&
    "achievementSignature" in payload &&
    "reviewerName" in payload &&
    "reviewerAddress" in payload &&
    "score" in payload &&
    "comment" in payload &&
    "reviewerPublicKey" in payload &&
    "timestamp" in payload &&
    "signature" in payload
  )
}

export function hashBlock(block: Block) {
  const hash = sha256(
    [
      block.previousHash,
      block.transactionsMerkleRoot,
      block.achievementsMerkleRoot,
      block.reviewsMerkleRoot,
      block.timestamp,
    ].join("_")
  )
  return hash
}

export function verifyBlock(block: Block): boolean {
  if (hashBlock(block) !== block.hash) {
    return false
  }
  if (
    computeMerkleRoot(block.transactions.map((transaction) => transaction.signature)) !== block.transactionsMerkleRoot
  ) {
    return false
  }
  if (
    computeMerkleRoot(block.achievements.map((achievement) => achievement.signature)) !== block.achievementsMerkleRoot
  ) {
    return false
  }
  if (computeMerkleRoot(block.reviews.map((review) => review.signature)) !== block.reviewsMerkleRoot) {
    return false
  }

  for (const transaction of block.transactions) {
    if (!verifyTransaction(transaction)) {
      return false
    }
  }

  const achievementReviews = new Map<string, Review[]>()
  for (const review of block.reviews) {
    if (!verifyReview(review)) {
      return false
    }
    const reviews = achievementReviews.get(review.achievementSignature) || []
    reviews.push(review)
    achievementReviews.set(review.achievementSignature, reviews)
  }

  if (achievementReviews.size !== block.achievements.length) {
    return false
  }

  for (const achievement of block.achievements) {
    if (!verifyAchievement(achievement)) {
      return false
    }
    // enough reviews and median score is 3 (weak accept)
    const reviews = achievementReviews.get(achievement.signature) || []
    const latestReviews = reviews
      .sort((a, b) => b.timestamp - a.timestamp)
      .filter((review, index, self) => index === self.findIndex((r) => r.reviewerAddress === review.reviewerAddress))
    if (latestReviews.length < MIN_REVIEWERS_PER_ACHIEVEMENT) {
      return false
    }

    const scores = latestReviews.map((review) => review.score).sort((a, b) => a - b)
    const medianScore = scores[Math.floor(scores.length / 2)]
    if (medianScore < 3) {
      return false
    }
  }

  return true
}

export function signTransaction(transaction: Transaction, wallet: Wallet): string {
  const hash = sha256(
    [
      transaction.senderAddress,
      transaction.recipientAddress,
      transaction.amount,
      transaction.timestamp,
      transaction.senderPublicKey,
    ].join("_")
  )
  return wallet.sign(hash)
}

export function verifyTransaction(transaction: Transaction): boolean {
  const hash = sha256(
    [
      transaction.senderAddress,
      transaction.recipientAddress,
      transaction.amount,
      transaction.timestamp,
      transaction.senderPublicKey,
    ].join("_")
  )

  return ecc.verify(
    Buffer.from(hash, "hex"),
    Buffer.from(transaction.senderPublicKey, "hex"),
    Buffer.from(transaction.signature, "hex")
  )
}

export function signAchievement(achievement: Achievement, wallet: Wallet): string {
  const hash = sha256(
    [
      achievement.creatorName,
      achievement.creatorAddress,
      achievement.title,
      achievement.description,
      achievement.attachments.join(","),
      achievement.timestamp,
      achievement.creatorPublicKey,
    ].join("_")
  )
  return wallet.sign(hash)
}

export function verifyAchievement(achievement: Achievement): boolean {
  const hash = sha256(
    [
      achievement.creatorName,
      achievement.creatorAddress,
      achievement.title,
      achievement.description,
      achievement.attachments.join(","),
      achievement.timestamp,
      achievement.creatorPublicKey,
    ].join("_")
  )

  return ecc.verify(
    Buffer.from(hash, "hex"),
    Buffer.from(achievement.creatorPublicKey, "hex"),
    Buffer.from(achievement.signature, "hex")
  )
}

export function signReview(review: Review, wallet: Wallet): string {
  const hash = sha256(
    [
      review.achievementSignature,
      review.reviewerName,
      review.reviewerAddress,
      review.score,
      review.comment,
      review.timestamp,
      review.reviewerPublicKey,
    ].join("_")
  )
  return wallet.sign(hash)
}

export function verifyReview(review: Review): boolean {
  if (review.score < 0 || review.score > 5) {
    return false
  }
  const hash = sha256(
    [
      review.achievementSignature,
      review.reviewerName,
      review.reviewerAddress,
      review.score,
      review.comment,
      review.timestamp,
      review.reviewerPublicKey,
    ].join("_")
  )

  return ecc.verify(
    Buffer.from(hash, "hex"),
    Buffer.from(review.reviewerPublicKey, "hex"),
    Buffer.from(review.signature, "hex")
  )
}

export function computeMerkleRoot(items: string[]): string {
  if (items.length === 0) {
    return sha256("")
  }

  let hashes = items.map((item) => sha256(item))

  while (hashes.length > 1) {
    const newLevel: string[] = []

    for (let i = 0; i < hashes.length; i += 2) {
      if (i + 1 < hashes.length) {
        const combined = hashes[i] + hashes[i + 1]
        const hash = sha256(combined)
        newLevel.push(hash)
      } else {
        newLevel.push(hashes[i])
      }
    }

    hashes = newLevel
  }

  return hashes[0]
}
