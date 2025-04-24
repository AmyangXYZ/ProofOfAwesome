import { Achievement, Review, Transaction, Block } from "./awesome"

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
  getAchievementsByEdition(edition: number): Promise<Achievement[]>
  // getAchievement(signature: string): Promise<Achievement | null>
  // getAchievementsByAuthor(author: string): Promise<Achievement[]>
  // getAchievementsByTheme(theme: string): Promise<Achievement[]>

  // addReview(review: Review): Promise<void>
  // getReviewBySignature(signature: string): Promise<Review | null>
  // getReviewsByAchievement(achievementSignature: string): Promise<Review[]>
  // getReviewsByReviewer(reviewer: string): Promise<Review[]>
  getReviewsByEdition(edition: number): Promise<Review[]>
}
