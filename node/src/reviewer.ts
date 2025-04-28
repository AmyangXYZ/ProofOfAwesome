import { Achievement } from "./awesome"

export interface ReviewerRequest {
  theme: string
  achievement: Achievement
}

export interface ReviewerResult {
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
  assignAchievement(request: ReviewerRequest): void
  onReviewSubmitted(listener: (reviewResult: ReviewerResult) => void): void
}
