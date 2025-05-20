import { sha256 } from "js-sha256"
import * as ecc from "tiny-secp256k1"
import { Buffer } from "buffer"
import { Wallet } from "./wallet"
import { MerkleTree } from "./merkle"

export const chainConfig = {
  chainId: "Proof-of-Awesome-0.1.0",
  genesisTime: new Date("2025-03-14T00:00:00Z").getTime(),

  awesomeCom: {
    period: 180 * 1000,
    submissionPhase: [0, 120 * 1000],
    reviewPhase: [120 * 1000, 150 * 1000],
    consensusPhase: [150 * 1000, 170 * 1000],
    announcementPhase: [170 * 1000, 180 * 1000],
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
    acceptedAchievement: 1,
  },
} as const

export interface AwesomeComStatus {
  session: number
  phase: "Submission" | "Review" | "Consensus" | "Announcement"
  sessionRemaining: number
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

  const session = Math.floor(timeSinceGenesis / chainConfig.awesomeCom.period)
  const sessionElapsedTime = timeSinceGenesis % chainConfig.awesomeCom.period

  const status: AwesomeComStatus = {
    session,
    phase: "Announcement",
    sessionRemaining: chainConfig.awesomeCom.period - sessionElapsedTime,
    phaseRemaining: 0,
  }

  const phases = [
    { name: "Submission", window: chainConfig.awesomeCom.submissionPhase },
    { name: "Review", window: chainConfig.awesomeCom.reviewPhase },
    { name: "Consensus", window: chainConfig.awesomeCom.consensusPhase },
    { name: "Announcement", window: chainConfig.awesomeCom.announcementPhase },
  ] as const

  for (const { name, window } of phases) {
    if (sessionElapsedTime < window[1]) {
      status.phase = name
      status.phaseRemaining = window[1] - sessionElapsedTime
      break
    }
  }

  return status
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
  transactionsCount: number
  achievementsCount: number
  reviewsCount: number
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
  blockHeight: number
}

export interface Achievement {
  targetBlock: number
  authorName: string
  authorAddress: string
  description: string
  attachment: string
  timestamp: number
  authorPublicKey: string
  signature: string
}

export interface Review {
  targetBlock: number
  achievementSignature: string
  reviewerName: string
  reviewerAddress: string
  scores: ReviewScores
  comment: string
  reviewerPublicKey: string
  timestamp: number
  signature: string
}

export type ReviewScores = {
  overall: number
  innovation: number
  dedication: number
  significance: number
  presentation: number
}

export function isAccount(payload: unknown): payload is Account {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "address" in payload &&
    typeof payload.address === "string" &&
    "balance" in payload &&
    typeof payload.balance === "number" &&
    "nonce" in payload &&
    typeof payload.nonce === "number" &&
    "acceptedAchievements" in payload &&
    typeof payload.acceptedAchievements === "number"
  )
}

export function isChainHead(payload: unknown): payload is ChainHead {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "chainId" in payload &&
    typeof payload.chainId === "string" &&
    "latestBlockHeight" in payload &&
    typeof payload.latestBlockHeight === "number" &&
    "latestBlockHash" in payload &&
    typeof payload.latestBlockHash === "string" &&
    "timestamp" in payload &&
    typeof payload.timestamp === "number" &&
    "nodePublicKey" in payload &&
    typeof payload.nodePublicKey === "string" &&
    "signature" in payload &&
    typeof payload.signature === "string"
  )
}

export function isBlockHeader(payload: unknown): payload is BlockHeader {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "height" in payload &&
    typeof payload.height === "number" &&
    "previousHash" in payload &&
    typeof payload.previousHash === "string" &&
    "accountsRoot" in payload &&
    typeof payload.accountsRoot === "string" &&
    "transactionsRoot" in payload &&
    typeof payload.transactionsRoot === "string" &&
    "achievementsRoot" in payload &&
    typeof payload.achievementsRoot === "string" &&
    "reviewsRoot" in payload &&
    typeof payload.reviewsRoot === "string" &&
    "transactionsCount" in payload &&
    typeof payload.transactionsCount === "number" &&
    "achievementsCount" in payload &&
    typeof payload.achievementsCount === "number" &&
    "reviewsCount" in payload &&
    typeof payload.reviewsCount === "number" &&
    "timestamp" in payload &&
    typeof payload.timestamp === "number" &&
    "hash" in payload &&
    typeof payload.hash === "string"
  )
}

