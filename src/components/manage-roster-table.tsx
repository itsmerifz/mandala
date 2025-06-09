/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import React, { useMemo, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { useUsers } from '@/hooks/use-users'
import { ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table'
import { Roster } from '@/app/types'
import { Button } from './ui/button'
import RatingBadge from './rating-badge'
import ManageUserCertsDialog from './manage-user-cert-dialog'
import EditUserRoleDialog from './edit-user-role-dialog'
import DataTablePagination from './data-table-pagination'
import { Skeleton } from './ui/skeleton'
import { Badge } from './ui/badge'

const ManageRosterTable = () => {
  const { data: users = [], isLoading } = useUsers();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [certDialogOpen, setCertDialogOpen] = useState(false);
  const [currentRoles, setCurrentRoles] = useState<string[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const openRoleDialog = (userId: string, roles: any[]) => {
    setSelectedUserId(userId);
    // Ensure roles is an array before mapping
    setCurrentRoles(Array.isArray(roles) ? roles.map((role) => role.id) : []);
    setRoleDialogOpen(true);
  };

  const openCertDialog = (userId: string) => {
    setSelectedUserId(userId);
    setCertDialogOpen(true);
  };

  const columns = useMemo<ColumnDef<Roster>[]>(() => [
    { accessorKey: 'cid', header: 'CID' },
    { accessorKey: 'name', header: 'Name' },
    {
      accessorKey: 'ratingShort',
      header: 'Rating',
      cell: ({ getValue }) => <RatingBadge ratingName={getValue<string>()} />,
    },
    {
      id: 'roles',
      header: 'Roles',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {Array.isArray(row.original.roles) && row.original.roles.length > 0 ? (
            row.original.roles.map((role: any) => (
              <Badge key={role.id} variant="outline">{role.name}</Badge>
            ))
          ) : (
            <span className="text-gray-400 text-xs italic">No roles</span>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end">
          <Button variant='outline' size="sm" onClick={() => openRoleDialog(row.original.id, row.original.roles || [])}>Manage Roles</Button>
          <Button variant='outline' size="sm" onClick={() => openCertDialog(row.original.id)}>Manage Certificates</Button>
        </div>
      ),
    },
  ], []);

  const table = useReactTable({
    data: users,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } }
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(group => (
              <TableRow key={group.id}>
                {group.headers.map(header => (
                  <TableHead key={header.id} onClick={header.column.getToggleSortingHandler()} className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: ' ▲',
                      desc: ' ▼',
                    }[header.column.getIsSorted() as string] ?? null}
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
      </div>

      <DataTablePagination table={table} />

      {selectedUserId && certDialogOpen && (
        <ManageUserCertsDialog userId={selectedUserId} onClose={() => setCertDialogOpen(false)} />
      )}
      {selectedUserId && roleDialogOpen && (
        <EditUserRoleDialog userId={selectedUserId} currentRoles={currentRoles} onClose={() => setRoleDialogOpen(false)} />
      )}
    </div>
  )
}

export default ManageRosterTable
