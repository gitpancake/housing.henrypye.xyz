"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    TrendingUp,
    Home,
    Star,
    ArrowRight,
    CheckCircle2,
    Circle,
    Sparkles,
    RefreshCw,
} from "lucide-react";
import { scoreColor, getEffectiveScore } from "@/lib/scores";
import { AreaRecommendations } from "./area-recommendations";
import { ViewingDayBanner } from "./viewing-day-banner";

interface Score {
    id: string;
    aiOverallScore: number | null;
    manualOverrideScore: number | null;
    user: { id: string; username: string; displayName: string };
}

interface Listing {
    id: string;
    title: string;
    address: string;
    price: number | null;
    bedrooms: number | null;
    status: string;
    photos: unknown;
    addedByUser: { id: string; displayName: string };
    scores: Score[];
    createdAt: string | Date;
}

interface AreaRec {
    id: string;
    areaName: string;
    matchScore: number;
    reasoning: string;
    keyHighlights: string[] | unknown;
    averageRent: string | null;
    transitScore: string | null;
    vibeDescription: string | null;
    user: { id: string; displayName: string };
}

interface DismissedAreaData {
    id: string;
    areaName: string;
    reason: string | null;
    user: { id: string; displayName: string };
}

interface AreaNoteData {
    id: string;
    areaName: string;
    liked: string | null;
    disliked: string | null;
    user: { id: string; displayName: string };
}

interface UserStatus {
    id: string;
    displayName: string;
    preferencesComplete: boolean;
}

interface UpcomingViewing {
    id: string;
    scheduledAt: string | Date;
    notes: string | null;
    status: string;
    listing: {
        id: string;
        title: string;
        address: string;
        latitude: number | null;
        longitude: number | null;
        price: number | null;
        bedrooms: number | null;
        bathrooms: number | null;
        neighbourhood: string | null;
        url: string;
        photos: unknown;
        scores: {
            aiOverallScore: number | null;
            manualOverrideScore: number | null;
            user: { id: string; displayName: string };
        }[];
    };
    user: { id: string; displayName: string };
}

interface DashboardContentProps {
    listings: Listing[];
    users: { id: string; username: string; displayName: string }[];
    recommendations: AreaRec[];
    staleness: Record<string, boolean>;
    currentUserId: string;
    dismissedAreas: DismissedAreaData[];
    areaNotes: AreaNoteData[];
    userStatuses: UserStatus[];
    upcomingViewings: UpcomingViewing[];
}

