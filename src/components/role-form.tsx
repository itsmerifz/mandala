'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { roleFormSchema, permissionEnum } from '@/lib/zod'
import { z } from 'zod'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Checkbox } from './ui/checkbox'
import { useCreateRole } from '@/hooks/use-create-role'


const RolePermission = permissionEnum.options

const RoleForm = () => {
  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<z.infer<typeof roleFormSchema>>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: '',
      description: '',
      color: 'slate-500',
      permissions: [],
    }
  })
  const { mutate, isPending } = useCreateRole()

  const selectedPermissions = watch('permissions')

  const onSubmit = async (data: z.infer<typeof roleFormSchema>) => {
    mutate(data, {
      onSuccess: () => {
        reset()
      }
    })
  }

  const togglePermission = (value: (typeof RolePermission)[number], checked: boolean | string) => {
    const current = new Set(selectedPermissions)
    if (checked) {
      current.add(value)
    } else {
      current.delete(value)
    }
    setValue('permissions', Array.from(current))
  }
  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant='outline' className='w-full'>Add Role</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Add Role</DialogTitle>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='name' className='text-sm font-medium'>Role Name</Label>
              <Input type='text' id='name' {...register('name')} className={`border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 w-full`} />
              {errors.name && <p className='text-red-500 text-sm'>{errors.name.message}</p>}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='description' className='text-sm font-medium'>Role Description</Label>
              <Input type='text' id='description' {...register('description')} className={`border ${errors.color ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 w-full`} />
              {errors.description && <p className='text-red-500 text-sm'>{errors.description.message}</p>}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='color' className='text-sm font-medium'>Role Color (Use Tailwind color code (e.g. blue-500))</Label>
              <Input type='text' id='color' {...register('color')} className={`border ${errors.color ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 w-full`} />
              {errors.color && <p className='text-red-500 text-sm'>{errors.color.message}</p>}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='permissions' className='text-sm font-medium'>Permissions</Label>
              {RolePermission.map((permission) => (
                <div key={permission} className="flex items-center space-x-2">
                  <Checkbox id={permission} value={permission} checked={selectedPermissions.includes(permission)} onCheckedChange={(checked) => togglePermission(permission, checked)} />
                  <Label htmlFor={permission} className="text-sm">{permission}</Label>
                </div>
              ))}
              {errors.permissions && <p className='text-red-500 text-sm'>{errors.permissions.message}</p>}
            </div>
            <Button type="submit" variant="outline" disabled={isPending} className="w-full">
              {isPending ? 'Creating...' : 'Create Role'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default RoleForm