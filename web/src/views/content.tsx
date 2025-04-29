"use client"

import { ReactNode, useEffect, useState } from "react"
import AwesomeComView from "./awesomecom"

export default function ContentView({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState("")

  const updateViewFromHash = () => {
    setCurrentView(window.location.hash.slice(1))
  }

  useEffect(() => {
    updateViewFromHash()
    window.addEventListener("hashchange", updateViewFromHash)
    return () => window.removeEventListener("hashchange", updateViewFromHash)
  }, [])

  if (!currentView) return children

  return <div className="inset-0 bg-transparent">{currentView === "awesomecom" && <AwesomeComView />}</div>
}
