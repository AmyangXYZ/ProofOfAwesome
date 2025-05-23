import mongoose from "mongoose"
import { Achievement, Block, BlockHeader, Review, ReviewScores, Transaction } from "./awesome"
import { Repository } from "./repository"

interface BlockDocument {
  _id?: mongoose.Types.ObjectId
  header: {
    height: number
    previousHash: string
    accountsRoot: string
    transactionsRoot: string
    achievementsRoot: string
    reviewsRoot: string
    transactionsCount: number
    achievementsCount: number
    reviewsCount: number
    timestamp: Date
    hash: string
  }
  transactions: mongoose.Types.ObjectId[] | TransactionDocument[]
  achievements: mongoose.Types.ObjectId[] | AchievementDocument[]
  reviews: mongoose.Types.ObjectId[] | ReviewDocument[]
}

interface TransactionDocument {
  _id?: mongoose.Types.ObjectId
  senderPublicKey: string
  senderAddress: string
  recipientAddress: string
  amount: number
  nonce: number
  timestamp: Date
  signature: string
  blockHeight: number
}

interface AchievementDocument {
  _id?: mongoose.Types.ObjectId
  targetBlock: number
  authorName: string
  authorAddress: string
  description: string
  attachment: string
  timestamp: Date
  authorPublicKey: string
  signature: string
  reviews: mongoose.Types.ObjectId[] | ReviewDocument[]
}

interface ReviewDocument {
  _id?: mongoose.Types.ObjectId
  targetBlock: number
  achievementSignature: string
  reviewerName: string
  reviewerAddress: string
  scores: ReviewScores
  comment: string
  timestamp: Date
  reviewerPublicKey: string
  signature: string
}

export class MongoDBRepository implements Repository {
  private address: string
  private readonly BlockModel: mongoose.Model<BlockDocument>
  private readonly TransactionModel: mongoose.Model<TransactionDocument>
  private readonly AchievementModel: mongoose.Model<AchievementDocument>
  private readonly ReviewModel: mongoose.Model<ReviewDocument>

  constructor(address: string) {
    this.address = address
    this.BlockModel = mongoose.model<BlockDocument>(
      "Block",
      new mongoose.Schema<BlockDocument>({
        header: {
          height: { type: Number, index: true },
          previousHash: String,
          accountsRoot: String,
          transactionsRoot: String,
          achievementsRoot: String,
          reviewsRoot: String,
          transactionsCount: Number,
          achievementsCount: Number,
          reviewsCount: Number,
          timestamp: Date,
          hash: String,
        },
        transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Transaction" }],
        achievements: [{ type: mongoose.Schema.Types.ObjectId, ref: "Achievement" }],
        reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
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
        blockHeight: { type: Number, index: true },
      })
    )

    this.AchievementModel = mongoose.model<AchievementDocument>(
      "Achievement",
      new mongoose.Schema<AchievementDocument>({
        targetBlock: Number,
        authorName: String,
        authorAddress: String,
        description: String,
        attachment: String,
        timestamp: Date,
        authorPublicKey: String,
        signature: { type: String, index: true },
        reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
      })
    )

    this.ReviewModel = mongoose.model<ReviewDocument>(
      "Review",
      new mongoose.Schema<ReviewDocument>({
        targetBlock: Number,
        achievementSignature: String,
        reviewerName: String,
        reviewerAddress: String,
        scores: {
          overall: Number,
          innovation: Number,
          dedication: Number,
          significance: Number,
          presentation: Number,
        },
        comment: String,
        timestamp: Date,
        reviewerPublicKey: String,
        signature: String,
      })
    )
  }

  async init(): Promise<void> {
    await mongoose.connect(this.address)
  }

  async clear(): Promise<void> {
    await this.BlockModel.deleteMany({})
    await this.TransactionModel.deleteMany({})
    await this.AchievementModel.deleteMany({})
    await this.ReviewModel.deleteMany({})
  }

  private blockDocToBlockHeader(blockDoc: BlockDocument): BlockHeader {
    return {
      height: blockDoc.header.height,
      previousHash: blockDoc.header.previousHash,
      timestamp: blockDoc.header.timestamp.getTime(),
      accountsRoot: blockDoc.header.accountsRoot,
      transactionsRoot: blockDoc.header.transactionsRoot,
      achievementsRoot: blockDoc.header.achievementsRoot,
      reviewsRoot: blockDoc.header.reviewsRoot,
      transactionsCount: blockDoc.header.transactionsCount,
      achievementsCount: blockDoc.header.achievementsCount,
      reviewsCount: blockDoc.header.reviewsCount,
      hash: blockDoc.header.hash,
    }
  }

