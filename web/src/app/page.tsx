"use client"

import { useEffect, useRef, useState } from "react"
import AchievementRow from "@/components/achievement-row"
import { Achievement } from "@/awesome/awesome"
import { motion } from "framer-motion"
import Greeting from "@/components/greeting"
import AchievementInput from "@/components/achievement-input"
import { useAwesomeNode } from "@/context/awesome-node-context"

export default function App() {
  const node = useAwesomeNode()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const endOfListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setAchievements(node.getPendingAchievements())

    const handleNewAchievement = (achievement: Achievement) => {
      setAchievements((prev) => [...prev, achievement])
    }
    node.on("achievement.new", handleNewAchievement)

    const handleAchievementsFetched = (achievements: Achievement[]) => {
      setAchievements(achievements)
    }
    node.on("achievements.fetched", handleAchievementsFetched)

    const handleSubmissionPhaseStarted = () => {
      setAchievements([])
    }
    node.on("awesomecom.submission.started", handleSubmissionPhaseStarted)

    return () => {
      node.off("achievement.new", handleNewAchievement)
      node.off("awesomecom.submission.started", handleSubmissionPhaseStarted)
    }
  }, [node])

  useEffect(() => {
    if (endOfListRef.current) {
      endOfListRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [achievements])

  return (
    <div className="max-w-3xl w-full h-[calc(100dvh-40px)] mx-auto min-w-0 flex-1 flex flex-col">
      <div className="flex flex-col px-4 min-w-0 flex-1 overflow-y-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {!achievements.length ? (
          <div className="flex flex-col justify-center items-center h-full -mx-4 ">
            <Greeting />
          </div>
        ) : (
          <div>
            {achievements.map((achievement, index) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                key={index}
                className="mt-4 flex flex-col"
              >
                <AchievementRow achievement={achievement} />
              </motion.div>
            ))}
            <div ref={endOfListRef} />
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto flex p-4 bg-background w-full">
        <AchievementInput />
      </div>
    </div>
  )
}
