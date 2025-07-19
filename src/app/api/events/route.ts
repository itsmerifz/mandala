import { prisma } from "@/lib/prisma";
import { eventSchema } from "@/lib/zod";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, description, thumbnail, location, time } = parsed.data;
  const event = await prisma.event.create({
    data: { name, description, thumbnail, location, time: new Date(time) },
  });
  return NextResponse.json({ message: "Event created successfully", id: event.id }, { status: 201 });
}

export async function GET() {
  const events = await prisma.event.findMany({ orderBy: { time: "asc" } });
  return NextResponse.json({ events }, { status: 200 });
} 