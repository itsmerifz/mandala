import React from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import ManageRosterTable from '@/components/manage-roster-table'

const Manage = () => {

  return (
    <>
      <h1 className='text-3xl font-bold'>Manage Roster</h1>
      <Card className='w-auto h-[calc(100vh-200px)] mt-5'>
        <div className='flex gap-4 p-3'>
          <Button variant='outline' className='w-48'>
            <Link className='w-full' href={'/roster/manage/assign-role'}>Assign Role</Link>
          </Button>
          <Button variant='outline' className='w-48'>
            <Link className='w-full' href={'/roster/manage/assign-cert'}>Assign Certificate</Link>
          </Button>
        </div>
        <CardContent>
          <div className='mt-3'>
            <ManageRosterTable />
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default Manage