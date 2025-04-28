import {
  Transaction,
  Block,
  Achievement,
  Review,
  ChainHead,
  isChainHead,
  isBlock,
  isTransaction,
  isAchievement,
  isReview,
  Account,
  isAccount,
} from "./awesome"
import { isSparseMerkleProof, MerkleProof, SparseMerkleProof } from "./merkle"

export enum MESSAGE_TYPE {
  // periodically broadcasted by full nodes
  CHAIN_HEAD = "CHAIN_HEAD",
  // exchanged among full nodes in block creation (tpc meeting) phase
  CANDIDATE_BLOCK = "CANDIDATE_BLOCK",
  // actively broadcasted by creators
  NEW_BLOCK = "NEW_BLOCK",
  NEW_TRANSACTION = "NEW_TRANSACTION",
  NEW_ACHIEVEMENT = "NEW_ACHIEVEMENT",
  NEW_REVIEW = "NEW_REVIEW",
  // data sync
  ACCOUNT_REQUEST = "ACCOUNT_REQUEST",
  ACCOUNT_RESPONSE = "ACCOUNT_RESPONSE",
  ACCOUNTS_REQUEST = "ACCOUNTS_REQUEST",
  ACCOUNTS_RESPONSE = "ACCOUNTS_RESPONSE",
  CHAIN_HEAD_REQUEST = "CHAIN_HEAD_REQUEST",
  CHAIN_HEAD_RESPONSE = "CHAIN_HEAD_RESPONSE",
  BLOCK_REQUEST = "BLOCK_REQUEST",
  BLOCK_RESPONSE = "BLOCK_RESPONSE",
  BLOCKS_REQUEST = "BLOCKS_REQUEST",
  BLOCKS_RESPONSE = "BLOCKS_RESPONSE",
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

export interface AccountRequest {
  requestId: string
  address: string
}

export interface AccountResponse {
  requestId: string
  account: Account
  proof: SparseMerkleProof
}

export interface AccountsRequest {
  requestId: string
  all?: boolean
  addresses?: string[]
  limit?: number
}

export interface AccountsResponse {
  requestId: string
  accounts: Account[]
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
  proof: MerkleProof
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

export function isAccountRequest(payload: unknown): payload is AccountRequest {
  return typeof payload === "object" && payload !== null && "requestId" in payload && "address" in payload
}

export function isAccountResponse(payload: unknown): payload is AccountResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    "account" in payload &&
    isAccount(payload.account) &&
    "proof" in payload &&
    isSparseMerkleProof(payload.proof)
  )
}

export function isAccountsRequest(payload: unknown): payload is AccountsRequest {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    ("all" in payload || "addresses" in payload || "limit" in payload)
  )
}

export function isAccountsResponse(payload: unknown): payload is AccountsResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    "accounts" in payload &&
    Array.isArray(payload.accounts) &&
    payload.accounts.every((account) => isAccount(account))
  )
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

export function isBlockRequest(payload: unknown): payload is BlockRequest {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    ("hash" in payload || "height" in payload)
  )
}

export function isBlockResponse(payload: unknown): payload is BlockResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    "block" in payload &&
    isBlock(payload.block)
  )
}

export function isBlocksRequest(payload: unknown): payload is BlocksRequest {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    "fromHeight" in payload &&
    "toHeight" in payload
  )
}

export function isBlocksResponse(payload: unknown): payload is BlocksResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    "blocks" in payload &&
    Array.isArray(payload.blocks) &&
    payload.blocks.every((block) => isBlock(block))
  )
}

export function isTransactionRequest(payload: unknown): payload is TransactionRequest {
  return typeof payload === "object" && payload !== null && "requestId" in payload && "signature" in payload
}

export function isTransactionResponse(payload: unknown): payload is TransactionResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    "transaction" in payload &&
    isTransaction(payload.transaction)
  )
}

export function isTransactionsRequest(payload: unknown): payload is TransactionsRequest {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    ("senderAddress" in payload || "recipientAddress" in payload || "signatures" in payload || "limit" in payload)
  )
}

export function isTransactionsResponse(payload: unknown): payload is TransactionsResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    "transactions" in payload &&
    Array.isArray(payload.transactions) &&
    payload.transactions.every((transaction) => isTransaction(transaction))
  )
}

export function isAchievementRequest(payload: unknown): payload is AchievementRequest {
  return typeof payload === "object" && payload !== null && "requestId" in payload && "signature" in payload
}

export function isAchievementResponse(payload: unknown): payload is AchievementResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    "achievement" in payload &&
    isAchievement(payload.achievement)
  )
}

export function isAchievementsRequest(payload: unknown): payload is AchievementsRequest {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    ("edition" in payload ||
      "creatorAddress" in payload ||
      "theme" in payload ||
      "signatures" in payload ||
      "limit" in payload)
  )
}

export function isAchievementsResponse(payload: unknown): payload is AchievementsResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    "achievements" in payload &&
    Array.isArray(payload.achievements) &&
    payload.achievements.every((achievement) => isAchievement(achievement))
  )
}

export function isReviewRequest(payload: unknown): payload is ReviewRequest {
  return typeof payload === "object" && payload !== null && "requestId" in payload && "signature" in payload
}

export function isReviewResponse(payload: unknown): payload is ReviewResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    "review" in payload &&
    isReview(payload.review)
  )
}

export function isReviewsRequest(payload: unknown): payload is ReviewsRequest {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    ("achievementSignature" in payload ||
      "edition" in payload ||
      "reviewerAddress" in payload ||
      "signatures" in payload ||
      "limit" in payload)
  )
}

export function isReviewsResponse(payload: unknown): payload is ReviewsResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    "reviews" in payload &&
    Array.isArray(payload.reviews) &&
    payload.reviews.every((review) => isReview(review))
  )
}
