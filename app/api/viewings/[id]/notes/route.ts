import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const notes = await prisma.viewingNote.findMany({
    where: { viewingId: id },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({ notes })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const data = await request.json()

  if (!data.title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 })
  }

  const note = await prisma.viewingNote.create({
    data: {
      viewingId: id,
      title: data.title,
      notes: data.notes || null,
    },
  })

  return NextResponse.json({ note }, { status: 201 })
}
