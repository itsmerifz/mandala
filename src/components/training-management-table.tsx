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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { ClipboardEditIcon, FilePlusIcon, UserPlusIcon } from "lucide-react"
import { EditTrainingPlanDialog } from "./edit-training-plan-dialog"
import { AddTrainingSessionDialog } from "./add-training-session-dialog"

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
  const [dialogState, setDialogState] = useState<{
    type: 'assign' | 'plan' | 'session' | null;
    request: RequestWithDetails | null
  }>({ type: null, request: null })

  const openDialog = (type: 'assign' | 'plan' | 'session', request: RequestWithDetails) => {
    setDialogState({ type, request })
  }
  const closeDialog = () => {
    setDialogState({ type: null, request: null });
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
            <div className="flex justify-end gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant='ghost' size="icon" className="h-8 w-8" onClick={() => openDialog('assign', request)} disabled={request.status !== 'Pending'}>
                      <UserPlusIcon className="h-4 w-4" /><span className="sr-only">Assign Mentor</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Assign Mentor</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog('plan', request)} disabled={request.status === 'Pending'}>
                      <ClipboardEditIcon className="h-4 w-4" /><span className="sr-only">Edit Plan</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit Training Plan</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog('session', request)} disabled={request.status === 'Pending'}>
                      <FilePlusIcon className="h-4 w-4" /><span className="sr-only">Add Session</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Log Training Session</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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

      {dialogState.request && (
        <>
            <AssignMentorDialog
                isOpen={dialogState.type === 'assign'}
                onClose={closeDialog}
                trainingId={dialogState.request.id}
                potentialMentors={mentors}
            />
            <EditTrainingPlanDialog
                isOpen={dialogState.type === 'plan'}
                onClose={closeDialog}
                trainingId={dialogState.request.id}
                initialPlan={dialogState.request.trainingPlan}
            />
            <AddTrainingSessionDialog
                isOpen={dialogState.type === 'session'}
                onClose={closeDialog}
                trainingId={dialogState.request.id}
                studentName={dialogState.request.student.name || 'Student'}
            />
        </>
      )}
    </div>
  );
}

export default TrainingManagementTable