  private blockDocToBlock(blockDoc: BlockDocument): Block {
    return {
      header: this.blockDocToBlockHeader(blockDoc),
      transactions: blockDoc.transactions.map((t) => this.transactionDocToTransaction(t as TransactionDocument)),
      achievements: blockDoc.achievements.map((a) => this.achievementDocToAchievement(a as AchievementDocument)),
      reviews: blockDoc.reviews.map((r) => this.reviewDocToReview(r as ReviewDocument)),
    }
  }

  private transactionDocToTransaction(transactionDoc: TransactionDocument): Transaction {
    return {
      senderPublicKey: transactionDoc.senderPublicKey,
      senderAddress: transactionDoc.senderAddress,
      recipientAddress: transactionDoc.recipientAddress,
      amount: transactionDoc.amount,
      nonce: transactionDoc.nonce,
      timestamp: transactionDoc.timestamp.getTime(),
      signature: transactionDoc.signature,
      blockHeight: transactionDoc.blockHeight,
    }
  }

  private achievementDocToAchievement(achievementDoc: AchievementDocument): Achievement {
    return {
      targetBlock: achievementDoc.targetBlock,
      authorName: achievementDoc.authorName,
      authorAddress: achievementDoc.authorAddress,
      description: achievementDoc.description,
      attachment: achievementDoc.attachment,
      timestamp: achievementDoc.timestamp.getTime(),
      authorPublicKey: achievementDoc.authorPublicKey,
      signature: achievementDoc.signature,
    }
  }

