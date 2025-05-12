import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Block } from "@/awesome/awesome"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAwesomeNode } from "@/context/awesome-node-context"
import { formatDistanceToNowStrict } from "date-fns"

export default function BlockCard({ block }: { block: Block }) {
  const router = useRouter()
  const node = useAwesomeNode()

  useEffect(() => {}, [node, block])

  const jumpToAchievement = () => {
    router.push(`/block/${block.header.height}`)
  }

  return (
    <>
      <Card
        className="py-2 gap-1 bg-zinc-50 text-zinc-950 text-sm cursor-pointer hover:bg-zinc-100 transition w-full"
        onClick={jumpToAchievement}
      >
        <CardHeader className="pt-1">
          <CardTitle className="flex items-center gap-2 truncate">
            Block
            <span className="truncate max-w-[100px] inline-block align-bottom" title={block.header.height.toString()}>
              #{block.header.height}
            </span>
            ·{" "}
            <span className="text-zinc-500 text-xs font-normal">
              {formatDistanceToNowStrict(block.header.timestamp)}
            </span>
          </CardTitle>
          {/* <CardDescription className="text-zinc-500 text-xs">
            {block.header.transactions.length} transactions
          </CardDescription> */}
        </CardHeader>
        <CardContent className="font-medium"></CardContent>
        <CardFooter className="gap-4 mt-1"></CardFooter>
      </Card>
    </>
  )
}
