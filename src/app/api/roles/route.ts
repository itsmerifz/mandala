import { prisma } from "@/lib/prisma";
import { Permission } from "@/lib/zod";
import { NextResponse } from "next/server";
import { z } from "zod";

const apiSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  color: z.string().min(1),
  permissions: z.array(z.enum([
    'MANAGE_WEB',
    'MANAGE_ROSTER',
    'MANAGE_EVENT',
    'MANAGE_TRAINING',
    'READ_TRAINING',
    'READ_EVENTS',
    'READ_ROSTER',
    'ADMINISTRATOR',
  ])).min(1),
})

export async function POST(request: Request) {
  const body = await request.json()

  const parsed = apiSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, description, color, permissions } = parsed.data

  const existingRole = await prisma.role.findUnique({ where: { name } })
  if (existingRole) {
    return NextResponse.json({ error: "Role already exists" }, { status: 409 })
  }

  const role = await prisma.role.create({
    data: {
      name,
      description,
      color
    },
  })

  await prisma.$transaction(
    permissions.map((perm) => prisma.rolePermission.create({
      data: {
        roleId: role.id,
        permission: perm,
      }
    }))
  )

  return NextResponse.json({ message: "Role created successfully", id: role.id }, { status: 201 })
}

export async function GET() {
  const roles = await prisma.role.findMany({
    include: {
      permissions: true
    }
  })
  if (roles) return NextResponse.json({
    roles: roles.map(role => ({
      ...role,
      permissions: role.permissions.map(permission => permission.permission as Permission)
    }))
  }, { status: 200 })
}