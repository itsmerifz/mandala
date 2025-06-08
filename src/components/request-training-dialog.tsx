'use client'

import { createTrainingAction } from '@/app/actions/training-actions'
import { TrainingType } from '@root/prisma/generated'
import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'

const RequestTrainingForm = () => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedType, setSelectedType] = React.useState<TrainingType | ''>('')
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createTrainingAction(formData)
      if (result.success) {
        alert(result.message as string)
        setIsOpen(false)
      }
      else setError(result.error as string)
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant='outline'>Request New Training</Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[475px]'>
        <DialogHeader>
          <DialogTitle className="text-lg">Request Training</DialogTitle>
          <DialogDescription>
            Select the type of training you want to request and fill in the details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div>
            <Label htmlFor='trainingType' className='block text-sm font-medium mb-2'>Training Type</Label>
            <Select name='trainingType' onValueChange={val => setSelectedType(val as TrainingType)} required>
              <SelectTrigger id='trainingType'>
                <SelectValue placeholder='Select Training Type...' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TrainingType.RATING_PROGRESSION}>Rating Progression</SelectItem>
                <SelectItem value={TrainingType.SOLO_ENDORSEMENT}>Solo Endorsement</SelectItem>
                <SelectItem value={TrainingType.RECURRENT_TRAINING}>Recurrent Training</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {selectedType === TrainingType.RATING_PROGRESSION && (
            <div>
              <Label htmlFor='targetRating' className='block text-sm font-medium mb-2'>Target Rating</Label>
              <Input id='targetRating' name='targetRating' placeholder='Example: S1' required />
            </div>
          )}
          {selectedType === TrainingType.SOLO_ENDORSEMENT && (
            <div>
              <Label htmlFor='soloPosition' className='block text-sm font-medium mb-2'>Solo Position</Label>
              <Input id='soloPosition' name='soloPosition' placeholder='Example: WIII_TWR' required />
            </div>
          )}
          <div>
            <Label htmlFor='notes' className='block text-sm font-medium mb-2'>Notes</Label>
            <Textarea id='notes' name='notes' placeholder='Reason why you request training...' />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type='submit' disabled={isPending || !selectedType} variant='outline'>
            {isPending ? 'Sending...' : 'Send Request'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default RequestTrainingForm