"use client"

import { useState } from "react"
import { useAwesomeNode } from "@/context/AwesomeNodeContext"
import { AwesomeComStatus } from "@/awesome/awesome"
export default function Banner() {
  const node = useAwesomeNode()
  const [awesomeComStatus, setAwesomeComStatus] = useState<AwesomeComStatus>({
    edition: 0,
    theme: "",
    phase: "Submission",
    phaseRemaining: 0,
    editionRemaining: 0,
  })

  node.on("awesomecom.status.updated", (status: AwesomeComStatus) => {
    setAwesomeComStatus(status)
  })

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg mt-8 p-2 pb-3 max-w-xl mx-auto">
        <div className="flex justify-center items-center">
          <span className="bg-blue-50 px-3 py-1 rounded text-blue-800 text-xl">
            Edition #{awesomeComStatus.edition}
          </span>
          <span className="bg-blue-50 px-0 py-1 rounded text-blue-800 text-xl">on</span>
          <span className="bg-blue-50 px-3 py-1 rounded text-blue-800 text-xl">[{awesomeComStatus.theme}]</span>
        </div>
        <h3 className="text-lg font-medium text-blue-900 mb-2">Current Phase: {awesomeComStatus?.phase}</h3>
        <div className="flex justify-center gap-8 mb-3">
          <div className="text-center">
            <div className="text-xl font-semibold text-blue-800">
              {Math.floor(awesomeComStatus.phaseRemaining / 60000)}m{" "}
              {Math.floor((awesomeComStatus.phaseRemaining % 60000) / 1000)}s
            </div>
            <div className="text-sm font-medium text-blue-600">Phase Remaining</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-semibold text-blue-800">
              {Math.floor(awesomeComStatus.editionRemaining / 60000)}m{" "}
              {Math.floor((awesomeComStatus.editionRemaining % 60000) / 1000)}s
            </div>
            <div className="text-sm font-medium text-blue-600">Edition Remaining</div>
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
