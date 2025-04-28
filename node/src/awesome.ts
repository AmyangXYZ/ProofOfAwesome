import { sha256 } from "js-sha256"
import * as ecc from "tiny-secp256k1"
import { Buffer } from "buffer"
import { Wallet } from "./wallet"
import { MerkleTree } from "./merkle"

export const chainConfig = {
  chainId: "proof-of-awesome-0.1.0",
  genesisTime: new Date("2025-04-24T16:00:00Z").getTime(),

  awesomeCom: {
    period: 15 * 1000,
    themes: ["life", "gaming", "fitness", "art", "meme", "home"],
    submissionPhase: [0, 8 * 1000],
    reviewPhase: [8 * 1000, 12 * 1000],
    consensusPhase: [12 * 1000, 14 * 1000],
    announcementPhase: [14 * 1000, 15 * 1000],
  },
  reviewRules: {
    minReviewPerAchievement: 1,
    scores: {
      1: "reject",
      2: "weak reject",
      3: "weak accept",
      4: "accept",
      5: "strong accept",
    } as const,
    acceptThreshold: 3,
  },
  rewardRules: {
    acceptedAchievements: 10,
  },
} as const

export interface AwesomeComStatus {
  edition: number
  theme: string
  phase: "Submission" | "Review" | "Consensus" | "Announcement"
  editionRemaining: number
  phaseRemaining: number
}

export async function waitForGenesis() {
  while (true) {
    const timeSinceGenesis = Date.now() - chainConfig.genesisTime
    if (timeSinceGenesis >= 0) {
      return
    }
    const remaining = -timeSinceGenesis
    const waitTime = Math.min(60 * 1000, remaining)
    console.log(`Waiting for genesis: ${Math.round(remaining / 1000)}s remaining`)
    await new Promise((resolve) => setTimeout(resolve, waitTime))
  }
}

export function getAwesomeComStatus(): AwesomeComStatus {
  const now = Date.now()
  const timeSinceGenesis = now - chainConfig.genesisTime

  const edition = Math.floor(timeSinceGenesis / chainConfig.awesomeCom.period)
  const editionElapsedTime = timeSinceGenesis % chainConfig.awesomeCom.period

  const status: AwesomeComStatus = {
    edition,
    theme: getTheme(edition),
    phase: "Announcement",
    editionRemaining: chainConfig.awesomeCom.period - editionElapsedTime,
    phaseRemaining: 0,
  }

  const phases = [
    { name: "Submission", window: chainConfig.awesomeCom.submissionPhase },
    { name: "Review", window: chainConfig.awesomeCom.reviewPhase },
    { name: "Consensus", window: chainConfig.awesomeCom.consensusPhase },
    { name: "Announcement", window: chainConfig.awesomeCom.announcementPhase },
  ] as const

  for (const { name, window } of phases) {
    if (editionElapsedTime < window[1]) {
      status.phase = name
      status.phaseRemaining = window[1] - editionElapsedTime
      break
    }
  }

  return status
}

export function getTheme(edition: number) {
  const hash = sha256(edition.toString())
  const themeIndex = parseInt(hash.substring(0, 8), 16) % chainConfig.awesomeCom.themes.length
  return chainConfig.awesomeCom.themes[themeIndex]
}

export interface Account {
  address: string
  balance: number
  nonce: number
  acceptedAchievements: number
}

export interface ChainHead {
  chainId: string
  latestBlockHeight: number
  latestBlockHash: string
  timestamp: number
  nodePublicKey: string
  signature: string
}

export interface BlockHeader {
  height: number
  previousHash: string
  accountsRoot: string
  transactionsRoot: string
  achievementsRoot: string
  reviewsRoot: string
  timestamp: number
  hash: string
}

export interface Block {
  header: BlockHeader
  transactions: Transaction[]
  achievements: Achievement[]
  reviews: Review[]
}

export interface Transaction {
  senderAddress: string
  recipientAddress: string
  amount: number
  nonce: number
  timestamp: number
  senderPublicKey: string
  signature: string
}

export interface Achievement {
  edition: number
  authorName: string
  authorAddress: string
  title: string
  description: string
  attachments: string[]
  timestamp: number
  authorPublicKey: string
  signature: string
}

export interface Review {
  edition: number
  achievementSignature: string
  reviewerName: string
  reviewerAddress: string
  scores: {
    overall: number
    originality: number
    creativity: number
    difficulty: number
    relevance: number
    presentation: number
  }
  comment: string
  reviewerPublicKey: string
  timestamp: number
  signature: string
}

export function isAccount(payload: unknown): payload is Account {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "address" in payload &&
    "balance" in payload &&
    "nonce" in payload &&
    "acceptedAchievements" in payload
  )
}

export function isChainHead(payload: unknown): payload is ChainHead {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "chainId" in payload &&
    "latestBlockHeight" in payload &&
    "latestBlockHash" in payload
  )
}

