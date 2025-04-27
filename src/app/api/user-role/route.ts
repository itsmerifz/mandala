import { prisma } from "@/lib/prisma";
import { assignRoleSchema } from "@/lib/zod";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = assignRoleSchema.safeParse(body)

  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { userId, roleIds } = parsed.data

  await prisma.$transaction(
    roleIds.map(roleId => prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          connect: { id: roleId }
        }
      }
    }))
  )

  return NextResponse.json({ message: 'Roles assigned successfully!' }, { status: 201 })
}