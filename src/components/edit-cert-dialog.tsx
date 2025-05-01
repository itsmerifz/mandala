/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { Certificate } from '@/app/types'
import { useUpdateCert } from '@/hooks/use-update-cert'
import { certFormSchema } from '@/lib/zod'
import { zodResolver } from '@hookform/resolvers/zod'
import React from 'react'
import { useForm } from 'react-hook-form'
import { Dialog, DialogContent, DialogTitle } from './ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form'
import { Input } from './ui/input'
import { Button } from './ui/button'

interface EditCertDialogProps {
  cert: Certificate
  open: boolean
  onClose: () => void
}

const EditCertDialog = ({ cert, open, onClose }: EditCertDialogProps) => {
  const form = useForm({
    resolver: zodResolver(certFormSchema),
    defaultValues: {
      code: cert.code,
      name: cert.name,
      color: cert.color
    }
  })

  const { mutate, isPending } = useUpdateCert(cert.id)

  const onSubmit = (values: any) => {
    mutate(values, {
      onSuccess: () => onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogTitle>Edit Certificate</DialogTitle>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField name='code' control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name='name' control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name='color' control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Color (Use Tailwind color code (e.g. blue-500))</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type='submit' className='w-full' variant='outline' disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default EditCertDialog