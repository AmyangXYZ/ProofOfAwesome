import { Achievement } from "./awesome"

export interface ReviewResult {
  achievementSignature: string
  scores: {
    overall: number
    originality: number
    creativity: number
    difficulty: number
    relevance: number
    presentation: number
  }
  comment: string
}

export interface Reviewer {
  assignAchievement(achievement: Achievement, theme: string): void
  onReviewSubmitted(listener: (reviewResult: ReviewResult) => void): void
}
