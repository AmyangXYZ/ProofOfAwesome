import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Achievement } from "@/awesome/awesome"
import { Button } from "./ui/button"
import { ChartNoAxesColumn, MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useEffect, useState } from "react"
import { ReviewSheet } from "./review-sheet"
import { useAwesomeNode } from "@/context/awesome-node-context"
import { toast } from "sonner"

export default function AchievementCard({ achievement }: { achievement: Achievement }) {
  const router = useRouter()
  const node = useAwesomeNode()
  const [reviewCount, setReviewCount] = useState(0)
  const [medianScore, setMedianScore] = useState(0)
  const [showReviewDialog, setShowReviewDialog] = useState(false)

  useEffect(() => {
    const handleNewReview = (review: { achievementSignature: string }) => {
      if (review.achievementSignature === achievement.signature) {
        setReviewCount((prev) => prev + 1)
        calculateMedianScore()
        toast.success(`New review for ${achievement.signature.slice(0, 10)}...`)
      }
    }

    const calculateMedianScore = () => {
      const reviews = node.getReviews(achievement.signature)
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
  }, [node, achievement])

  // Helper to format relative time
  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now()
    const diff = Math.floor((now - timestamp) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const jumpToAchievement = () => {
    router.push(`/achievement/${achievement.signature}`)
  }

  return (
    <>
      <Card
        className="py-3 gap-1 bg-zinc-50 text-zinc-950 text-sm cursor-pointer hover:bg-zinc-100 transition"
        onClick={jumpToAchievement}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 truncate">
            Achievement
            <span className="truncate max-w-[100px] inline-block align-bottom" title={achievement.signature}>
              {achievement.signature.slice(0, 10)}...
            </span>
            · {formatRelativeTime(achievement.timestamp)}
          </CardTitle>
          <CardDescription className="text-zinc-500 text-xs">
            {achievement.authorName} ·{" "}
            <span className="truncate max-w-[120px] inline-block align-bottom" title={achievement.authorAddress}>
              {achievement.authorAddress.slice(0, 10)}...
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="font-medium">
          <span className="truncate block">{achievement.description}</span>
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
        <CardFooter className="gap-4 mt-1">
          <Button
            onClick={(e) => {
              e.preventDefault()
              // setShowQuickReview(true)
              e.stopPropagation()
            }}
            className="shadow-sm h-7 hover:bg-zinc-200! hover:text-zinc-950!"
            variant="ghost"
          >
            <ChartNoAxesColumn className="size-4.5" strokeWidth={2} />
            <span className="text-sm">{medianScore}</span>
          </Button>

          <Button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowReviewDialog(true)
            }}
            className="bg-transparent! h-7 hover:bg-zinc-200! hover:text-zinc-950! shadow-sm"
            variant="outline"
          >
            <MessageCircle className="size-3.5" strokeWidth={2.25} />
            {reviewCount}
          </Button>
        </CardFooter>
      </Card>
      <ReviewSheet
        achievementSignature={achievement.signature}
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
      />
    </>
  )
}
