"use client"

import { BlockHeader } from "@/awesome/awesome"
import BlockHeaderCard from "@/components/block-header-card"
import { useAwesomeNode } from "@/context/awesome-node-context"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function Blocks() {
  const node = useAwesomeNode()
  const [headers, setHeaders] = useState<BlockHeader[]>([])
  const [targetHeight, setTargetHeight] = useState<string>("")
  const [showEmptyBlocks, setShowEmptyBlocks] = useState(true)

  useEffect(() => {
    setHeaders(node.getBlockHeaders())
    const handleBlockHeadersFetched = (headers: BlockHeader[]) => {
      setHeaders(headers)
    }
    node.on("block_headers.fetched", handleBlockHeadersFetched)

    const handleNewBlockHeader = (header: BlockHeader) => {
      setHeaders((prevHeaders) => [header, ...prevHeaders])
    }
    node.on("block_header.new", handleNewBlockHeader)

    return () => {
      node.off("block_headers.fetched", handleBlockHeadersFetched)
      node.off("block_header.new", handleNewBlockHeader)
    }
  }, [node])

  return (
    <div className="max-w-3xl w-full mx-auto p-4">
      <div className="flex flex-row gap-4 items-center justify-between mb-2">
        <Input
          type="number"
          placeholder="Jump to height..."
          className="w-38 text-sm"
          value={targetHeight}
          onChange={(e) => setTargetHeight(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && targetHeight) {
              const height = parseInt(targetHeight)
              const block = headers.find((h) => h.height === height)
              if (block) {
                document.getElementById(`block-${height}`)?.scrollIntoView({ behavior: "smooth" })
              }
            }
          }}
        />
        <div className="flex items-center space-x-2">
          <Checkbox
            id="show-empty-blocks"
            checked={showEmptyBlocks}
            onCheckedChange={(checked) => setShowEmptyBlocks(checked as boolean)}
          />
          <label
            htmlFor="show-empty-blocks"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Show empty blocks
          </label>
        </div>
      </div>
      <ScrollArea className="flex-1 h-[calc(100vh-120px)]">
        {headers
          .sort((a, b) => b.height - a.height)
          .filter((header) => showEmptyBlocks || header.achievementsCount > 0)
          .map((header) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              key={header.height}
              id={`block-${header.height}`}
              className="w-full py-2"
            >
              <BlockHeaderCard header={header} />
            </motion.div>
          ))}
      </ScrollArea>
    </div>
  )
}
