'use client'
import React from 'react'
import { CardHeader, CardContent } from './ui/card'
import { ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table'
import { Roster } from '@/app/types'
import { Input } from './ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import RatingBadge from './rating-badge'
import { Button } from './ui/button'
import { useDebounce } from 'use-debounce'
import ManageUserPopover from './manage-user-popover'
import CertificateBadge from './certificate-badge'


const RosterTable = ({ data }: { data: Roster[] }) => {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(5)
  const [search, setSearch] = React.useState('')
  const [debouncedSearch] = useDebounce(search, 500)

  const filteredData = React.useMemo(() => {
    return data.filter(user => user.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
  }, [data, debouncedSearch])

  const rosterColumns: ColumnDef<Roster>[] = [
    {
      accessorKey: 'cid',
      header: 'CID'
    },
    {
      accessorKey: 'name',
      header: 'Name'
    },
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: ({ getValue }) => <RatingBadge ratingName={getValue() as string} />
    },
    {
      accessorKey: 'certificate',
      header: 'Certificate',
      cell: ({ row }) => {
        const certs = row.original.certificates
        if (!certs) return null

        return (
          <div className="flex flex-wrap gap-2">
            {certs.map(cert => (
              <CertificateBadge
                key={cert.id}
                code={cert.code}
                color={cert.color}
                isOnTraining={cert.isOnTraining}
                notes={cert.notes}
              />
            ))}
          </div>
        )
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => <ManageUserPopover userId={row.original.cid}
      />
    }
  ]

  const rosterTable = useReactTable({
    data: filteredData,
    columns: rosterColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      pagination: {
        pageIndex,
        pageSize
      }
    },
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater({ pageIndex, pageSize }) : updater
      setPageIndex(next.pageIndex ?? pageIndex)
      setPageSize(next.pageSize ?? pageSize)
    }
  })

  return (
    <>
      <CardHeader>
        <Input
          placeholder='Search name...'
          className='max-w-sm'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </CardHeader>
      <CardContent className='overflow-auto h-[calc(100vh-200px)]'>
        <Table>
          <TableHeader>
            {rosterTable.getHeaderGroups().map(group => (
              <TableRow key={group.id}>
                {group.headers.map(header => (
                  <TableHead key={header.id} onClick={header.column.getToggleSortingHandler()} className="cursor-pointer select-none">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted() as string] ?? null}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rosterTable.getRowModel().rows.map(row => (
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
        <div className='flex items-center justify-end gap-7 p-4 mt-4'>
          <div>Page {rosterTable.getState().pagination.pageIndex + 1} of {rosterTable.getPageCount()}</div>
          <Button className='w-24' variant={'outline'} onClick={() => rosterTable.previousPage()} disabled={!rosterTable.getCanPreviousPage()}>Previous</Button>
          <Button className='w-24' variant={'outline'} onClick={() => rosterTable.nextPage()} disabled={!rosterTable.getCanNextPage()}>Next</Button>
        </div>
      </CardContent>


    </>
  )
}

export default RosterTable