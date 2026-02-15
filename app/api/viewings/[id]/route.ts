import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const data = await request.json()

  const viewing = await prisma.viewing.update({
    where: { id },
    data: {
      ...(data.scheduledAt && { scheduledAt: new Date(data.scheduledAt) }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
      ...(data.status && { status: data.status }),
      ...(data.listingId && { listingId: data.listingId }),
    },
    include: {
      listing: {
        select: { id: true, title: true, address: true, price: true },
      },
      user: {
        select: { id: true, username: true, displayName: true },
      },
    },
  })

  return NextResponse.json({ viewing })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  await prisma.viewing.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
