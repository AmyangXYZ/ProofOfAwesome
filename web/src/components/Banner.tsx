"use client"

import { useState } from "react"
import { useAwesomeNode } from "@/context/awesome-node-context"
import { AwesomeComStatus } from "@/awesome/awesome"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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
    <div className="mt-8 max-w-lg mx-auto">
      <Card className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 gap-4 py-4">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-50" />

        <CardHeader>
          <CardTitle>
            Edition #{awesomeComStatus.edition} on [{awesomeComStatus.theme}]
          </CardTitle>
          <CardDescription>Current Phase: {awesomeComStatus?.phase}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-8 mb-2">
            <div className="text-center">
              <div className="text-xl font-medium">
                {Math.floor(awesomeComStatus.phaseRemaining / 60000)}m{" "}
                {Math.floor((awesomeComStatus.phaseRemaining % 60000) / 1000)}s
              </div>
              <div className="text-xs">Phase Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-medium">
                {Math.floor(awesomeComStatus.editionRemaining / 60000)}m{" "}
                {Math.floor((awesomeComStatus.editionRemaining % 60000) / 1000)}s
              </div>
              <div className="text-xs">Edition Remaining</div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            onClick={() => {
              window.location.hash = "awesomecom"
            }}
          >
            Participate Now
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
