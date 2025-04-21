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

export interface Chain {
  name: string
  genesisTime: number
  awesomeComPeriod: number
  achievementSubmissionWindow: [number, number]
  achievementReviewWindow: [number, number]
  blockCreationWindow: [number, number]
  blockAnnouncementWindow: [number, number]
  themes: string[]
}

export interface AwesomeComStatus {
  edition: number
  theme: string
  phase: string
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
  achievementSignature: string
  reviewerName: string
  reviewerAddress: string
  score: number
  comment: string
  reviewerPublicKey: string
  timestamp: number
  signature: string
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
  // updateTransactionStatus(signature: string, status: string): Promise<void>

  // addAchievement(achievement: Achievement): Promise<void>
  // getAchievement(signature: string): Promise<Achievement | null>
  // getAchievementsByCreator(creator: string): Promise<Achievement[]>
  // getAchievementsByTheme(theme: string): Promise<Achievement[]>

  // addReview(review: Review): Promise<void>
  // getReviewBySignature(signature: string): Promise<Review | null>
  // getReviewsByAchievement(achievementSignature: string): Promise<Review[]>
  // getReviewsByReviewer(reviewer: string): Promise<Review[]>
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
