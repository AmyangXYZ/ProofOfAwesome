"use client"

import { Account } from "@/awesome/awesome"
import { Identity } from "@/awesome/connect"
import PeersRow, { PeerAccount } from "@/components/peers-row"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAwesomeNode } from "@/context/awesome-node-context"
import { motion } from "framer-motion"
import { useEffect, useMemo } from "react"
import { useState } from "react"

export default function Peers() {
  const node = useAwesomeNode()
  const [peers, setPeers] = useState<Identity[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])

  const peerAccounts = useMemo(() => {
    const accountMap = new Map(accounts.map(account => [account.address, account]))
    const uniquePeers = new Map<string, PeerAccount>()

    // Add online peers first
    peers.forEach(peer => {
      const account = accountMap.get(peer.address)
      uniquePeers.set(peer.address, {
        address: peer.address,
        name: peer.name,
        balance: account?.balance || 0,
        isOnline: true
      })
    })

    // Add offline accounts only if not already in uniquePeers
    accounts.forEach(account => {
      if (!uniquePeers.has(account.address)) {
        uniquePeers.set(account.address, {
          address: account.address,
          name: account.name,
          balance: account.balance,
          isOnline: false
        })
      }
    })

    // Convert Map to array and sort
    return Array.from(uniquePeers.values()).sort((a, b) => {
      if (a.isOnline !== b.isOnline) return b.isOnline ? 1 : -1
      return b.balance - a.balance
    })
  }, [peers, accounts])

  useEffect(() => {
    setPeers(node.getActivePeers())
    // Add method to request all accounts
    setAccounts(node.getAccounts())

    const handlePeerDiscovered = (peers: Identity[]) => {
      setPeers(peers)
    }
    const handleAccountsFetched = (accounts: Account[]) => {
      setAccounts(accounts)
    }

    node.on("peer.discovered", handlePeerDiscovered)
    node.on("accounts.fetched", handleAccountsFetched)
    return () => {
      node.off("peer.discovered", handlePeerDiscovered)
      node.off("accounts.fetched", handleAccountsFetched)
    }
  }, [node])

  return (
    <div className="max-w-3xl w-full mx-auto p-4">
      <div className="text-sm text-zinc-500 mb-2 text-center">
        {peerAccounts.filter(peer => peer.isOnline).length} online • {peerAccounts.length} total
      </div>
      <ScrollArea className="flex-1 h-[calc(100vh-120px)]">
        {peerAccounts
          .map((peer) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              key={peer.address}
              id={`peer-${peer.address}`}
              className="w-full py-2"
            >
              <PeersRow peer={peer} />
            </motion.div>
          ))}
      </ScrollArea>
    </div>
  )
}