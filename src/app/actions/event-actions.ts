"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@root/auth"
import { prisma } from "@/lib/prisma"
import { Permission } from "@root/prisma/generated"
import { eventSchema } from "@/lib/zod"


export const createEventAction = async (formData: FormData) => {
  const session = await auth()
  if (!session?.user?.appPermissions?.includes(Permission.MANAGE_EVENTS)) return { success: false, error: "You don't have permission to manage events" }

  const parsed = eventSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.flatten() }

  try {
    await prisma.event.create({
      data: {
        ...parsed.data,
        createdById: session.user.id,
      }
    })
    revalidatePath("/events/manage")
    return { success: true, message: "Event created successfully" }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to create event" }
  }
}

export const updateEventAction = async (formData: FormData, eventId: string) => {
  const session = await auth()
  if (!session?.user?.appPermissions?.includes(Permission.MANAGE_EVENTS)) return { success: false, error: "You don't have permission to manage events" }

  const parsed = eventSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: parsed.error.flatten() }

  try {
    await prisma.event.update({
      where: { id: eventId },
      data: parsed.data
    })
    revalidatePath("/events/manage")
    return { success: true, message: "Event updated successfully" }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to update event" }
  }
}

export const deleteEventAction = async (eventId: string) => {
  const session = await auth()
  if (!session?.user?.appPermissions?.includes(Permission.MANAGE_EVENTS)) return { success: false, error: "You don't have permission to manage events" }

  try {
    await prisma.event.delete({ where: { id: eventId } })
    revalidatePath("/events/manage")
    return { success: true, message: "Event deleted successfully" }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to delete event" }
  }
}

