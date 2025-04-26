/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import React from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useAssignCert } from '@/hooks/use-assign-cert'
import { useCerts } from '@/hooks/use-certs'
import { assignCertSchema } from '@/lib/zod'
import { z } from 'zod'
import { format } from 'date-fns'

interface UserCertificateFormProps {
  userId: string
  onClose: () => void
}

const AddCertDialog = ({ userId, onClose }: UserCertificateFormProps) => {
  const { data: certificates = [] } = useCerts()

  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm<z.infer<typeof assignCertSchema>>({
    resolver: zodResolver(assignCertSchema),
    defaultValues: {
      certId: '',
      isOnTraining: false,
      notes: '',
      issuedAt: format(new Date(), 'yyyy-MM-dd')
    }
  })

  const { mutate, isPending } = useAssignCert()

  const onSubmit = async (data: z.infer<typeof assignCertSchema>) => {
    mutate({
      ...data,
      userId
    }, {
      onSuccess: () => {
        reset()
        onClose()
      }
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogTitle>Assign Certificate</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='certificateId'>Certificate</Label>
            <Select onValueChange={(value) => setValue('certId', value)}>
              <SelectTrigger className='w-56'>
                <SelectValue placeholder="Select Certificate" />
              </SelectTrigger>
              <SelectContent className='w-56'>
                {certificates.map((cert: any) => (
                  <SelectItem key={cert.id} value={cert.id}>{cert.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.certId && <p className='text-red-500 text-sm'>{errors.certId.message}</p>}
          </div>

          <div className='flex items-center space-x-2'>
            <Checkbox id='isOnTraining' {...register('isOnTraining')} />
            <Label htmlFor='isOnTraining'>Is on Training?</Label>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='notes'>Notes (optional)</Label>
            <Input id='notes' {...register('notes')} className='border border-gray-300 rounded-md p-2 w-full' />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='issuedAt'>Issued Date</Label>
            <Input id='issuedAt' type='date' {...register('issuedAt')} className='border border-gray-300 rounded-md p-2 w-full' />
          </div>

          <Button type="submit" variant="outline" disabled={isPending} className="w-full">
            {isPending ? 'Assigning...' : 'Assign Certificate'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddCertDialog
