import CertForm from '@/components/cert-form'
import ManageCerts from '@/components/manage-cert'
import ManageRoles from '@/components/manage-role'
import RoleForm from '@/components/role-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import React from 'react'


const page = async () => {
  return (
    <div className="grid grid-cols-1 gap-6">
      <div>
        <h1 className="text-3xl font-bold">Site Settings</h1>
      </div>

      <div className="flex flex-wrap gap-4">
        <Card className="w-full flex-grow sm:flex-grow-0 sm:w-56">
          <CardHeader>
            <CardTitle className="text-lg text-center">Add Role</CardTitle>
          </CardHeader>
          <CardContent>
            <RoleForm />
          </CardContent>
        </Card>
        <Card className="w-full flex-grow sm:flex-grow-0 sm:w-56">
          <CardHeader>
            <CardTitle className="text-lg text-center">Add Certificate</CardTitle>
          </CardHeader>
          <CardContent>
            <CertForm />
          </CardContent>
        </Card>
      </div>

      <ManageRoles />
      <ManageCerts />
    </div>
  )
}

export default page