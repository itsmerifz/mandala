'use client'

import { TrainingSession } from '@root/prisma/generated'
import React from 'react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { format } from 'date-fns'
import { Separator } from './ui/separator'
import { Button } from './ui/button'

type SessionWithMentor = TrainingSession & {
  mentor: { name: string | null }
}

interface SessionDetailsDialogProps {
  isOpen: boolean
  onClose: () => void
  session: SessionWithMentor | null
}

const SessionDetailsDialog = ({ isOpen, onClose, session }: SessionDetailsDialogProps) => {
  if (!session) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Session Details: {session.position}</DialogTitle>
          <DialogDescription>
            A summary of the training session conducted on{' '}
            {format(new Date(session.sessionDate), 'PPP')}.
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className='grid gap-4 py-4 text-sm'>
          <div className='grid grid-cols-3 items-center gap-4'>
            <span className='text-muted-foreground'>Mentor</span>
            <span className='col-span-2 font-medium'>{session.mentor.name}</span>
          </div>
          <div className='space-y-2'>
            <h4 className="font-semibold">Mentor&apos;s Notes & Feedback</h4>
            <div className="prose prose-sm dark:prose-invert max-w-none rounded-md border bg-muted p-4 whitespace-pre-wrap">
              {session.notes || <em className="text-muted-foreground">No notes were provided for this session.</em>}
            </div></div>
        </div>
        <DialogClose asChild>
          <Button type="button" variant="outline" className="mt-2">Close</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}

export default SessionDetailsDialog