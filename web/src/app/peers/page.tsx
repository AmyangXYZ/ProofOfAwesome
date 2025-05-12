"use client"

import { Identity } from "@/awesome/connect"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAwesomeNode } from "@/context/awesome-node-context"
import { useEffect } from "react"
import { useState } from "react"

export default function Peers() {
  const node = useAwesomeNode()

  const [peers, setPeers] = useState<Identity[]>([])

  useEffect(() => {
    setPeers(node.getActivePeers())
    const handlePeerDiscovered = (peers: Identity[]) => {
      setPeers(peers)
    }

    node.on("peer.discovered", handlePeerDiscovered)
    return () => {
      node.off("peer.discovered", handlePeerDiscovered)
    }
  }, [node])

  return (
    <div className="max-w-3xl w-full mx-auto p-4">
      <div className="text-sm text-zinc-500 mb-2 text-center">{peers.length} peers connected</div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="text-sm">
              <TableHead className="w-[160px] md:w-[400px]">Peer</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {peers.map((peer) => (
              <TableRow key={peer.address} className="text-sm">
                <TableCell className="font-medium font-mono">
                  <div className="truncate max-w-[160px] md:max-w-[400px]" title={peer.address}>
                    {peer.address}
                  </div>
                </TableCell>
                <TableCell>{peer.name}</TableCell>
                <TableCell>{peer.nodeType}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
