import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function HomePage() {
    const session = await getSession();
    if (!session) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { preferences: true },
    });

    if (!user) redirect("/login");
    if (!user.preferences?.onboardingComplete) redirect("/onboarding");

    const listings = await prisma.listing.findMany({
        include: {
            addedByUser: {
                select: { id: true, username: true, displayName: true },
            },
            scores: {
                include: {
                    user: {
                        select: { id: true, username: true, displayName: true },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const allUsers = await prisma.user.findMany({
        select: { id: true, username: true, displayName: true },
    });

    return (
        <AppShell
            user={{
                displayName: user.displayName,
                username: user.username,
                isAdmin: user.isAdmin,
            }}
        >
            <DashboardContent listings={listings} users={allUsers} />
        </AppShell>
    );
}
