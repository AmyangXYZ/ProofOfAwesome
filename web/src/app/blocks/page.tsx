"use client"

import { BlockHeader } from "@/awesome/awesome"
import BlockHeaderCard from "@/components/block-header-card"
import { useAwesomeNode } from "@/context/awesome-node-context"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export default function Blocks() {
  const node = useAwesomeNode()
  const [headers, setHeaders] = useState<BlockHeader[]>([])

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
      <div className="flex flex-col gap-4">
        {headers
          .sort((a, b) => b.height - a.height)
          .map((header) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              key={header.height}
            >
              <BlockHeaderCard header={header} />
            </motion.div>
          ))}
      </div>
    </div>
  )
}
