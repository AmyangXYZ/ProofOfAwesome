import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BlockHeader } from "@/awesome/awesome"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAwesomeNode } from "@/context/awesome-node-context"
import { formatDistanceToNowStrict } from "date-fns"
import { Badge } from "./ui/badge"
import { ArrowLeftRight, Box, Trophy } from "lucide-react"

export default function BlockHeaderRow({ header }: { header: BlockHeader }) {
  const router = useRouter()
  const node = useAwesomeNode()

  useEffect(() => { }, [node, header])

  const jumpToBlockDetails = () => {
    router.push(`/block/${header.height}`)
  }

  return (
    <>
      <Card
        className="py-3 gap-0 text-sm cursor-pointer hover:bg-zinc-900 transition w-full bg-transparent"
        onClick={jumpToBlockDetails}
      >
        <CardHeader className="gap-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <CardTitle className="flex items-center gap-2 truncate">
                <Box className="w-4.5 h-4.5 text-blue-500" />
                <span className="truncate max-w-[100px] inline-block align-bottom">
                  Block #{header.height}</span>

              </CardTitle>
              <CardDescription title={header.hash} className="flex items-center gap-2 pt-1">
                <span className="text-zinc-500 text-sm font-mono">{header.hash.slice(0, 7)}</span>
                <span className="text-zinc-500 text-sm font-bold">
                  ·{" "}
                </span>
                <span className="text-zinc-500 text-sm font-normal">
                  {formatDistanceToNowStrict(header.timestamp, { addSuffix: true })}
                </span>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="text-orange-500 bg-orange-50/5 shadow-sm gap-2 flex items-center">
                <Trophy />
                {header.achievementsCount}
              </Badge>
              <Badge className="text-cyan-500 bg-cyan-500/5 shadow-sm gap-2 flex items-center">
                <ArrowLeftRight />
                {header.transactionsCount}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>
    </>
  )
}
