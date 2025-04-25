import CertForm from '@/components/cert-form'
import RoleForm from '@/components/role-form'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import React from 'react'

const page = () => {
  return (
    <>
      <h1 className='text-3xl font-bold'>Site Settings</h1>
      <Card className='w-auto h-[calc(100vh-200px)] mt-5'>
        <CardContent className='flex flex-col gap-4'>
          <div className='flex gap-4'>
            <Card className='w-48'>
              <CardHeader>
                <h1 className='text-lg text-center'>Role</h1>
              </CardHeader>
              <CardContent>
                <RoleForm />
              </CardContent>
            </Card>
            <Card className='w-48'>
              <CardHeader>
                <h1 className='text-lg text-center'>Certificate</h1>
              </CardHeader>
              <CardContent>
                <CertForm />
              </CardContent>
            </Card>
          </div>
          <Card>
            Manage Role
          </Card>
          <Card>
            Manage Certificate
          </Card>
        </CardContent>
      </Card>
    </>
  )
}

export default page