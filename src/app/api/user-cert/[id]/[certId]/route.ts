/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { editUserCertSchema } from "@/lib/zod";

export async function PATCH(request: Request, { params }: { params: { id: string, certId: string } }) {
  try {
    const body = await request.json()
    const parsed = editUserCertSchema.safeParse(body)

    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { isOnTraining, notes, upgradedAt } = parsed.data

    await prisma.userCertificate.update({
      where: {
        id: params.certId,
        userId: params.id
      },
      data: {
        isOnTraining,
        notes,
        upgradedAt: upgradedAt ? new Date(upgradedAt) : null
      }
    })

    return NextResponse.json({ message: 'Certificate updated successfully' }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.response?.message || 'Something went wrong' }, { status: 500 })
  }
}

export async function GET(_: Request, { params }: { params: { id: string, certId: string } }) {
  const { id, certId } = params

  try {
    const data = await prisma.userCertificate.findFirst({
      where: { userId: id, id: certId }
    })

    return NextResponse.json({ data }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.response?.message || 'Failed to fetch user certificate(s)' }, { status: 500 })
  }
}