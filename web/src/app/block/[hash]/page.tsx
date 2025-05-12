"use client"

import { Block } from "@/awesome/awesome"
import { useAwesomeNode } from "@/context/awesome-node-context"
import { use, useEffect, useState } from "react"

export default function BlockPage({ params }: { params: Promise<{ height: number }> }) {
  const height = use(params).height
  const node = useAwesomeNode()
  const [block, setBlock] = useState<Block | undefined>(undefined)

  useEffect(() => {
    const block = node.getBlock(height)
    setBlock(block)
  }, [node, height])

  return (
    <div className="max-w-3xl w-full mx-auto p-4">
      <div className="border-b pb-4">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Block #{block?.header.height}</h1>
      </div>
    </div>
  )
}
