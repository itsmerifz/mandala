"use server"

import { prisma } from "@/lib/prisma"
import { assignMentorSchema, createTemplateSchema, createTrainingSchema, createTrainingSessionSchema, setSoloValiditySchema, updatePlanSchema } from "@/lib/zod"
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

const updateTrainingPlanAction = async (formData: FormData) => {
  const session = await auth()
  const currentUserId = session?.user?.id

  if (!currentUserId) return { success: false, error: "Login Required" }

  const parsed = updatePlanSchema.safeParse({
    trainingId: formData.get('trainingId'),
    planContent: formData.get('planContent')
  })

  if (!parsed.success) return { success: false, error: "Invalid Data" }

  const { trainingId, planContent } = parsed.data

  try {
    const training = await prisma.training.findFirst({
      where: { id: trainingId, mentorId: currentUserId }
    })

    if (!training) return { success: false, error: "You aren't student mentor" }

    await prisma.training.update({
      where: { id: trainingId },
      data: { trainingPlan: planContent }
    })

    revalidatePath('/training')
    revalidatePath('/training/manage')
    return { success: true, message: "Training Plan has been updated" }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: "Error when update training plan" }
  }
}

const createTrainingSessionAction = async (formData: FormData) => {
  const session = await auth()
  const mentorId = session?.user.id

  if (!mentorId) return { success: false, error: "Login Required" }

  const parsed = createTrainingSessionSchema.safeParse({
    trainingId: formData.get('trainingId'),
    sessionDate: formData.get('sessionDate'),
    position: formData.get('position'),
    notes: formData.get('notes'),
    competencyResults: formData.get("competencyResults")
  })

  if (!parsed.success) return { success: false, error: "Invalid Data" }

  const { trainingId, competencyResults, ...sessionData } = parsed.data


  try {
    const training = await prisma.training.findFirst({
      where: { id: trainingId, mentorId: mentorId }
    })

    if (!training) return { success: false, error: "You aren't student mentor" }

    await prisma.$transaction(async tx => {
      const newSession = await tx.trainingSession.create({
        data: {
          trainingId,
          mentorId,
          sessionDate: sessionData.sessionDate,
          position: sessionData.position,
          notes: sessionData.notes
        },
      })

      await tx.sessionCompetencyResult.createMany({
        data: competencyResults.map(result => ({
          trainingSessionId: newSession.id,
          ...result
        }))
      })
    })

    revalidatePath('/training')
    revalidatePath('/training/manage')
    return { success: true, message: "Training session has been successfully logged" }
  } catch (error) {
    console.error("Error:", error)
    return { success: false, error: "Failed to log training session" };
  }
}

const setSoloValidityAction = async (formData: FormData) => {
  const session = await auth()
  const currentUserId = session?.user?.id

  if (!currentUserId) return { success: false, error: "Login Required" }

  const parsed = setSoloValiditySchema.safeParse({
    trainingId: formData.get("trainingId"),
    validUntil: formData.get("validUntil"),
  })

  if (!parsed.success) return { success: false, error: "Invalid Data" }

  const { trainingId, validUntil } = parsed.data

  try {
    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      select: { soloDetail: true, mentorId: true }
    })

    if (!training) return { success: false, error: "Training record not found" }

    const isAssignedMentor = training.mentorId === currentUserId

    if (!isAssignedMentor) return { success: false, error: "You are not authorized to perform this action" }
    if (!training?.soloDetail) return { success: false, error: "This is not a valid solo endorsement training" }

    await prisma.trainingSoloDetail.update({
      where: { id: training.soloDetail.id },
      data: { validUntil },
    })

    revalidatePath(`/training`)
    revalidatePath(`/training/manage`)
    return { success: true, message: "Solo endorsement validity has been set" }
  } catch (error) {
    console.error("Error:", error);
    return { success: false, error: "Failed to set solo validity date" }
  }
}

const getCompetencyTemplateAction = async (templateName: string) => {
  try {
    const template = await prisma.competencyTemplate.findUnique({
      where: { name: templateName },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            items: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
    if (!template) return { success: false, error: "Template not found." };
    return { success: true, data: template };
  } catch (error) {
    return { success: false, error: `Failed to fetch competency template, Error: ${error}` };
  }
}

const getSessionReportAction = async (sessionId: string) => {
  try {
    const sessionReport = await prisma.trainingSession.findUnique({
      where: { id: sessionId },
      include: {
        mentor: { select: { name: true } },
        training: { select: { studentId: true } },
        competencyResults: {
          orderBy: { competencyItem: { order: 'asc' } },
          include: {
            competencyItem: {
              include: {
                section: true,
              },
            },
          },
        },
      },
    });

    if (!sessionReport) return { success: false, error: "Session report not found." };

    const sections: Record<string, unknown[]> = {};
    sessionReport.competencyResults.forEach(result => {
      const sectionTitle = result.competencyItem.section.title;
      if (!sections[sectionTitle]) {
        sections[sectionTitle] = [];
      }
      sections[sectionTitle].push(result);
    })

    return { success: true, data: { ...sessionReport, sections } };
  } catch (error) {
    return { success: false, error: `Failed to fetch session report, Error: ${error}` };
  }
}

const createTemplateAction = async (data: unknown) => {
  const session = await auth();
  if (!session?.user?.appPermissions?.includes(Permission.MANAGE_TRAINING)) {
    return { success: false, error: "Unauthorized." };
  }

  const parsed = createTemplateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid template data.", issues: parsed.error.flatten() };
  }

  const { name, targetPosition, sections } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const newTemplate = await tx.competencyTemplate.create({
        data: { name, targetPosition, targetRating: "" }, // Provide a default or actual value for targetRating
      })

      for (const [sectionIndex, section] of sections.entries()) {
        const newSection = await tx.competencySection.create({
          data: {
            templateId: newTemplate.id,
            title: section.title,
            order: sectionIndex + 1,
          },
        });

        await tx.competencyItem.createMany({
          data: section.items.map((item, itemIndex) => ({
            sectionId: newSection.id,
            competency: item.competency,
            order: itemIndex + 1,
          })),
        });
      }
    });

    revalidatePath('/settings');
    return { success: true, message: "New competency template created successfully." };

  } catch (error) {
    console.error("Error creating template:", error);
    return { success: false, error: "Failed to create template due to a server error." };
  }
}

export { createTrainingAction, assignMentorAction, updateTrainingPlanAction, createTrainingSessionAction, setSoloValidityAction, getCompetencyTemplateAction, getSessionReportAction, createTemplateAction }