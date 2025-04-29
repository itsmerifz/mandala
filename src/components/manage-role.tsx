'use client'
import { Role } from "@/app/types"
import { ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"

interface ManageRoleProps {
  data: Role[]
}

const ManageRoles = ({ data }: ManageRoleProps) => {
  const roleColumns: ColumnDef<Role>[] = [
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

  const manageRoleTable = useReactTable({
    data: data,
    columns: roleColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // if (isLoading) return <p>Loading data...</p>
  // if (isError) return <p>Error recieving roles.</p>
  if (!data) return <p>No roles data.</p>

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
      </CardContent>
    </Card>
  )
}

export default ManageRoles