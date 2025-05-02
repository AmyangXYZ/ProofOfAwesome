"use client"

import { Identity } from "@/awesome/connect"
import { useEffect } from "react"
import { useAwesomeNode } from "@/context/awesome-node-context"
import { useState } from "react"

export default function Peers() {
  const node = useAwesomeNode()
  const [peers, setPeers] = useState<Identity[]>([])

  useEffect(() => {
    setPeers(node.getActivePeers())
  }, [node])

  node.on("peer.discovered", (peers) => {
    setPeers(peers)
  })

  return (
    <div className="max-w-5xl px-4 mx-auto py-2">
      <header className="mb-8 text-center">
        <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-3xl">Peers</h1>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {peers.map((peer) => (
          <div key={peer.address} className="p-4 border rounded-md">
            <h2 className="text-lg font-semibold">{peer.address}</h2>
            <p className="text-sm text-gray-500">{peer.name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
