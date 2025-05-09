"use client"

import { useEffect, useRef, useState } from "react"
import AchievementCard from "@/components/achievement-card"
import { Achievement } from "@/awesome/awesome"
import { motion } from "framer-motion"
import Greeting from "@/components/greeting"
import AchievementInput from "@/components/achievement-input"
import { useAwesomeNode } from "@/context/awesome-node-context"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function AwesomeCom() {
  const node = useAwesomeNode()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const endOfListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleNewAchievement = (achievement: Achievement) => {
      setAchievements((prev) => [...prev, achievement])
    }

    node.on("achievement.new", handleNewAchievement)

    return () => {
      node.off("achievement.new", handleNewAchievement)
    }
  }, [node])

  const [, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now()) // This will trigger a re-render
    }, 10000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (endOfListRef.current) {
      endOfListRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [achievements])

  return (
    <div className="max-w-3xl mx-auto">
      {achievements.length === 0 && <Greeting />}

      <ScrollArea className="h-[calc(100dvh-11rem)] pt-4 px-4">
        <div className="flex flex-col gap-4">
          {achievements.map((achievement) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              key={achievement.signature}
            >
              <AchievementCard achievement={achievement} />
            </motion.div>
          ))}
          <div ref={endOfListRef} />
        </div>
      </ScrollArea>

      <div className="max-w-3xl mx-auto fixed bottom-0 left-0 right-0 p-4 bg-background">
        <AchievementInput />
      </div>
    </div>
  )
}
