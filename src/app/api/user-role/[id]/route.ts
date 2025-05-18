/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma"
import { editUserRoleSchema } from "@/lib/zod"
import { NextResponse } from "next/server"


export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = params

  try {
    const body = await request.json()
    const parsed = editUserRoleSchema.safeParse(body)

    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const existed = await prisma.user.findFirst({
      where: { id }
    })

    if (!existed) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { roleIds } = parsed.data

    await prisma.user.update({
      where: { id },
      data: {
        roles: {
          set: [],
          connect: roleIds.map(id => ({ id }))
        }
      }
    })

    return NextResponse.json({ message: 'Role(s) updated successfully' }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Something went wrong' }, { status: 500 })
  }
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    const roles = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          select: { id: true }
        }
      }
    })

    if (!roles) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ roleIds: roles.roles.map(r => r.id) }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch user roles' }, { status: 500 })
  }
}