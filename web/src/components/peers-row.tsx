import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "./ui/badge"

export interface PeerAccount {
  address: string
  name: string
  balance: number
  isOnline: boolean
}

export default function PeersRow({ peer }: { peer: PeerAccount }) {

  return (
    <>
      <Card
        className="py-2 gap-0 text-sm transition w-full bg-transparent"
      >
        <CardHeader className="gap-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${peer.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
              <div className="flex flex-col">
                <CardTitle className="flex items-center gap-2 truncate">
                  <span className="inline-block align-bottom">
                    {peer.name}
                  </span>
                </CardTitle>
                <CardDescription className="flex items-center gap-1 pt-1">

                  <span className="text-zinc-500 text-xs font-mono">
                    {peer.address.slice(0, 9)}
                  </span>
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="text-cyan-500 bg-cyan-500/5 shadow-sm gap-2 flex items-center">
                {peer.balance.toFixed(Math.max(1, Math.min(4, (peer.balance.toString().split('.')[1]?.length || 0))))}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>
    </>
  )
}
