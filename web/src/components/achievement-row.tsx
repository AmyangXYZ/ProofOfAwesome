import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Achievement, Review } from "@/awesome/awesome"
import { Trophy } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useAwesomeNode } from "@/context/awesome-node-context"
import { Badge } from "@/components/ui/badge"

const decisionMap: Record<number, string> = {
  1: "Reject",
  2: "Weak Reject",
  3: "Weak Accept",
  4: "Accept",
  5: "Strong Accept",
}

export default function AchievementRow({ achievement }: { achievement: Achievement }) {
  const router = useRouter()
  const node = useAwesomeNode()
  const [reviews, setReviews] = useState<Review[]>([])
  const [medianScore, setMedianScore] = useState(0)

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
      }
    }
    node.on("review.new", handleNewReview)

    const handleReviewsFetched = (reviews: Review[]) => {
      setReviews((prevReviews) => {
        const seenSignatures = new Set(prevReviews.map((r) => r.signature))
        const newReviews = reviews.filter(
          (review) => review.achievementSignature === achievement.signature && !seenSignatures.has(review.signature)
        )
        return [...prevReviews, ...newReviews]
      })
    }
    node.on("reviews.fetched", handleReviewsFetched)

    return () => {
      node.off("review.new", handleNewReview)
      node.off("reviews.fetched", handleReviewsFetched)
    }
  }, [node, achievement])

  const jumpToAchievement = () => {
    router.push(`/achievement/${achievement.signature}`)
  }

  return (
    <>
      <Card
        className="py-3 gap-1 text-sm cursor-pointer hover:bg-zinc-900 transition w-full bg-transparent"
        onClick={jumpToAchievement}
      >
        <CardHeader className="gap-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <CardTitle className="flex items-center gap-2 truncate">
                <Trophy className="w-4 h-4 text-orange-500" />
                <span className="inline-block align-bottom">
                  Achievement
                </span>
                <span className="inline-block align-bottom font-mono">
                  {achievement.signature.slice(0, 7)}
                </span>
              </CardTitle>
              <CardDescription title={achievement.authorAddress} className="flex items-center gap-1 pt-1">
                <span className="text-zinc-500 text-xs">{achievement.authorName}</span>
                <span className="text-zinc-500 text-xs">
                  -
                </span>
                <span className="text-zinc-500 text-xs font-mono">
                  {achievement.authorAddress.slice(0, 9)}
                </span>
                {/* <span className="text-zinc-500 text-xs font-bold">·</span> */}
                {/* <span className="text-zinc-500 text-xs">
                  {formatDistanceToNowStrict(achievement.timestamp, { addSuffix: true })}
                </span> */}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${medianScore < 3 ? 'text-red-500 bg-red-50/5' : 'text-blue-500 bg-blue-50/5'} shadow-sm gap-2 flex items-center`}>
                {decisionMap[medianScore]}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="font-medium gap-0">
          <span className="truncate whitespace-nowrap overflow-hidden block w-full">{achievement.description}</span>
          {achievement.attachment && achievement.attachment.length > 0 && (
            <Image
              src={achievement.attachment}
              alt="attachment"
              width={320}
              height={180}
              className="max-h-50 rounded border w-full mt-2"
              style={{ objectFit: "cover" }}
            />
          )}
        </CardContent>
      </Card>
    </>
  )
}
