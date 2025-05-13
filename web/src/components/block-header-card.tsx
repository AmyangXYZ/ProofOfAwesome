import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BlockHeader } from "@/awesome/awesome"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAwesomeNode } from "@/context/awesome-node-context"
import { formatDistanceToNowStrict } from "date-fns"
import { Badge } from "./ui/badge"
import { ArrowRightLeft, MessageCircle, Trophy } from "lucide-react"

export default function BlockHeaderCard({ header }: { header: BlockHeader }) {
  const router = useRouter()
  const node = useAwesomeNode()

  useEffect(() => {}, [node, header])

  const jumpToBlockDetails = () => {
    router.push(`/block/${header.height}`)
  }

  return (
    <>
      <Card
        className="py-2 gap-2 bg-zinc-50 text-zinc-950 text-sm cursor-pointer hover:bg-zinc-100 transition w-full"
        onClick={jumpToBlockDetails}
      >
        <CardHeader className="pt-1">
          <CardTitle className="flex items-center gap-2 truncate">
            <span className="truncate max-w-[100px] inline-block align-bottom">Block #{header.height}</span>·{" "}
            <span className="text-zinc-500 text-xs font-normal">
              {formatDistanceToNowStrict(header.timestamp, { addSuffix: true })}
            </span>
          </CardTitle>
          <CardDescription className="text-zinc-500 text-xs" title={header.hash}>
            {header.hash.slice(0, 24)}...
          </CardDescription>
        </CardHeader>
        <CardContent className="font-medium gap-4 flex items-center">
          <Badge variant="outline" className="text-zinc-950 shadow-sm gap-2 flex items-center">
            <Trophy />
            {header.achievementsCount}
          </Badge>
          <Badge variant="outline" className="text-zinc-950 shadow-sm gap-2 flex items-center">
            <MessageCircle />
            {header.reviewsCount}
          </Badge>
          <Badge variant="outline" className="text-zinc-950 shadow-sm gap-2 flex items-center">
            <ArrowRightLeft />
            {header.transactionsCount}
          </Badge>
        </CardContent>
      </Card>
    </>
  )
}
