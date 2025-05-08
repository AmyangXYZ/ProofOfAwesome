"use client"

import { useAwesomeNode } from "@/context/awesome-node-context"
import { use } from "react"

export default function Page({ params }: { params: Promise<{ signature: string }> }) {
  const signature = use(params).signature
  const node = useAwesomeNode()
  const achievement = node.getAchievement(signature)
  const reviews = node.getReviews(signature)

  return (
    <div>
      {achievement ? (
        <div>
          {JSON.stringify(achievement)}
          <div>
            {reviews.map((review) => (
              <div key={review.signature}>{JSON.stringify(review)}</div>
            ))}
          </div>
        </div>
      ) : (
        <p>Achievement {signature} not found</p>
      )}
    </div>
  )
}
