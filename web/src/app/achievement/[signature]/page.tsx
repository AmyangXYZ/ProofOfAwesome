"use client"

import { Achievement, Review } from "@/awesome/awesome"
import { useAwesomeNode } from "@/context/awesome-node-context"
import { use, useEffect, useState } from "react"
import { formatDistanceToNowStrict } from "date-fns"
import ReviewComments from "@/components/review-comments"
import { Button } from "@/components/ui/button"
import { MessageCircle, ChartNoAxesColumn } from "lucide-react"
import { ReviewSheet } from "@/components/review-sheet"
import Image from "next/image"

export default function Page({ params }: { params: Promise<{ signature: string }> }) {
  const signature = use(params).signature
  const node = useAwesomeNode()
  const [achievement, setAchievement] = useState<Achievement | undefined>(undefined)

  const [reviews, setReviews] = useState<Review[]>([])
  const [medianScore, setMedianScore] = useState(0)
  const [showReviewSheet, setShowReviewSheet] = useState(false)

  useEffect(() => {
    const scores = reviews.map((review) => review.scores.overall)
    const sortedScores = scores.sort((a, b) => a - b)
    const medianIndex = Math.floor(sortedScores.length / 2)
    const medianScore = sortedScores[medianIndex]
    setMedianScore(medianScore)
  }, [reviews])

  useEffect(() => {
    setAchievement(node.getAchievement(signature))
    setReviews(node.getReviewsByAchievementSignature(signature))

    const handleNewReview = (review: Review) => {
      if (review.achievementSignature === signature) {
        setReviews((prevReviews) => [...prevReviews, review])
      }
    }
    node.on("review.new", handleNewReview)

    const handleAchievementFetched = (achievement: Achievement) => {
      if (achievement.signature === signature) {
        setAchievement(achievement)
      }
    }
    node.on("achievement.fetched", handleAchievementFetched)

    const handleReviewsFetched = (reviews: Review[]) => {
      if (reviews.some((review) => review.achievementSignature === signature)) {
        setReviews(reviews)
      }
    }
    node.on("reviews.fetched", handleReviewsFetched)

    return () => {
      node.off("review.new", handleNewReview)
      node.off("achievement.fetched", handleAchievementFetched)
      node.off("reviews.fetched", handleReviewsFetched)
    }
  }, [node, signature])

  return (
    <div className="max-w-3xl w-full mx-auto p-4">
      {achievement ? (
        <div className="">
          {/* Achievement Header */}
          <div className="border-b pb-4">
            <header className="mb-2">
              <h1 className="text-xl md:text-2xl font-bold mb-1">Achievement</h1>
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

            {/* attachment */}
            {achievement.attachment && achievement.attachment.length > 0 && (
              <div className="mt-2">
                <Image
                  src={achievement.attachment}
                  alt="attachment"
                  width={320}
                  height={160}
                  className="rounded border mt-1 w-full h-auto"
                  style={{ objectFit: "contain" }}
                />
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
              <div key={review.signature} className="mb-4 border-b pb-4">
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
          <p className="text-muted-foreground">Loading achievement {signature.slice(0, 10)}...</p>
        </div>
      )}
    </div>
  )
}
