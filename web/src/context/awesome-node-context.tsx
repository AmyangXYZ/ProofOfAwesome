"use client"

import { createContext, useContext, ReactNode } from "react"
import { AwesomeNodeLight } from "@/awesome/node"

interface AwesomeNodeContextType {
  node: AwesomeNodeLight
}

const AwesomeNodeContext = createContext<AwesomeNodeContextType | null>(null)

export function AwesomeNodeProvider({ children }: { children: ReactNode }) {
  const node = new AwesomeNodeLight("https://connect.proof-of-awesome.app", "Web Node", "", "")
  node.start()
  return <AwesomeNodeContext.Provider value={{ node }}>{children}</AwesomeNodeContext.Provider>
}

export function useAwesomeNode() {
  const context = useContext(AwesomeNodeContext)
  if (!context) {
    throw new Error("useAwesomeNode must be used within an AwesomeNodeProvider")
  }
  return context.node
}
