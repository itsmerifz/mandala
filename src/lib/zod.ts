import { TrainingType } from '@root/prisma/generated'
import { z } from 'zod'

export const permissionValues = [
  'ADMINISTRATOR',
  'MANAGE_WEBSITE',
  'MANAGE_USERS_ROSTER',
  'MANAGE_TRAINING',
  'MANAGE_EVENTS',
  'MANAGE_FACILITIES',
  'MANAGE_COMMUNICATIONS',
  'MANAGE_OPERATIONS',
  'VIEW_ALL_DATA',
  'VIEW_TRAINING_RECORDS',
  'VIEW_EVENT_RECORDS',
  'VIEW_ROSTER',
] as const

export const permissionEnum = z.enum(permissionValues)

export type Permission = z.infer<typeof permissionEnum>

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
  }, z.date({ required_error: "A date should be required" }).optional())
})

export const editUserCertSchema = z.object({
  isOnTraining: z.boolean(),
  notes: z.string().optional(),
  upgradedAt: z.preprocess((arg) => {
    if (typeof arg === 'string') {
      if (arg.trim() === '') return undefined
      const date = new Date(arg)
      return !isNaN(date.getTime()) ? date : undefined
    }
    if (arg instanceof Date) return !isNaN(arg.getTime()) ? arg : undefined

    return undefined
  }, z.date({ required_error: "A date should be required", invalid_type_error: "Invalid date format" }).optional())
})

export const editUserRoleSchema = z.object({
  roleIds: z.array(z.string())
})

export const createTrainingSchema = z.object({
  trainingType: z.nativeEnum(TrainingType, {
    errorMap: () => ({ message: "Training type should be selected" })
  }),
  notes: z.string().optional(),
  targetRating: z.string().optional(), // for RATING PROGRESS
  soloPosition: z.string().optional() // for SOLO ENDORSEMENT
})

export const assignMentorSchema = z.object({
  trainingId: z.string().cuid(),
  mentorId: z.string().cuid()
})

export const updatePlanSchema = z.object({
  trainingId: z.string().cuid(),
  planContent: z.string().trim().min(1, 'Plan content cannot be empty')
})

export const createTrainingSessionSchema = z.object({
  trainingId: z.string().cuid(),
  sessionDate: z.coerce.date(),
  position: z.string().trim().min(3, 'Position is required'),
  notes: z.string().optional()
})

export const setSoloValiditySchema = z.object({
  trainingId: z.string().cuid(),
  validUntil: z.coerce.date({ required_error: 'Validity date is required'})
})