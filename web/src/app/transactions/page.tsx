"use client"

import { Transaction } from "@/awesome/awesome"
import { useAwesomeNode } from "@/context/awesome-node-context"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import TransactionRow from "@/components/transaction-row"

export default function Transactions() {
  const node = useAwesomeNode()
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    setTransactions(node.getTransactions())
    const handleTransactionsFetched = (transactions: Transaction[]) => {
      setTransactions(transactions)
    }
    node.on("transactions.fetched", handleTransactionsFetched)

    const handleNewTransaction = (transaction: Transaction) => {
      setTransactions((prevTransactions) => [transaction, ...prevTransactions])
    }
    node.on("transaction.new", handleNewTransaction)

    return () => {
      node.off("transactions.fetched", handleTransactionsFetched)
      node.off("transaction.new", handleNewTransaction)
    }
  }, [node])

  return (
    <div className="max-w-3xl w-full mx-auto p-4">
      <ScrollArea className="flex-1 h-[calc(100vh-120px)]">
        {transactions
          .sort((a, b) => b.timestamp - a.timestamp)
          .map((transaction) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              key={transaction.signature}
              id={`transaction-${transaction.signature}`}
              className="w-full py-2"
            >
              <TransactionRow transaction={transaction} />
            </motion.div>
          ))}
      </ScrollArea>
    </div>
  )
}