export function isBlockHeader(payload: unknown): payload is BlockHeader {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "height" in payload &&
    "previousHash" in payload &&
    "accountsRoot" in payload &&
    "transactionsRoot" in payload &&
    "achievementsRoot" in payload &&
    "reviewsRoot" in payload &&
    "timestamp" in payload &&
    "hash" in payload
  )
}

export function isBlock(payload: unknown): payload is Block {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "header" in payload &&
    "transactions" in payload &&
    "achievements" in payload &&
    "reviews" in payload
  )
}

export function isTransaction(payload: unknown): payload is Transaction {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "senderAddress" in payload &&
    "recipientAddress" in payload &&
    "amount" in payload &&
    "nonce" in payload &&
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

export function signChainHead(chainHead: ChainHead, wallet: Wallet): string {
  const hash = sha256(
    [
      chainHead.chainId,
      chainHead.latestBlockHeight,
      chainHead.latestBlockHash,
      chainHead.timestamp,
      chainHead.nodePublicKey,
    ].join("_")
  )
  return wallet.sign(hash)
}

export function verifyChainHead(chainHead: ChainHead): boolean {
  const hash = sha256(
    [
      chainHead.chainId,
      chainHead.latestBlockHeight,
      chainHead.latestBlockHash,
      chainHead.timestamp,
      chainHead.nodePublicKey,
    ].join("_")
  )
  return ecc.verify(
    Buffer.from(hash, "hex"),
    Buffer.from(chainHead.nodePublicKey, "hex"),
    Buffer.from(chainHead.signature, "hex")
  )
}

export function hashBlockHeader(blockHeader: BlockHeader) {
  const hash = sha256(
    [
      blockHeader.previousHash,
      blockHeader.accountsRoot,
      blockHeader.transactionsRoot,
      blockHeader.achievementsRoot,
      blockHeader.reviewsRoot,
      blockHeader.timestamp,
    ].join("_")
  )
  return hash
}

export function verifyBlockHeader(blockHeader: BlockHeader): boolean {
  if (hashBlockHeader(blockHeader) !== blockHeader.hash) {
    return false
  }
  return true
}

export function verifyBlock(block: Block): boolean {
  if (!verifyBlockHeader(block.header)) {
    return false
  }
  if (
    MerkleTree.calculateRoot(block.transactions.map((transaction) => transaction.signature)) !==
    block.header.transactionsRoot
  ) {
    return false
  }
  if (
    MerkleTree.calculateRoot(block.achievements.map((achievement) => achievement.signature)) !==
    block.header.achievementsRoot
  ) {
    return false
  }
  if (MerkleTree.calculateRoot(block.reviews.map((review) => review.signature)) !== block.header.reviewsRoot) {
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
    if (latestReviews.length < chainConfig.reviewRules.minReviewPerAchievement) {
      return false
    }

    const overallScores = latestReviews.map((review) => review.scores.overall).sort((a, b) => a - b)
    const medianScore = overallScores[Math.floor(overallScores.length / 2)]
    if (medianScore < chainConfig.reviewRules.acceptThreshold) {
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
      achievement.authorName,
      achievement.authorAddress,
      achievement.title,
      achievement.description,
      achievement.attachments.join(","),
      achievement.timestamp,
      achievement.authorPublicKey,
    ].join("_")
  )
  return wallet.sign(hash)
}

export function verifyAchievement(achievement: Achievement): boolean {
  const hash = sha256(
    [
      achievement.authorName,
      achievement.authorAddress,
      achievement.title,
      achievement.description,
      achievement.attachments.join(","),
      achievement.timestamp,
      achievement.authorPublicKey,
    ].join("_")
  )

  return ecc.verify(
    Buffer.from(hash, "hex"),
    Buffer.from(achievement.authorPublicKey, "hex"),
    Buffer.from(achievement.signature, "hex")
  )
}

export function signReview(review: Review, wallet: Wallet): string {
  const hash = sha256(
    [
      review.achievementSignature,
      review.reviewerName,
      review.reviewerAddress,
      review.scores.overall,
      review.scores.originality,
      review.scores.creativity,
      review.scores.difficulty,
      review.scores.relevance,
      review.scores.presentation,
      review.comment,
      review.timestamp,
      review.reviewerPublicKey,
    ].join("_")
  )
  return wallet.sign(hash)
}

export function verifyReview(review: Review): boolean {
  if (
    review.scores.overall < 0 ||
    review.scores.overall > 5 ||
    review.scores.originality < 0 ||
    review.scores.originality > 5 ||
    review.scores.creativity < 0 ||
    review.scores.creativity > 5 ||
    review.scores.difficulty < 0 ||
    review.scores.difficulty > 5 ||
    review.scores.relevance < 0 ||
    review.scores.relevance > 5 ||
    review.scores.presentation < 0 ||
    review.scores.presentation > 5
  ) {
    return false
  }
  const hash = sha256(
    [
      review.achievementSignature,
      review.reviewerName,
      review.reviewerAddress,
      review.scores.overall,
      review.scores.originality,
      review.scores.creativity,
      review.scores.difficulty,
      review.scores.relevance,
      review.scores.presentation,
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
