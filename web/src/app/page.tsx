"use client"

import { useEffect, useRef, useState } from "react"
import AchievementCard from "@/components/achievement-card"
import { Achievement } from "@/awesome/awesome"
import { motion } from "framer-motion"
import Greeting from "@/components/greeting"
import AchievementInput from "@/components/achievement-input"
import { useAwesomeNode } from "@/context/awesome-node-context"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function App() {
  const node = useAwesomeNode()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const endOfListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setAchievements(node.getAchievements())

    const handleNewAchievement = (achievement: Achievement) => {
      setAchievements((prev) => [...prev, achievement])
    }

    node.on("achievement.new", handleNewAchievement)

    return () => {
      node.off("achievement.new", handleNewAchievement)
    }
  }, [node])

  useEffect(() => {
    if (endOfListRef.current) {
      endOfListRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [achievements])

  return (
    <div className="max-w-3xl w-full h-[calc(100dvh-40px)] mx-auto min-w-0 flex-1 flex flex-col">
      <ScrollArea className="flex flex-col px-4 min-w-0 flex-1 overflow-y-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {!achievements.length ? (
          <div className="flex flex-col justify-center items-center h-full -mx-4 mt-[18dvh] md:mt-[25dvh]">
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
                className="mt-4"
              >
                <AchievementCard achievement={achievement} />
              </motion.div>
            ))}
            <div ref={endOfListRef} />
          </div>
        )}
      </ScrollArea>

      <div className="max-w-3xl mx-auto flex p-4 bg-background w-full">
        <AchievementInput />
      </div>
    </div>
  )
}
