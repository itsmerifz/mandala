/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useAssignCert } from '@/hooks/use-assign-cert'
import { useCerts } from '@/hooks/use-certs'
import { assignCertSchema } from '@/lib/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { CalendarDaysIcon } from 'lucide-react'
import { Calendar } from './ui/calendar'
import { Textarea } from './ui/textarea'
import { Dialog, DialogContent, DialogTitle } from './ui/dialog'

interface AssignCertProps {
  userId: string
  onClose: () => void
}

const AssignCert = ({ onClose, userId }: AssignCertProps) => {
  const { data: certificates = [] } = useCerts()
  const { mutate, isPending } = useAssignCert()

  const form = useForm<z.infer<typeof assignCertSchema>>({
    resolver: zodResolver(assignCertSchema) as any,
    defaultValues: {
      userId,
      certificateId: '',
      isOnTraining: false,
      notes: '',
      issuedAt: new Date()
    }
  })

  const onSubmit = (data: z.infer<typeof assignCertSchema>) => {
    mutate(
      { ...data, userId },
      {
        onSuccess: () => {
          form.reset()
          onClose()
        }
      }
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className='max-w-lg'>
        <DialogTitle>Assign Certificate</DialogTitle>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <FormField
              name="certificateId"
              control={form.control}
              render={({ field }) => (
                <FormItem className='space-y-2'>
                  <FormLabel htmlFor='certificateId'>Certificate</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Certificate" />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        {certificates.map((cert: any) => (
                          <SelectItem key={cert.id} value={cert.id}>
                            {cert.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

            <FormField
              name='isOnTraining'
              control={form.control}
              render={({ field }) => (
                <FormItem className='space-y-2 flex'>
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
                    <FormLabel>Is on Training?</FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name='notes'
              control={form.control}
              render={({ field }) => (
                <FormItem className='space-y-2'>
                  <FormLabel htmlFor='notes'>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea className='min-h-10' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

            <FormField
              name='issuedAt'
              control={form.control}
              render={({ field }) => (
                <FormItem className='space-y-2 flex flex-col'>
                  <FormLabel htmlFor='issuedAt'>Issued Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant='outline'>
                          {field.value ? (format(field.value, "PPP")) : <span>Pick a date</span>}
                          <CalendarDaysIcon className='ml-auto h-4 w-4 opacity-50' />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => {
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          return date < today
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" variant="outline" disabled={isPending} className="w-full">
              {isPending ? 'Assigning...' : 'Assign Certificate'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default AssignCert
