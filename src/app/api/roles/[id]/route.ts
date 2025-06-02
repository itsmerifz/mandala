import { prisma } from "@/lib/prisma";
import { roleFormSchema } from "@/lib/zod";
import { NextResponse } from "next/server";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const body = await request.json()
  const parsed = roleFormSchema.safeParse(body)

  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const { name, description, color, permissions: newPermissionData } = parsed.data

  await prisma.$transaction(async tx => {
    await tx.role.update({
      where: { id: id },
      data: { name, description, color }
    })

    await tx.rolePermission.deleteMany({ where: { roleId: id } })
    if (newPermissionData && newPermissionData.length > 0) {
      await tx.rolePermission.createMany({
        data: newPermissionData.map(permEnum => ({
          roleId: id,
          permission: permEnum
        }))
      })
    }

    await tx.user.updateMany({
      where: { roles: { some: { id } } },
      data: { permissionsLastUpdatedAt: new Date() }
    })
  })
  return NextResponse.json({ message: 'Role Updated and relevant user timestamps refreshed' })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { id } = params

  await prisma.$transaction(async tx => {
    await tx.user.updateMany({
      where: { roles: { some: { id } } },
      data: { permissionsLastUpdatedAt: new Date() }
    })

    await tx.rolePermission.deleteMany({ where: { roleId: id } })
    await tx.role.delete({ where: { id } })
  })
  return NextResponse.json({ message: 'Role Deleted and relevant user timestamps refreshed' })
}