import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const certSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  color: z.string().min(1)
})

export async function POST(request: Request) {
  const body = await request.json()

  const parsed = certSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, code, color } = parsed.data

  const existingCert = await prisma.certificate.findUnique({ where: { code } })
  if (existingCert) {
    return NextResponse.json({ error: "Certificate already exists" }, { status: 409 })
  }

  const cert = await prisma.certificate.create({
    data: {
      name,
      color,
      code
    }
  })

  return NextResponse.json({ message: "Certificate created successfully", id: cert.id }, { status: 201 })
}

export async function GET() {
  const certificate = await prisma.certificate.findMany()
  if (certificate) return NextResponse.json({ certificates: certificate }, { status: 200 })
}