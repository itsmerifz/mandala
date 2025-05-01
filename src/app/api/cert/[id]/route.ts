import { prisma } from "@/lib/prisma";
import { certFormSchema } from "@/lib/zod";
import { NextResponse } from "next/server";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const id = params.id
  const body = await request.json()
  const parsed = certFormSchema.safeParse(body)

  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { code, name, color } = parsed.data

  await prisma.certificate.update({
    where: { id },
    data: { code, name, color }
  })

  return NextResponse.json({ message: 'Certificate Updated' })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.certificate.delete({ where: { id: params.id } })
  return NextResponse.json({ message: 'Certificate Deleted' })
}