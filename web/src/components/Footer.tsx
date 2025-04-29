"use client"

import { useAwesomeNode } from "@/context/AwesomeNodeContext"
import { useState } from "react"

export default function Footer() {
  const node = useAwesomeNode()
  const identity = node.getIdentity()

  const [isConnected, setIsConnected] = useState(false)
  node.on("node.connected", () => {
    setIsConnected(true)
  })
  node.on("node.disconnected", () => {
    setIsConnected(false)
  })

  return (
    <footer className="w-full border-t border-slate-200 text-sm mt-auto">
      <div className="mx-auto px-8 h-12 flex items-center justify-between">
        <span className="text-slate-600">{identity.chainId}</span>
        <div className="text-center text-slate-400">
          <p>© {new Date().getFullYear()} Proof of Awesome. All rights reserved.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`} />
          <span className="text-slate-600">
            {isConnected ? "Connected to AwesomeConnect" : "Disconnected from AwesomeConnect"}
          </span>
        </div>
      </div>
    </footer>
  )
}
