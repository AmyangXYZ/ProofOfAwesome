import { Achievement, Review, Transaction, Block } from "./awesome"

export interface Repository {
  init(): Promise<void>

  addBlock(block: Block): Promise<void>
  getLatestBlock(): Promise<Block | null>
  getBlock(height: number): Promise<Block | null>
  getBlocks(fromHeight: number, toHeight: number): Promise<Block[]>

  addTransaction(transaction: Transaction, pending: boolean): Promise<void>
  getTransactionBySignature(signature: string): Promise<Transaction | null>
  getTransactionsBySender(sender: string): Promise<Transaction[]>
  getTransactionsByRecipient(recipient: string): Promise<Transaction[]>
  getPendingTransactions(): Promise<Transaction[]>
  updateTransactionStatus(signature: string, pending: boolean): Promise<void>

  addAchievement(achievement: Achievement): Promise<void>
  getAchievementBySignature(signature: string): Promise<Achievement | null>
  getAchievementsByAuthor(author: string): Promise<Achievement[]>
  getAchievementsByTheme(theme: string): Promise<Achievement[]>

  addReview(review: Review): Promise<void>
  getReviewBySignature(signature: string): Promise<Review | null>
  getReviewsByAchievement(achievementSignature: string): Promise<Review[]>
  getReviewsByReviewer(reviewer: string): Promise<Review[]>
}
