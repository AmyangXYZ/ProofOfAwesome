import { useState } from "react"
import { Button } from "./ui/button"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet"

const overallLabels = [
  { value: 1, label: "Reject" },
  { value: 2, label: "Weak Reject" },
  { value: 3, label: "Weak Accept" },
  { value: 4, label: "Accept" },
  { value: 5, label: "Strong Accept" },
]

export function ReviewSheet({
  achievementSignature,
  open,
  onOpenChange,
}: {
  achievementSignature: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [innovation, setInnovation] = useState(3)
  const [dedication, setDedication] = useState(3)
  const [significance, setSignificance] = useState(3)
  const [presentation, setPresentation] = useState(3)
  const [overall, setOverall] = useState(3)
  const [comment, setComment] = useState("")

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="p-0">
        <div className="mx-auto w-full max-w-xl px-4 pb-4">
          <SheetHeader className="text-left gap-1">
            <SheetTitle className="text-base font-clamp-1">
              Review Achievement {achievementSignature.slice(0, 10)}...
            </SheetTitle>
            <SheetDescription>Please provide your evaluation and feedback.</SheetDescription>
          </SheetHeader>
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              // handle submit here
              onOpenChange(false)
            }}
          >
            <div className="overflow-x-auto">
              <Table className="border-0">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24 text-center">Score</TableHead>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <TableHead key={n} className="font-normal  text-center">
                        {n}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { label: "Innovation", value: innovation, setValue: setInnovation },
                    { label: "Dedication", value: dedication, setValue: setDedication },
                    { label: "Significance", value: significance, setValue: setSignificance },
                    { label: "Presentation", value: presentation, setValue: setPresentation },
                  ].map(({ label, value, setValue }) => (
                    <TableRow key={label} className="border-0">
                      <TableCell className="text-center align-middle py-2 text-sm font-medium">{label}</TableCell>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <TableCell key={n} className="text-center w-4 border-0 align-middle py-2">
                          <input
                            type="radio"
                            name={label}
                            value={n}
                            checked={value === n}
                            onChange={() => setValue(n)}
                            className="accent-blue-500"
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center gap-2 justify-center">
              <span className="text-sm font-medium">Overall Recommendation:</span>
              <Select value={String(overall)} onValueChange={(val) => setOverall(Number(val))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select score" />
                </SelectTrigger>
                <SelectContent>
                  {overallLabels.map(({ value, label }) => (
                    <SelectItem key={value} value={String(value)}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label className="flex flex-col text-xs font-medium">
              <span className="text-sm font-medium mb-1">Comment</span>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[60px] mt-1 text-sm"
                placeholder="Reason for this score"
                maxLength={200}
              />
            </label>
            <Button type="submit" className="w-full mt-2">
              Submit
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
