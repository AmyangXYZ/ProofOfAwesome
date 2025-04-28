import mongoose from "mongoose"
import { Achievement, Block, Review, Transaction } from "./awesome"
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
  pending: boolean
}

interface AchievementDocument {
  _id?: mongoose.Types.ObjectId
  edition: number
  authorName: string
  authorAddress: string
  description: string
  attachments: string[]
  timestamp: Date
  authorPublicKey: string
  signature: string
  reviews: mongoose.Types.ObjectId[] | ReviewDocument[]
}

interface ReviewDocument {
  _id?: mongoose.Types.ObjectId
  edition: number
  achievementSignature: string
  reviewerName: string
  reviewerAddress: string
  scores: {
    overall: number
    originality: number
    creativity: number
    difficulty: number
    relevance: number
    presentation: number
  }
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
          transactionsRoot: String,
          achievementsRoot: String,
          reviewsRoot: String,
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
        pending: { type: Boolean, default: true, index: true },
      })
    )

    this.AchievementModel = mongoose.model<AchievementDocument>(
      "Achievement",
      new mongoose.Schema<AchievementDocument>({
        authorName: String,
        authorAddress: String,
        description: String,
        attachments: [String],
        timestamp: Date,
        authorPublicKey: String,
        signature: { type: String, index: true },
        reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
      })
    )

    this.ReviewModel = mongoose.model<ReviewDocument>(
      "Review",
      new mongoose.Schema<ReviewDocument>({
        reviewerName: String,
        reviewerAddress: String,
        scores: {
          overall: Number,
          originality: Number,
          creativity: Number,
          difficulty: Number,
          relevance: Number,
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
    const connection = await mongoose.connect(this.address)
    connection.connection.db?.dropDatabase()
  }

  private blockDocToBlock(blockDoc: BlockDocument): Block {
    return {
      header: {
        height: blockDoc.header.height,
        previousHash: blockDoc.header.previousHash,
        accountsRoot: blockDoc.header.accountsRoot,
        transactionsRoot: blockDoc.header.transactionsRoot,
        achievementsRoot: blockDoc.header.achievementsRoot,
        reviewsRoot: blockDoc.header.reviewsRoot,
        timestamp: blockDoc.header.timestamp.getTime(),
        hash: blockDoc.header.hash,
      },
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
    }
  }

  private achievementDocToAchievement(achievementDoc: AchievementDocument): Achievement {
    return {
      edition: achievementDoc.edition,
      authorName: achievementDoc.authorName,
      authorAddress: achievementDoc.authorAddress,
      description: achievementDoc.description,
      attachments: achievementDoc.attachments,
      timestamp: achievementDoc.timestamp.getTime(),
      authorPublicKey: achievementDoc.authorPublicKey,
      signature: achievementDoc.signature,
    }
  }

  private reviewDocToReview(reviewDoc: ReviewDocument): Review {
    return {
      edition: reviewDoc.edition,
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
          edition: a.edition,
          authorName: a.authorName,
          authorAddress: a.authorAddress,
          description: a.description,
          attachments: a.attachments,
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
          edition: r.edition,
          reviewerName: r.reviewerName,
          reviewerAddress: r.reviewerAddress,
          scores: r.scores,
          comment: r.comment,
          timestamp: new Date(r.timestamp),
          reviewerPublicKey: r.reviewerPublicKey,
          signature: r.signature,
          achievementSignature: r.achievementSignature,
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
        timestamp: new Date(block.header.timestamp),
        hash: block.header.hash,
      },
      transactions: transactionDocs.map((t) => t._id!),
      achievements: achievementDocs.map((a) => a._id!),
      reviews: reviewDocs.map((r) => r._id!),
    }
    await this.BlockModel.create(blockDoc)
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

  async getPendingTransactions(): Promise<Transaction[]> {
    const transactionDocs = await this.TransactionModel.find({ pending: true })
    return Promise.all(transactionDocs.map((t) => this.transactionDocToTransaction(t)))
  }

  async updateTransactionStatus(signature: string, pending: boolean): Promise<void> {
    await this.TransactionModel.updateOne({ signature }, { $set: { pending } })
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

  async getAchievementsByTheme(theme: string): Promise<Achievement[]> {
    const achievementDocs = await this.AchievementModel.find({ theme })
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

const main = async () => {
  const repo = new MongoDBRepository("mongodb://localhost:27017/awesome")
  await repo.init()
  await repo.addTransaction(
    {
      senderPublicKey: "0x123",
      senderAddress: "0x123",
      recipientAddress: "0x456",
      amount: 100,
      nonce: 0,
      timestamp: Date.now(),
      signature: "0x123",
    },
    true
  )
  console.log(await repo.getTransactionBySignature("0x123"))
  await repo.updateTransactionStatus("0x123", true)
  console.log(await repo.getPendingTransactions())
}
if (require.main === module) {
  main()
}
