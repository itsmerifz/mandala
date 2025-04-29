'use client'
import React from 'react'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { certFormSchema } from '@/lib/zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateCert } from '@/hooks/use-create-cert'
import { Input } from './ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form'

const CertForm = () => {
  const form = useForm<z.infer<typeof certFormSchema>>({
    resolver: zodResolver(certFormSchema),
    defaultValues: {
      code: '',
      name: '',
      color: 'slate-500'
    }
  })

  const { mutate, isPending } = useCreateCert()

  const onSubmit = async (data: z.infer<typeof certFormSchema>) => {
    mutate(data, {
      onSuccess: () => {
        form.reset()
      }
    })
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='outline' className='w-full'>Add Certificate</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>
          Add Certificate
        </DialogTitle>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              name='code'
              control={form.control}
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Certificate Code</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name='name'
              control={form.control}
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Certificate Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name='color'
              control={form.control}
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Color (Use Tailwind color code (e.g. blue-500))</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className='w-full' type='submit' variant='outline' disabled={isPending}>
              {isPending ? 'Creating' : 'Create Certificate'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default CertForm