"use client"

import { Achievement, Review } from "@/awesome/awesome"
import { useAwesomeNode } from "@/context/awesome-node-context"
import { use, useEffect, useState } from "react"
import { formatDistanceToNowStrict } from "date-fns"
import ReviewComments from "@/components/review-comments"
import { Button } from "@/components/ui/button"
import { MessageCircle, ChartNoAxesColumn } from "lucide-react"
import { ReviewSheet } from "@/components/review-sheet"

export default function Page({ params }: { params: Promise<{ signature: string }> }) {
  const signature = use(params).signature
  const node = useAwesomeNode()
  const [achievement, setAchievement] = useState<Achievement | undefined>(undefined)

  const [reviews, setReviews] = useState<Review[]>([])
  const [medianScore, setMedianScore] = useState(0)
  const [showReviewSheet, setShowReviewSheet] = useState(false)

  useEffect(() => {
    const achievement = node.getAchievement(signature)
    const reviews = node.getReviews(signature)
    setAchievement(achievement)
    setReviews(reviews)

    const handleNewReview = (review: Review) => {
      setReviews((prevReviews) => [...prevReviews, review])
      if (review.achievementSignature === signature) {
        calculateMedianScore()
      }
    }

    const calculateMedianScore = () => {
      const reviews = node.getReviews(signature)
      const scores = reviews.map((review) => review.scores.overall)
      const sortedScores = scores.sort((a, b) => a - b)
      const medianIndex = Math.floor(sortedScores.length / 2)
      const medianScore = sortedScores[medianIndex]
      setMedianScore(medianScore)
    }

    node.on("review.new", handleNewReview)

    return () => {
      node.off("review.new", handleNewReview)
    }
  }, [node, signature])

  return (
    <div className="max-w-4xl mx-auto p-4">
      {achievement ? (
        <div className="">
          {/* Achievement Header */}
          <div className="border-b pb-4">
            <header className="mb-2">
              <h1 className="text-xl md:text-2xl font-bold mb-1">Achievement Details</h1>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <span className="truncate max-w-[200px] md:max-w-[300px] inline-block" title={achievement.signature}>
                  {achievement.signature.slice(0, 10)}...
                </span>
                <span>•</span>
                <span>{formatDistanceToNowStrict(new Date(achievement.timestamp), { addSuffix: true })}</span>
              </div>
            </header>

            <div className="prose prose-sm dark:prose-invert max-w-none font-medium">
              <p className="text-base">{achievement.description}</p>
            </div>

            {/* Author Info */}
            <div className="mt-2 flex items-center gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Posted by </span>
                <span className="font-medium">{achievement.authorName}</span>{" "}
                <span title={achievement.authorAddress}>{achievement.authorAddress.slice(0, 10)}...</span>
              </div>
            </div>

            {/* Attachments */}
            {achievement.attachments.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Attachments</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {achievement.attachments.map((attachment, index) => (
                    <div key={index} className="text-sm text-muted-foreground">
                      {attachment}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="gap-4 mt-3 flex items-center">
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                className="h-7 shadow-sm"
              >
                <ChartNoAxesColumn className="size-4.5" strokeWidth={2} />
                <span className="text-sm">{medianScore}</span>
              </Button>

              <Button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowReviewSheet(true)
                }}
                className="h-7 shadow-sm"
              >
                <MessageCircle className="size-3.5" strokeWidth={2.25} />
                {reviews.length}
              </Button>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-4">
            {reviews.map((review) => (
              <div key={review.signature} className="mb-4">
                <ReviewComments review={review} />
              </div>
            ))}
            {reviews.length === 0 && (
              <div className="text-center text-muted-foreground">
                No reviews yet. Be the first to review this achievement!
              </div>
            )}
          </div>

          <ReviewSheet
            achievementSignature={achievement.signature}
            open={showReviewSheet}
            onOpenChange={setShowReviewSheet}
          />
        </div>
      ) : (
        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-2">Achievement Not Found</h2>
          <p className="text-muted-foreground">
            The achievement with signature {signature.slice(0, 10)}... could not be found.
          </p>
        </div>
      )}
    </div>
  )
}
