import { Paperclip } from "lucide-react"

import { ArrowUp } from "lucide-react"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { motion } from "framer-motion"
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card"

import { useAwesomeNode } from "@/context/awesome-node-context"
import { useState, useEffect, useRef } from "react"
import { Achievement } from "@/awesome/awesome"

const suggestedAchievements: {
  title: string
  label: string
  description: string
}[] = [
  {
    title: "I ran",
    label: "for 30 minutes on Fox Hill",
    description: "I ran for 30 minutes on Fox Hill",
  },
  {
    title: "I cooked",
    label: "a three-course meal for my family",
    description: "I cooked a three-course meal for my family",
  },
  {
    title: "I won",
    label: "5 Dota2 games in a row",
    description: "I won 5 Dota2 games in a row",
  },

  {
    title: "I cleaned",
    label: "10 dishes after dinner",
    description: "I cleaned 10 dishes after dinner",
  },
] as const

export default function AchievementInput() {
  const node = useAwesomeNode()
  const [achievements, setAchievements] = useState<Achievement[]>([])

  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  const [description, setDescription] = useState("")

  const createAchievement = (description: string) => {
    node.createAchievement(description)
    setDescription("")
    resetHeight()
  }

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight()
    }
  }, [])

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`
    }
  }

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = "98px"
    }
  }
  return (
    <>
      <div className="relative w-full flex flex-col gap-4">
        {!achievements.length && (
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestedAchievements.map((ach, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.05 * i }}
                key={`suggested-achievement-${ach.title}-${i}`}
                className={i > 1 ? "hidden sm:block" : "block"}
              >
                <Card
                  key={i}
                  className={`bg-transparent py-3 gap-2 h-full w-full hover:bg-zinc-800 cursor-pointer ${
                    i >= 2 ? "hidden md:block" : ""
                  }`}
                  onClick={() => {
                    createAchievement(ach.description)
                  }}
                >
                  <CardHeader>
                    <CardTitle className="text-sm">{ach.title}</CardTitle>
                    <CardDescription>{ach.label}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <Textarea
          ref={textareaRef}
          className="max-h-[calc(75dvh)] min-h-[24px] overflow-hidden resize-none rounded-2xl !text-base bg-muted pb-10 dark:border-zinc-700"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value)
            adjustHeight()
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && description.trim().length > 0) {
              e.preventDefault()
              createAchievement(description)
            }
          }}
          placeholder="I am thrilled to announce that ..."
        />
        <div className="absolute bottom-0 p-2 w-fit flex flex-row justify-start">
          <Button size="icon" variant="ghost">
            <Paperclip className="size-4.5" />
          </Button>
        </div>
        <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
          <Button
            size="icon"
            className="rounded-full h-fit w-fit p-1"
            disabled={description.length === 0}
            onClick={() => createAchievement(description)}
          >
            <ArrowUp className="size-5" />
          </Button>
        </div>
      </div>
    </>
  )
}
