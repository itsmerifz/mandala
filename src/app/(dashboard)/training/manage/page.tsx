import TrainingManagementTable from '@/components/training-management-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { auth } from '@root/auth'
import { Permission } from '@root/prisma/generated'
import { redirect } from 'next/navigation'
import React from 'react'

const page = async () => {
  const session = await auth()
  const userPermissions = session?.user?.appPermissions || []

  if (!userPermissions.includes(Permission.MANAGE_TRAINING)) {
    redirect('/main?error=unauthorized');
  }

  const trainingRequests = await prisma.training.findMany({
    where: {
      status: { in: ['Pending', 'In Progress'] },
    },
    include: {
      student: { select: { name: true, cid: true } },
      mentor: { select: { name: true } },
      soloDetail: true,
      ratingDetail: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  const potentialMentors = await prisma.user.findMany({
    where: {
      roles: {
        some: {
          permissions: {
            some: {
              permission: Permission.MANAGE_TRAINING,
            },
          },
        },
      },
    },
  })
  return (
    <>
      <h1 className='text-3xl font-bold'>Manage Training</h1>
      <Card className='mt-6'>
        <CardHeader>
          <CardTitle>Training Request Lists</CardTitle>
          <CardContent className='mt-3'>
            <TrainingManagementTable requests={trainingRequests} mentors={potentialMentors} />
          </CardContent>
        </CardHeader>
      </Card>
    </>
  )
}

export default page