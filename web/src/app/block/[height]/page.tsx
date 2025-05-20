"use client"

import { Block, BlockHeader } from "@/awesome/awesome"
import AchievementCard from "@/components/achievement-card"
import { Separator } from "@/components/ui/separator"
import { useAwesomeNode } from "@/context/awesome-node-context"
import { formatDistanceToNowStrict } from "date-fns"
import Link from "next/link"
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
      console.log("Block fetched", block)
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
      {header ? (
        <div className="pb-4">
          <header className="mb-2">
            <h1 className="text-xl md:text-2xl font-bold mb-1">Block #{header.height} </h1>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <span>{formatDistanceToNowStrict(new Date(header.timestamp), { addSuffix: true })}</span>
            </div>
          </header>
          <div className="flex flex-col gap-2">
            <h4 className="scroll-m-20 font-semibold tracking-tight">Header</h4>
            <span className="text-sm truncate">
              Hash:{" "}
              <span className="text-xs text-muted-foreground" title={header?.hash}>
                {header?.hash}
              </span>
            </span>
            <span className="text-sm truncate">
              Previous block hash:{" "}
              <span className="text-xs text-muted-foreground" title={header?.previousHash}>
                {header?.previousHash}
              </span>
            </span>
            <span className="text-sm truncate">
              Accounts Merkle root:{" "}
              <span className="text-xs text-muted-foreground" title={header?.accountsRoot}>
                {header?.accountsRoot}
              </span>
            </span>
            <span className="text-sm truncate">
              Transactions Merkle root:{" "}
              <span className="truncate text-xs text-muted-foreground" title={header?.transactionsRoot}>
                {header?.transactionsRoot}
              </span>
            </span>
            <span className="text-sm truncate">
              Achievements Merkle root:{" "}
              <span className="truncate text-xs text-muted-foreground" title={header?.achievementsRoot}>
                {header?.achievementsRoot}
              </span>
            </span>
            <span className="text-sm truncate">
              Reviews Merkle root:{" "}
              <span className="truncate text-xs text-muted-foreground" title={header?.reviewsRoot}>
                {header?.reviewsRoot}
              </span>
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-row gap-2">
          <span className="text-xl md:text-2xl font-bold">Loading block #{height} ...</span>
        </div>
      )}
      {block && (
        <>
          <Separator className="w-full mb-2" />
          <h4 className="scroll-m-20 font-semibold tracking-tight">Transactions</h4>
          <ul className="my-2 list-disc [&>li]:mt-2">
            {block.transactions.map((transaction) => (
              <li key={transaction.signature}>
                <Link
                  href={`/transaction/${transaction.signature}`}
                  className="text-xs text-muted-foreground underline"
                  title={transaction.signature}
                >
                  {transaction.signature.slice(0, 24)}...
                </Link>
              </li>
            ))}
            {block.transactions.length === 0 && <p className="text-muted-foreground text-sm">No transactions</p>}
          </ul>
          <Separator className="w-full mb-2" />
          <h4 className="scroll-m-20 font-semibold tracking-tight">Achievements</h4>
          <ul className="my-2 list-disc [&>li]:mt-2">
            {block.achievements.map((achievement) => (
              // <li className="truncate text-sm" key={achievement.signature}>
              //   <Link
              //     href={`/achievement/${achievement.signature}`}
              //     className="text-xs text-muted-foreground underline"
              //     title={achievement.signature}
              //   >
              //     {achievement.signature.slice(0, 24)}...
              //   </Link>
              // </li>
              <div className="flex flex-col mb-4" key={achievement.signature}>
                <AchievementCard achievement={achievement} />
              </div>
            ))}
            {block.achievements.length === 0 && <p className="text-muted-foreground text-sm">No achievements</p>}
          </ul>
        </>
      )}
    </div>
  )
}
