'use client';

import React, { useState, useTransition } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { User } from '@prisma/client';
import { assignMentorAction } from '@/app/actions/training-actions';

type PotentialMentor = Pick<User, 'id' | 'name' | 'cid'>;

interface AssignMentorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  trainingId: string;
  potentialMentors: PotentialMentor[];
}

export function AssignMentorDialog({ isOpen, onClose, trainingId, potentialMentors }: AssignMentorDialogProps) {
  const [selectedMentorId, setSelectedMentorId] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedMentorId) {
        setError("Please choose a mentor.");
        return;
    }
    setError(null);

    const formData = new FormData();
    formData.append('trainingId', trainingId);
    formData.append('mentorId', selectedMentorId);

    startTransition(async () => {
      const result = await assignMentorAction(formData);
      if (result.success) {
        alert(result.message || "Success!");
        onClose();
      } else {
        setError(result.error || 'Something went wrong.');
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Mentor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <label htmlFor="mentor-select" className="text-sm font-medium">Select Mentor</label>
            <Select onValueChange={setSelectedMentorId} value={selectedMentorId}>
              <SelectTrigger id="mentor-select">
                <SelectValue placeholder="Select a mentor..." />
              </SelectTrigger>
              <SelectContent>
                {potentialMentors.map((mentor) => (
                  <SelectItem key={mentor.id} value={mentor.id}>
                    {mentor.name} ({mentor.cid})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="destructive" onClick={onClose} disabled={isPending}>
                  Cancel
                </Button>
            </DialogClose>
            <Button type="submit" variant='outline' disabled={!selectedMentorId || isPending}>
              {isPending ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}