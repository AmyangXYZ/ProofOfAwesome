import { Achievement, ReviewScores } from "./awesome"

export interface ReviewResult {
  achievementSignature: string
  achievementAuthorAddress: string
  scores: ReviewScores
  comment: string
}

export interface Reviewer {
  assignAchievement(achievement: Achievement): void
  onReviewSubmitted(listener: (reviewResult: ReviewResult) => void): void
}
