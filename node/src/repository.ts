import { Achievement, Review, Transaction } from "./blockchain"

import { Block } from "./blockchain"

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
  // getAchievement(signature: string): Promise<Achievement | null>
  // getAchievementsByCreator(creator: string): Promise<Achievement[]>
  // getAchievementsByTheme(theme: string): Promise<Achievement[]>
  getAchievementsByEdition(edition: number): Promise<Achievement[]>

  // addReview(review: Review): Promise<void>
  // getReviewBySignature(signature: string): Promise<Review | null>
  // getReviewsByAchievement(achievementSignature: string): Promise<Review[]>
  // getReviewsByReviewer(reviewer: string): Promise<Review[]>
  getReviewsByEdition(edition: number): Promise<Review[]>
}