  private reviewDocToReview(reviewDoc: ReviewDocument): Review {
    return {
      targetBlock: reviewDoc.targetBlock,
      achievementSignature: reviewDoc.achievementSignature,
      reviewerName: reviewDoc.reviewerName,
      reviewerAddress: reviewDoc.reviewerAddress,
      scores: reviewDoc.scores,
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
          targetBlock: a.targetBlock,
          authorName: a.authorName,
          authorAddress: a.authorAddress,
          description: a.description,
          attachment: a.attachment,
          timestamp: new Date(a.timestamp),
          authorPublicKey: a.authorPublicKey,
          signature: a.signature,
          reviews: [],
        })
      })
    )
    const reviewDocs: ReviewDocument[] = await Promise.all(
      block.reviews.map(async (r): Promise<ReviewDocument> => {
        return await this.ReviewModel.create({
          targetBlock: r.targetBlock,
          achievementSignature: r.achievementSignature,
          reviewerName: r.reviewerName,
          reviewerAddress: r.reviewerAddress,
          scores: r.scores,
          comment: r.comment,
          timestamp: new Date(r.timestamp),
          reviewerPublicKey: r.reviewerPublicKey,
          signature: r.signature,
        })
      })
    )
    const blockDoc: BlockDocument = {
      header: {
        height: block.header.height,
        previousHash: block.header.previousHash,
        accountsRoot: block.header.accountsRoot,
        transactionsRoot: block.header.transactionsRoot,
        achievementsRoot: block.header.achievementsRoot,
        reviewsRoot: block.header.reviewsRoot,
        transactionsCount: block.header.transactionsCount,
        achievementsCount: block.header.achievementsCount,
        reviewsCount: block.header.reviewsCount,
        timestamp: new Date(block.header.timestamp),
        hash: block.header.hash,
      },
      transactions: transactionDocs.map((t) => t._id!),
      achievements: achievementDocs.map((a) => a._id!),
      reviews: reviewDocs.map((r) => r._id!),
    }
    await this.BlockModel.create(blockDoc)
  }

  async getBlockHeader(height: number): Promise<BlockHeader | null> {
    const blockDoc = await this.BlockModel.findOne({ "header.height": height }).lean()

    if (!blockDoc) return null
    return this.blockDocToBlockHeader(blockDoc)
  }

  async getBlockHeaders(fromHeight: number, toHeight: number): Promise<BlockHeader[]> {
    const blockDocs = await this.BlockModel.find({ "header.height": { $gte: fromHeight, $lte: toHeight } }).lean()
    return Promise.all(blockDocs.map((b) => this.blockDocToBlockHeader(b)))
  }

  async getLatestBlockHeader(): Promise<BlockHeader | null> {
    const blockDoc = await this.BlockModel.findOne({}).sort({ "header.height": -1 }).lean()
    if (!blockDoc) return null
    return this.blockDocToBlockHeader(blockDoc)
  }

  async getLatestBlock(): Promise<Block | null> {
    const blockDoc = await this.BlockModel.findOne({})
      .sort({ "header.height": -1 })
      .populate("transactions")
      .populate("achievements")
      .populate("reviews")
      .lean()
    if (!blockDoc) return null
    return this.blockDocToBlock(blockDoc)
  }

  async getBlocks(fromHeight: number, toHeight: number): Promise<Block[]> {
    const blocks = await this.BlockModel.find({ "header.height": { $gte: fromHeight, $lte: toHeight } })
      .sort({ "header.height": 1 })
      .populate("transactions")
      .populate("achievements")
      .populate("reviews")
      .lean()
    return Promise.all(blocks.map((b) => this.blockDocToBlock(b))).then(
      (blocks) => blocks.filter((b) => b !== null) as Block[]
    )
  }

  async getBlock(height: number): Promise<Block | null> {
    const blockDoc = await this.BlockModel.findOne({ "header.height": height })
      .populate("transactions")
      .populate("achievements")
      .populate("reviews")
      .lean()
    if (!blockDoc) return null
    return this.blockDocToBlock(blockDoc)
  }

  async addTransaction(transaction: Transaction, pending: boolean): Promise<void> {
    await this.TransactionModel.create({
      ...transaction,
      pending,
    })
  }

  async getTransactionBySignature(signature: string): Promise<Transaction | null> {
    const transactionDoc = await this.TransactionModel.findOne({ signature })
    if (!transactionDoc) return null
    return this.transactionDocToTransaction(transactionDoc)
  }

  async getTransactionsBySender(sender: string): Promise<Transaction[]> {
    const transactionDocs = await this.TransactionModel.find({ senderAddress: sender })
    return Promise.all(transactionDocs.map((t) => this.transactionDocToTransaction(t)))
  }

  async getTransactionsByRecipient(recipient: string): Promise<Transaction[]> {
    const transactionDocs = await this.TransactionModel.find({ recipientAddress: recipient })
    return Promise.all(transactionDocs.map((t) => this.transactionDocToTransaction(t)))
  }

  async getTransactionsByBlockHeight(blockHeight: number): Promise<Transaction[]> {
    const transactionDocs = await this.TransactionModel.find({ blockHeight })
    return Promise.all(transactionDocs.map((t) => this.transactionDocToTransaction(t)))
  }

  async updateTransactionBlockHeight(signature: string, blockHeight: number): Promise<void> {
    await this.TransactionModel.updateOne({ signature }, { $set: { blockHeight } })
  }

  async addAchievement(achievement: Achievement): Promise<void> {
    await this.AchievementModel.create(achievement)
  }

  async getAchievementBySignature(signature: string): Promise<Achievement | null> {
    const achievementDoc = await this.AchievementModel.findOne({ signature })
    if (!achievementDoc) return null
    return this.achievementDocToAchievement(achievementDoc)
  }

  async getAchievementsByAuthor(author: string): Promise<Achievement[]> {
    const achievementDocs = await this.AchievementModel.find({ authorAddress: author })
    return Promise.all(achievementDocs.map((a) => this.achievementDocToAchievement(a)))
  }

  async addReview(review: Review): Promise<void> {
    await this.ReviewModel.create(review)
  }

  async getReviewBySignature(signature: string): Promise<Review | null> {
    const reviewDoc = await this.ReviewModel.findOne({ signature })
    if (!reviewDoc) return null
    return this.reviewDocToReview(reviewDoc)
  }

  async getReviewsByAchievement(achievementSignature: string): Promise<Review[]> {
    const reviewDocs = await this.ReviewModel.find({ achievementSignature })
    return Promise.all(reviewDocs.map((r) => this.reviewDocToReview(r)))
  }

  async getReviewsByReviewer(reviewer: string): Promise<Review[]> {
    const reviewDocs = await this.ReviewModel.find({ reviewerAddress: reviewer })
    return Promise.all(reviewDocs.map((r) => this.reviewDocToReview(r)))
  }
}
