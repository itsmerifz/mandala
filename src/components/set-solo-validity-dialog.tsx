'use client';

import React, { useState, useTransition } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from './ui/dialog'
import { Label } from './ui/label'
import { Calendar } from './ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { TrainingSoloDetail } from '@root/prisma/generated'
import { setSoloValidityAction } from '@/app/actions/training-actions';

interface SetSoloValidityDialogProps {
  isOpen: boolean
  onClose: () => void
  trainingId: string
  soloDetail: TrainingSoloDetail | null
}

export const SetSoloValidityDialog = ({ isOpen, onClose, trainingId, soloDetail }: SetSoloValidityDialogProps) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Initialize with the existing date or today
  const [validityDate, setValidityDate] = useState<Date | undefined>(
    soloDetail?.validUntil ? new Date(soloDetail.validUntil) : new Date()
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget);
    formData.append('trainingId', trainingId);
    if (validityDate) {
      formData.append('validUntil', validityDate.toISOString());
    } else {
      setError("Please select a validity date.")
      return
    }

    startTransition(async () => {
      const result = await setSoloValidityAction(formData)
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
          <DialogTitle>Set Solo Endorsement Validity</DialogTitle>
          <DialogDescription>
            Choose the expiration date for this solo endorsement.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Valid Until</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={'outline'} className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {validityDate ? format(validityDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={validityDate}
                  onSelect={setValidityDate}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="ghost" disabled={isPending}>Cancel</Button></DialogClose>
            <Button type="submit" disabled={isPending || !validityDate}>
              {isPending ? 'Saving...' : 'Save Validity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}