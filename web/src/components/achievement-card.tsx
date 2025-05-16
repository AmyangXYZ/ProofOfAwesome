import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Achievement, Review } from "@/awesome/awesome"
import { Button } from "./ui/button"
import { ChartNoAxesColumn, MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useEffect, useState } from "react"
import { ReviewSheet } from "./review-sheet"
import { useAwesomeNode } from "@/context/awesome-node-context"
import { formatDistanceToNowStrict } from "date-fns"
import { motion } from "framer-motion"

export default function AchievementCard({ achievement }: { achievement: Achievement }) {
  const router = useRouter()
  const node = useAwesomeNode()
  const [reviews, setReviews] = useState<Review[]>([])
  const [medianScore, setMedianScore] = useState(0)
  const [showReviewSheet, setShowReviewSheet] = useState(false)
  const [isNewReview, setIsNewReview] = useState(false)

  const [canReview, setCanReview] = useState(true)

  useEffect(() => {
    const scores = reviews.map((review) => review.scores.overall)
    const sortedScores = scores.sort((a, b) => a - b)
    const medianIndex = Math.floor(sortedScores.length / 2)
    const medianScore = sortedScores[medianIndex]
    if (medianScore) {
      setMedianScore(medianScore)
    }
  }, [reviews])

  useEffect(() => {
    setReviews(node.getReviewsByAchievementSignature(achievement.signature))

    const handleNewReview = (review: Review) => {
      if (review.achievementSignature === achievement.signature) {
        setReviews((prev) => [...prev, review])
        setIsNewReview(true)
        setTimeout(() => setIsNewReview(false), 1000)
      }
    }
    node.on("review.new", handleNewReview)

    const awesomeComStatus = node.getAwesomeComStatus()
    setCanReview(awesomeComStatus.phase === "Submission" || awesomeComStatus.phase === "Review")

    const handleSubmissionStarted = () => {
      setCanReview(true)
    }
    const handleConsensusStarted = () => {
      setCanReview(false)
    }
    node.on("awesomecom.submission.started", handleSubmissionStarted)
    node.on("awesomecom.consensus.started", handleConsensusStarted)

    const handleReviewsFetched = (reviews: Review[]) => {
      setReviews(reviews.filter((review) => review.achievementSignature === achievement.signature))
    }
    node.on("reviews.fetched", handleReviewsFetched)

    return () => {
      node.off("review.new", handleNewReview)
      node.off("awesomecom.submission.started", handleSubmissionStarted)
      node.off("awesomecom.consensus.started", handleConsensusStarted)
      node.off("reviews.fetched", handleReviewsFetched)
    }
  }, [node, achievement])

  const jumpToAchievement = () => {
    router.push(`/achievement/${achievement.signature}`)
  }

  return (
    <>
      <Card
        className="py-2 gap-1 bg-zinc-50 text-zinc-950 text-sm cursor-pointer hover:bg-zinc-100 transition w-full"
        onClick={jumpToAchievement}
      >
        <CardHeader className="pt-1">
          <CardTitle className="flex items-center gap-2 truncate">
            Achievement
            <span className="truncate max-w-[100px] inline-block align-bottom" title={achievement.signature}>
              {achievement.signature.slice(0, 10)}...
            </span>
            ·{" "}
            <span className="text-zinc-500 text-xs font-normal">
              {formatDistanceToNowStrict(achievement.timestamp, { addSuffix: true })}
            </span>
          </CardTitle>
          <CardDescription className="text-zinc-500 text-xs">
            {achievement.authorName} ·{" "}
            <span className="truncate max-w-[120px] inline-block align-bottom" title={achievement.authorAddress}>
              {achievement.authorAddress.slice(0, 10)}...
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="font-medium">
          <span className="truncate inline-block">{achievement.description.slice(0, 80)}</span>
          {achievement.attachments && achievement.attachments.length > 0 && (
            <div className="mt-2">
              <Image
                src={achievement.attachments[0]}
                alt="attachment"
                width={320}
                height={160}
                className="max-h-40 rounded border mt-1"
                style={{ objectFit: "cover" }}
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="gap-4">
          <Button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            className="shadow-sm h-5 hover:bg-zinc-200! hover:text-zinc-950!"
            variant="ghost"
          >
            <ChartNoAxesColumn className="size-3.5" strokeWidth={2} />
            <span className="text-xs">{medianScore}</span>
          </Button>

          <motion.div
            style={{ position: "relative", display: "inline-block" }}
            animate={isNewReview ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            <Button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (canReview) {
                  setShowReviewSheet(true)
                }
              }}
              disabled={!canReview}
              className="bg-transparent! h-5 hover:bg-zinc-200! hover:text-zinc-950! shadow-sm"
              variant="outline"
            >
              <MessageCircle className="size-3" strokeWidth={2.25} />
              <span className="text-xs">{reviews.length}</span>
            </Button>
            {isNewReview && (
              <motion.span
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 0, y: -10 }}
                transition={{ duration: 1 }}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "-1.5em",
                  transform: "translateX(-50%)",
                  color: "blue",
                  fontWeight: "semibold",
                  pointerEvents: "none",
                }}
              >
                +1
              </motion.span>
            )}
          </motion.div>
        </CardFooter>
      </Card>
      <ReviewSheet
        achievementSignature={achievement.signature}
        open={showReviewSheet}
        onOpenChange={setShowReviewSheet}
      />
    </>
  )
}
