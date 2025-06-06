import Database from "better-sqlite3"
import { Achievement, Block, BlockHeader, Review, Transaction } from "./awesome"

interface BlockHeaderRow {
  height: number
  previous_hash: string
  accounts_root: string
  transactions_root: string
  achievements_root: string
  reviews_root: string
  transactions_count: number
  achievements_count: number
  reviews_count: number
  timestamp: number
  hash: string
}

interface TransactionRow {
  sender_address: string
  recipient_address: string
  amount: number
  nonce: number
  timestamp: number
  sender_public_key: string
  signature: string
  block_height: number
}

interface AchievementRow {
  target_block: number
  author_name: string
  author_address: string
  description: string
  attachment: string
  timestamp: number
  author_public_key: string
  signature: string
}

interface ReviewRow {
  target_block: number
  achievement_signature: string
  reviewer_name: string
  reviewer_address: string
  score_overall: number
  score_innovation: number
  score_dedication: number
  score_significance: number
  score_presentation: number
  comment: string
  reviewer_public_key: string
  timestamp: number
  signature: string
}

function rowToBlockHeader(row: BlockHeaderRow): BlockHeader {
  return {
    height: row.height,
    previousHash: row.previous_hash,
    accountsRoot: row.accounts_root,
    transactionsRoot: row.transactions_root,
    achievementsRoot: row.achievements_root,
    reviewsRoot: row.reviews_root,
    transactionsCount: row.transactions_count,
    achievementsCount: row.achievements_count,
    reviewsCount: row.reviews_count,
    timestamp: row.timestamp,
    hash: row.hash,
  }
}

function rowToTransaction(row: TransactionRow): Transaction {
  return {
    senderAddress: row.sender_address,
    recipientAddress: row.recipient_address,
    amount: row.amount,
    nonce: row.nonce,
    timestamp: row.timestamp,
    senderPublicKey: row.sender_public_key,
    signature: row.signature,
    blockHeight: row.block_height,
  }
}

function rowToAchievement(row: AchievementRow): Achievement {
  return {
    targetBlock: row.target_block,
    authorName: row.author_name,
    authorAddress: row.author_address,
    description: row.description,
    attachment: row.attachment,
    timestamp: row.timestamp,
    authorPublicKey: row.author_public_key,
    signature: row.signature,
  }
}

function rowToReview(row: ReviewRow): Review {
  return {
    targetBlock: row.target_block,
    achievementSignature: row.achievement_signature,
    reviewerName: row.reviewer_name,
    reviewerAddress: row.reviewer_address,
    scores: {
      overall: row.score_overall,
      innovation: row.score_innovation,
      dedication: row.score_dedication,
      significance: row.score_significance,
      presentation: row.score_presentation,
    },
    comment: row.comment,
    timestamp: row.timestamp,
    reviewerPublicKey: row.reviewer_public_key,
    signature: row.signature,
  }
}

export class SQLiteDB {
  private db: Database.Database

  private addBlockHeaderStmt: Database.Statement
  private getLatestBlockHeaderStmt: Database.Statement
  private getBlockHeaderStmt: Database.Statement
  private getBlockHeadersStmt: Database.Statement

  private addTransactionStmt: Database.Statement
  private getTransactionBySignatureStmt: Database.Statement
  private getAllTransactionsStmt: Database.Statement
  private getTransactionsBySenderStmt: Database.Statement
  private getTransactionsByRecipientStmt: Database.Statement
  private getTransactionsByBlockHeightStmt: Database.Statement
  private updateTransactionBlockHeightStmt: Database.Statement

  private addAchievementStmt: Database.Statement
  private getAchievementBySignatureStmt: Database.Statement
  private getAchievementsByAuthorStmt: Database.Statement
  private getAchievementsByBlockHeightStmt: Database.Statement

  private addReviewStmt: Database.Statement
  private getReviewBySignatureStmt: Database.Statement
  private getReviewsByAchievementStmt: Database.Statement
  private getReviewsByReviewerStmt: Database.Statement
  private getReviewsByBlockHeightStmt: Database.Statement

