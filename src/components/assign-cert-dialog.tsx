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
import { useUsers } from '@/hooks/use-users'
import { Textarea } from './ui/textarea'

const AssignCert = () => {
  const { data: certificates = [] } = useCerts()
  const { data: users = [] } = useUsers()
  const { mutate, isPending } = useAssignCert()

  const form = useForm<z.infer<typeof assignCertSchema>>({
    resolver: zodResolver(assignCertSchema) as any,
    defaultValues: {
      certificateId: '',
      isOnTraining: false,
      notes: '',
      issuedAt: new Date()
    }
  })

  const onSubmit = async (data: z.infer<typeof assignCertSchema>) => {
    console.log("Submitting Data:", data)
    mutate({
      ...data,
      userId: form.getValues('userId')
    }, {
      onSuccess: () => {
        form.reset()
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <FormField
          name='userId'
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select User</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select User" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>{user.name} ({user.cid})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                    disabled={(date) => date < new Date()}
                    initialFocus
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
  )
}

export default AssignCert
