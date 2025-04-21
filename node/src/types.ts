export enum MESSAGE_TYPE {
  GET_CHAIN_HEAD = "GET_CHAIN_HEAD",
  CHAIN_HEAD = "CHAIN_HEAD",
  NEW_TRANSACTION = "NEW_TRANSACTION",
  NEW_BLOCK = "NEW_BLOCK",
  NEW_ACHIEVEMENT = "NEW_ACHIEVEMENT",
  NEW_REVIEW = "NEW_REVIEW",
  NEW_REVIEW_DECISION = "NEW_REVIEW_DECISION",
}

export interface Chain {
  name: string
  genesisTime: number
  awesomeComPeriod: number
  achievementSubmissionWindow: [number, number]
  achievementReviewWindow: [number, number]
  blockCreationWindow: [number, number]
  blockAnnouncementWindow: [number, number]
}

export interface AwesomeComStatus {
  edition: number
  theme: string
  phase: string
  phaseRemaining: number
}

export interface Block {
  height: number
  previousHash: string
  transactions: Transaction[]
  transactionMerkleRoot: string
  achievements: Achievement[]
  achievementMerkleRoot: string
  reviewDecisions: ReviewDecision[]
  reviewDecisionMerkleRoot: string
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
  reviewerPublicKey: string
  timestamp: number
  signature: string
}

export interface ReviewDecision {
  achievementSignature: string
  decision: "ACCEPTED" | "REJECTED"
  averageScore: number
  reward: number
  reviews: Review[]
  reviewMerkleRoot: string
  hash: string
}

export interface Repository {
  addBlock(block: Block): Promise<void>
  getLatestBlock(): Promise<Block | null>
  getBlocks(fromHeight: number, toHeight: number): Promise<Block[]>
  getBlockByHeight(height: number): Promise<Block | null>
  getBlockByHash(hash: string): Promise<Block | null>

  addTransaction(transaction: Transaction): Promise<void>
  getTransactionsBySender(sender: string): Promise<Transaction[]>
  getTransactionsByRecipient(recipient: string): Promise<Transaction[]>
  getTransactionBySignature(signature: string): Promise<Transaction | null>

  addAchievement(achievement: Achievement): Promise<void>
  getAchievementsByCreator(creator: string): Promise<Achievement[]>
  getAchievementByHash(hash: string): Promise<Achievement | null>
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
  room: string
  type: string
  payload: unknown
  timestamp: number
  hash: string
}
