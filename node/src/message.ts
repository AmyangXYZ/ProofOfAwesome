import { Transaction, Block, Achievement, Review, ChainHead, isChainHead } from "./awesome"

export enum MESSAGE_TYPE {
  // periodically broadcasted by full nodes
  CHAIN_HEAD = "CHAIN_HEAD",
  // exchanged between full nodes in block creation (tpc meeting) phase
  CANDIDATE_BLOCK = "CANDIDATE_BLOCK",
  // broadcasted by full nodes in wrap up (announcement) phase
  NEW_BLOCK = "NEW_BLOCK",
  NEW_TRANSACTION = "NEW_TRANSACTION",
  NEW_ACHIEVEMENT = "NEW_ACHIEVEMENT",
  NEW_REVIEW = "NEW_REVIEW",
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

export function isChainHeadRequest(payload: unknown): payload is ChainHeadRequest {
  return typeof payload === "object" && payload !== null && "requestId" in payload
}

export function isChainHeadResponse(payload: unknown): payload is ChainHeadResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    "chainHead" in payload &&
    isChainHead(payload.chainHead)
  )
}
