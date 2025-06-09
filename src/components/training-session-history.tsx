'use client';

import React, { useState } from 'react'
import { Button } from './ui/button'
import type { TrainingSession } from '@root/prisma/generated/client'
import { format } from 'date-fns'
import SessionDetailsDialog from './session-details-dialog'

// Define the type for the props this component will receive
export type SessionHistoryWithMentor = TrainingSession & {
  mentor: { name: string | null }
};

interface TrainingSessionHistoryProps {
  sessions: SessionHistoryWithMentor[]
}

export const TrainingSessionHistory = ({ sessions }: TrainingSessionHistoryProps) => {
  const [selectedSession, setSelectedSession] = useState<SessionHistoryWithMentor | null>(null)

  if (sessions.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-4">
        History not found.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center justify-between rounded-md border p-3"
          >
            <div>
              <p className="font-semibold">{session.position}</p>
              <p className="text-sm text-muted-foreground">
                by {session.mentor.name} on {format(new Date(session.sessionDate), 'PPP')}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedSession(session)}
            >
              View Details
            </Button>
          </div>
        ))}
      </div>

      <SessionDetailsDialog
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        session={selectedSession}
      />
    </>
  );
};