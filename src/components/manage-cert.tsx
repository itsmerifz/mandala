'use client'

import { Certificate } from "@/app/types"
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { useCerts } from "@/hooks/use-certs"
import React, { useMemo, useState } from "react"
import DeleteCertDialog from "./delete-cert-dialog"
import EditCertDialog from "./edit-cert-dialog"
import { useDebounce } from "use-debounce"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { Edit, Trash2 } from "lucide-react"
import { Skeleton } from "./ui/skeleton"
import { Input } from "./ui/input"
import DataTablePagination from "./data-table-pagination"

const ManageCerts = () => {
  const { data: certs = [], isLoading } = useCerts()
  const [selected, setSelected] = useState<Certificate | null>(null)
  const [dialogType, setDialogType] = useState<'edit' | 'delete' | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [debouncedGlobalFilter] = useDebounce(globalFilter, 300)

  const openDialog = (type: 'edit' | 'delete', cert: Certificate) => {
    setSelected(cert)
    setDialogType(type)
  };
  const closeDialog = () => {
    setSelected(null)
    setDialogType(null)
  }

  const certColumns = useMemo<ColumnDef<Certificate>[]>(() => [
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'name', header: 'Certificate Name' },
    { accessorKey: 'color', header: 'Color', cell: ({ getValue }) => <div className="flex items-center gap-2"><div className={`h-4 w-4 rounded-full bg-${getValue<string>()}`} /><span>{getValue<string>()}</span></div> },
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
              <TooltipContent><p>Edit Certificate</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant='ghost' size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => openDialog('delete', row.original)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Delete Certificate</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    }
  ], [])

  const manageCertTable = useReactTable({
    data: certs,
    columns: certColumns,
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
      </CardContent>
    </Card>
  )

  if (!certs) return <p>No certificate data.</p>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Certificates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Search by name or code..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {manageCertTable.getHeaderGroups().map(group => (
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
        </div>
        <DataTablePagination table={manageCertTable} />
        {selected && (
          <>
            <EditCertDialog cert={selected} open={dialogType === 'edit'} onClose={closeDialog} />
            <DeleteCertDialog cert={selected} open={dialogType === 'delete'} onClose={closeDialog} />
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default ManageCerts