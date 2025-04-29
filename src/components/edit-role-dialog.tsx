/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { EditRole } from "@/app/types"
import { Permission, permissionValues, roleFormSchema } from "@/lib/zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { useUpdateRole } from "@/hooks/use-update-role"
import { Checkbox } from "./ui/checkbox"

interface EditRoleDialogProps {
  role: EditRole
  open: boolean
  onClose: () => void
}

const EditRoleDialog = ({ role, open, onClose }: EditRoleDialogProps) => {
  const form = useForm({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: role.name,
      description: role.description as string,
      color: role.color ?? '',
      permissions: role.permissions
    }
  })

  const selectedPermissions = form.watch('permissions')

  const togglePermission = (value: Permission, checked: boolean) => {
    const current = new Set(selectedPermissions)
    if (checked) current.add(value)
    else current.delete(value)
    form.setValue('permissions', Array.from(current))
  }

  const { mutate, isPending } = useUpdateRole(role.id)

  const onSubmit = (values: any) => {
    mutate(values, {
      onSuccess: () => onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogTitle>Edit Role</DialogTitle>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField name='name' control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name='description' control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name='color' control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormItem>
              <FormLabel>Permissions</FormLabel>
              <div className="space-y-2">
                {permissionValues.map((permission: Permission) => (
                  <div key={permission} className="flex items-center space-x-2">
                    <Checkbox
                      id={permission}
                      checked={form.watch("permissions").includes(permission)}
                      onCheckedChange={(checked) => togglePermission(permission, Boolean(checked))}
                    />
                    <label htmlFor={permission} className="text-sm">{permission}</label>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
            <Button type='submit' className='w-full' variant='outline' disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default EditRoleDialog