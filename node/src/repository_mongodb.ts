import mongoose from "mongoose"
import { Achievement, Block, Repository, Review, Transaction } from "./types"

interface BlockDocument {
  height: number
  previousHash: string
  transactions: mongoose.Types.ObjectId[] | TransactionDocument[]
  transactionsMerkleRoot: string
  achievements: mongoose.Types.ObjectId[] | AchievementDocument[]
  achievementsMerkleRoot: string
  reviews: mongoose.Types.ObjectId[] | ReviewDocument[]
  reviewsMerkleRoot: string
  creatorAddress: string
  timestamp: Date
  hash: string
}

interface TransactionDocument {
  senderPublicKey: string
  senderAddress: string
  recipientAddress: string
  amount: number
  timestamp: Date
  signature: string
  pending: boolean
}

interface BalanceDocument {
  address: string
  balance: number
}

interface AchievementDocument {
  creatorName: string
  creatorAddress: string
  title: string
  description: string
  attachments: string[]
  timestamp: Date
  creatorPublicKey: string
  signature: string
  reviews: mongoose.Types.ObjectId[] | ReviewDocument[]
}

interface ReviewDocument {
  achievementSignature: string
  reviewerName: string
  reviewerAddress: string
  score: number
  comment: string
  reward: number
  timestamp: Date
  reviewerPublicKey: string
  signature: string
}

export class MongoDBRepository implements Repository {
  private address: string
  private readonly BlockModel: mongoose.Model<BlockDocument>
  private readonly TransactionModel: mongoose.Model<TransactionDocument>
  private readonly BalanceModel: mongoose.Model<BalanceDocument>
  private readonly AchievementModel: mongoose.Model<AchievementDocument>
  private readonly ReviewModel: mongoose.Model<ReviewDocument>

  constructor(address: string) {
    this.address = address
    this.BlockModel = mongoose.model<BlockDocument>(
      "Block",
      new mongoose.Schema<BlockDocument>({
        height: { type: Number, index: true },
        previousHash: String,
        transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Transaction" }],
        transactionsMerkleRoot: String,
        achievements: [{ type: mongoose.Schema.Types.ObjectId, ref: "Achievement" }],
        achievementsMerkleRoot: String,
        reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
        reviewsMerkleRoot: String,
        creatorAddress: String,
        timestamp: Date,
        hash: String,
      })
    )

    this.TransactionModel = mongoose.model<TransactionDocument>(
      "Transaction",
      new mongoose.Schema<TransactionDocument>({
        senderPublicKey: String,
        senderAddress: { type: String, index: true },
        recipientAddress: { type: String, index: true },
        amount: Number,
        timestamp: Date,
        signature: { type: String, index: true },
        pending: { type: Boolean, default: true, index: true },
      })
    )

    this.BalanceModel = mongoose.model<BalanceDocument>(
      "Balance",
      new mongoose.Schema<BalanceDocument>({
        address: { type: String, index: true },
        balance: Number,
      })
    )

    this.AchievementModel = mongoose.model<AchievementDocument>(
      "Achievement",
      new mongoose.Schema<AchievementDocument>({
        creatorName: String,
        creatorAddress: String,
        description: String,
        attachments: [String],
        timestamp: Date,
        creatorPublicKey: String,
        signature: { type: String, index: true },
        reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
      })
    )

    this.ReviewModel = mongoose.model<ReviewDocument>(
      "Review",
      new mongoose.Schema<ReviewDocument>({
        reviewerName: String,
        reviewerAddress: String,
        score: Number,
        achievementSignature: String,
        comment: String,
        reward: Number,
        timestamp: Date,
        reviewerPublicKey: String,
        signature: String,
      })
    )
  }

  async init(): Promise<void> {
    await mongoose.connect(this.address)
  }

  private blockDocToBlock(blockDoc: BlockDocument): Block {
    return {
      height: blockDoc.height,
      previousHash: blockDoc.previousHash,
      transactions: blockDoc.transactions.map((t) => this.transactionDocToTransaction(t as TransactionDocument)),
      transactionsMerkleRoot: blockDoc.transactionsMerkleRoot,
      achievements: blockDoc.achievements.map((a) => this.achievementDocToAchievement(a as AchievementDocument)),
      achievementsMerkleRoot: blockDoc.achievementsMerkleRoot,
      reviews: blockDoc.reviews.map((r) => this.reviewDocToReview(r as ReviewDocument)),
      reviewsMerkleRoot: blockDoc.reviewsMerkleRoot,
      creatorAddress: blockDoc.creatorAddress,
      timestamp: blockDoc.timestamp.getTime(),
      hash: blockDoc.hash,
    } satisfies Block
  }

  private transactionDocToTransaction(transactionDoc: TransactionDocument): Transaction {
    return {
      senderPublicKey: transactionDoc.senderPublicKey,
      senderAddress: transactionDoc.senderAddress,
      recipientAddress: transactionDoc.recipientAddress,
      amount: transactionDoc.amount,
      timestamp: transactionDoc.timestamp.getTime(),
      signature: transactionDoc.signature,
    } satisfies Transaction
  }

  private achievementDocToAchievement(achievementDoc: AchievementDocument): Achievement {
    return {
      creatorName: achievementDoc.creatorName,
      creatorAddress: achievementDoc.creatorAddress,
      title: achievementDoc.title,
      description: achievementDoc.description,
      attachments: achievementDoc.attachments,
      timestamp: achievementDoc.timestamp.getTime(),
      creatorPublicKey: achievementDoc.creatorPublicKey,
      signature: achievementDoc.signature,
    } satisfies Achievement
  }

  private reviewDocToReview(reviewDoc: ReviewDocument): Review {
    return {
      achievementSignature: reviewDoc.achievementSignature,
      reviewerName: reviewDoc.reviewerName,
      reviewerAddress: reviewDoc.reviewerAddress,
      score: reviewDoc.score,
      comment: reviewDoc.comment,
      timestamp: reviewDoc.timestamp.getTime(),
      reviewerPublicKey: reviewDoc.reviewerPublicKey,
      signature: reviewDoc.signature,
    } satisfies Review
  }

  async addBlock(block: Block): Promise<void> {
    await this.BlockModel.create(block)
  }

  async getBlockByHash(hash: string): Promise<Block | null> {
    const blockDoc = await this.BlockModel.findOne({ hash })
      .populate("transactions")
      .populate("achievements")
      .populate("reviews")
      .lean()
    if (!blockDoc) return null

    return this.blockDocToBlock(blockDoc)
  }

  async getLatestBlock(): Promise<Block | null> {
    const blockDoc = await this.BlockModel.findOne()
      .sort({ height: -1 })
      .populate("transactions")
      .populate("achievements")
      .populate("reviews")
      .lean()
    if (!blockDoc) return null
    return this.blockDocToBlock(blockDoc)
  }

  async getBlocks(fromHeight: number, toHeight: number): Promise<Block[]> {
    const blocks = await this.BlockModel.find({ height: { $gte: fromHeight, $lte: toHeight } })
      .sort({ height: 1 })
      .populate("transactions")
      .populate("achievements")
      .populate("reviews")
      .lean()
    return Promise.all(blocks.map((b) => this.blockDocToBlock(b))).then(
      (blocks) => blocks.filter((b) => b !== null) as Block[]
    )
  }

  async getBlockByHeight(height: number): Promise<Block | null> {
    const blockDoc = await this.BlockModel.findOne({ height })
      .populate("transactions")
      .populate("achievements")
      .populate("reviews")
      .lean()
    if (!blockDoc) return null
    return this.blockDocToBlock(blockDoc)
  }
}
