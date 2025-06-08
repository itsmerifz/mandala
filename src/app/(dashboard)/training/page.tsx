import RequestTrainingForm from '@/components/request-training-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { auth } from '@root/auth'
import React from 'react'

const page = async () => {
  const session = await auth()

  const activeTraining = await prisma.training.findFirst({
    where: {
      studentId: session?.user?.id,
      status: { in: ['Pending', 'In Progress'] }
    },
    include: {
      mentor: { select: { name: true } },
      ratingDetail: true,
      soloDetail: true
    }
  })

  const trainingHistory = await prisma.trainingSession.findMany({
    where: { training: { studentId: session?.user.id } },
    take: 5,
    include: { mentor: { select: { name: true } } }
  })


  return (
    <div className='space-y-3'>
      <div className='space-y-6'>
        <h1 className='text-3xl font-bold'>Training Center</h1>
        {!activeTraining && <RequestTrainingForm />}
      </div>
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        <Card className='md:col-span-2'>
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
              <div className='text-center py-8'>
                <p className='text-muted-foreground'>You didn&apos;t have any requests.</p>
                <p className='text-muted-foreground text-sm'>Click &quot;Request New Training&quot; to start.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex justify-between'>
            <div className='space-y-1'>
              <CardTitle>Training Plan</CardTitle>
              <CardDescription>Your any training plan and strategies.</CardDescription>
            </div>
            <Button variant='outline' size='sm'>Add Training Plan</Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Coming soon. It will showing syllabus and training slides you will learn.
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Last Session Training</CardTitle>
          </CardHeader>
          <CardContent>
            {trainingHistory.length > 0 ? (
              <ul className="space-y-4">
                {trainingHistory.map((session) => (
                  <li key={session.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{session.position}</p>
                      <p className="text-sm text-muted-foreground">
                        by {session.mentor.name}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">History not found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default page