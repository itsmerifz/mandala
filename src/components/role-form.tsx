'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { roleFormSchema, permissionEnum } from '@/lib/zod'
import { z } from 'zod'
import { Input } from './ui/input'
import { Checkbox } from './ui/checkbox'
import { useCreateRole } from '@/hooks/use-create-role'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form'


const RolePermission = permissionEnum.options

const RoleForm = () => {
  // const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<z.infer<typeof roleFormSchema>>({
  const form = useForm<z.infer<typeof roleFormSchema>>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: '',
      description: '',
      color: 'slate-500',
      permissions: [],
    }
  })
  const { mutate, isPending } = useCreateRole()

  // const selectedPermissions = form.watch('permissions')

  const onSubmit = async (data: z.infer<typeof roleFormSchema>) => {
    mutate(data, {
      onSuccess: () => {
        form.reset()
      }
    })
  }

  // const togglePermission = (value: (typeof RolePermission)[number], checked: boolean | string) => {
  //   const current = new Set(selectedPermissions)
  //   if (checked) {
  //     current.add(value)
  //   } else {
  //     current.delete(value)
  //   }
  //   form.setValue('permissions', Array.from(current))
  // }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='outline' className='w-full'>Add Role</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Add Role</DialogTitle>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              name='name'
              control={form.control}
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name='description'
              control={form.control}
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Role Description</FormLabel>
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
                  <FormLabel>Role Color (Use Tailwind color code (e.g. blue-500))</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name='permissions'
              control={form.control}
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Role Permission</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {RolePermission.map((permission) => (
                        <FormItem key={permission} className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              id={permission}
                              value={permission}
                              checked={field.value?.includes(permission)}
                              onCheckedChange={(checked) => {
                                const currValues = field.value || [];
                                if (checked) field.onChange([...currValues, permission]);
                                else field.onChange(currValues.filter(val => val !== permission));
                              }}
                            />
                          </FormControl>
                          <FormLabel htmlFor={permission} className="text-sm font-normal">
                            {permission}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" variant="outline" disabled={isPending} className="w-full">
              {isPending ? 'Creating...' : 'Create Role'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default RoleForm