import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const areaNotes = await prisma.areaNote.findMany({
    include: {
      user: { select: { id: true, username: true, displayName: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json({ areaNotes })
}

export async function PUT(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const data = await request.json()

  if (!data.areaName) {
    return NextResponse.json(
      { error: "areaName is required" },
      { status: 400 }
    )
  }

  const areaNote = await prisma.areaNote.upsert({
    where: {
      userId_areaName: {
        userId: session.userId,
        areaName: data.areaName,
      },
    },
    update: {
      liked: data.liked ?? null,
      disliked: data.disliked ?? null,
    },
    create: {
      userId: session.userId,
      areaName: data.areaName,
      liked: data.liked ?? null,
      disliked: data.disliked ?? null,
    },
    include: {
      user: { select: { id: true, username: true, displayName: true } },
    },
  })

  return NextResponse.json({ areaNote })
}
