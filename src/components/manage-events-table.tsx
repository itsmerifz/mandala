'use client';

import React, { useState, useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Edit, PlusCircle, Trash2 } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { Badge } from './ui/badge';
import type { Event } from '@root/prisma/generated';
import DataTablePagination from './data-table-pagination';
import { format } from 'date-fns';
import { CreateEditEventDialog } from './create-edit-event-dialog';
import { deleteEventAction } from '@/app/actions/event-actions';

// Tipe data yang digabungkan untuk tabel
type EventWithCount = Event & {
  _count: { participants: number };
};

interface ManageEventsTableProps {
  eventsData: EventWithCount[];
}

export const ManageEventsTable = ({ eventsData }: ManageEventsTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [debouncedGlobalFilter] = useDebounce(globalFilter, 300);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedEvent(null); // Pastikan null untuk mode create
    setIsDialogOpen(true);
  };

  const handleDelete = async (eventId: string) => {
    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      const result = await deleteEventAction(eventId);
      if (result.success) alert(result.message);
      else alert(`Error: ${result.error}`);
    }
  }

  const columns = useMemo<ColumnDef<EventWithCount>[]>(() => [
    { accessorKey: 'name', header: 'Event Name' },
    { accessorKey: 'startDateTime', header: 'Date', cell: ({ row }) => <span>{format(new Date(row.original.startDateTime), 'dd MMM yyyy, HH:mm')}</span> },
    { accessorKey: '_count.participants', header: 'Participants', cell: ({ getValue }) => <div className="text-center">{getValue<number>()}</div> },
    { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => <Badge variant="outline">{getValue<string>()}</Badge> },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant='ghost' size="icon" className="h-8 w-8" onClick={() => handleEdit(row.original)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant='ghost' size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(row.original.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ], []);

  const table = useReactTable({
    data: eventsData,
    columns,
    state: { sorting, globalFilter: debouncedGlobalFilter },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } }
  });

  return (
    <>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex justify-between items-center">
            <Input
              placeholder="Search by event name..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={handleCreate} variant='outline'>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Event
            </Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(group => (
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
                {table.getRowModel().rows.map(row => (
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
          <DataTablePagination table={table} />
        </CardContent>
      </Card>

      <CreateEditEventDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        event={selectedEvent}
      />
    </>

  );
};

export default ManageEventsTable;