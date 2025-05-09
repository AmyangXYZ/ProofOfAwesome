"use client"

import { Achievement, Review } from "@/awesome/awesome"
import { useAwesomeNode } from "@/context/awesome-node-context"
import { use, useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { ChevronsUpDown } from "lucide-react"

const scoreLabels = ["Reject", "Weak Reject", "Weak Accept", "Accept", "Strong Accept"]

export default function Page({ params }: { params: Promise<{ signature: string }> }) {
  const signature = use(params).signature
  const node = useAwesomeNode()
  const [achievement, setAchievement] = useState<Achievement | undefined>({
    signature: "1111111111111111111111111111111111111111111111111111111111111111",
    authorAddress: "0x111111111111111111111111111111",
    timestamp: Date.now(),
    targetBlock: 0,
    description: "",
    authorName: "111111111111111",
    authorPublicKey: "1111111111111111111111111111111111111111111111111111111111111111",
    attachments: [],
  })
  const [reviews, setReviews] = useState<Review[]>([
    {
      signature: "1111111111111111111111111111111111111111111111111111111111111111",
      achievementSignature: signature,
      targetBlock: 0,
      reviewerPublicKey: "1111111111111111111111111111111111111111111111111111111111111111",
      timestamp: Date.now(),
      reviewerName: "111111111111111",
      reviewerAddress: "0x111111111111111111111111111111",
      scores: { overall: 1, innovation: 2, dedication: 3, significance: 4, presentation: 5 },
      comment: "This is a test comment",
    },
  ])
  const [medianScore, setMedianScore] = useState(0)
  useEffect(() => {
    const achievement = node.getAchievement(signature)
    const reviews = node.getReviews(signature)
    setAchievement(achievement)
    setReviews(reviews)

    const handleNewReview = (review: { achievementSignature: string }) => {
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
                <span>{formatDistanceToNow(new Date(achievement.timestamp), { addSuffix: true })}</span>
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
              <div className="text-muted-foreground"></div>
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
          </div>

          {/* Reviews Section */}
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">Reviews ({reviews.length})</h2>
            <div className="space-y-4 ">
              {reviews.map((review) => (
                <Collapsible key={review.signature}>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between mb-2 text-sm">
                      <div className="flex flex-col gap-0 justify-start">
                        <div className="font-medium">{review.reviewerName}</div>
                        <div className="text-muted-foreground font-mono">{review.reviewerAddress.slice(0, 10)}...</div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium">
                          {scoreLabels[Math.floor(review.scores.overall) - 1]}
                        </span>
                        <Button variant="ghost" size="sm">
                          <ChevronsUpDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 mb-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Innovation: </span>
                        <span className="font-medium">{review.scores.innovation}/5</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Dedication: </span>
                        <span className="font-medium">{review.scores.dedication}/5</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Significance: </span>
                        <span className="font-medium">{review.scores.significance}/5</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Presentation: </span>
                        <span className="font-medium">{review.scores.presentation}/5</span>
                      </div>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                      <p>{review.comment}</p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
              {reviews.length === 0 && (
                <div className="text-center text-muted-foreground">
                  No reviews yet. Be the first to review this achievement!
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-lg md:text-2xl font-bold mb-2">Achievement Not Found</h2>
          <p className="text-muted-foreground">
            The achievement with signature {signature.slice(0, 10)}... could not be found.
          </p>
        </div>
      )}
    </div>
  )
}
