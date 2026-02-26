"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    CheckCircle2,
    Circle,
    RefreshCw,
    Search,
    MapPin,
    Bed,
    Bath,
    Home,
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
            <div className="p-8 space-y-6">
                <h1 className="text-lg font-semibold">Dashboard</h1>

                <div className="rounded-lg border border-green-200 bg-white overflow-hidden">
                    <div className="bg-green-50 px-5 py-3 flex items-center gap-2 border-b border-green-200">
                        <Home className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium uppercase tracking-wide text-green-700">
                            Currently living at
                        </span>
                    </div>
                    <div className="p-5">
                        <div className="flex flex-col md:flex-row gap-6">
                            {photo && (
                                <div className="md:w-56 shrink-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={photo}
                                        alt={selectedListing.title}
                                        className="h-40 md:h-full w-full object-cover rounded-lg"
                                    />
                                </div>
                            )}
                            <div className="flex-1 space-y-3">
                                <div>
                                    <Link
                                        href={`/listings/${selectedListing.id}`}
                                        className="text-sm font-semibold hover:underline"
                                    >
                                        {selectedListing.title}
                                    </Link>
                                    {selectedListing.address && (
                                        <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                                            <MapPin className="h-3 w-3" />
                                            {selectedListing.address}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-4 text-xs text-zinc-700">
                                    {selectedListing.price && (
                                        <span className="font-mono">
                                            ${selectedListing.price.toLocaleString()}/mo
                                        </span>
                                    )}
                                    {selectedListing.bedrooms != null && (
                                        <span className="flex items-center gap-1">
                                            <Bed className="h-3 w-3 text-zinc-400" />
                                            {selectedListing.bedrooms} bed
                                        </span>
                                    )}
                                    {selectedListing.bathrooms != null && (
                                        <span className="flex items-center gap-1">
                                            <Bath className="h-3 w-3 text-zinc-400" />
                                            {selectedListing.bathrooms} bath
                                        </span>
                                    )}
                                    {selectedListing.neighbourhood && (
                                        <span className="text-zinc-500">
                                            {selectedListing.neighbourhood}
                                        </span>
                                    )}
                                </div>
                                {selectedListing.scores.length > 0 && (
                                    <div className="flex flex-wrap gap-4">
                                        {selectedListing.scores.map((score) => {
                                            const val = getEffectiveScore(score);
                                            return val != null ? (
                                                <div key={score.id} className="text-xs">
                                                    <span className="text-zinc-500">
                                                        {score.user.displayName}:{" "}
                                                    </span>
                                                    <span className={`font-mono font-semibold ${scoreColor(val)}`}>
                                                        {val.toFixed(1)}/10
                                                    </span>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                )}
                                <Link
                                    href={`/listings/${selectedListing.id}`}
                                    className="inline-block text-xs text-zinc-600 hover:text-zinc-900 underline mt-1"
                                >
                                    View details
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-zinc-200 bg-white p-5 text-center space-y-3">
                    <Search className="h-8 w-8 mx-auto text-zinc-300" />
                    <p className="text-sm font-medium text-zinc-700">
                        Looking for a new place?
                    </p>
                    <p className="text-xs text-zinc-500">
                        Your current listing will be archived along with all previous listings.
                    </p>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button
                                disabled={resetting}
                                className="text-xs text-zinc-600 hover:text-zinc-900 underline disabled:opacity-40"
                            >
                                {resetting ? "Resetting..." : "Start looking again"}
                            </button>
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
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold">Dashboard</h1>
                <Link href="/listings/new">
                    <button className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 transition-colors">
                        + Add Listing
                    </button>
                </Link>
            </div>

            {/* Summary cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-zinc-200 bg-white px-4 py-4 min-w-0">
                    <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                        Active
                    </div>
                    <div className="font-mono text-lg font-semibold mt-1">
                        {activeListings.length}
                    </div>
                </div>

                <div className="rounded-lg border border-zinc-200 bg-white px-4 py-4 min-w-0">
                    <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                        Favorites
                    </div>
                    <div className="font-mono text-lg font-semibold mt-1">
                        {favorites.length}
                    </div>
                </div>

                {users.map((user) => {
                    const pick = topPicks[user.id];
                    return (
                        <div
                            key={user.id}
                            className="rounded-lg border border-zinc-200 bg-white px-4 py-4 min-w-0"
                        >
                            <div className="text-xs font-medium uppercase tracking-wide text-zinc-400 truncate">
                                {user.displayName}&apos;s Top
                            </div>
                            {pick ? (
                                <div
                                    className="font-mono text-lg font-semibold text-green-600 mt-1 truncate"
                                    title={pick.listing.title}
                                >
                                    {pick.score.toFixed(1)}/10
                                </div>
                            ) : (
                                <div className="font-mono text-lg text-zinc-300 mt-1">
                                    —
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Viewing Day Dashboard */}
            <ViewingDayBanner viewings={upcomingViewings} />

            {/* Setup status */}
            {(!allPrefsComplete || !hasRecs) && (
                <div className="rounded-lg border border-zinc-200 bg-white p-5">
                    <div className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-3">
                        Getting Started
                    </div>
                    <div className="space-y-2">
                        {userStatuses.map((u) => (
                            <div
                                key={u.id}
                                className="flex items-center gap-2"
                            >
                                {u.preferencesComplete ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                                ) : (
                                    <Circle className="h-4 w-4 text-zinc-300 shrink-0" />
                                )}
                                <span className="text-sm text-zinc-700">
                                    {u.displayName}
                                    {u.preferencesComplete
                                        ? " — preferences complete"
                                        : " — waiting for preferences"}
                                </span>
                                {!u.preferencesComplete &&
                                    u.id === currentUserId && (
                                        <Link href="/onboarding">
                                            <button className="text-xs text-zinc-600 hover:text-zinc-900 underline ml-2">
                                                Complete Setup
                                            </button>
                                        </Link>
                                    )}
                            </div>
                        ))}
                    </div>

                    {allPrefsComplete && !hasRecs && (
                        <div className="mt-4 rounded border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center">
                            <p className="text-sm text-zinc-700 mb-3">
                                Both of you are set up! Generate AI-powered
                                neighbourhood recommendations.
                            </p>
                            <button
                                onClick={handleGenerateRecs}
                                disabled={generatingRecs}
                                className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 transition-colors disabled:opacity-40"
                            >
                                {generatingRecs ? (
                                    <span className="flex items-center gap-2">
                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                        Generating...
                                    </span>
                                ) : (
                                    "Generate Area Recommendations"
                                )}
                            </button>
                        </div>
                    )}

                    {!allPrefsComplete && (
                        <p className="text-xs text-zinc-400 mt-3">
                            Once everyone completes their preferences,
                            you&apos;ll be able to generate neighbourhood
                            recommendations.
                        </p>
                    )}
                </div>
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

            {/* Score comparison table */}
            {scoredListings.length > 0 && (
                <div className="rounded-lg border border-zinc-200 bg-white p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                            Score Comparison
                        </div>
                        <Link
                            href="/listings"
                            className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
                        >
                            View all →
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr>
                                    <th className="text-left py-2 pr-4 font-medium text-xs uppercase tracking-wide text-zinc-400 border-b-2 border-zinc-200">
                                        Listing
                                    </th>
                                    <th className="text-right py-2 px-3 font-medium text-xs uppercase tracking-wide text-zinc-400 border-b-2 border-zinc-200">
                                        Price
                                    </th>
                                    {users.map((u) => (
                                        <th
                                            key={u.id}
                                            className="text-right py-2 px-3 font-medium text-xs uppercase tracking-wide text-zinc-400 border-b-2 border-zinc-200"
                                        >
                                            {u.displayName}
                                        </th>
                                    ))}
                                    <th className="text-right py-2 pl-3 font-medium text-xs uppercase tracking-wide text-zinc-400 border-b-2 border-zinc-200">
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
                                            className="group hover:bg-zinc-50 transition-colors"
                                        >
                                            <td className="py-2 pr-4 border-b border-zinc-100">
                                                <Link
                                                    href={`/listings/${listing.id}`}
                                                    className="hover:underline font-medium text-sm line-clamp-1"
                                                >
                                                    {listing.title}
                                                </Link>
                                                {listing.status === "FAVORITE" && (
                                                    <span className="ml-2 text-[10px] text-amber-600">
                                                        fav
                                                    </span>
                                                )}
                                                {listing.status === "SELECTED" && (
                                                    <span className="ml-2 text-[10px] text-green-600">
                                                        selected
                                                    </span>
                                                )}
                                            </td>
                                            <td className="text-right py-2 px-3 font-mono text-sm text-zinc-500 border-b border-zinc-100">
                                                {listing.price
                                                    ? `$${listing.price.toLocaleString()}`
                                                    : "—"}
                                            </td>
                                            {users.map((u) => {
                                                const val = userScores[u.id];
                                                return (
                                                    <td
                                                        key={u.id}
                                                        className="text-right py-2 px-3 font-mono text-sm border-b border-zinc-100"
                                                    >
                                                        {val != null ? (
                                                            <span className={`font-semibold ${scoreColor(val)}`}>
                                                                {val.toFixed(1)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-zinc-300">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td className="text-right py-2 pl-3 font-mono text-sm font-semibold border-b border-zinc-100">
                                                {avg != null
                                                    ? avg.toFixed(1)
                                                    : "—"}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {listings.length === 0 && (
                <div className="rounded-lg border border-zinc-200 bg-white p-5 py-12 text-center">
                    <p className="text-sm font-medium text-zinc-700 mb-2">
                        No listings yet
                    </p>
                    <p className="text-xs text-zinc-400 mb-6">
                        Start adding apartments you find and we&apos;ll score
                        them against both your preferences.
                    </p>
                    <Link href="/listings/new">
                        <button className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 transition-colors">
                            + Add Your First Listing
                        </button>
                    </Link>
                </div>
            )}
        </div>
    );
}
