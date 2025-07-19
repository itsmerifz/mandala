'use client'

import { createEventAction, updateEventAction } from "@/app/actions/event-actions"
import { eventSchema as EventSchema } from "@/lib/zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Event, EventStatus } from "@root/prisma/generated"
import { useEffect, useTransition } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form"
import { Input } from "./ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Button } from "./ui/button"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "./ui/calendar"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Textarea } from "./ui/textarea"
import { toast } from "sonner"


type EventFormValues = z.infer<typeof EventSchema>

interface CreateEditEventDialogProps {
  isOpen: boolean
  onClose: () => void
  event?: Event | null
}

export const CreateEditEventDialog = ({ isOpen, onClose, event }: CreateEditEventDialogProps) => {
  const [isPending, startTransition] = useTransition()
  const isEditMode = !!event

  const form = useForm<EventFormValues>({
    resolver: zodResolver(EventSchema),
    defaultValues: {
      name: '',
      description: '',
      status: EventStatus.DRAFT
    }
  })

  useEffect(() => {
    if (isOpen && event) {
      form.reset({
        name: event.name,
        description: event.description || '',
        status: event.status,
        startDateTime: new Date(event.startDateTime),
        endDateTime: new Date(event.endDateTime)
      })
    } else if (isOpen && !event) {
      form.reset({
        name: '',
        description: '',
        status: EventStatus.DRAFT,
        startDateTime: new Date(),
        endDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
      })
    }
  }, [isOpen, event, form])

  const onSubmit = (data: EventFormValues) => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof Date) formData.append(key, value.toISOString())
      else if (value !== null) formData.append(key, String(value))
    })

    startTransition(async () => {
      const result = isEditMode ? await updateEventAction(formData, event?.id) : await createEventAction(formData)
      if (result.success) {
        onClose()
        toast.success(result.message)
      } else {
        toast.error(`Error: ${result.error}`)
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Event' : 'Create New Event'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="startDateTime" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Start Date</FormLabel>
                  <Popover><PopoverTrigger asChild>
                    <FormControl><Button variant="outline" className="font-normal justify-start"><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}</Button></FormControl>
                  </PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="endDateTime" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>End Date</FormLabel>
                  <Popover><PopoverTrigger asChild>
                    <FormControl><Button variant="outline" className="font-normal justify-start"><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}</Button></FormControl>
                  </PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={{ before: form.watch("startDateTime") }} /></PopoverContent></Popover>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem><FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl>
                  <SelectContent>{Object.values(EventStatus).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select><FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="ghost" disabled={isPending}>Cancel</Button></DialogClose>
              <Button type="submit" disabled={isPending} variant="outline">
                {isPending ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Event')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
