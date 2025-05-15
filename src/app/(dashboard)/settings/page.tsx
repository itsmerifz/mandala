import CertForm from '@/components/cert-form'
import ManageCerts from '@/components/manage-cert'
import ManageRoles from '@/components/manage-role'
import RoleForm from '@/components/role-form'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import React from 'react'


const page = async () => {
  return (
    <>
      <h1 className='text-3xl font-bold'>Site Settings</h1>
      <Card className='w-auto h-[calc(100vh-200px)] mt-5 relative flex flex-col'>
        <CardContent className='flex flex-col gap-4 flex-grow overflow-hidden'>
          <div className='flex gap-4 flex-shrink-0'>
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
          <ScrollArea className='flex-grow overflow-y-auto flex flex-col gap-4 min-h-0 pr-2'>
            <div className='pr-2 space-y-4'>
              <ManageRoles />
              <ManageCerts />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  )
}

export default page