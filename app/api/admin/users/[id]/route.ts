import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession, hashPassword } from "@/lib/auth"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const data = await request.json()

  const updateData: Record<string, unknown> = {}
  if (data.displayName !== undefined) updateData.displayName = data.displayName
  if (data.isAdmin !== undefined) updateData.isAdmin = data.isAdmin
  if (data.password) updateData.passwordHash = await hashPassword(data.password)

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      username: true,
      displayName: true,
      isAdmin: true,
    },
  })

  return NextResponse.json({ user })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  // Don't allow deleting yourself
  if (id === session.userId) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
  }

  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
