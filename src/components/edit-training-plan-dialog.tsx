'use client'

import React, { useState, useTransition } from 'react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from './ui/dialog'
import { Textarea } from './ui/textarea'
import { updateTrainingPlanAction } from '@/app/actions/training-actions'

interface EditTrainingPlanDialogProps {
  isOpen: boolean
  onClose: () => void
  trainingId: string
  initialPlan: string | null
}

export const EditTrainingPlanDialog = ({ isOpen, onClose, trainingId, initialPlan }: EditTrainingPlanDialogProps) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget);
    formData.append('trainingId', trainingId)

    startTransition(async () => {
      const result = await updateTrainingPlanAction(formData)
      if (result.success) {
        alert(result.message || 'Success!')
        onClose()
      } else {
        setError(result.error || 'An unknown error occurred.')
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Training Plan</DialogTitle>
          <DialogDescription>
            Outline the syllabus, schedule, and notes for the student here. This content supports Markdown.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <Textarea
            name="planContent"
            defaultValue={initialPlan || ''}
            placeholder="e.g., Session 1: Basic Phraseology (MON)..."
            rows={12}
            className="font-mono text-sm"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="destructive" disabled={isPending}>Cancel</Button></DialogClose>
            <Button type="submit" variant="outline" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Plan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}