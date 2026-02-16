import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computePreferencesHash } from "@/lib/ai/preferences-hash";
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

    // Fetch area recommendations
    const areaRecommendations = await prisma.areaRecommendation.findMany({
        include: {
            user: { select: { id: true, username: true, displayName: true } },
        },
        orderBy: { matchScore: "desc" },
    });

    // Compute staleness per user
    const usersWithPrefs = await prisma.user.findMany({
        include: { preferences: true },
        where: { preferences: { onboardingComplete: true } },
    });

    const staleness: Record<string, boolean> = {};
    for (const u of usersWithPrefs) {
        if (!u.preferences) continue;
        const currentHash = computePreferencesHash({
            naturalLight: u.preferences.naturalLight,
            bedroomsMin: u.preferences.bedroomsMin,
            bedroomsMax: u.preferences.bedroomsMax,
            outdoorsAccess: u.preferences.outdoorsAccess,
            publicTransport: u.preferences.publicTransport,
            budgetMin: u.preferences.budgetMin,
            budgetMax: u.preferences.budgetMax,
            petFriendly: u.preferences.petFriendly,
            laundryInUnit: u.preferences.laundryInUnit,
            parking: u.preferences.parking,
            quietNeighbourhood: u.preferences.quietNeighbourhood,
            modernFinishes: u.preferences.modernFinishes,
            storageSpace: u.preferences.storageSpace,
            gymAmenities: u.preferences.gymAmenities,
            customDesires:
                (u.preferences.customDesires as {
                    label: string;
                    enabled: boolean;
                }[]) || [],
        });

        const latestRec = areaRecommendations.find((r) => r.user.id === u.id);
        staleness[u.id] =
            !latestRec || latestRec.preferencesHash !== currentHash;
    }

    // Fetch dismissed areas
    const dismissedAreas = await prisma.dismissedArea.findMany({
        include: {
            user: { select: { id: true, username: true, displayName: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    // Fetch area notes
    const areaNotes = await prisma.areaNote.findMany({
        include: {
            user: { select: { id: true, username: true, displayName: true } },
        },
        orderBy: { updatedAt: "desc" },
    });

    // Build onboarding status per user
    const onboardedUserIds = new Set(usersWithPrefs.map((u) => u.id));
    const userStatuses = allUsers.map((u) => ({
        id: u.id,
        displayName: u.displayName,
        preferencesComplete: onboardedUserIds.has(u.id),
    }));

    return (
        <AppShell
            user={{
                displayName: user.displayName,
                username: user.username,
                isAdmin: user.isAdmin,
            }}
        >
            <DashboardContent
                listings={listings}
                users={allUsers}
                recommendations={areaRecommendations}
                staleness={staleness}
                currentUserId={session.userId}
                dismissedAreas={dismissedAreas}
                areaNotes={areaNotes}
                userStatuses={userStatuses}
            />
        </AppShell>
    );
}
