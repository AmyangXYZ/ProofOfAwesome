import mongoose from "mongoose"
import { Achievement, Block, Repository, Review, Transaction } from "./types"

interface BlockDocument {
  _id?: mongoose.Types.ObjectId
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
  _id?: mongoose.Types.ObjectId
  senderPublicKey: string
  senderAddress: string
  recipientAddress: string
  amount: number
  timestamp: Date
  signature: string
  pending: boolean
}

interface BalanceDocument {
  _id?: mongoose.Types.ObjectId
  address: string
  balance: number
}

interface AchievementDocument {
  _id?: mongoose.Types.ObjectId
  edition: number
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
  _id?: mongoose.Types.ObjectId
  edition: number
  achievementSignature: string
  reviewerName: string
  reviewerAddress: string
  score: number
  comment: string
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
        timestamp: Date,
        reviewerPublicKey: String,
        signature: String,
      })
    )
  }

  async init(): Promise<void> {
    await mongoose.connect(this.address)
    // connection.connection.db?.dropDatabase()
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
    }
  }

  private transactionDocToTransaction(transactionDoc: TransactionDocument): Transaction {
    return {
      senderPublicKey: transactionDoc.senderPublicKey,
      senderAddress: transactionDoc.senderAddress,
      recipientAddress: transactionDoc.recipientAddress,
      amount: transactionDoc.amount,
      timestamp: transactionDoc.timestamp.getTime(),
      signature: transactionDoc.signature,
    }
  }

  private achievementDocToAchievement(achievementDoc: AchievementDocument): Achievement {
    return {
      edition: achievementDoc.edition,
      creatorName: achievementDoc.creatorName,
      creatorAddress: achievementDoc.creatorAddress,
      title: achievementDoc.title,
      description: achievementDoc.description,
      attachments: achievementDoc.attachments,
      timestamp: achievementDoc.timestamp.getTime(),
      creatorPublicKey: achievementDoc.creatorPublicKey,
      signature: achievementDoc.signature,
    }
  }

  private reviewDocToReview(reviewDoc: ReviewDocument): Review {
    return {
      edition: reviewDoc.edition,
      achievementSignature: reviewDoc.achievementSignature,
      reviewerName: reviewDoc.reviewerName,
      reviewerAddress: reviewDoc.reviewerAddress,
      score: reviewDoc.score,
      comment: reviewDoc.comment,
      timestamp: reviewDoc.timestamp.getTime(),
      reviewerPublicKey: reviewDoc.reviewerPublicKey,
      signature: reviewDoc.signature,
    }
  }

  async addBlock(block: Block): Promise<void> {
    const transactionDocs: TransactionDocument[] = await Promise.all(
      block.transactions.map(async (t): Promise<TransactionDocument> => {
        return await this.TransactionModel.create({
          senderPublicKey: t.senderPublicKey,
          senderAddress: t.senderAddress,
          recipientAddress: t.recipientAddress,
          amount: t.amount,
          timestamp: new Date(t.timestamp),
          signature: t.signature,
          pending: true,
        })
      })
    )
    const achievementDocs: AchievementDocument[] = await Promise.all(
      block.achievements.map(async (a): Promise<AchievementDocument> => {
        return await this.AchievementModel.create({
          edition: a.edition,
          creatorName: a.creatorName,
          creatorAddress: a.creatorAddress,
          title: a.title,
          description: a.description,
          attachments: a.attachments,
          timestamp: new Date(a.timestamp),
          creatorPublicKey: a.creatorPublicKey,
          signature: a.signature,
          reviews: [],
        })
      })
    )
    const reviewDocs: ReviewDocument[] = await Promise.all(
      block.reviews.map(async (r): Promise<ReviewDocument> => {
        return await this.ReviewModel.create({
          edition: r.edition,
          reviewerName: r.reviewerName,
          reviewerAddress: r.reviewerAddress,
          score: r.score,
          comment: r.comment,
          timestamp: new Date(r.timestamp),
          reviewerPublicKey: r.reviewerPublicKey,
          signature: r.signature,
          achievementSignature: r.achievementSignature,
        })
      })
    )

    const blockDoc = {
      height: block.height,
      previousHash: block.previousHash,
      transactions: transactionDocs.map((t) => t._id!),
      transactionsMerkleRoot: block.transactionsMerkleRoot,
      achievements: achievementDocs.map((a) => a._id!),
      achievementsMerkleRoot: block.achievementsMerkleRoot,
      reviews: reviewDocs.map((r) => r._id!),
      reviewsMerkleRoot: block.reviewsMerkleRoot,
      creatorAddress: block.creatorAddress,
      timestamp: new Date(block.timestamp),
      hash: block.hash,
    } satisfies BlockDocument
    await this.BlockModel.create(blockDoc)
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

  async addTransaction(transaction: Transaction): Promise<void> {
    await this.TransactionModel.create(transaction)
  }

  async getTransactionBySignature(signature: string): Promise<Transaction | null> {
    const transactionDoc = await this.TransactionModel.findOne({ signature })
    if (!transactionDoc) return null
    return this.transactionDocToTransaction(transactionDoc)
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    const transactionDocs = await this.TransactionModel.find({ pending: true })
    return Promise.all(transactionDocs.map((t) => this.transactionDocToTransaction(t)))
  }

  async getAchievementsByEdition(edition: number): Promise<Achievement[]> {
    const achievementDocs = await this.AchievementModel.find({ edition })
    return Promise.all(achievementDocs.map((a) => this.achievementDocToAchievement(a)))
  }

  async getReviewsByEdition(edition: number): Promise<Review[]> {
    const reviewDocs = await this.ReviewModel.find({ edition })
    return Promise.all(reviewDocs.map((r) => this.reviewDocToReview(r)))
  }
}
