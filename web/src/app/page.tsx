"use client"

import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ArrowUp, Paperclip } from "lucide-react"
import { useState } from "react"
// import { useAwesomeNode } from "@/context/awesome-node-context"

export default function AwesomeCom() {
  // const node = useAwesomeNode()
  const [description, setDescription] = useState("")

  return (
    <div className="max-w-2xl mx-auto p-4">
      {description}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Textarea
              className="h-24 rounded-16 resize-none rounded-2xl dark:bg-zinc-800 pr-24"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="I am thrilled to announce that ..."
            />
            <div className="absolute bottom-2 left-2">
              <Button size="icon" variant="ghost">
                <Paperclip className="size-4" />
              </Button>
            </div>
            <div className="absolute bottom-2 right-2">
              <Button size="icon" className="rounded-full h-fit w-fit p-1 bg-zinc-400">
                <ArrowUp className="size-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
