'use client'

import { Certificate } from "@/app/types"
import { ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { useCerts } from "@/hooks/use-certs"
import React from "react"
import DeleteCertDialog from "./delete-cert-dialog"
import EditCertDialog from "./edit-cert-dialog"

const ManageCerts = () => {
  const { data: certs = [], isLoading } = useCerts()
  const [selected, setSelected] = React.useState<Certificate | null>(null)
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  const openEdit = (role: Certificate) => {
    setSelected(role)
    setEditOpen(true)
  }

  const openDelete = (role: Certificate) => {
    setSelected(role)
    setDeleteOpen(true)
  }

  const certColumns: ColumnDef<Certificate>[] = [
    {
      accessorKey: 'code',
      header: 'Code'
    },
    {
      accessorKey: 'name',
      header: 'Name'
    },
    {
      accessorKey: 'color',
      header: 'Color'
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

  const manageCertTable = useReactTable({
    data: certs,
    columns: certColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  if (isLoading) return <p>Loading certificate...</p>
  if (!certs) return <p>No certificate data.</p>

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Manage Certificate(s)</h2>
      </CardHeader>
      <CardContent className="overflow-auto">
        <Table>
          <TableHeader>
            {manageCertTable.getHeaderGroups().map(group => (
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
            {manageCertTable.getRowModel().rows.map(row => (
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
            <EditCertDialog key={selected.id} cert={selected} open={editOpen} onClose={() => setEditOpen(false)} />
            <DeleteCertDialog cert={selected} open={deleteOpen} onClose={() => setDeleteOpen(false)} />
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default ManageCerts