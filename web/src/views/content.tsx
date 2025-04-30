"use client"

import { useEffect, useState } from "react"
import AwesomeComView from "./awesomecom"
import CallForAchievements from "./call-for-achievements"

export default function ContentView() {
  const [currentView, setCurrentView] = useState("")

  const updateViewFromHash = () => {
    setCurrentView(window.location.hash.slice(1))
  }

  useEffect(() => {
    updateViewFromHash()
    window.addEventListener("hashchange", updateViewFromHash)
    return () => window.removeEventListener("hashchange", updateViewFromHash)
  }, [])

  return (
    <div className="inset-0 bg-transparent">
      {currentView === "" && <AwesomeComView />}
      {currentView === "call-for-achievements" && <CallForAchievements />}
    </div>
  )
}
