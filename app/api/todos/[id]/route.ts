import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = await request.json();

  const todo = await prisma.todo.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && {
        description: data.description || null,
      }),
      ...(data.scheduledAt && { scheduledAt: new Date(data.scheduledAt) }),
      ...(data.durationMin !== undefined && { durationMin: data.durationMin }),
      ...(data.location !== undefined && { location: data.location || null }),
      ...(data.link !== undefined && { link: data.link || null }),
      ...(data.completed !== undefined && { completed: data.completed }),
    },
    include: {
      user: {
        select: { id: true, username: true, displayName: true },
      },
    },
  });

  return NextResponse.json({ todo });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.todo.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
