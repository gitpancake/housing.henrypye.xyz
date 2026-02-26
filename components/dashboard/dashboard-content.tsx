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
    Search,
    MapPin,
    Bed,
    Bath,
    DollarSign,
    ExternalLink,
} from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { scoreColor, getEffectiveScore } from "@/lib/scores";
import { isActiveListing } from "@/lib/listing-status";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Listing } from "@/types";
import { AreaRecommendations } from "./area-recommendations";
import { ViewingDayBanner } from "./viewing-day-banner";

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
    const router = useRouter();
    const [generatingRecs, setGeneratingRecs] = useState(false);
    const [resetting, setResetting] = useState(false);
    const selectedListing = listings.find((l) => l.status === "SELECTED");
    const activeListings = listings.filter(
        (l) => isActiveListing(l.status),
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

    async function handleResetSearch() {
        setResetting(true);
        try {
            const res = await fetch("/api/listings/reset-search", {
                method: "POST",
            });
            if (!res.ok) throw new Error();
            toast.success("Ready to start your apartment search again!");
            router.refresh();
        } catch {
            toast.error("Failed to reset search");
        } finally {
            setResetting(false);
        }
    }

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

    // When a listing is selected as "home", show the settled view
    if (selectedListing) {
        const photo = (selectedListing.photos as string[])?.[0];
        return (
            <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
                <div>
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground">
                        You&apos;ve found your place!
                    </p>
                </div>

                <Card className="overflow-hidden border-green-200 dark:border-green-800">
                    <div className="bg-green-50 dark:bg-green-900/20 px-6 py-4 flex items-center gap-3 border-b border-green-200 dark:border-green-800">
                        <Home className="h-5 w-5 text-green-600" />
                        <p className="font-semibold text-green-800 dark:text-green-200">
                            Currently living at
                        </p>
                    </div>
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            {photo && (
                                <div className="md:w-64 shrink-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={photo}
                                        alt={selectedListing.title}
                                        className="h-48 md:h-full w-full object-cover rounded-lg"
                                    />
                                </div>
                            )}
                            <div className="flex-1 space-y-4">
                                <div>
                                    <Link
                                        href={`/listings/${selectedListing.id}`}
                                        className="text-xl font-bold hover:underline"
                                    >
                                        {selectedListing.title}
                                    </Link>
                                    {selectedListing.address && (
                                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                                            <MapPin className="h-3.5 w-3.5" />
                                            {selectedListing.address}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm">
                                    {selectedListing.price && (
                                        <span className="flex items-center gap-1">
                                            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                                            ${selectedListing.price.toLocaleString()}/mo
                                        </span>
                                    )}
                                    {selectedListing.bedrooms != null && (
                                        <span className="flex items-center gap-1">
                                            <Bed className="h-3.5 w-3.5 text-muted-foreground" />
                                            {selectedListing.bedrooms} bed
                                        </span>
                                    )}
                                    {selectedListing.bathrooms != null && (
                                        <span className="flex items-center gap-1">
                                            <Bath className="h-3.5 w-3.5 text-muted-foreground" />
                                            {selectedListing.bathrooms} bath
                                        </span>
                                    )}
                                    {selectedListing.neighbourhood && (
                                        <Badge variant="outline">
                                            {selectedListing.neighbourhood}
                                        </Badge>
                                    )}
                                </div>
                                {selectedListing.scores.length > 0 && (
                                    <div className="flex flex-wrap gap-4">
                                        {selectedListing.scores.map((score) => {
                                            const val = getEffectiveScore(score);
                                            return val != null ? (
                                                <div key={score.id} className="text-sm">
                                                    <span className="text-muted-foreground">
                                                        {score.user.displayName}:{" "}
                                                    </span>
                                                    <span className={`font-semibold ${scoreColor(val)}`}>
                                                        {val.toFixed(1)}/10
                                                    </span>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                )}
                                <div className="flex items-center gap-3 pt-2">
                                    <Link href={`/listings/${selectedListing.id}`}>
                                        <Button variant="outline" size="sm">
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            View Details
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="py-8 text-center space-y-4">
                        <Search className="h-10 w-10 mx-auto text-muted-foreground" />
                        <div>
                            <p className="font-medium">Looking for a new place?</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Start a new apartment search. Your current listing will be
                                archived along with all previous listings.
                            </p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" disabled={resetting}>
                                    <Search className="h-4 w-4 mr-2" />
                                    {resetting ? "Resetting..." : "Start Looking Again"}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        Start a new apartment search?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will archive &quot;{selectedListing.title}&quot; and
                                        clear your dashboard for a fresh search. All your previous
                                        listings, viewings, and notes will be preserved in the
                                        archived section.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleResetSearch}>
                                        Start Fresh
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>
            </div>
        );
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
