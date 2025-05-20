import { Review } from "@/awesome/awesome"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

const scoreLabels = ["Reject", "Weak Reject", "Weak Accept", "Accept", "Strong Accept"]

export default function ReviewComments({ review }: { review: Review }) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between mb-2 text-sm">
          <div className="flex flex-col gap-0 justify-start">
            <div className="font-medium">{review.reviewerName}</div>
            <div className="text-muted-foreground" title={review.reviewerAddress}>
              {review.reviewerAddress.slice(0, 10)}...
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <span className="text-sm font-medium">{scoreLabels[Math.floor(review.scores.overall) - 1]}</span>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 my-2 text-sm pl-12">
          <div>
            <span className="text-muted-foreground">Innovation: </span>
            <span className="font-medium">{review.scores.innovation}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Dedication: </span>
            <span className="font-medium">{review.scores.dedication}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Significance: </span>
            <span className="font-medium">{review.scores.significance}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Presentation: </span>
            <span className="font-medium">{review.scores.presentation}</span>
          </div>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
          <p>{review.comment}</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
