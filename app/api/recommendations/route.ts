import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateRecommendations } from "@/lib/ai/recommend-areas";
import { computePreferencesHash } from "@/lib/ai/preferences-hash";

export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fetchAll = request.nextUrl.searchParams.get("all") === "true";

    if (fetchAll) {
        const recommendations = await prisma.areaRecommendation.findMany({
            include: {
                user: {
                    select: { id: true, username: true, displayName: true },
                },
            },
            orderBy: { matchScore: "desc" },
        });

        const users = await prisma.user.findMany({
            include: { preferences: true },
            where: { preferences: { onboardingComplete: true } },
        });

        const staleness: Record<string, boolean> = {};
        for (const user of users) {
            if (!user.preferences) continue;
            const currentHash = computePreferencesHash({
                naturalLight: user.preferences.naturalLight,
                bedroomsMin: user.preferences.bedroomsMin,
                bedroomsMax: user.preferences.bedroomsMax,
                outdoorsAccess: user.preferences.outdoorsAccess,
                publicTransport: user.preferences.publicTransport,
                budgetMin: user.preferences.budgetMin,
                budgetMax: user.preferences.budgetMax,
                petFriendly: user.preferences.petFriendly,
                laundryInUnit: user.preferences.laundryInUnit,
                parking: user.preferences.parking,
                quietNeighbourhood: user.preferences.quietNeighbourhood,
                modernFinishes: user.preferences.modernFinishes,
                storageSpace: user.preferences.storageSpace,
                gymAmenities: user.preferences.gymAmenities,
                customDesires:
                    (user.preferences.customDesires as {
                        label: string;
                        enabled: boolean;
                    }[]) || [],
            });

            const latestRec = await prisma.areaRecommendation.findFirst({
                where: { userId: user.id },
                orderBy: { generatedAt: "desc" },
            });

            staleness[user.id] =
                !latestRec || latestRec.preferencesHash !== currentHash;
        }

        return NextResponse.json({ recommendations, staleness });
    }

    const recommendations = await prisma.areaRecommendation.findMany({
        where: { userId: session.userId },
        orderBy: { matchScore: "desc" },
    });

    return NextResponse.json({ recommendations });
}

export async function POST() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Generate recommendations for ALL users with completed preferences
        const usersWithPrefs = await prisma.user.findMany({
            where: { preferences: { onboardingComplete: true } },
            select: { id: true },
        });

        await Promise.all(
            usersWithPrefs.map((u) => generateRecommendations(u.id)),
        );

        const recommendations = await prisma.areaRecommendation.findMany({
            include: {
                user: {
                    select: { id: true, username: true, displayName: true },
                },
            },
            orderBy: { matchScore: "desc" },
        });

        return NextResponse.json({ recommendations });
    } catch (err) {
        console.error("Recommendation generation failed:", err);
        return NextResponse.json(
            { error: "Failed to generate recommendations" },
            { status: 500 },
        );
    }
}
