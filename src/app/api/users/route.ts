/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        cid: true,
      },
      orderBy: {
        name: 'asc'
      }
    })
    return NextResponse.json({ users })
  } catch (error: any) {
    return NextResponse.json({ error: error?.response?.message || 'Failed to fetch users' }, { status: 500 })
  }
}