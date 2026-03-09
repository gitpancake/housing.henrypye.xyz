import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { adminAuth } from "@/lib/firebase-admin"

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

  const { email, password, displayName, isAdmin } = await request.json()

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    )
  }

  try {
    const firebaseUser = await adminAuth.createUser({
      email,
      password,
      displayName: displayName || email,
    })

    const user = await prisma.user.create({
      data: {
        firebaseUid: firebaseUser.uid,
        username: email.toLowerCase(),
        displayName: displayName || email,
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
  } catch (error: any) {
    if (error?.code === "auth/email-already-exists") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
