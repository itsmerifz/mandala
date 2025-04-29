import { z } from 'zod'

export const permissionValues = [
  'MANAGE_WEB',
  'MANAGE_ROSTER',
  'MANAGE_EVENT',
  'MANAGE_TRAINING',
  'READ_TRAINING',
  'READ_EVENTS',
  'READ_ROSTER',
  'ADMINISTRATOR',
] as const

export const permissionEnum = z.enum(permissionValues)

export type Permission = typeof permissionEnum._type

export const roleFormSchema = z.object({
  name: z.string().min(1, { message: 'Role Name is required' }),
  description: z.string().min(1, { message: 'Role Description is required' }),
  color: z.string().min(1, { message: 'Role Color is required' }),
  permissions: z.array(permissionEnum).min(1, { message: 'At least one permission is required' })
})

export const certFormSchema = z.object({
  code: z.string().min(2, { message: 'Certificate Code is required' }),
  name: z.string().min(1, { message: 'Certificate Name is required' }),
  color: z.string().min(1, { message: 'Certificate Color is required' })
})

export const assignRoleSchema = z.object({
  userId: z.string().min(1, { message: "User should be selected first" }),
  roleIds: z.array(z.string()).min(1, { message: 'At least one role must be selected' })
})

export const assignCertSchema = z.object({
  userId: z.string().min(1, { message: "User should be selected first" }),
  certificateId: z.string().min(1, { message: "Certificate should be selected first" }),
  isOnTraining: z.boolean(),
  notes: z.string().optional(),
  issuedAt: z.preprocess((arg) => {
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg)
    return arg
  }, z.date({ required_error: "A date should be required" }))
})

export const editUserCertSchema = z.object({
  isOnTraining: z.boolean(),
  notes: z.string().optional(),
  upgradedAt: z.string().optional()
})

export const editUserRoleSchema = z.object({
  roleIds: z.array(z.string()).min(1)
})