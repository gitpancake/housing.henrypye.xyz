import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession, hashPassword } from "@/lib/auth"

export async function GET() {
  const session = await getSession()
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      displayName: true,
      isAdmin: true,
      createdAt: true,
      preferences: { select: { onboardingComplete: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({ users })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { username, password, displayName, isAdmin } = await request.json()

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 }
    )
  }

  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    return NextResponse.json({ error: "Username already exists" }, { status: 409 })
  }

  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({
    data: {
      username: username.toLowerCase(),
      passwordHash,
      displayName: displayName || username,
      isAdmin: isAdmin ?? false,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      isAdmin: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ user }, { status: 201 })
}
