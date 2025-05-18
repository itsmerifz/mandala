/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { useUsers } from '@/hooks/use-users'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Roster } from '@/app/types'
import { Button } from './ui/button'
import RatingBadge from './rating-badge'
import ManageUserCertsDialog from './manage-user-cert-dialog'
import EditUserRoleDialog from './edit-user-role-dialog'

const ManageRosterTable = () => {
  const { data: users = [], isLoading } = useUsers()
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null)
  const [roleDialogOpen, setRoleDialogOpen] = React.useState(false)
  const [certDialogOpen, setCertDialogOpen] = React.useState(false)
  const [currentRoles, setCurrentRoles] = React.useState<string[]>([])

  const openRoleDialog = (userId: string, roles: string[]) => {
    setSelectedUserId(userId)
    setCurrentRoles(roles.map((role: any) => role.id))
    setRoleDialogOpen(true)
  }

  const openCertDialog = (userId: string) => {
    setSelectedUserId(userId)
    setCertDialogOpen(true)
  }

  const columns: ColumnDef<Roster>[] = [
    { accessorKey: 'cid', header: 'CID' },
    { accessorKey: 'name', header: 'Name' },
    {
      accessorKey: 'ratingShort', header: 'Rating', cell: ({ getValue }) => <RatingBadge ratingName={getValue() as string} />
    },
    {
      id: 'roles',
      header: 'Roles',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.roles && row.original.roles.length > 0 ? (
            row.original.roles.map((role: any) => (
              <span key={role.id} className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                {role.name}
              </span>
            ))
          ) : (
            <span className="text-gray-400 text-xs italic">No roles</span>
          )}
        </div>
      )
    },
    {
      id: 'actions', header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant='outline' onClick={() => openRoleDialog(row.original.id, row.original.roles || [])}>Manage Role(s)</Button>
          <Button variant='outline' onClick={() => openCertDialog(row.original.id)}> Manage Certificate(s)</Button>
        </div>
      )
    }
  ]

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  return (
    <>
      {isLoading ? <p>Loading Data...</p>
        :
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(group => (
              <TableRow key={group.id}>
                {group.headers.map(header => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map(row => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      }

      {selectedUserId && certDialogOpen && (
        <ManageUserCertsDialog userId={selectedUserId} onClose={() => setCertDialogOpen(false)} />
      )}

      {selectedUserId && roleDialogOpen && (
        <EditUserRoleDialog userId={selectedUserId} currentRoles={currentRoles} onClose={() => setRoleDialogOpen(false)} />
      )}
    </>
  )
}

export default ManageRosterTable
