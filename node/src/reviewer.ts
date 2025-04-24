import { Achievement } from "./awesome"

export interface ReviewRequest {
  theme: string
  achievement: Achievement
}

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
  assignAchievement(request: ReviewRequest): void
  onReviewSubmitted(listener: (reviewResult: ReviewResult) => void): void
}
