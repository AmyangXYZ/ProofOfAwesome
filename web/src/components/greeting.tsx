import { motion } from "framer-motion"
import { useAwesomeNode } from "@/context/awesome-node-context"
import { useEffect } from "react"
import { AwesomeComStatus } from "@/awesome/awesome"
import { useState } from "react"

export default function Greeting() {
  const node = useAwesomeNode()

  const [awesomeComStatus, setAwesomeComStatus] = useState<AwesomeComStatus>({
    edition: 0,
    phase: "Submission",
    editionRemaining: 0,
    phaseRemaining: 0,
  })

  useEffect(() => {
    const status = node.getAwesomeComStatus()
    setAwesomeComStatus(status)
    const handleAwesomeComStatusUpdated = (status: AwesomeComStatus) => {
      setAwesomeComStatus(status)
    }
    node.on("awesomecom.status.updated", handleAwesomeComStatusUpdated)

    return () => {
      node.off("awesomecom.status.updated", handleAwesomeComStatusUpdated)
    }
  }, [node])

  return (
    <div className="z-10 absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-3xl w-full">
      <div className="w-full mx-auto md:mt-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.5 }}
          className="text-2xl font-semibold"
        >
          Prove your Awesome!
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.6 }}
          className="text-2xl text-zinc-500"
        >
          Get recognized on blockchain.
        </motion.div>
        <div className="my-12" />
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.9 }}
            className="bg-zinc-900/70 rounded-lg px-6 py-4 shadow-lg flex flex-col gap-1 max-w-md"
          >
            <div className="text-xl font-semibold text-blue-300 flex items-center gap-2">
              <span>Current Target Block:</span>
              <span className="font-bold text-blue-400 font-mono">#{node.getTargetBlock()}</span>
            </div>
            <div className="text-lg mt-1">
              <span className="font-semibold text-green-400 text-xl">{awesomeComStatus.phase}</span>
              <span className="text-zinc-400"> ending in </span>
              <span className="px-2 py-1 rounded bg-zinc-800 text-yellow-400 font-semibold font-mono">
                {Math.floor(awesomeComStatus.phaseRemaining / 1000)}s
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
