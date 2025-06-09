'use client';

import React, { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import type { TrainingSession } from '@root/prisma/generated/client';
import { format } from 'date-fns';
import SessionDetailsDialog from './session-details-dialog';

// Define the type for the props this component will receive
export type SessionHistoryWithMentor = TrainingSession & {
  mentor: { name: string | null };
};

interface TrainingSessionHistoryProps {
  sessions: SessionHistoryWithMentor[];
}

export const TrainingSessionHistory = ({ sessions }: TrainingSessionHistoryProps) => {
  const [selectedSession, setSelectedSession] = useState<SessionHistoryWithMentor | null>(null);

  if (sessions.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-4">
        History not found.
      </p>
    );
  }

  return (
    <>
      <Accordion type="single" collapsible className="w-full">
        {sessions.map((session) => (
          <AccordionItem value={`item-${session.id}`} key={session.id}>
            <AccordionTrigger>
              <div className="flex justify-between items-center w-full pr-4">
                <div className="text-left">
                  <p className="font-semibold text-base">{session.position}</p>
                  <p className="text-sm text-muted-foreground">
                    by {session.mentor.name}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-sm text-muted-foreground font-mono hidden sm:block">
                    {format(new Date(session.sessionDate), 'dd MMM yyyy')}
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent accordion from opening/closing
                      setSelectedSession(session);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Separator className="mb-4" />
              {session.notes ? (
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {session.notes}
                </div>
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  No notes were provided for this session.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* The Dialog is managed and rendered here */}
      <SessionDetailsDialog
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        session={selectedSession}
      />
    </>
  );
};