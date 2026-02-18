import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { AppShell } from "@/components/layout/app-shell"
import { CompareView } from "@/components/compare/compare-view"

export default async function ComparePage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { preferences: true },
  })

  if (!user) redirect("/login")

  const listings = await prisma.listing.findMany({
    where: { status: { in: ["ACTIVE", "FAVORITE"] } },
    include: {
      addedByUser: { select: { id: true, displayName: true } },
      scores: {
        include: {
          user: { select: { id: true, username: true, displayName: true } },
        },
      },
      viewings: {
        include: {
          viewingNotes: true,
          user: { select: { id: true, displayName: true } },
        },
        orderBy: { scheduledAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const allUsers = await prisma.user.findMany({
    select: { id: true, username: true, displayName: true },
  })

  return (
    <AppShell
      user={{
        displayName: user.displayName,
        username: user.username,
        isAdmin: user.isAdmin,
      }}
    >
      <CompareView listings={listings} users={allUsers} />
    </AppShell>
  )
}
