"use client"

import { Achievement, AwesomeComStatus, Review } from "@/awesome/awesome"
import { useAwesomeNode } from "@/context/awesome-node-context"
import { use, useEffect, useState } from "react"
import { formatDistanceToNowStrict } from "date-fns"
import ReviewComments from "@/components/review-comments"
import { Button } from "@/components/ui/button"
import { SquarePen } from "lucide-react"
import { ReviewSheet } from "@/components/review-sheet"
import Image from "next/image"

const decisionMap: Record<number, string> = {
  1: "Reject",
  2: "Weak Reject",
  3: "Weak Accept",
  4: "Accept",
  5: "Strong Accept",
}

export default function Page({ params }: { params: Promise<{ signature: string }> }) {
  const signature = use(params).signature
  const node = useAwesomeNode()
  const [achievement, setAchievement] = useState<Achievement | undefined>(undefined)
  const [awesomeComStatus, setAwesomeComStatus] = useState<AwesomeComStatus>({
    session: 0,
    phase: "Submission",
    sessionRemaining: 0,
    phaseRemaining: 0,
  })

  const [reviews, setReviews] = useState<Review[]>([])
  const [medianScore, setMedianScore] = useState(0)
  const [showReviewSheet, setShowReviewSheet] = useState(false)

  const [nodeAddress, setNodeAddress] = useState<string>("")

  const [canReview, setCanReview] = useState(false)

  useEffect(() => {
    setCanReview((awesomeComStatus.phase === "Submission" || awesomeComStatus.phase === "Review") && node.targetBlock === achievement?.targetBlock && achievement?.authorAddress !== nodeAddress)
  }, [awesomeComStatus, achievement, nodeAddress, node.targetBlock])

  useEffect(() => {
    const scores = reviews.map((review) => review.scores.overall)
    const sortedScores = scores.sort((a, b) => a - b)
    const medianIndex = Math.floor(sortedScores.length / 2)
    const medianScore = sortedScores[medianIndex]
    setMedianScore(medianScore)
  }, [reviews])

  useEffect(() => {
    setNodeAddress(node.getIdentity().address)
    setAchievement(node.getAchievement(signature))
    setReviews(node.getReviewsByAchievementSignature(signature))

    setAwesomeComStatus(node.getAwesomeComStatus())
    const handleAwesomeComStatusUpdated = (status: AwesomeComStatus) => {
      setAwesomeComStatus(status)
    }
    node.on("awesomecom.status.updated", handleAwesomeComStatusUpdated)

    const handleNewReview = (review: Review) => {
      if (review.achievementSignature === signature) {
        setReviews((prevReviews) => {
          if (prevReviews.some(r => r.signature === review.signature)) {
            return prevReviews;
          }
          return [...prevReviews, review];
        });
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
        const filteredReviews = reviews
          .filter(review => review.achievementSignature === signature)
          .reduce((acc, review) => {
            if (!acc.some(r => r.signature === review.signature)) {
              acc.push(review);
            }
            return acc;
          }, [] as Review[]);
        setReviews(filteredReviews);
      }
    }
    node.on("reviews.fetched", handleReviewsFetched)

    return () => {
      node.off("review.new", handleNewReview)
      node.off("achievement.fetched", handleAchievementFetched)
      node.off("reviews.fetched", handleReviewsFetched)
      node.off("awesomecom.status.updated", handleAwesomeComStatusUpdated)
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
                <span className="font-mono" title={achievement.signature}>
                  {achievement.signature.slice(0, 9)}
                </span>
                <span>•</span>
                <span>{formatDistanceToNowStrict(new Date(achievement.timestamp), { addSuffix: true })}</span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Posted by </span>
                  <span className="font-medium">{achievement.authorName}</span>{" "}
                  <span className="font-mono" title={achievement.authorAddress}>{achievement.authorAddress.slice(0, 9)}</span>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Decision: </span>
                  <span className="font-medium">{decisionMap[medianScore]}</span>
                </div>
              </div>
            </header>



            <div className="prose prose-sm dark:prose-invert max-w-none font-medium">
              <p className="text-base">{achievement.description}</p>
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


          </div>

          {/* Reviews Section */}
          <div className="gap-4 mt-4 flex flex-row items-center justify-between">
            <h4 className="font-semibold tracking-tight">Reviews</h4>

            {canReview && (
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowReviewSheet(true)
                }}
                size="sm"
              >
                <SquarePen />
                Review
              </Button>
            )}
          </div>


          <div className="mt-2">

            {reviews.map((review) => (
              <div key={review.signature} className="pt-4 border-b pb-4">
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
          <p className="text-muted-foreground">Loading achievement {signature.slice(0, 9)}...</p>
        </div>
      )}
    </div>
  )
}
