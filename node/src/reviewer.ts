import { Achievement } from "./awesome"

export interface ReviewResult {
  achievementSignature: string
  achievementAuthorAddress: string
  scores: {
    overall: number
    innovation: number
    dedication: number
    significance: number
    presentation: number
  }
  comment: string
}

export interface Reviewer {
  assignAchievement(achievement: Achievement): void
  onReviewSubmitted(listener: (reviewResult: ReviewResult) => void): void
}
