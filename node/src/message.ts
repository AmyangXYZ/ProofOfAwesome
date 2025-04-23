import { Transaction, Block, Achievement, Review, ChainHead } from "./awesome"

export enum MESSAGE_TYPE {
  CHAIN_HEAD = "CHAIN_HEAD",
  CANDIDATE_BLOCK = "CANDIDATE_BLOCK",
  BLOCK = "BLOCK",
  TRANSACTION = "TRANSACTION",
  ACHIEVEMENT = "ACHIEVEMENT",
  REVIEW = "REVIEW",
  CHAIN_HEAD_REQUEST = "CHAIN_HEAD_REQUEST",
  CHAIN_HEAD_RESPONSE = "CHAIN_HEAD_RESPONSE",
  BLOCK_REQUEST = "BLOCK_REQUEST",
  BLOCK_RESPONSE = "BLOCK_RESPONSE",
  TRANSACTION_REQUEST = "TRANSACTION_REQUEST",
  TRANSACTION_RESPONSE = "TRANSACTION_RESPONSE",
  TRANSACTIONS_REQUEST = "TRANSACTIONS_REQUEST",
  TRANSACTIONS_RESPONSE = "TRANSACTIONS_RESPONSE",
  ACHIEVEMENT_REQUEST = "ACHIEVEMENT_REQUEST",
  ACHIEVEMENT_RESPONSE = "ACHIEVEMENT_RESPONSE",
  ACHIEVEMENTS_REQUEST = "ACHIEVEMENTS_REQUEST",
  ACHIEVEMENTS_RESPONSE = "ACHIEVEMENTS_RESPONSE",
  REVIEW_REQUEST = "REVIEW_REQUEST",
  REVIEW_RESPONSE = "REVIEW_RESPONSE",
  REVIEWS_REQUEST = "REVIEWS_REQUEST",
  REVIEWS_RESPONSE = "REVIEWS_RESPONSE",
}

export interface ChainHeadRequest {
  requestId: string
}

export interface ChainHeadResponse {
  requestId: string
  chainHead: ChainHead
}

export interface BlockRequest {
  requestId: string
  hash?: string
  height?: number
}

export interface BlockResponse {
  requestId: string
  block: Block
}

export interface BlocksRequest {
  requestId: string
  fromHeight: number
  toHeight: number
}

export interface BlocksResponse {
  requestId: string
  blocks: Block[]
}

export interface TransactionRequest {
  requestId: string
  signature: string
}

export interface TransactionResponse {
  requestId: string
  transaction: Transaction
}

export interface TransactionsRequest {
  requestId: string
  senderAddress?: string
  recipientAddress?: string
  signatures?: string[]
  limit?: number
}

export interface TransactionsResponse {
  requestId: string
  transactions: Transaction[]
}

export interface AchievementRequest {
  requestId: string
  signature: string
}

export interface AchievementResponse {
  requestId: string
  achievement: Achievement
}

export interface AchievementsRequest {
  requestId: string
  edition?: number
  creatorAddress?: string
  theme?: string
  signatures?: string[]
  limit?: number
}

export interface AchievementsResponse {
  requestId: string
  achievements: Achievement[]
}

export interface ReviewRequest {
  requestId: string
  signature: string
}

export interface ReviewResponse {
  requestId: string
  review: Review
}

export interface ReviewsRequest {
  requestId: string
  achievementSignature?: string
  edition?: number
  reviewerAddress?: string
  signatures?: string[]
  limit?: number
}

export interface ReviewsResponse {
  requestId: string
  reviews: Review[]
}
