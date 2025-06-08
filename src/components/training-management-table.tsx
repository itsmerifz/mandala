'use client'

import type { Training, TrainingRatingDetail, TrainingSoloDetail, User } from "@root/prisma/generated"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import React, { useMemo } from "react"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { AssignMentorDialog } from "./assign-mentor-dialog"
import { ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table"

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
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [selectedRequest, setSelectedRequest] = React.useState<RequestWithDetails | null>(null)
  const [sorting, setSorting] = React.useState<SortingState>([])

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
            <div>
              <div className="font-medium">{student.name}</div>
              <div className="text-sm text-muted-foreground">{student.cid}</div>
            </div>
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
                <Button size="sm" onClick={() => openDialog(request)}>
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
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 5 } }
  });

  if (requests.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No training requests are currently active.</p>
  }

  return (
    <>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} onClick={header.column.getToggleSortingHandler()} className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
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
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
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
                  No data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <span className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>

      {isDialogOpen && selectedRequest && (
        <AssignMentorDialog
          isOpen={isDialogOpen}
          onClose={closeDialog}
          trainingId={selectedRequest.id}
          potentialMentors={mentors}
        />
      )}
    </>
  );
}

export default TrainingManagementTable