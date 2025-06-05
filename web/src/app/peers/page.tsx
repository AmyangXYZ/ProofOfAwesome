"use client"

import { Account } from "@/awesome/awesome"
import { Identity } from "@/awesome/connect"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAwesomeNode } from "@/context/awesome-node-context"
import { useEffect, useMemo } from "react"
import { useState } from "react"

interface PeerAccount {
  address: string
  name: string
  balance: number
  isOnline: boolean
}

export default function Peers() {
  const node = useAwesomeNode()
  const [peers, setPeers] = useState<Identity[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])

  const peerAccounts = useMemo(() => {
    const peerMap = new Map(peers.map(peer => [peer.address, peer]))
    const accountMap = new Map(accounts.map(account => [account.address, account]))

    const merged: PeerAccount[] = []

    // Add online peers first
    peers.forEach(peer => {
      const account = accountMap.get(peer.address)
      merged.push({
        address: peer.address,
        name: peer.name,
        balance: account?.balance || 0,
        isOnline: true
      })
    })

    // Add offline accounts
    accounts.forEach(account => {
      if (!peerMap.has(account.address)) {
        merged.push({
          address: account.address,
          name: account.name,
          balance: account.balance,
          isOnline: false
        })
      }
    })

    // Sort: online first, then by balance descending
    return merged.sort((a, b) => {
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
        {peers.length} online • {accounts.length} total
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="text-sm">
              <TableHead>Address</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {peerAccounts.map((peerAccount) => (
              <TableRow key={peerAccount.address} className="text-sm">
                <TableCell className="font-medium font-mono">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${peerAccount.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <div className="truncate" title={peerAccount.address}>
                      <span className="md:hidden">{peerAccount.address.slice(0, 9)}</span>
                      <span className="hidden md:inline">{peerAccount.address}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{peerAccount.name}</TableCell>
                <TableCell>{peerAccount.balance}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}