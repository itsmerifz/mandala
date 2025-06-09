'use client'

import React, { useState, useTransition } from 'react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { createTrainingSessionAction } from '@/app/actions/training-actions'
import { Calendar } from './ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { ChevronDownIcon } from 'lucide-react'
import { format } from 'date-fns'

interface AddTrainingSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  trainingId: string;
  studentName: string;
}

export const AddTrainingSessionDialog = ({ isOpen, onClose, trainingId, studentName }: AddTrainingSessionDialogProps) => {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [open, setOpen] = useState(false)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget)
    formData.append('trainingId', trainingId)
    if (date) {
      formData.append('sessionDate', date.toISOString());
    } else {
      // Handle case where no date is selected, although the field is required
      setError("Please select a session date.");
      return;
    }

    startTransition(async () => {
      const result = await createTrainingSessionAction(formData)
      if (result.success) {
        alert(result.message || 'Success!')
        onClose();
      } else {
        setError(result.error || 'An unknown error occurred.')
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log New Training Session</DialogTitle>
          <DialogDescription>
            Record a session for {studentName}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="sessionDate">Session Date</Label>
            <Popover open={open} onOpenChange={setOpen}>
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
                    setOpen(false)
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Input id="position" name="position" placeholder="e.g., WIII_TWR" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes / Feedback</Label>
            <Textarea id="notes" name="notes" placeholder="Performance summary and points for improvement..." rows={6} />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="destructive" disabled={isPending}>Cancel</Button></DialogClose>
            <Button type="submit" variant="outline" disabled={isPending}>
              {isPending ? 'Logging...' : 'Log Session'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}