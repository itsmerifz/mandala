'use client'
import { EditRole } from "@/app/types"
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import React, { useMemo, useState } from "react"
import EditRoleDialog from "./edit-role-dialog"
import DeleteRoleDialog from "./delete-role-dialog"
import { useRoles } from "@/hooks/use-roles"
import { Skeleton } from "./ui/skeleton"
import DataTablePagination from "./data-table-pagination"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { Edit, Trash2 } from "lucide-react"
import { useDebounce } from "use-debounce"
import { Input } from "./ui/input"

const ManageRoles = () => {
  const { data: roles = [], isLoading } = useRoles()
  const [selected, setSelected] = useState<EditRole | null>(null)
  const [dialogType, setDialogType] = useState<'edit' | 'delete' | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [debouncedGlobalFilter] = useDebounce(globalFilter, 300)

  const openDialog = (type: 'edit' | 'delete', role: EditRole) => {
    setSelected(role)
    setDialogType(type)
  }
  const closeDialog = () => {
    setSelected(null)
    setDialogType(null)
  }

  const columns = useMemo<ColumnDef<EditRole>[]>(() => [
    { accessorKey: 'name', header: 'Role Name' },
    { accessorKey: 'description', header: 'Description', cell: ({ getValue }) => getValue<string>() || '-' },
    { accessorKey: 'userCount', header: 'Users', cell: ({ getValue }) => <div className="text-center">{getValue<number>()}</div> },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant='ghost' size="icon" className="h-8 w-8" onClick={() => openDialog('edit', row.original)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Edit Role</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant='ghost' size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => openDialog('delete', row.original)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Delete Role</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    }
  ], [])

  const manageRoleTable = useReactTable({
    data: roles,
    columns,
    state: { sorting, globalFilter: debouncedGlobalFilter },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 5 } }
  })

  if (isLoading) return (
    <Card>
      <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  )
  if (!roles) return <p>No roles data.</p>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Roles</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Search by role name..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {manageRoleTable.getHeaderGroups().map(group => (
                <TableRow key={group.id}>
                  {group.headers.map(header => (
                    <TableHead key={header.id} onClick={header.column.getToggleSortingHandler()} className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{ asc: ' ▲', desc: ' ▼' }[header.column.getIsSorted() as string] ?? null}
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
        </div>
        <DataTablePagination table={manageRoleTable} />
        {selected && (
          <>
            <EditRoleDialog role={selected} open={dialogType === 'edit'} onClose={closeDialog} />
            <DeleteRoleDialog role={selected} open={dialogType === 'delete'} onClose={closeDialog} />
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default ManageRoles