export function DashboardContent({
    listings,
    users,
    recommendations,
    staleness,
    currentUserId,
    dismissedAreas,
    areaNotes,
    userStatuses,
    upcomingViewings,
}: DashboardContentProps) {
    const [generatingRecs, setGeneratingRecs] = useState(false);
    const activeListings = listings.filter(
        (l) => l.status === "ACTIVE" || l.status === "FAVORITE" || l.status === "SELECTED",
    );
    const favorites = listings.filter((l) => l.status === "FAVORITE");

    // Calculate top picks per user
    const topPicks: Record<string, { listing: Listing; score: number } | null> =
        {};
    for (const user of users) {
        let best: { listing: Listing; score: number } | null = null;
        for (const listing of activeListings) {
            const userScore = listing.scores.find((s) => s.user.id === user.id);
            if (!userScore) continue;
            const val = getEffectiveScore(userScore);
            if (val != null && (!best || val > best.score)) {
                best = { listing, score: val };
            }
        }
        topPicks[user.id] = best;
    }

    // Average scores per listing (for comparison table)
    const scoredListings = activeListings
        .map((listing) => {
            const userScores: Record<string, number | null> = {};
            for (const user of users) {
                const s = listing.scores.find((sc) => sc.user.id === user.id);
                userScores[user.id] = s ? getEffectiveScore(s) : null;
            }
            const allScores = Object.values(userScores).filter(
                (v): v is number => v != null,
            );
            const avg =
                allScores.length > 0
                    ? allScores.reduce((a, b) => a + b, 0) / allScores.length
                    : null;
            return { listing, userScores, avg };
        })
        .filter((s) => s.avg != null)
        .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));

    const allPrefsComplete = userStatuses.every((u) => u.preferencesComplete);
    const hasRecs = recommendations.length > 0;

    async function handleGenerateRecs() {
        setGeneratingRecs(true);
        try {
            const res = await fetch("/api/recommendations", { method: "POST" });
            if (!res.ok) throw new Error();
            window.location.reload();
        } catch {
            setGeneratingRecs(false);
        }
    }

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Your apartment search at a glance
                    </p>
                </div>
                <Link href="/listings/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Listing
                    </Button>
                </Link>
            </div>

            {/* Stats cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-primary/10 p-2">
                                <Home className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {activeListings.length}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Active Listings
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-yellow-100 dark:bg-yellow-900/30 p-2">
                                <Star className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {favorites.length}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Favorites
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {users.map((user) => {
                    const pick = topPicks[user.id];
                    return (
                        <Card key={user.id}>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-2">
                                        <TrendingUp className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-muted-foreground">
                                            {user.displayName}'s Top
                                        </p>
                                        {pick ? (
                                            <p
                                                className="text-sm font-medium truncate"
                                                title={pick.listing.title}
                                            >
                                                {pick.score.toFixed(1)}/10
                                            </p>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                —
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Viewing Day Dashboard */}
            <ViewingDayBanner viewings={upcomingViewings} />

            {/* Setup status — show when not everyone has prefs or no recs yet */}
            {(!allPrefsComplete || !hasRecs) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Getting Started
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            {userStatuses.map((u) => (
                                <div
                                    key={u.id}
                                    className="flex items-center gap-3"
                                >
                                    {u.preferencesComplete ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                                    )}
                                    <span
                                        className={
                                            u.preferencesComplete
                                                ? "text-sm"
                                                : "text-sm text-muted-foreground"
                                        }
                                    >
                                        {u.displayName}
                                        {u.preferencesComplete
                                            ? " — preferences complete"
                                            : " — waiting for preferences"}
                                    </span>
                                    {!u.preferencesComplete &&
                                        u.id === currentUserId && (
                                            <Link href="/onboarding">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    Complete Setup
                                                </Button>
                                            </Link>
                                        )}
                                </div>
                            ))}
                        </div>

                        {allPrefsComplete && !hasRecs && (
                            <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-4 text-center">
                                <p className="text-sm font-medium mb-3">
                                    Both of you are set up! Generate AI-powered
                                    neighbourhood recommendations based on your
                                    combined preferences.
                                </p>
                                <Button
                                    onClick={handleGenerateRecs}
                                    disabled={generatingRecs}
                                >
                                    {generatingRecs ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4 mr-2" />
                                            Generate Area Recommendations
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}

                        {!allPrefsComplete && (
                            <p className="text-xs text-muted-foreground">
                                Once everyone completes their preferences,
                                you&apos;ll be able to generate neighbourhood
                                recommendations.
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Area Recommendations */}
            <AreaRecommendations
                recommendations={recommendations}
                users={users}
                staleness={staleness}
                currentUserId={currentUserId}
                dismissedAreas={dismissedAreas}
                areaNotes={areaNotes}
            />

            {/* Comparison table */}
            {scoredListings.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                                Score Comparison
                            </CardTitle>
                            <Link href="/listings">
                                <Button variant="ghost" size="sm">
                                    View All{" "}
                                    <ArrowRight className="h-4 w-4 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2 pr-4 font-medium">
                                            Listing
                                        </th>
                                        <th className="text-right py-2 px-3 font-medium">
                                            Price
                                        </th>
                                        {users.map((u) => (
                                            <th
                                                key={u.id}
                                                className="text-right py-2 px-3 font-medium"
                                            >
                                                {u.displayName}
                                            </th>
                                        ))}
                                        <th className="text-right py-2 pl-3 font-medium">
                                            Avg
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {scoredListings
                                        .slice(0, 10)
                                        .map(({ listing, userScores, avg }) => (
                                            <tr
                                                key={listing.id}
                                                className="border-b last:border-0"
                                            >
                                                <td className="py-2.5 pr-4">
                                                    <Link
                                                        href={`/listings/${listing.id}`}
                                                        className="hover:underline font-medium line-clamp-1"
                                                    >
                                                        {listing.title}
                                                    </Link>
                                                    {listing.status ===
                                                        "FAVORITE" && (
                                                        <Badge
                                                            variant="default"
                                                            className="ml-2 text-[10px]"
                                                        >
                                                            Fav
                                                        </Badge>
                                                    )}
                                                    {listing.status ===
                                                        "SELECTED" && (
                                                        <Badge
                                                            className="ml-2 text-[10px] bg-green-600 text-white"
                                                        >
                                                            Selected
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="text-right py-2.5 px-3 tabular-nums text-muted-foreground">
                                                    {listing.price
                                                        ? `$${listing.price.toLocaleString()}`
                                                        : "—"}
                                                </td>
                                                {users.map((u) => {
                                                    const val =
                                                        userScores[u.id];
                                                    return (
                                                        <td
                                                            key={u.id}
                                                            className="text-right py-2.5 px-3 tabular-nums"
                                                        >
                                                            {val != null ? (
                                                                <span
                                                                    className={`font-semibold ${scoreColor(val)}`}
                                                                >
                                                                    {val.toFixed(
                                                                        1,
                                                                    )}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground">
                                                                    —
                                                                </span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className="text-right py-2.5 pl-3 tabular-nums font-semibold">
                                                    {avg != null
                                                        ? avg.toFixed(1)
                                                        : "—"}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Empty state */}
            {listings.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h2 className="text-lg font-semibold mb-2">
                            No listings yet
                        </h2>
                        <p className="text-muted-foreground mb-6">
                            Start adding apartments you find and we'll score
                            them against both your preferences.
                        </p>
                        <Link href="/listings/new">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Listing
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