  constructor() {
    this.db = new Database("awesome.db")
    this.db.pragma("journal_mode = WAL")

    this.createTables()

    this.addBlockHeaderStmt = this.db.prepare(
      "INSERT INTO blocks (height, previous_hash, accounts_root, transactions_root, achievements_root, reviews_root, transactions_count, achievements_count, reviews_count, timestamp, hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    this.getLatestBlockHeaderStmt = this.db.prepare("SELECT * FROM blocks ORDER BY height DESC LIMIT 1")
    this.getBlockHeaderStmt = this.db.prepare("SELECT * FROM blocks WHERE height = ?")
    this.getBlockHeadersStmt = this.db.prepare("SELECT * FROM blocks WHERE height BETWEEN ? AND ?")

    this.addTransactionStmt = this.db.prepare(
      "INSERT INTO transactions (sender_address, recipient_address, amount, nonce, timestamp, sender_public_key, signature, block_height) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    this.getTransactionBySignatureStmt = this.db.prepare("SELECT * FROM transactions WHERE signature = ?")
    this.getAllTransactionsStmt = this.db.prepare("SELECT * FROM transactions")
    this.getTransactionsBySenderStmt = this.db.prepare("SELECT * FROM transactions WHERE sender_address = ?")
    this.getTransactionsByRecipientStmt = this.db.prepare("SELECT * FROM transactions WHERE recipient_address = ?")
    this.getTransactionsByBlockHeightStmt = this.db.prepare("SELECT * FROM transactions WHERE block_height = ?")
    this.updateTransactionBlockHeightStmt = this.db.prepare(
      "UPDATE transactions SET block_height = ? WHERE signature = ?"
    )

    this.addAchievementStmt = this.db.prepare(
      "INSERT INTO achievements (target_block, author_name, author_address, description, attachment, timestamp, author_public_key, signature) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    this.getAchievementBySignatureStmt = this.db.prepare("SELECT * FROM achievements WHERE signature = ?")
    this.getAchievementsByAuthorStmt = this.db.prepare("SELECT * FROM achievements WHERE author_address = ?")
    this.getAchievementsByBlockHeightStmt = this.db.prepare("SELECT * FROM achievements WHERE target_block = ?")

    this.addReviewStmt = this.db.prepare(
      "INSERT INTO reviews (target_block, achievement_signature, reviewer_name, reviewer_address, score_overall, score_innovation, score_dedication, score_significance, score_presentation, comment, reviewer_public_key, timestamp, signature) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    this.getReviewBySignatureStmt = this.db.prepare("SELECT * FROM reviews WHERE signature = ?")
    this.getReviewsByAchievementStmt = this.db.prepare("SELECT * FROM reviews WHERE achievement_signature = ?")
    this.getReviewsByReviewerStmt = this.db.prepare("SELECT * FROM reviews WHERE reviewer_address = ?")
    this.getReviewsByBlockHeightStmt = this.db.prepare("SELECT * FROM reviews WHERE target_block = ?")
  }

  createTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS blocks (
        height INTEGER PRIMARY KEY,
        previous_hash TEXT NOT NULL,
        accounts_root TEXT NOT NULL,
        transactions_root TEXT NOT NULL,
        achievements_root TEXT NOT NULL,
        reviews_root TEXT NOT NULL,
        transactions_count INTEGER NOT NULL,
        achievements_count INTEGER NOT NULL,
        reviews_count INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        hash TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS transactions (
        sender_address TEXT NOT NULL,
        recipient_address TEXT NOT NULL,
        amount INTEGER NOT NULL,
        nonce INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        sender_public_key TEXT NOT NULL,
        signature TEXT NOT NULL UNIQUE PRIMARY KEY,
        block_height INTEGER
      );

      CREATE TABLE IF NOT EXISTS achievements (
        target_block INTEGER NOT NULL,
        author_name TEXT NOT NULL,
        author_address TEXT NOT NULL,
        description TEXT NOT NULL,
        attachment TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        author_public_key TEXT NOT NULL,
        signature TEXT NOT NULL UNIQUE PRIMARY KEY,
        FOREIGN KEY (target_block) REFERENCES blocks(height)
      );

      CREATE TABLE IF NOT EXISTS reviews (
        target_block INTEGER NOT NULL,
        achievement_signature TEXT NOT NULL,
        reviewer_name TEXT NOT NULL,
        reviewer_address TEXT NOT NULL,
        score_overall INTEGER NOT NULL,
        score_innovation INTEGER NOT NULL,
        score_dedication INTEGER NOT NULL,
        score_significance INTEGER NOT NULL,
        score_presentation INTEGER NOT NULL,
        comment TEXT NOT NULL,
        reviewer_public_key TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        signature TEXT NOT NULL UNIQUE PRIMARY KEY,
        FOREIGN KEY (achievement_signature) REFERENCES achievements(signature)
      );
    `)
  }

  clear(): void {
    this.db.prepare("DELETE FROM reviews").run()
    this.db.prepare("DELETE FROM achievements").run()
    this.db.prepare("DELETE FROM transactions").run()
    this.db.prepare("DELETE FROM blocks").run()
  }

  addBlock(block: Block): void {
    this.addBlockHeaderStmt.run(
      block.header.height,
      block.header.previousHash,
      block.header.accountsRoot,
      block.header.transactionsRoot,
      block.header.achievementsRoot,
      block.header.reviewsRoot,
      block.header.transactionsCount,
      block.header.achievementsCount,
      block.header.reviewsCount,
      block.header.timestamp,
      block.header.hash
    )
    block.transactions.forEach((transaction) => {
      this.addTransaction(transaction)
    })
    block.achievements.forEach((achievement) => {
      this.addAchievement(achievement)
    })
    block.reviews.forEach((review) => {
      this.addReview(review)
    })
  }

  getLatestBlockHeader(): BlockHeader | null {
    const row = this.getLatestBlockHeaderStmt.get() as BlockHeaderRow | undefined
    if (!row) return null
    return rowToBlockHeader(row)
  }

  getBlockHeader(height: number): BlockHeader | null {
    const row = this.getBlockHeaderStmt.get(height) as BlockHeaderRow | undefined
    if (!row) return null
    return rowToBlockHeader(row)
  }

  getBlockHeaders(fromHeight: number, toHeight: number): BlockHeader[] {
    const rows = this.getBlockHeadersStmt.all(fromHeight, toHeight) as BlockHeaderRow[]
    return rows.map((row) => rowToBlockHeader(row))
  }

  getBlock(height: number): Block | null {
    const blockHeader = this.getBlockHeader(height)
    if (!blockHeader) return null
    const transactions = this.getTransactionsByBlockHeight(height)
    const achievements = this.getAchievementsByBlockHeight(height)
    const reviews = this.getReviewsByBlockHeight(height)

    return {
      header: blockHeader,
      transactions,
      achievements,
      reviews,
    }
  }

  getBlocks(fromHeight: number, toHeight: number): Block[] {
    const blockHeaders = this.getBlockHeaders(fromHeight, toHeight)
    if (blockHeaders.length < toHeight - fromHeight + 1) return []
    return blockHeaders.map((blockHeader) => this.getBlock(blockHeader.height)).filter((block) => block !== null)
  }

  addTransaction(transaction: Transaction): void {
    const existingTx = this.getTransactionBySignature(transaction.signature)
    if (existingTx) {
      // Update block height if transaction exists
      this.updateTransactionBlockHeightStmt.run(transaction.blockHeight, transaction.signature)
    } else {
      // Insert new transaction
      this.addTransactionStmt.run(
        transaction.senderAddress,
        transaction.recipientAddress,
        transaction.amount,
        transaction.nonce,
        transaction.timestamp,
        transaction.senderPublicKey,
        transaction.signature,
        transaction.blockHeight
      )
    }
  }

  getTransactionBySignature(signature: string): Transaction | null {
    const row = this.getTransactionBySignatureStmt.get(signature) as TransactionRow | undefined
    if (!row) return null
    return rowToTransaction(row)
  }

  getTransactionsBySender(sender: string): Transaction[] {
    const rows = this.getTransactionsBySenderStmt.all(sender) as TransactionRow[]
    return rows.map((row) => rowToTransaction(row))
  }

  getTransactionsByRecipient(recipient: string): Transaction[] {
    const rows = this.getTransactionsByRecipientStmt.all(recipient) as TransactionRow[]
    return rows.map((row) => rowToTransaction(row))
  }

  getTransactionsByBlockHeight(height: number): Transaction[] {
    const rows = this.getTransactionsByBlockHeightStmt.all(height) as TransactionRow[]
    return rows.map((row) => rowToTransaction(row))
  }

  getAllTransactions(): Transaction[] {
    const rows = this.getAllTransactionsStmt.all() as TransactionRow[]
    return rows.map((row) => rowToTransaction(row))
  }

  addAchievement(achievement: Achievement): void {
    this.addAchievementStmt.run(
      achievement.targetBlock,
      achievement.authorName,
      achievement.authorAddress,
      achievement.description,
      achievement.attachment,
      achievement.timestamp,
      achievement.authorPublicKey,
      achievement.signature
    )
  }

  getAchievementBySignature(signature: string): Achievement | null {
    const row = this.getAchievementBySignatureStmt.get(signature) as AchievementRow | undefined
    if (!row) return null
    return rowToAchievement(row)
  }

  getAchievementsByAuthor(author: string): Achievement[] {
    const rows = this.getAchievementsByAuthorStmt.all(author) as AchievementRow[]
    return rows.map((row) => rowToAchievement(row))
  }

  getAchievementsByBlockHeight(height: number): Achievement[] {
    const rows = this.getAchievementsByBlockHeightStmt.all(height) as AchievementRow[]
    return rows.map((row) => rowToAchievement(row))
  }

  addReview(review: Review): void {
    this.addReviewStmt.run(
      review.targetBlock,
      review.achievementSignature,
      review.reviewerName,
      review.reviewerAddress,
      review.scores.overall,
      review.scores.innovation,
      review.scores.dedication,
      review.scores.significance,
      review.scores.presentation,
      review.comment,
      review.reviewerPublicKey,
      review.timestamp,
      review.signature
    )
  }

  getReviewBySignature(signature: string): Review | null {
    const row = this.getReviewBySignatureStmt.get(signature) as ReviewRow | undefined
    if (!row) return null
    return rowToReview(row)
  }

  getReviewsByAchievement(achievementSignature: string): Review[] {
    const rows = this.getReviewsByAchievementStmt.all(achievementSignature) as ReviewRow[]
    return rows.map((row) => rowToReview(row))
  }

  getReviewsByReviewer(reviewer: string): Review[] {
    const rows = this.getReviewsByReviewerStmt.all(reviewer) as ReviewRow[]
    return rows.map((row) => rowToReview(row))
  }

  getReviewsByBlockHeight(height: number): Review[] {
    const rows = this.getReviewsByBlockHeightStmt.all(height) as ReviewRow[]
    return rows.map((row) => rowToReview(row))
  }
}

if (require.main === module) {
  const db = new SQLiteDB()

  db.clear()

  const tx: Transaction = {
    senderAddress: "0x08",
    recipientAddress: "0x09",
    amount: 100,
    nonce: 0,
    timestamp: +new Date(),
    senderPublicKey: "0x0a",
    signature: "0x0b",
    blockHeight: -1,
  }

  db.addTransaction(tx)

  tx.blockHeight = 1
  const block: Block = {
    header: {
      height: 1,
      previousHash: "0x01",
      accountsRoot: "0x02",
      transactionsRoot: "0x03",
      achievementsRoot: "0x04",
      reviewsRoot: "0x05",
      transactionsCount: 0,
      achievementsCount: 0,
      reviewsCount: 0,
      timestamp: +new Date(),
      hash: "0x06",
    },
    transactions: [tx],
    achievements: [],
    reviews: [],
  }
  db.addBlock(block)

  const blockR = db.getBlock(1)
  console.log(blockR)
  console.log(db.getAllTransactions())
}
