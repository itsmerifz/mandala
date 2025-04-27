import { prisma } from "@/lib/prisma";
import { assignCertSchema } from "@/lib/zod";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = assignCertSchema.safeParse(body)

  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { certificateId, userId, isOnTraining, notes, issuedAt } = parsed.data

  await prisma.userCertificate.create({
    data: {
      userId,
      certificateId,
      isOnTraining,
      notes,
      issuedAt: new Date(issuedAt)
    }
  })

  return NextResponse.json({ message: 'Certificate assigned successfully!' }, { status: 201 })
}