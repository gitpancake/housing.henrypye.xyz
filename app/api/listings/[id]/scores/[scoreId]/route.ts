import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; scoreId: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { scoreId } = await params
  const { manualOverrideScore } = await request.json()

  const score = await prisma.listingScore.update({
    where: { id: scoreId },
    data: {
      manualOverrideScore: manualOverrideScore != null ? parseFloat(manualOverrideScore) : null,
    },
  })

  return NextResponse.json({ score })
}
