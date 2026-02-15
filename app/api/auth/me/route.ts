import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ user: null })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      isAdmin: true,
      preferences: {
        select: { onboardingComplete: true },
      },
    },
  })

  return NextResponse.json({
    user: user
      ? {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          isAdmin: user.isAdmin,
          onboardingComplete: user.preferences?.onboardingComplete ?? false,
        }
      : null,
  })
}
