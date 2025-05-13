"use client"

import { Block, BlockHeader } from "@/awesome/awesome"
import { useAwesomeNode } from "@/context/awesome-node-context"
import { use, useEffect, useState } from "react"

export default function BlockPage({ params }: { params: Promise<{ height: number }> }) {
  const height = Number(use(params).height)
  const node = useAwesomeNode()
  const [block, setBlock] = useState<Block | undefined>(undefined)
  const [header, setHeader] = useState<BlockHeader | undefined>(undefined)

  useEffect(() => {
    if (isNaN(height)) {
      return
    }
    const block = node.getBlock(height)
    const header = node.getBlockHeader(height)
    console.log(header)
    setBlock(block)
    setHeader(header)
  }, [node, height])

  return (
    <div className="max-w-3xl w-full mx-auto p-4">
      <div className="border-b pb-4">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Block #{header?.height}</h1>
        {header ? (
          <div className="flex flex-row gap-2">
            <span className="text-sm text-muted-foreground">Accounts Merkle Root {header?.accountsRoot}</span>
            <span className="text-sm text-muted-foreground">Transactions Merkle Root {header?.transactionsRoot}</span>
            <span className="text-sm text-muted-foreground">
              Achievements Merkle Root {block?.header.achievementsRoot}
            </span>
            <span className="text-sm text-muted-foreground">Reviews Merkle Root {header?.reviewsRoot}</span>
          </div>
        ) : (
          <div className="flex flex-row gap-2">
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        )}
      </div>
    </div>
  )
}
