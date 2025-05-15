/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { id } = params

  try {
    const certs = await prisma.userCertificate.findMany({
      where: { userId: id },
      include: {
        certificate: {
          select: { code: true, color: true }
        }
      },
      orderBy: {
        issuedAt: 'desc'
      }
    })

    return NextResponse.json({ certs }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.response?.message || 'Failed to fetch user certificate(s)' }, { status: 500 })
  }
}