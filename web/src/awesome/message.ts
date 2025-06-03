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
  BlockHeader,
  isBlockHeader,
} from "./awesome"
import { isSparseMerkleProof, SparseMerkleProof } from "./merkle"

export enum MESSAGE_TYPE {
  // periodically broadcasted by full nodes
  CHAIN_HEAD = "CHAIN_HEAD",
  // broadcasted among full nodes in the consensus phase
  CANDIDATE_BLOCK = "CANDIDATE_BLOCK",
  // broadcasted to light nodes in the announcement phase
  NEW_BLOCK = "NEW_BLOCK",
  // broadcasted to full nodes from any node in any phase
  NEW_TRANSACTION = "NEW_TRANSACTION",
  // broadcasted to all nodes in the submission phase
  NEW_ACHIEVEMENT = "NEW_ACHIEVEMENT",
  // broadcasted to all nodes in the review phase
  NEW_REVIEW = "NEW_REVIEW",
  // data queries
  CHAIN_HEAD_REQUEST = "CHAIN_HEAD_REQUEST",
  CHAIN_HEAD_RESPONSE = "CHAIN_HEAD_RESPONSE",
  BLOCK_HEADER_REQUEST = "BLOCK_HEADER_REQUEST",
  BLOCK_HEADER_RESPONSE = "BLOCK_HEADER_RESPONSE",
  BLOCK_HEADERS_REQUEST = "BLOCK_HEADERS_REQUEST",
  BLOCK_HEADERS_RESPONSE = "BLOCK_HEADERS_RESPONSE",
  BLOCK_REQUEST = "BLOCK_REQUEST",
  BLOCK_RESPONSE = "BLOCK_RESPONSE",
  BLOCKS_REQUEST = "BLOCKS_REQUEST",
  BLOCKS_RESPONSE = "BLOCKS_RESPONSE",
  // data queries from light nodes only
  ACCOUNT_REQUEST = "ACCOUNT_REQUEST",
  ACCOUNT_RESPONSE = "ACCOUNT_RESPONSE",
  ACCOUNTS_REQUEST = "ACCOUNTS_REQUEST",
  ACCOUNTS_RESPONSE = "ACCOUNTS_RESPONSE",
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

export interface BlockHeaderRequest {
  requestId: string
  height: number
}

export interface BlockHeaderResponse {
  requestId: string
  blockHeader: BlockHeader
}

export interface BlockHeadersRequest {
  requestId: string
  fromHeight: number
  toHeight: number
}

export interface BlockHeadersResponse {
  requestId: string
  blockHeaders: BlockHeader[]
}

export interface BlockRequest {
  requestId: string
  height: number
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
  targetBlock?: number
  authorAddress?: string
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
  targetBlock?: number
  achievementSignature?: string
  reviewerAddress?: string
  limit?: number
}

export interface ReviewsResponse {
  requestId: string
  reviews: Review[]
}

export function isAccountRequest(payload: unknown): payload is AccountRequest {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    typeof payload.requestId === "string" &&
    "address" in payload &&
    typeof payload.address === "string"
  )
}

export function isAccountResponse(payload: unknown): payload is AccountResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    typeof payload.requestId === "string" &&
    "account" in payload &&
    isAccount(payload.account) &&
    "proof" in payload &&
    isSparseMerkleProof(payload.proof)
  )
}

export function isAccountsRequest(payload: unknown): payload is AccountsRequest {
  return (
    typeof payload === "object" && payload !== null && "requestId" in payload && typeof payload.requestId === "string"
  )
}

export function isAccountsResponse(payload: unknown): payload is AccountsResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    typeof payload.requestId === "string" &&
    "accounts" in payload &&
    Array.isArray(payload.accounts) &&
    payload.accounts.every((account) => isAccount(account))
  )
}

export function isChainHeadRequest(payload: unknown): payload is ChainHeadRequest {
  return (
    typeof payload === "object" && payload !== null && "requestId" in payload && typeof payload.requestId === "string"
  )
}

export function isChainHeadResponse(payload: unknown): payload is ChainHeadResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    typeof payload.requestId === "string" &&
    "chainHead" in payload &&
    isChainHead(payload.chainHead)
  )
}

export function isBlockHeaderRequest(payload: unknown): payload is BlockHeaderRequest {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    typeof payload.requestId === "string" &&
    "height" in payload &&
    typeof payload.height === "number"
  )
}

