/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

'use client'

import React from "react"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { z } from "zod"
import { assignRoleSchema } from "@/lib/zod"
import { useAssignRole } from "@/hooks/use-assign-role"
import { useRoles } from "@/hooks/use-roles"
import { Checkbox } from "./ui/checkbox"

interface AddRoleProps {
  userId: string,
  onClose: () => void
}

const AddRoleDialog = ({ userId, onClose }: AddRoleProps) => {
  const { data: roles = [] } = useRoles()
  const { handleSubmit, formState: { errors }, reset, setValue, watch } = useForm({
    resolver: zodResolver(assignRoleSchema),
    defaultValues: {
      roleIds: []
    }
  })
  const { mutate, isPending } = useAssignRole()
  const selectedRoles = watch('roleIds')

  const onSubmit = async (data: z.infer<typeof assignRoleSchema>) => {
    mutate({ ...data, userId }, {
      onSuccess: () => {
        reset()
        onClose()
      }
    })
  }

  const toggleRole = (roleId: string, checked: boolean) => {
    const current = new Set(selectedRoles)
    if(checked) {
      current.add(roleId)
    } else {
      current.delete(roleId)
    }
    setValue('roleIds', Array.from(current))
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogTitle>Assign Role</DialogTitle>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="roleIds">
              Roles
            </Label>
            {roles.map((role: any) => (
              <div key={role.id} className="flex items-center space-x-2">
                <Checkbox
                  id={role.id}
                  checked={selectedRoles.includes(role.id)}
                  onCheckedChange={(checked) => toggleRole(role.id, Boolean(checked))}  
                />
                <Label htmlFor={role.id}>{role.name}</Label>
              </div>
            ))}
            {errors.roleIds && <p className="text-red-500 text-sm">{errors.roleIds.message}</p>}
          </div>
          <Button disabled={isPending} variant='outline' className="w-full">{isPending ? 'Assigning...' : 'Assign Role(s)'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}




export default AddRoleDialog