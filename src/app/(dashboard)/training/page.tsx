import React from 'react';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrainingSessionHistory } from '@/components/training-session-history'
import RequestTrainingDialog from '@/components/request-training-dialog';
import { Badge } from '@/components/ui/badge';

const TrainingCenterPage = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  // --- Data Fetching Happens on the Server ---
  const activeTraining = await prisma.training.findFirst({
    where: {
      studentId: session.user.id,
      status: { in: ['Pending', 'In Progress'] },
    },
    include: {
      mentor: { select: { name: true } },
      ratingDetail: true,
      soloDetail: true
    }
  });

  const trainingHistory = await prisma.trainingSession.findMany({
    where: {
      training: { studentId: session.user.id },
    },
    orderBy: { sessionDate: 'desc' },
    take: 5,
    include: {
      mentor: { select: { name: true } },
    }
  });
  // --- End of Data Fetching ---

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className='text-3xl font-bold'>Training Center</h1>
        {!activeTraining && <RequestTrainingDialog />}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Training Status</CardTitle>
            </CardHeader>
            <CardContent>
              {activeTraining ? (
                <div className='space-y-3'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Type</span>
                    <Badge variant='outline'>{activeTraining.type}</Badge>
                  </div>
                  {activeTraining.ratingDetail && (
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Target</span>
                      <span>{activeTraining.ratingDetail.targetRating}</span>
                    </div>
                  )}
                  {activeTraining.soloDetail && (
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Position</span>
                      <span>{activeTraining.soloDetail.position}</span>
                    </div>
                  )}
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Status</span>
                    <span className='font-semibold'>{activeTraining.status}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Mentor</span>
                    <span className='font-semibold'>{activeTraining.mentor?.name || 'Not assigned'}</span>
                  </div>
                  {activeTraining.notes && (
                    <div className='pt-2'>
                      <p className='text-muted-foreground text-sm'>Notes</p>
                      <p className='text-sm italic'>{activeTraining.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  You do not have an active training request.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Last Session Training</CardTitle>
              <CardDescription>
                Review your most recent training sessions and feedback.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrainingSessionHistory sessions={trainingHistory} />
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Training Plan</CardTitle>
            <CardDescription>
              Notes and schedule from your mentor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeTraining?.trainingPlan ? (
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {activeTraining.trainingPlan}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {activeTraining ? "Your mentor has not added a plan yet." : "No active training."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default TrainingCenterPage;