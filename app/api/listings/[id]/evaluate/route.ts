import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { evaluateListing, toUserPreferences } from "@/lib/ai/evaluate-listing";
import { scrapeUrl } from "@/lib/ai/scrape-url";

export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
        return NextResponse.json(
            { error: "Listing not found" },
            { status: 404 },
        );
    }

    // Scrape URL content if not already scraped and URL exists
    let scrapedContent = listing.scrapedContent;
    if (!scrapedContent && listing.url) {
        scrapedContent = await scrapeUrl(listing.url);
        if (scrapedContent) {
            await prisma.listing.update({
                where: { id },
                data: { scrapedContent },
            });
        }
    }

    // Get all users with completed preferences
    const usersWithPrefs = await prisma.user.findMany({
        include: { preferences: true },
        where: { preferences: { onboardingComplete: true } },
    });

    const results = [];

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
                    scrapedContent,
                },
                toUserPreferences(user.preferences),
                user.displayName,
            );

            const score = await prisma.listingScore.upsert({
                where: {
                    listingId_userId: {
                        listingId: id,
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
                    listingId: id,
                    userId: user.id,
                    aiOverallScore: evaluation.overall,
                    aiBreakdown: evaluation.breakdown,
                    aiSummary: evaluation.summary,
                    evaluatedAt: new Date(),
                },
            });

            results.push({
                userId: user.id,
                userName: user.displayName,
                score,
            });
        } catch (err) {
            console.error(
                `Evaluation failed for user ${user.displayName}:`,
                err,
            );
            results.push({
                userId: user.id,
                userName: user.displayName,
                error: "Evaluation failed",
            });
        }
    }

    return NextResponse.json({ results });
}
