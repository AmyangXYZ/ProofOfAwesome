import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Transaction } from "@/awesome/awesome"
import { formatDistanceToNowStrict } from "date-fns"
import { Badge } from "./ui/badge"
import { ArrowLeftRight, MoveRight } from "lucide-react"

export default function TransactionRow({ transaction }: { transaction: Transaction }) {
  return (
    <>
      <Card className="py-3 gap-0 text-sm transition w-full bg-transparent">
        <CardHeader className="gap-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <CardTitle className="flex items-center gap-2 truncate">
                <ArrowLeftRight className="w-4 h-4 text-cyan-500" />
                <span className="inline-block align-bottom">Transaction</span>
                <span className="inline-block align-bottom font-mono">{transaction.signature.slice(0, 7)}</span>
                <Badge
                  className={` ${
                    transaction.blockHeight != -1 ? "bg-blue-500/5 text-blue-500" : "bg-orange-500/5 text-orange-500"
                  } shadow-sm gap-2 flex items-center`}
                >
                  {transaction.blockHeight != -1 ? `Block #${transaction.blockHeight}` : "Pending"}
                </Badge>
              </CardTitle>
              <CardDescription className="flex items-center gap-1 pt-1">
                <span className="text-zinc-500 text-xs font-mono">{transaction.senderAddress.slice(0, 9)}</span>
                <MoveRight className="w-2.5 h-2.5 mb-0.5" />
                <span className="text-zinc-500 text-xs font-mono">{transaction.recipientAddress.slice(0, 9)}</span>
                <span className="text-zinc-500 text-xs font-bold">· </span>
                <span className="text-zinc-500 text-xs font-normal">
                  {formatDistanceToNowStrict(transaction.timestamp, { addSuffix: true })}
                </span>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="text-cyan-500 bg-cyan-500/5 shadow-sm gap-2 flex items-center">
                {transaction.amount.toFixed(
                  Math.max(1, Math.min(4, transaction.amount.toString().split(".")[1]?.length || 0))
                )}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>
    </>
  )
}
