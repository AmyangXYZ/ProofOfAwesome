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
    const cachedBlock = node.getBlock(height)
    const cachedHeader = node.getBlockHeader(height)
    setBlock(cachedBlock)
    setHeader(cachedHeader)
    const handleBlockHeadersFetched = (headers: BlockHeader[]) => {
      if (cachedHeader) {
        return
      }
      if (headers.find((h) => h.height === height)) {
        setHeader(headers.find((h) => h.height === height))
      }
    }
    const handleBlockFetched = (block: Block) => {
      if (cachedBlock) {
        return
      }
      if (block.header.height === height) {
        setBlock(block)
      }
    }
    node.on("block_headers.fetched", handleBlockHeadersFetched)
    node.on("block.fetched", handleBlockFetched)
    return () => {
      node.off("block_headers.fetched", handleBlockHeadersFetched)
      node.off("block.fetched", handleBlockFetched)
    }
  }, [node, height])

  return (
    <div className="max-w-3xl w-full mx-auto p-4">
      <div className="border-b pb-4">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Block #{header?.height}</h1>
        {header ? (
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Accounts Merkle Root {header?.accountsRoot}</span>
            <span className="text-sm text-muted-foreground">Transactions Merkle Root {header?.transactionsRoot}</span>
            <span className="text-sm text-muted-foreground">Achievements Merkle Root {header?.achievementsRoot}</span>
            <span className="text-sm text-muted-foreground">Reviews Merkle Root {header?.reviewsRoot}</span>
          </div>
        ) : (
          <div className="flex flex-row gap-2">
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        )}
        {block && (
          <div className="flex flex-row gap-2">
            <span className="text-sm text-muted-foreground">{block.transactions.length} transactions</span>
            <span className="text-sm text-muted-foreground">{block.achievements.length} achievements</span>
            <span className="text-sm text-muted-foreground">{block.reviews.length} reviews</span>
          </div>
        )}
      </div>
    </div>
  )
}
