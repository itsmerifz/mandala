'use client'
import { EditRole } from "@/app/types"
import { ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import React from "react"
import EditRoleDialog from "./edit-role-dialog"
import DeleteRoleDialog from "./delete-role-dialog"
import { useRoles } from "@/hooks/use-roles"

const ManageRoles = () => {
  const { data: roles = [], isLoading } = useRoles()
  const [selected, setSelected] = React.useState<EditRole | null>(null)
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  const openEdit = (role: EditRole) => {
    setSelected(role)
    setEditOpen(true)
  }

  const openDelete = (role: EditRole) => {
    setSelected(role)
    setDeleteOpen(true)
  }

  const roleColumns: ColumnDef<EditRole>[] = [
    {
      accessorKey: 'name',
      header: 'Name'
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: data => data.getValue() || '-'
    },
    {
      accessorKey: 'color',
      header: 'Color',
      cell: data => data.getValue() || '-'
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant='outline' onClick={() => openEdit(row.original)}>
            Edit
          </Button>
          <Button variant='outline' onClick={() => openDelete(row.original)}>
            Delete
          </Button>
        </div>
      )
    }
  ]

  const manageRoleTable = useReactTable({
    data: roles,
    columns: roleColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  if (isLoading) return <p>Loading roles...</p>
  if (!roles) return <p>No roles data.</p>

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Manage Role(s)</h2>
      </CardHeader>
      <CardContent className="overflow-auto">
        <Table>
          <TableHeader>
            {manageRoleTable.getHeaderGroups().map(group => (
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
            {manageRoleTable.getRowModel().rows.map(row => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {selected && (
          <>
            <EditRoleDialog key={selected.id} role={selected} open={editOpen} onClose={() => setEditOpen(false)} />
            <DeleteRoleDialog role={selected} open={deleteOpen} onClose={() => setDeleteOpen(false)} />
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default ManageRoles