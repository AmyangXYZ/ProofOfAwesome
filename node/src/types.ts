export enum MESSAGE_TYPE {
  CHAIN_HEAD = "CHAIN_HEAD",
  BLOCK = "BLOCK",
  TRANSACTION = "TRANSACTION",
  ACHIEVEMENT = "ACHIEVEMENT",
  REVIEW = "REVIEW",
  GET_CHAIN_HEAD = "GET_CHAIN_HEAD",
  GET_BLOCK = "GET_BLOCK",
  GET_TRANSACTION = "GET_TRANSACTION",
  GET_ACHIEVEMENT = "GET_ACHIEVEMENT",
  GET_REVIEW = "GET_REVIEW",
}

export enum AWESOME_COM_PHASE {
  ACHIEVEMENT_SUBMISSION = "Achievement Submission",
  ACHIEVEMENT_REVIEW = "Achievement Review",
  BLOCK_CREATION = "Block Creation",
  WRAP_UP = "Wrap Up",
}

export interface Chain {
  name: string
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

export interface AwesomeComStatus {
  edition: number
  theme: string
  phase: AWESOME_COM_PHASE
  editionRemaining: number
  phaseRemaining: number
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
  creatorAddress: string
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

export interface EventMap {
  "awesome_com.status.updated": AwesomeComStatus
  "awesome_com.achievement_submission.started": void
  "awesome_com.achievement_review.started": void
  "awesome_com.block_creation.started": void
  "awesome_com.wrap_up.started": void
  "block.added": Block
  "achievement.added": Achievement
  "review.added": Review
  "transaction.added": Transaction
}

export interface Repository {
  init(): Promise<void>

  addBlock(block: Block): Promise<void>
  getBlockByHash(hash: string): Promise<Block | null>
  getLatestBlock(): Promise<Block | null>
  getBlocks(fromHeight: number, toHeight: number): Promise<Block[]>
  getBlockByHeight(height: number): Promise<Block | null>

  // addTransaction(transaction: Transaction): Promise<void>
  // getTransactionBySignature(signature: string): Promise<Transaction | null>
  // getTransactionsBySender(sender: string): Promise<Transaction[]>
  // getTransactionsByRecipient(recipient: string): Promise<Transaction[]>
  // getTransactionsByBlock(blockHash: string): Promise<Transaction[]>
  getPendingTransactions(): Promise<Transaction[]>
  // updateTransactionStatus(signature: string, status: string): Promise<void>

  // addAchievement(achievement: Achievement): Promise<void>
  // getAchievement(signature: string): Promise<Achievement | null>
  // getAchievementsByCreator(creator: string): Promise<Achievement[]>
  // getAchievementsByTheme(theme: string): Promise<Achievement[]>
  getAchievementsByEdition(edition: number): Promise<Achievement[]>

  // addReview(review: Review): Promise<void>
  // getReviewBySignature(signature: string): Promise<Review | null>
  // getReviewsByAchievement(achievementSignature: string): Promise<Review[]>
  // getReviewsByReviewer(reviewer: string): Promise<Review[]>
  getReviewsByEdition(edition: number): Promise<Review[]>
}

// Connect api types
export interface ServerEvents {
  "node.connect": (identity: Identity) => void
  "message.send": (message: Message) => void
  "room.join": (room: string) => void
  "room.leave": (room: string) => void
  "room.get_members": (room: string) => void
}

export interface ClientEvents {
  "node.connected": () => void
  "message.received": (message: Message) => void
  "room.members": (room: string, members: Identity[]) => void
}

export interface Identity {
  chain: string
  name: string
  address: string
  nodeType: "light" | "full"
  publicKey: string
  signature: string
}

export interface Message {
  from: string
  to: string | "*"
  room?: string
  type: string
  payload: unknown
  timestamp: number
}
