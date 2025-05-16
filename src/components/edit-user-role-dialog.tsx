/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRoles } from '@/hooks/use-roles'
import { useEditUserRole } from '@/hooks/use-edit-user-role'
import { editUserRoleSchema } from '@/lib/zod'
import { Dialog, DialogContent, DialogTitle } from './ui/dialog'
import { Form, FormField, FormItem, FormLabel } from './ui/form'
import { Checkbox } from './ui/checkbox'
import { Button } from './ui/button'

interface EditUserRoleDialogProps {
  userId: string
  currentRoles: string[]
  onClose: () => void
}

const EditUserRoleDialog = ({ userId, currentRoles, onClose }: EditUserRoleDialogProps) => {
  const { data: roles = [], isLoading } = useRoles()
  const { mutate, isPending } = useEditUserRole(userId)

  const form = useForm({
    resolver: zodResolver(editUserRoleSchema),
    defaultValues: { roleIds: currentRoles }
  })

  React.useEffect(() => {
    form.reset({ roleIds: currentRoles })
  }, [currentRoles, form])

  const selectedRoles = form.watch('roleIds')

  const toggleRole = (roleId: string, checked: boolean) => {
    const set = new Set(selectedRoles)
    if (checked) set.add(roleId)
    else set.delete(roleId)
    form.setValue('roleIds', Array.from(set))
  }

  const onSubmit = (data: any) => {
    mutate(data, {
      onSuccess: () => {
        form.reset()
        onClose()
      }
    })
  }

  if (isLoading) return <p>Loading roles...</p>

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogTitle>Edit Role(s)</DialogTitle>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="roleIds"
              control={form.control}
              render={() => (
                <FormItem className="space-y-2">
                  {roles.map((role: any) => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={role.id}
                        checked={selectedRoles.includes(role.id)}
                        onCheckedChange={checked => toggleRole(role.id, Boolean(checked))}
                      />
                      <FormLabel htmlFor={role.id}>{role.name}</FormLabel>
                    </div>
                  ))}
                </FormItem>
              )}
            />
            <Button type="submit" variant="outline" className="w-full" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default EditUserRoleDialog
