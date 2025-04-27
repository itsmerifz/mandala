/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useAssignRole } from "@/hooks/use-assign-role"
import { useRoles } from "@/hooks/use-roles"
import { useUsers } from "@/hooks/use-users"
import { assignRoleSchema } from "@/lib/zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Checkbox } from "./ui/checkbox"
import { Button } from "./ui/button"

const AssignRole = () => {
  const { data: roles = [] } = useRoles()
  const { data: users = [] } = useUsers()
  const { mutate, isPending } = useAssignRole()

  const form = useForm<z.infer<typeof assignRoleSchema>>({
    resolver: zodResolver(assignRoleSchema),
    defaultValues: {
      roleIds: []
    }
  })

  const selectedRoles = form.watch('roleIds')

  const toggleRoles = (roleId: string, checked: boolean) => {
    const current = new Set(selectedRoles)
    if (checked) current.add(roleId)
    else current.delete(roleId)
    form.setValue('roleIds', Array.from(current))
  }

  const onSubmit = (data: z.infer<typeof assignRoleSchema>) => {
    mutate({ ...data, userId: form.getValues('userId') })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          name="userId"
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

        <FormItem>
          <FormLabel>Select Roles</FormLabel>
          <div className="flex flex-col space-y-2">
            {roles.map((role: any) => (
              <div key={role.id} className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedRoles.includes(role.id)}
                  onCheckedChange={(checked) => toggleRoles(role.id, Boolean(checked))}
                />
                <span>{role.name}</span>
              </div>
            ))}
          </div>
        </FormItem>

        <Button variant='outline' type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Assigning...' : 'Assign Role(s)'}
        </Button>
      </form>
    </Form>
  )
}

export default AssignRole