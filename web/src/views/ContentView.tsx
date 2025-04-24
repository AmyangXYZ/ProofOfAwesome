"use client"

import { useEffect, useState } from "react"
import CallForAchievementsView from "./CallForAchievemetnView"
import SubmissionView from "./SubmissionView"

const chainId = "Proof-of-Awesome v0.1.0"
const isConnected = true

export default function ContentView() {
  const [currentView, setCurrentView] = useState("call-for-achievements")

  const [awesomeComStatus, setAwesomeComStatus] = useState({
    edition: 42,
    theme: "Computational Fitness",
    phase: "Achievement Submission",
    phaseRemaining: 285000,
    editionRemaining: 485000,
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setAwesomeComStatus((prev) => ({
        ...prev,
        phaseRemaining: Math.max(0, prev.phaseRemaining - 1000),
        editionRemaining: Math.max(0, prev.editionRemaining - 1000),
      }))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Format time remaining in mm:ss
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-serif">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-700 shadow-lg">
        <div className="p-6 border-b border-slate-700 flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center mb-2 relative">
            <span className="text-2xl font-bold text-blue-200">PoA</span>
            <div className="absolute inset-0 rounded-full border-2 border-blue-500 opacity-70"></div>
            <div className="absolute w-2 h-2 bg-blue-400 rounded-full top-1 right-2 animate-pulse"></div>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-2">Proof of Awesome</h1>
          <p className="text-xs text-blue-300 mt-1 font-mono text-center">
            Transform achievements into validated digital assets
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            <button
              onClick={() => setCurrentView("call-for-achievements")}
              className={`w-full text-left px-4 py-2 rounded transition-colors ${currentView === "call-for-achievements" ? "bg-blue-900 text-blue-100" : "text-slate-300 hover:bg-slate-800 cursor-pointer"}`}
            >
              Call for Achievements
            </button>
            <button
              onClick={() => setCurrentView("submission")}
              className={`w-full text-left px-4 py-2 rounded transition-colors ${currentView === "submission" ? "bg-blue-900 text-blue-100" : "text-slate-300 hover:bg-slate-800 cursor-pointer"}`}
            >
              Submit Achievement
            </button>
            <button
              onClick={() => setCurrentView("review")}
              className={`w-full text-left px-4 py-2 rounded transition-colors ${currentView === "review" ? "bg-blue-900 text-blue-100" : "text-slate-300 hover:bg-slate-800 cursor-pointer"}`}
            >
              Peer Review
            </button>
            <button
              onClick={() => setCurrentView("blockchain")}
              className={`w-full text-left px-4 py-2 rounded transition-colors ${currentView === "blockchain" ? "bg-blue-900 text-blue-100" : "text-slate-300 hover:bg-slate-800 cursor-pointer"}`}
            >
              Blockchain Explorer
            </button>
            <button
              onClick={() => setCurrentView("wallet")}
              className={`w-full text-left px-4 py-2 rounded transition-colors ${currentView === "wallet" ? "bg-blue-900 text-blue-100" : "text-slate-300 hover:bg-slate-800 cursor-pointer"}`}
            >
              Token Management
            </button>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-700">
            <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2 px-4">Resources</h3>
            <div className="space-y-1">
              <a href="#" className="block px-4 py-1 text-sm text-slate-400 hover:text-slate-200">
                Documentation
              </a>
              <a
                href="https://github.com/AmyangXYZ/ProofOfAwesome"
                target="_blank"
                className="block px-4 py-1 text-sm text-slate-400 hover:text-slate-200"
              >
                GitHub Repository
              </a>
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-700 flex flex-col">
          <div className="bg-slate-800 rounded p-3 text-xs text-slate-300">
            <div className="flex justify-between mb-1">
              <span>AwesomeCom:</span>
              <span className="font-mono text-blue-300">#{awesomeComStatus.edition}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Phase:</span>
              <span className="font-mono text-amber-300">{awesomeComStatus.phase}</span>
            </div>
            <div className="flex justify-between">
              <span>Time Remaining:</span>
              <span className="font-mono">{formatTime(awesomeComStatus.phaseRemaining)}</span>
            </div>
          </div>
          <button className="mt-4 bg-blue-800 hover:bg-blue-700 text-white py-2 rounded text-sm font-sans transition-colors">
            Connect Wallet
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="w-full flex-1 overflow-auto relative flex flex-col">
        {/* Subtle grid background with faint blue lines */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
                 linear-gradient(rgba(30, 58, 138, 0.05) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(30, 58, 138, 0.05) 1px, transparent 1px)
               `,
            backgroundSize: "20px 20px",
            zIndex: -1,
          }}
        ></div>

        <div className="flex-1">
          {currentView === "call-for-achievements" && <CallForAchievementsView />}
          {currentView === "submission" && <SubmissionView />}
        </div>

        {/* Footer */}
        <footer className="w-full border-t border-slate-200 text-sm mt-auto">
          <div className="mx-auto px-8 h-12 flex items-center justify-between">
            <span className="text-slate-600">{chainId}</span>
            <div className="text-center text-slate-400">
              <p>© {new Date().getFullYear()} Proof of Awesome. All rights reserved.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`} />
              <span className="text-slate-600">Connected to AwesomeConnect</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
