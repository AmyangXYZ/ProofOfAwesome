import mongoose from "mongoose"

export interface ChainDocument {
  name: string
  description: string
  rule: string
}

const chainSchema = new mongoose.Schema<ChainDocument>({
  name: String,
  description: String,
  rule: String,
})

export const ChainModel = mongoose.model<ChainDocument>("Chain", chainSchema)

export interface BalanceDocument {
  address: string
  balance: number
}

const balanceSchema = new mongoose.Schema<BalanceDocument>({
  address: { type: String, index: true },
  balance: Number,
})

export const BalanceModel = mongoose.model<BalanceDocument>("Balance", balanceSchema)

export interface BlockDocument {
  height: number
  previousHash: string
  transactions: mongoose.Types.ObjectId[] | TransactionDocument[]
  merkleRoot: string
  achievement?: mongoose.Types.ObjectId | AchievementDocument
  reviewDecision: mongoose.Types.ObjectId | ReviewDecisionDocument
  timestamp: Date
  hash: string
}

const blockSchema = new mongoose.Schema<BlockDocument>({
  height: { type: Number, index: true },
  previousHash: String,
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Transaction" }],
  merkleRoot: String,
  achievement: { type: mongoose.Schema.Types.ObjectId, ref: "Achievement" },
  reviewDecision: { type: mongoose.Schema.Types.ObjectId, ref: "ReviewDecision" },
  timestamp: Date,
  hash: String,
})

export const BlockModel = mongoose.model<BlockDocument>("Block", blockSchema)

export interface TransactionDocument {
  chain: mongoose.Types.ObjectId | ChainDocument
  senderPublicKey: string
  senderAddress: string
  recipientAddress: string
  amount: number
  timestamp: Date
  signature: string
  pending: boolean
  block?: mongoose.Types.ObjectId | BlockDocument
}

const transactionSchema = new mongoose.Schema<TransactionDocument>({
  senderPublicKey: String,
  senderAddress: String,
  recipientAddress: String,
  amount: Number,
  timestamp: Date,
  signature: { type: String, index: true },
  pending: { type: Boolean, default: true, index: true },
})

export const TransactionModel = mongoose.model<TransactionDocument>("Transaction", transactionSchema)

export interface AchievementDocument {
  creatorName: string
  creatorAddress: string
  description: string
  evidenceImage: string
  timestamp: Date
  creatorPublicKey: string
  signature: string
  reviews?: mongoose.Types.ObjectId[] | ReviewDocument[]
}

const achievementSchema = new mongoose.Schema<AchievementDocument>({
  creatorName: String,
  creatorAddress: String,
  description: String,
  evidenceImage: String,
  timestamp: Date,
  creatorPublicKey: String,
  signature: { type: String, index: true },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
})

export const AchievementModel = mongoose.model<AchievementDocument>("Achievement", achievementSchema)

export interface ReviewDocument {
  achievement: mongoose.Types.ObjectId | AchievementDocument
  reviewerName: string
  reviewerAddress: string
  score: number
  comment: string
  reward: number
  timestamp: Date
  reviewerPublicKey: string
  signature: string
}

const reviewSchema = new mongoose.Schema<ReviewDocument>({
  reviewerName: String,
  reviewerAddress: String,
  score: Number,
  achievement: { type: mongoose.Schema.Types.ObjectId, ref: "Achievement", index: true },
  comment: String,
  reward: Number,
  timestamp: Date,
  reviewerPublicKey: String,
  signature: String,
})

export const ReviewModel = mongoose.model<ReviewDocument>("Review", reviewSchema)

export interface ReviewDecisionDocument {
  achievement: mongoose.Types.ObjectId | AchievementDocument
  reviews: mongoose.Types.ObjectId[] | ReviewDocument[]
  decision: "accepted" | "rejected"
  timestamp: Date
}

const reviewDecisionSchema = new mongoose.Schema<ReviewDecisionDocument>({
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  decision: String,
  timestamp: Date,
})

export const ReviewDecisionModel = mongoose.model<ReviewDecisionDocument>("ReviewDecision", reviewDecisionSchema)