export function isBlockHeaderResponse(payload: unknown): payload is BlockHeaderResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    typeof payload.requestId === "string" &&
    "blockHeader" in payload &&
    isBlockHeader(payload.blockHeader)
  )
}

export function isBlockHeadersRequest(payload: unknown): payload is BlockHeadersRequest {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    typeof payload.requestId === "string" &&
    "fromHeight" in payload &&
    typeof payload.fromHeight === "number" &&
    "toHeight" in payload &&
    typeof payload.toHeight === "number"
  )
}

export function isBlockHeadersResponse(payload: unknown): payload is BlockHeadersResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    typeof payload.requestId === "string" &&
    "blockHeaders" in payload &&
    Array.isArray(payload.blockHeaders) &&
    payload.blockHeaders.every((blockHeader) => isBlockHeader(blockHeader))
  )
}

export function isBlockRequest(payload: unknown): payload is BlockRequest {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    typeof payload.requestId === "string" &&
    "height" in payload &&
    typeof payload.height === "number"
  )
}

export function isBlockResponse(payload: unknown): payload is BlockResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    typeof payload.requestId === "string" &&
    "block" in payload &&
    isBlock(payload.block)
  )
}

export function isBlocksRequest(payload: unknown): payload is BlocksRequest {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    typeof payload.requestId === "string" &&
    "fromHeight" in payload &&
    typeof payload.fromHeight === "number" &&
    "toHeight" in payload &&
    typeof payload.toHeight === "number"
  )
}

export function isBlocksResponse(payload: unknown): payload is BlocksResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    typeof payload.requestId === "string" &&
    "blocks" in payload &&
    Array.isArray(payload.blocks) &&
    payload.blocks.every((block) => isBlock(block))
  )
}

export function isTransactionRequest(payload: unknown): payload is TransactionRequest {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    typeof payload.requestId === "string" &&
    "signature" in payload &&
    typeof payload.signature === "string"
  )
}

export function isTransactionResponse(payload: unknown): payload is TransactionResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    typeof payload.requestId === "string" &&
    "transaction" in payload &&
    isTransaction(payload.transaction)
  )
}

export function isTransactionsRequest(payload: unknown): payload is TransactionsRequest {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    typeof payload.requestId === "string" &&
    ("senderAddress" in payload || "recipientAddress" in payload || "limit" in payload)
  )
}

export function isTransactionsResponse(payload: unknown): payload is TransactionsResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    typeof payload.requestId === "string" &&
    "transactions" in payload &&
    Array.isArray(payload.transactions) &&
    payload.transactions.every((transaction) => isTransaction(transaction))
  )
}

export function isAchievementRequest(payload: unknown): payload is AchievementRequest {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    typeof payload.requestId === "string" &&
    "signature" in payload &&
    typeof payload.signature === "string"
  )
}

export function isAchievementResponse(payload: unknown): payload is AchievementResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    typeof payload.requestId === "string" &&
    "achievement" in payload &&
    isAchievement(payload.achievement)
  )
}

export function isAchievementsRequest(payload: unknown): payload is AchievementsRequest {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    typeof payload.requestId === "string" &&
    ("targetBlock" in payload || "authorAddress" in payload || "limit" in payload)
  )
}

export function isAchievementsResponse(payload: unknown): payload is AchievementsResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    typeof payload.requestId === "string" &&
    "achievements" in payload &&
    Array.isArray(payload.achievements) &&
    payload.achievements.every((achievement) => isAchievement(achievement))
  )
}

export function isReviewRequest(payload: unknown): payload is ReviewRequest {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    typeof payload.requestId === "string" &&
    "signature" in payload &&
    typeof payload.signature === "string"
  )
}

export function isReviewResponse(payload: unknown): payload is ReviewResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    typeof payload.requestId === "string" &&
    "review" in payload &&
    isReview(payload.review)
  )
}

export function isReviewsRequest(payload: unknown): payload is ReviewsRequest {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    typeof payload.requestId === "string" &&
    ("achievementSignature" in payload ||
      "targetBlock" in payload ||
      "reviewerAddress" in payload ||
      "limit" in payload)
  )
}

export function isReviewsResponse(payload: unknown): payload is ReviewsResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    typeof payload.requestId === "string" &&
    "reviews" in payload &&
    Array.isArray(payload.reviews) &&
    payload.reviews.every((review) => isReview(review))
  )
}
