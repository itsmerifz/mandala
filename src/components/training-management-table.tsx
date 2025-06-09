'use client'

import type { Training, TrainingRatingDetail, TrainingSoloDetail, User } from "@root/prisma/generated"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import React, { useMemo, useState } from "react"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { AssignMentorDialog } from "./assign-mentor-dialog"
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, RowSelectionState, SortingState, useReactTable } from "@tanstack/react-table"
import DataTablePagination from "./data-table-pagination"
import { useDebounce } from "use-debounce"
import { Input } from "./ui/input"

type RequestWithDetails = Training & {
  student: { name: string | null, cid: string },
  mentor: { name: string | null } | null,
  ratingDetail: TrainingRatingDetail | null,
  soloDetail: TrainingSoloDetail | null
}

type PotentialMentor = Pick<User, 'id' | 'name' | 'cid'>

interface TrainingManagementTableProps {
  requests: RequestWithDetails[]
  mentors: PotentialMentor[]
}

const TrainingManagementTable: React.FC<TrainingManagementTableProps> = ({ requests, mentors }) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [debouncedGlobalFilter] = useDebounce(globalFilter, 300);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestWithDetails | null>(null);
  const openDialog = (request: RequestWithDetails) => {
    setSelectedRequest(request)
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setSelectedRequest(null)
  }

  const columns = useMemo<ColumnDef<RequestWithDetails>[]>(
    () => [
      {
        accessorKey: 'student',
        header: 'Student',
        cell: ({ row }) => {
          const student = row.original.student;
          return (
            <div className="font-medium">{student.name}</div>
          );
        },
      },
      {
        accessorKey: 'type',
        header: 'Training Type',
        cell: ({ getValue }) => <Badge variant="secondary">{getValue<string>()}</Badge>,
      },
      {
        id: 'details',
        header: 'Details',
        cell: ({ row }) => {
          const { ratingDetail, soloDetail } = row.original;
          if (ratingDetail) return <div className="text-sm">{`Target: ${ratingDetail.targetRating}`}</div>;
          if (soloDetail) return <div className="text-sm">{`Position: ${soloDetail.position}`}</div>;
          return <div className="text-sm text-muted-foreground">-</div>;
        }
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const status = getValue<string>();
          return (
            <Badge variant={status === 'Pending' ? 'destructive' : 'default'}>
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'mentor.name',
        header: 'Mentor',
        cell: ({ getValue }) => getValue<string>() || <span className="text-muted-foreground">N/A</span>,
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => {
          const request = row.original;
          return (
            <div className="text-right">
              {request.status === 'Pending' && (
                <Button size="sm" variant='outline' onClick={() => openDialog(request)}>
                  Assign Mentor
                </Button>
              )}
            </div>
          );
        }
      }
    ],
    []
  );
  const table = useReactTable({
    data: requests,
    columns,
    state: {
      sorting,
      rowSelection,
      globalFilter: debouncedGlobalFilter
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, filterValue) => {
      const studentName = row.original.student.name?.toLowerCase() || '';
      return studentName.includes(filterValue.toLowerCase());
    },
    initialState: { pagination: { pageSize: 5 } }
  });

  if (requests.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No training requests are currently active.</p>
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by student name..."
        value={globalFilter}
        onChange={(event) => setGlobalFilter(event.target.value)}
        className="max-w-sm"
      />
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={header.column.getCanSort() ? 'cursor-pointer select-none flex items-center' : ''}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: ' ▲', desc: ' ▼' }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />

      {isDialogOpen && selectedRequest && (
        <AssignMentorDialog
          isOpen={isDialogOpen}
          onClose={closeDialog}
          trainingId={selectedRequest.id}
          potentialMentors={mentors}
        />
      )}
    </div>
  );
}

export default TrainingManagementTable