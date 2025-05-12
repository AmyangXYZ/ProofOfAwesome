"use client"

import { createContext, useContext, ReactNode, useEffect } from "react"
import { AwesomeNodeLight } from "@/awesome/node"
import { generateMnemonic } from "bip39"

interface AwesomeNodeContextType {
  node: AwesomeNodeLight
}

const AwesomeNodeContext = createContext<AwesomeNodeContextType | null>(null)

export function AwesomeNodeProvider({ children }: { children: ReactNode }) {
  // Generate and store new mnemonic if none exists
  let mnemonic = ""
  let passphrase = ""

  if (typeof window !== "undefined") {
    mnemonic = localStorage.getItem("mnemonic") || ""
    if (!mnemonic) {
      mnemonic = generateMnemonic()
      localStorage.setItem("mnemonic", mnemonic)
    }
    passphrase = localStorage.getItem("passphrase") || ""
  }

  const node = new AwesomeNodeLight("https://connect.proof-of-awesome.app", "Web Node", mnemonic, passphrase)

  useEffect(() => {
    node.start()

    // Cleanup function
    return () => {
      node.stop()
    }
  })

  return <AwesomeNodeContext.Provider value={{ node }}>{children}</AwesomeNodeContext.Provider>
}

export function useAwesomeNode() {
  const context = useContext(AwesomeNodeContext)
  if (!context) {
    throw new Error("useAwesomeNode must be used within an AwesomeNodeProvider")
  }
  return context.node
}
