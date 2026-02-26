import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { evaluateListing, toUserPreferences } from "@/lib/ai/evaluate-listing";
import { ACTIVE_STATUSES } from "@/lib/listing-status";

export async function POST() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const listings = await prisma.listing.findMany({
        where: { status: { in: [...ACTIVE_STATUSES] } },
    });

    const usersWithPrefs = await prisma.user.findMany({
        include: { preferences: true },
        where: { preferences: { onboardingComplete: true } },
    });

    let evaluated = 0;
    let failed = 0;

    for (const listing of listings) {
        for (const user of usersWithPrefs) {
            if (!user.preferences) continue;

            try {
                const evaluation = await evaluateListing(
                    {
                        title: listing.title,
                        description: listing.description,
                        url: listing.url,
                        address: listing.address,
                        price: listing.price,
                        bedrooms: listing.bedrooms,
                        bathrooms: listing.bathrooms,
                        petFriendly: listing.petFriendly,
                        squareFeet: listing.squareFeet,
                        scrapedContent: listing.scrapedContent,
                    },
                    toUserPreferences(user.preferences),
                    user.displayName,
                );

                await prisma.listingScore.upsert({
                    where: {
                        listingId_userId: {
                            listingId: listing.id,
                            userId: user.id,
                        },
                    },
                    update: {
                        aiOverallScore: evaluation.overall,
                        aiBreakdown: evaluation.breakdown,
                        aiSummary: evaluation.summary,
                        evaluatedAt: new Date(),
                    },
                    create: {
                        listingId: listing.id,
                        userId: user.id,
                        aiOverallScore: evaluation.overall,
                        aiBreakdown: evaluation.breakdown,
                        aiSummary: evaluation.summary,
                        evaluatedAt: new Date(),
                    },
                });

                evaluated++;
            } catch (err) {
                console.error(
                    `Batch eval failed: ${listing.title} for ${user.displayName}:`,
                    err,
                );
                failed++;
            }
        }
    }

    return NextResponse.json({
        evaluated,
        failed,
        total: listings.length * usersWithPrefs.length,
    });
}
