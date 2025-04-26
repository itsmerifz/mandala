'use client'
import React from 'react'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { certFormSchema } from '@/lib/zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateCert } from '@/hooks/use-create-cert'
import { Label } from './ui/label'
import { Input } from './ui/input'

const CertForm = () => {
  const { register, handleSubmit, formState: { errors }, reset, } = useForm<z.infer<typeof certFormSchema>>({
    resolver: zodResolver(certFormSchema),
    defaultValues: {
      code: '',
      name: '',
      color: ''
    }
  })

  const { mutate, isPending } = useCreateCert()

  const onSubmit = async (data: z.infer<typeof certFormSchema>) => {
    mutate(data, {
      onSuccess: () => {
        reset()
      }
    })
  }
  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant='outline' className='w-full'>Add Certificate</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>
            Add Certificate
          </DialogTitle>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <div className="space-y-2">
              <Label htmlFor='code'>Certificate Code</Label>
              <Input id='code' {...register('code')} className={`border ${errors.code ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 w-full`} />
              {errors.code && <p className='text-red-500 text-sm'>{errors.code.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor='name'>Certificate Name</Label>
              <Input id='name' {...register('name')} className={`border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 w-full`} />
              {errors.name && <p className='text-red-500 text-sm'>{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor='color'>Color (Use Tailwind color code (e.g. blue-500))</Label>
              <Input id='color' {...register('color')} className={`border ${errors.color ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 w-full`} />
              {errors.color && <p className='text-red-500 text-sm'>{errors.color.message}</p>}
            </div>
            <Button className='w-full' type='submit' variant='outline' disabled={isPending}>
              {isPending ? 'Creating' : 'Create Certificate'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CertForm