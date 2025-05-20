import { Paperclip } from "lucide-react"

import { ArrowUp } from "lucide-react"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { motion } from "framer-motion"
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card"

import { useAwesomeNode } from "@/context/awesome-node-context"
import { useState, useEffect, useRef, ChangeEvent } from "react"
import { AwesomeComStatus } from "@/awesome/awesome"
import Image from "next/image"
import { Skeleton } from "./ui/skeleton"

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
  const [awesomeComStatus, setAwesomeComStatus] = useState<AwesomeComStatus>({
    session: 0,
    phase: "Submission",
    sessionRemaining: 0,
    phaseRemaining: 0,
  })
  const [targetBlock, setTargetBlock] = useState<number>(0)
  const [canSubmit, setCanSubmit] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [fileUrl, setFileUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setCanSubmit(awesomeComStatus.phase === "Submission")
  }, [awesomeComStatus])

  useEffect(() => {
    if (fileUrl.length > 0) {
      setShowSuggestions(false)
    }
  }, [fileUrl])

  useEffect(() => {
    setTargetBlock(node.targetBlock)

    setAwesomeComStatus(node.getAwesomeComStatus())
    const handleAwesomeComStatusUpdated = (status: AwesomeComStatus) => {
      setAwesomeComStatus(status)
    }
    node.on("awesomecom.status.updated", handleAwesomeComStatusUpdated)

    const handleNewTargetBlock = (block: number) => {
      setTargetBlock(block)
    }
    node.on("target_block.updated", handleNewTargetBlock)

    return () => {
      node.off("awesomecom.status.updated", handleAwesomeComStatusUpdated)
      node.off("target_block.updated", handleNewTargetBlock)
    }
  }, [node])

  const [description, setDescription] = useState("")

  const createAchievement = (description: string, fileUrl: string) => {
    node.createAchievement(description, fileUrl)
    setDescription("")
    setFileUrl("")
    resetHeight()
    setShowSuggestions(false)
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setFileUrl("")
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      // 1. Get presigned upload URL and public file URL from your API
      const res = await fetch(`/api/upload-url?filename=${encodeURIComponent(file.name)}`)
      const { uploadUrl, fileUrl: publicUrl, error: apiError } = await res.json()
      if (!uploadUrl) throw new Error(apiError || "Failed to get upload URL")

      // 2. Upload the file to R2 using the presigned URL
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      })
      if (!uploadRes.ok) throw new Error("Upload failed")

      // 3. Show the public file URL
      setFileUrl(publicUrl)
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
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
        {showSuggestions && canSubmit && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                    createAchievement(ach.description, "")
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

        <span className="text-sm text-muted-foreground  text-center -mb-1">
          {awesomeComStatus.phase} for block #{targetBlock} is ending in{" "}
          {Math.floor(awesomeComStatus.phaseRemaining / 1000)} seconds
        </span>
        {fileUrl.length > 0 && fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) && (
          <div className="w-full flex justify-start">
            <div className="w-[180px] h-[120px] border-2 border-zinc-700 rounded-xl shadow-lg overflow-hidden">
              <Image src={fileUrl} alt="Uploaded" width={160} height={100} className="object-cover w-full h-full" />
            </div>
          </div>
        )}
        {uploading && (
          <div className="w-full flex justify-start">
            <Skeleton className="w-[180px] h-[120px] rounded-xl" />
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
              createAchievement(description, fileUrl)
            }
          }}
          disabled={!canSubmit}
          placeholder={canSubmit ? "I am thrilled to announce that ..." : "Submission is closed for the current block"}
        />
        <div className="absolute bottom-0 p-2 w-fit flex flex-row justify-start">
          <Button size="icon" variant="ghost" disabled={!canSubmit} onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="size-4.5" />
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} disabled={uploading} />
          </Button>
        </div>
        <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
          <Button
            size="icon"
            className="rounded-full h-fit w-fit p-1"
            disabled={description.length === 0 || !canSubmit}
            onClick={() => createAchievement(description, fileUrl)}
          >
            <ArrowUp className="size-5" />
          </Button>
        </div>
      </div>
    </>
  )
}
