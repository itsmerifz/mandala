import CertForm from '@/components/cert-form'
import ManageCerts from '@/components/manage-cert'
import ManageRoles from '@/components/manage-role'
import RoleForm from '@/components/role-form'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { Permission } from '@/lib/zod'
import React from 'react'

const getRoles = async () => {
  const roles = await prisma.role.findMany({
    include: {
      permissions: true
    }
  })
  return roles.map(role => ({
    ...role,
    permissions: role.permissions.map(data => data.permission as Permission)
  }))
}
const getCerts = async () => {
  const data = await prisma.certificate.findMany()
  return data
}

const page = async () => {
  const roleData = await getRoles()
  const certData = await getCerts()
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
          <div className='flex-grow overflow-y-auto flex flex-col gap-4 min-h-0 pr-2'>
            <ManageRoles data={roleData} />
            <ManageCerts data={certData} />
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default page