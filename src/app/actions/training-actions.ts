"use server"

import { prisma } from "@/lib/prisma"
import { assignMentorSchema, createTrainingSchema } from "@/lib/zod"
import { auth } from "@root/auth"
import { Permission } from "@root/prisma/generated"
import { revalidatePath } from "next/cache"

const createTrainingAction = async (formData: FormData) => {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Login Required" }

  const formValues = {
    trainingType: formData.get('trainingType'),
    notes: formData.get('notes'),
    targetRating: formData.get('targetRating') || undefined,
    soloPosition: formData.get('soloPosition') || undefined
  }

  const parsed = createTrainingSchema.safeParse(formValues)

  console.log(formValues);
  

  if (!parsed.success) return { success: false, error: "Invalid Data" }

  const { trainingType, notes, targetRating, soloPosition } = parsed.data

  // Validate by Type
  if (trainingType === 'RATING_PROGRESSION' && !targetRating) return { success: false, error: "Target Rating should be filled" }
  if (trainingType === 'SOLO_ENDORSEMENT' && !soloPosition) return { success: false, error: "Solo Position should be filled" }

  try {
    const existingRequest = await prisma.training.findFirst({
      where: { studentId: session.user.id, status: { in: ['Pending', 'In Progress'] } }
    })

    if (existingRequest) return { success: false, error: "You have active requested training" }

    await prisma.$transaction(async tx => {
      const newTraining = await tx.training.create({
        data: {
          studentId: session.user.id,
          type: trainingType,
          status: "Pending", // initial status
          notes: notes
        }
      })

      if (trainingType === 'RATING_PROGRESSION') {
        await tx.trainingRatingDetail.create({
          data: {
            trainingId: newTraining.id,
            targetRating: targetRating!
          }
        })
      } else if (trainingType === 'SOLO_ENDORSEMENT') {
        await tx.trainingSoloDetail.create({
          data: {
            trainingId: newTraining.id,
            position: soloPosition!
          }
        })
      }
    })

    revalidatePath('/training')
    return { success: true, message: "Training request was created!" }
  } catch (error) {
    console.error("Error:", error)
    return { success: false, error: "Error when added training request" }
  }
}

const assignMentorAction = async (formData: FormData) => {
  const session = await auth()
  const staffId = session?.user?.id
  const staffPermissions = session?.user?.appPermissions || []

  if (!staffId || !staffPermissions.includes(Permission.MANAGE_TRAINING)) return { success: false, error: "You not have permission" }

  const parsed = assignMentorSchema.safeParse({
    trainingId: formData.get('trainingId'),
    mentorId: formData.get('mentorId')
  })

  if (!parsed.success) return { success: false, error: "Invalid Data" }

  const { trainingId, mentorId } = parsed.data

  try {
    const mentorUser = await prisma.user.findUnique({
      where: { id: mentorId },
      include: { roles: { include: { permissions: true } } }
    })

    if (!mentorUser) return { success: false, error: "Mentor not found" }

    const mentorPermissions = new Set(mentorUser.roles.flatMap(role => role.permissions.map(p => p.permission)))
    if (!mentorPermissions.has(Permission.MANAGE_TRAINING)) return { success: false, error: "User not have permission to be mentor" }

    await prisma.training.update({
      where: { id: trainingId },
      data: { mentorId, assignedById: staffId, status: "In Progress" }
    })

    revalidatePath('/training/manage')
    return { success: true, message: `Mentor ${mentorUser.name} was assigned` }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: "Error when assign mentor" }
  }
}

export { createTrainingAction, assignMentorAction } 