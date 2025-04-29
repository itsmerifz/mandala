'use client'

import { Certificate } from "@/app/types"
import { ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"

interface ManageCertProps {
  data: Certificate[]
}

const ManageCerts = ({ data }: ManageCertProps) => {
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
          <Button variant='outline' id={row.original.id}>
            Edit
          </Button>
          <Button variant='outline'>
            Delete
          </Button>
        </div>
      )
    }
  ]

  const manageCertTable = useReactTable({
    data: data,
    columns: certColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  if (!data) return <p>No certificate data.</p>

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
      </CardContent>
    </Card>
  )
}

export default ManageCerts