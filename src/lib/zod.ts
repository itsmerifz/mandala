'use client'

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