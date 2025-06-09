'use client'
import React, { useMemo, useState } from 'react'
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table'
import { Roster } from '@/app/types'
import { Input } from './ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import RatingBadge from './rating-badge'
import { useDebounce } from 'use-debounce'
import CertificateBadge from './certificate-badge'
import RosterPopover from './roster-popover'
import DataTablePagination from './data-table-pagination'


const RosterTable = ({ data }: { data: Roster[] }) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [debouncedGlobalFilter] = useDebounce(globalFilter, 300); // Debounce for performance

  const columns = useMemo<ColumnDef<Roster>[]>(
    () => [
      {
        accessorKey: 'cid',
        header: 'CID',
      },
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'rating',
        header: 'Rating',
        cell: ({ getValue }) => <RatingBadge ratingName={getValue<string>()} />,
      },
      {
        id: 'certificates',
        accessorKey: 'certificates',
        header: 'Certificates',
        cell: ({ row }) => {
          const certs = row.original.certificates;
          if (!certs || certs.length === 0) return <span className="text-muted-foreground text-xs">N/A</span>;

          return (
            <div className="flex flex-wrap gap-2">
              {certs.map((cert) => (
                <CertificateBadge
                  key={cert.id}
                  code={cert.code}
                  color={cert.color}
                  isOnTraining={cert.isOnTraining}
                  notes={cert.notes}
                />
              ))}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <RosterPopover cid={row.original.cid} />
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter: debouncedGlobalFilter, // Use the debounced value for filtering
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter, // Allow TanStack to manage filter state if needed
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(), // Enable filtering
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 } // Set default page size
    }
  });

  return (
    <div className="space-y-4">
      <div className="p-4">
        <Input
          placeholder="Search by name..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}

export default RosterTable