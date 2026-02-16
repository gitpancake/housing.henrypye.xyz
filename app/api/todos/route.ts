import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todos = await prisma.todo.findMany({
    include: {
      user: {
        select: { id: true, username: true, displayName: true },
      },
    },
    orderBy: { scheduledAt: "asc" },
  });

  return NextResponse.json({ todos });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();

  if (!data.title || !data.scheduledAt) {
    return NextResponse.json(
      { error: "title and scheduledAt are required" },
      { status: 400 },
    );
  }

  const todo = await prisma.todo.create({
    data: {
      userId: session.userId,
      title: data.title,
      description: data.description || null,
      scheduledAt: new Date(data.scheduledAt),
      durationMin: data.durationMin || 30,
      location: data.location || null,
      link: data.link || null,
    },
    include: {
      user: {
        select: { id: true, username: true, displayName: true },
      },
    },
  });

  return NextResponse.json({ todo }, { status: 201 });
}
