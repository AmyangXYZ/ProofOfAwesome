import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Review } from "@/awesome/awesome"

const scoreLabels = ["Reject", "Weak Reject", "Weak Accept", "Accept", "Strong Accept"]

export default function ReviewResult({ review }: { review: Review }) {
  return (
    <Card className="py-4 gap-2 bg-zinc-900">
      <CardHeader>
        <CardTitle>Review - {review.signature.slice(0, 8)}...</CardTitle>
        <CardDescription>
          {review.reviewerName} - {review.reviewerAddress.slice(0, 8)}...
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <span className="font-medium">
            Score: {review.scores.overall} - {scoreLabels[Math.floor(review.scores.overall) - 1]}
          </span>
          <div className="px-6 flex flex-row gap-2 text-muted-foreground text-sm grid grid-cols-2 md:grid-cols-4">
            <span className="font-semibold">Innovation: {review.scores.innovation}</span>
            <span className="font-semibold">Dedication: {review.scores.dedication}</span>
            <span className="font-semibold">Significance: {review.scores.significance}</span>
            <span className="font-semibold">Presentation: {review.scores.presentation}</span>
          </div>
          {review.comment}
        </div>
      </CardContent>
    </Card>
  )
}