export function isBlock(payload: unknown): payload is Block {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "header" in payload &&
    isBlockHeader(payload.header) &&
    "transactions" in payload &&
    Array.isArray(payload.transactions) &&
    payload.transactions.every((transaction) => isTransaction(transaction)) &&
    "achievements" in payload &&
    Array.isArray(payload.achievements) &&
    payload.achievements.every((achievement) => isAchievement(achievement)) &&
    "reviews" in payload &&
    Array.isArray(payload.reviews) &&
    payload.reviews.every((review) => isReview(review))
  )
}

export function isTransaction(payload: unknown): payload is Transaction {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "senderAddress" in payload &&
    typeof payload.senderAddress === "string" &&
    "recipientAddress" in payload &&
    typeof payload.recipientAddress === "string" &&
    "amount" in payload &&
    typeof payload.amount === "number" &&
    "nonce" in payload &&
    typeof payload.nonce === "number" &&
    "timestamp" in payload &&
    typeof payload.timestamp === "number" &&
    "senderPublicKey" in payload &&
    typeof payload.senderPublicKey === "string" &&
    "signature" in payload &&
    typeof payload.signature === "string" &&
    "blockHeight" in payload &&
    typeof payload.blockHeight === "number" &&
    (payload.blockHeight === -1 || payload.blockHeight >= 1)
  )
}

export function isAchievement(payload: unknown): payload is Achievement {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "targetBlock" in payload &&
    typeof payload.targetBlock === "number" &&
    "authorName" in payload &&
    typeof payload.authorName === "string" &&
    "authorAddress" in payload &&
    typeof payload.authorAddress === "string" &&
    "description" in payload &&
    typeof payload.description === "string" &&
    "attachment" in payload &&
    typeof payload.attachment === "string" &&
    "timestamp" in payload &&
    typeof payload.timestamp === "number" &&
    "authorPublicKey" in payload &&
    typeof payload.authorPublicKey === "string" &&
    "signature" in payload &&
    typeof payload.signature === "string"
  )
}

export function isReview(payload: unknown): payload is Review {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "targetBlock" in payload &&
    typeof payload.targetBlock === "number" &&
    "achievementSignature" in payload &&
    typeof payload.achievementSignature === "string" &&
    "reviewerName" in payload &&
    typeof payload.reviewerName === "string" &&
    "reviewerAddress" in payload &&
    typeof payload.reviewerAddress === "string" &&
    "scores" in payload &&
    typeof payload.scores === "object" &&
    "comment" in payload &&
    typeof payload.comment === "string" &&
    "reviewerPublicKey" in payload &&
    typeof payload.reviewerPublicKey === "string" &&
    "timestamp" in payload &&
    typeof payload.timestamp === "number" &&
    "signature" in payload &&
    typeof payload.signature === "string"
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
      blockHeader.transactionsCount,
      blockHeader.achievementsCount,
      blockHeader.reviewsCount,
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
  if (block.header.transactionsCount !== block.transactions.length) {
    return false
  }
  if (block.header.achievementsCount !== block.achievements.length) {
    return false
  }
  if (block.header.reviewsCount !== block.reviews.length) {
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
      achievement.targetBlock,
      achievement.authorName,
      achievement.authorAddress,
      achievement.description,
      achievement.attachment,
      achievement.timestamp,
      achievement.authorPublicKey,
    ].join("_")
  )
  return wallet.sign(hash)
}

export function verifyAchievement(achievement: Achievement): boolean {
  const hash = sha256(
    [
      achievement.targetBlock,
      achievement.authorName,
      achievement.authorAddress,
      achievement.description,
      achievement.attachment,
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
      review.targetBlock,
      review.achievementSignature,
      review.reviewerName,
      review.reviewerAddress,
      review.scores.overall,
      review.scores.innovation,
      review.scores.dedication,
      review.scores.significance,
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
    review.scores.innovation < 0 ||
    review.scores.innovation > 5 ||
    review.scores.dedication < 0 ||
    review.scores.dedication > 5 ||
    review.scores.significance < 0 ||
    review.scores.significance > 5 ||
    review.scores.presentation < 0 ||
    review.scores.presentation > 5
  ) {
    return false
  }
  const hash = sha256(
    [
      review.targetBlock,
      review.achievementSignature,
      review.reviewerName,
      review.reviewerAddress,
      review.scores.overall,
      review.scores.innovation,
      review.scores.dedication,
      review.scores.significance,
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
