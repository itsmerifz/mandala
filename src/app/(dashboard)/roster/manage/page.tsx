import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import ManageRosterTable from '@/components/manage-roster-table'

const Manage = () => {

  return (
    <>
      <h1 className='text-3xl font-bold'>Manage Roster</h1>
      <Card className='w-auto h-[calc(100vh-200px)] mt-5'>
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