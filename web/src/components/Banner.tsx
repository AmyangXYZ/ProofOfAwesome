"use client"

import { useEffect, useState } from "react"

export default function Banner() {
  const [awesomeComStatus, setAwesomeComStatus] = useState({
    edition: 42,
    theme: "Computational Fitness",
    phase: "Submission",
    phaseRemaining: 285000,
    editionRemaining: 485000,
  })

  // Simulate countdown
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
  return (
    <>
      <div className="flex justify-center items-center space-x-3 mb-4">
        <span className="bg-blue-50 px-3 py-1 rounded text-blue-800 font-medium">
          Edition #{awesomeComStatus.edition}
        </span>
        <span className="bg-blue-50 px-3 py-1 rounded text-blue-800 font-medium">{awesomeComStatus.theme}</span>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 pb-3 max-w-xl mx-auto">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Current Phase: {awesomeComStatus.phase}</h3>
        <div className="flex justify-center gap-8 mb-3">
          <div className="text-center">
            <div className="text-xl font-semibold text-blue-800">
              {Math.floor(awesomeComStatus.phaseRemaining / 60000)}m{" "}
              {Math.floor((awesomeComStatus.phaseRemaining % 60000) / 1000)}s
            </div>
            <div className="text-xs text-blue-600">Phase Remaining</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-semibold text-blue-800">
              {Math.floor(awesomeComStatus.editionRemaining / 60000)}m{" "}
              {Math.floor((awesomeComStatus.editionRemaining % 60000) / 1000)}s
            </div>
            <div className="text-xs text-blue-600">Edition Remaining</div>
          </div>
        </div>
        <button
          onClick={() => {}}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors duration-200 text-sm cursor-pointer"
        >
          Connect Wallet to Participate
        </button>
      </div>
    </>
  )
}
