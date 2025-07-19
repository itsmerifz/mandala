/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { createTrainingSessionAction, getCompetencyTemplateAction } from "@/app/actions/training-actions"
import { CompetencyTemplate, MentorInputLevel, PerformanceLevel } from "@root/prisma/generated"
import { FormEvent, useEffect, useState, useTransition } from "react"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Button } from "./ui/button"
import { format } from "date-fns"
import { ChevronDownIcon } from "lucide-react"
import { Calendar } from "./ui/calendar"
import { Skeleton } from "./ui/skeleton"
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"
import { Textarea } from "./ui/textarea"

interface LogSessionWithReportDialogProps {
  isOpen: boolean
  onClose: () => void
  trainingId: string
  studentName: string
  templateName: string
}

type CompetencyResultState = {
  mentorInput: MentorInputLevel
  performanceLevel: PerformanceLevel
  notes?: string
}

const LogSessionWithReportDialog = ({ isOpen, onClose, trainingId, studentName, templateName }: LogSessionWithReportDialogProps) => {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [template, setTemplate] = useState<CompetencyTemplate | null>(null)
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true)
  const [results, setResults] = useState<Record<string, CompetencyResultState>>({})
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [openDate, setOpenDate] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const fetchTemplate = async () => {
        setIsLoadingTemplate(true)
        const res = await getCompetencyTemplateAction(templateName)
        if (res.success) setTemplate(res.data as CompetencyTemplate)
        else setError(res.error as string)
        setIsLoadingTemplate(false)
      }
      fetchTemplate()
    }
  }, [isOpen, templateName])

  const handleResultChange = (itemId: string, field: keyof CompetencyResultState, value: string) => {
    setResults(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }))
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.append('trainingId', trainingId)
    
    const allItems = template?.sections.flatMap((s: any) => s.items) || []
    for (const item of allItems) {
      if (!results[item.id]?.mentorInput || !results[item.id]?.performanceLevel) {
        setError(`Please fill all required fields for "${item.competency}"`);
        return;
      }
    }

    const competencyResultsForAction = Object.entries(results).map(([itemId, result]) => ({
      competencyItemId: itemId,
      ...result
    }))
    formData.append('competencyResults', JSON.stringify(competencyResultsForAction))

    startTransition(async () => {
      const result = await createTrainingSessionAction(formData)
      if (result.success) {
        alert(result.message || 'Success!')
        onClose()
      } else {
        setError(result.error || 'An unknown error occurred')
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Log Training Session Report</DialogTitle>
          <DialogDescription>Fill out the competency checklist for {studentName}.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="max-h-[65dvh] overflow-y-auto pr-6 space-y-6">
            <fieldset className="grid grid-cols-3 gap-4 border p-4 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="sessionDate">Session Date</Label>
                <Popover open={openDate} onOpenChange={setOpenDate}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="date"
                      className="w-full justify-between font-normal"
                    >
                      {date ? format(date, 'PPP') : <span>Pick a date</span>}
                      <ChevronDownIcon />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      captionLayout="dropdown"
                      disabled={(date) => {
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        return date < today
                      }}
                      onSelect={(date) => {
                        setDate(date)
                        setOpenDate(false)
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input id="position" name="position" required />
              </div>
            </fieldset>

            {/* Competency checklists */}
            {isLoadingTemplate ? <Skeleton className="w-full h-48" /> : template?.sections.map((section: any) => (
              <div key={section.id}>
                <h3 className="text-lg font-semibold mb-2 p-2 bg-muted rounded-md">{section.title}</h3>
                {section.items.map((item: any)=> (
                  <div key={item.id} className="grid grid-cols-12 gap-4 items-center border-b py-2">
                    <p className="col-span-4 text-sm">{item.competency}</p>
                    <RadioGroup onValueChange={(val) => handleResultChange(item.id, 'mentorInput', val)} className="col-span-2 flex justify-around">
                      {Object.values(MentorInputLevel).map(level => <RadioGroupItem key={level} value={level} id={`${item.id}-${level}`} />)}
                    </RadioGroup>
                    <RadioGroup onValueChange={(val) => handleResultChange(item.id, 'performanceLevel', val)} className="col-span-2 flex justify-around">
                      {Object.values(PerformanceLevel).map(level => <RadioGroupItem key={level} value={level} id={`${item.id}-${level}`} />)}
                    </RadioGroup>
                    <Input onChange={(e) => handleResultChange(item.id, 'notes', e.target.value)} className="col-span-4 h-8" placeholder="Notes..." />
                  </div>
                ))}
              </div>
            ))}

            {/* Notes */}
            <div className="space-y-2 pt-4">
              <Label htmlFor="notes">General Notes</Label>
              <Textarea id="notes" name="notes" placeholder="Overall summary of the session..." rows={5} />
            </div>
          </div>
          {error && <p className="text-sm text-red-500 font-semibold p-4">{error}</p>}
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="destructive" disabled={isPending}>Cancel</Button></DialogClose>
            <Button type="submit" variant="outline" disabled={isPending || isLoadingTemplate}>
              {isPending ? 'Saving Report...' : 'Save Report'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default LogSessionWithReportDialog