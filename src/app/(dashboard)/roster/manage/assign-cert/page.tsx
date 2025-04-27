import AssignCert from '@/components/assign-cert-dialog'
import { Card } from '@/components/ui/card'
import React from 'react'

const page = () => {
  return (
    <div>
      <h1 className='text-3xl font-bold'>Assign Roster Certificate</h1>
      <Card className='w-auto h-[calc(100vh-200px)] mt-5 p-5'>
        <AssignCert />
      </Card>
    </div>
  )
}

export default page