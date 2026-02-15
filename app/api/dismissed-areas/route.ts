import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Return all dismissed areas across all users (shared visibility)
  const dismissedAreas = await prisma.dismissedArea.findMany({
    include: {
      user: { select: { id: true, username: true, displayName: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ dismissedAreas })
}

export async function POST(request: Request) {
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

  const dismissedArea = await prisma.dismissedArea.upsert({
    where: {
      userId_areaName: {
        userId: session.userId,
        areaName: data.areaName,
      },
    },
    update: {
      reason: data.reason || null,
    },
    create: {
      userId: session.userId,
      areaName: data.areaName,
      reason: data.reason || null,
    },
    include: {
      user: { select: { id: true, username: true, displayName: true } },
    },
  })

  return NextResponse.json({ dismissedArea }, { status: 201 })
}

export async function DELETE(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { areaName } = await request.json()

  if (!areaName) {
    return NextResponse.json(
      { error: "areaName is required" },
      { status: 400 }
    )
  }

  await prisma.dismissedArea.deleteMany({
    where: {
      userId: session.userId,
      areaName,
    },
  })

  return NextResponse.json({ success: true })
}
