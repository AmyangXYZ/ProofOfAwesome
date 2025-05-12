"use client"

import { Block } from "@/awesome/awesome"
import BlockCard from "@/components/block-card"
import { useAwesomeNode } from "@/context/awesome-node-context"
import { useEffect, useState } from "react"

export default function Blocks() {
  const node = useAwesomeNode()
  const [blocks, setBlocks] = useState<Block[]>([])

  useEffect(() => {
    setBlocks(node.getBlocks())
  }, [node])

  return (
    <div className="max-w-3xl w-full mx-auto p-4">
      <div className="text-2xl font-bold">Blocks</div>
      <div className="flex flex-col gap-4">
        {blocks.map((block) => (
          <BlockCard key={block.header.height} block={block} />
        ))}
      </div>
    </div>
  )
}
