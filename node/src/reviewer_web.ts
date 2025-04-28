import { Achievement } from "./awesome"
import { Reviewer, ReviewResult } from "./reviewer"

export class WebReviewer implements Reviewer {
  constructor() {}

  assignAchievement(achievement: Achievement, theme: string): void {
    console.log("assignAchievement", achievement, theme)
  }

  onReviewSubmitted(listener: (reviewResult: ReviewResult) => void): void {
    console.log("onReviewSubmitted", listener)
  }
}
