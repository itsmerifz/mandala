import { prisma } from "@/lib/prisma";
import { roleFormSchema } from "@/lib/zod";
import { NextResponse } from "next/server";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const id = params.id
  const body = await request.json()
  const parsed = roleFormSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { name, description, color, permissions } = parsed.data

  await prisma.role.update({
    where: { id },
    data: { name, description, color }
  })

  await prisma.rolePermission.deleteMany({ where: { roleId: id } })
  await prisma.$transaction(
    permissions.map(permission => prisma.rolePermission.create({
      data: { roleId: id, permission }
    }))
  )

  return NextResponse.json({ message: 'Role Updated' })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.role.delete({ where: { id: params.id } })
  return NextResponse.json({message: 'Role Deleted'})
}