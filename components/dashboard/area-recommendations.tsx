"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    RefreshCw,
    MapPin,
    Train,
    DollarSign,
    Sparkles,
    Users,
    User,
    ThumbsDown,
    Undo2,
    X,
} from "lucide-react";
import { toast } from "sonner";

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

interface AreaRecommendationsProps {
    recommendations: AreaRec[];
    users: { id: string; username: string; displayName: string }[];
    staleness: Record<string, boolean>;
    currentUserId: string;
    dismissedAreas: DismissedAreaData[];
}

function scoreBadgeColor(score: number): string {
    if (score >= 8)
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    if (score >= 6)
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    if (score >= 4)
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
}

function AreaCard({
    rec,
    score,
    onDismiss,
}: {
    rec: AreaRec;
    score?: number;
    onDismiss?: (areaName: string) => void;
}) {
    const displayScore = score ?? rec.matchScore;
    const highlights = Array.isArray(rec.keyHighlights)
        ? (rec.keyHighlights as string[])
        : [];

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <CardTitle className="text-base flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 shrink-0 text-primary" />
                            <span className="truncate">{rec.areaName}</span>
                        </CardTitle>
                        {rec.vibeDescription && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                                {rec.vibeDescription}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <Badge className={scoreBadgeColor(displayScore)}>
                            {displayScore.toFixed(1)}
                        </Badge>
                        {onDismiss && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDismiss(rec.areaName);
                                }}
                                title="Not interested in this area"
                            >
                                <ThumbsDown className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                {highlights.length > 0 && (
                    <ul className="text-sm space-y-1">
                        {highlights.map((h, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <span className="text-primary mt-0.5 shrink-0">
                                    -
                                </span>
                                <span>{h}</span>
                            </li>
                        ))}
                    </ul>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-2 border-t mt-auto">
                    {rec.averageRent && (
                        <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {rec.averageRent}
                        </span>
                    )}
                    {rec.transitScore && (
                        <span className="flex items-center gap-1">
                            <Train className="h-3 w-3" />
                            {rec.transitScore}
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export function AreaRecommendations({
    recommendations,
    users,
    staleness,
    currentUserId,
    dismissedAreas: initialDismissed,
}: AreaRecommendationsProps) {
    const [refreshing, setRefreshing] = useState(false);
    const [dismissed, setDismissed] =
        useState<DismissedAreaData[]>(initialDismissed);

    // Set of area names dismissed by ANY user
    const dismissedNames = new Set(dismissed.map((d) => d.areaName));

    // Filter out dismissed areas from recommendations
    const activeRecs = recommendations.filter(
        (r) => !dismissedNames.has(r.areaName),
    );

    // Group recommendations by user
    const byUser: Record<string, AreaRec[]> = {};
    for (const rec of activeRecs) {
        if (!byUser[rec.user.id]) byUser[rec.user.id] = [];
        byUser[rec.user.id].push(rec);
    }

    // Find shared areas (appear in both users' lists)
    const userIds = users.filter((u) => byUser[u.id]?.length).map((u) => u.id);
    const sharedAreaNames = new Set<string>();

    if (userIds.length >= 2) {
        const areasByUser = userIds.map(
            (uid) => new Set((byUser[uid] || []).map((r) => r.areaName)),
        );
        for (const areaName of areasByUser[0]) {
            if (areasByUser.every((s) => s.has(areaName))) {
                sharedAreaNames.add(areaName);
            }
        }
    }

    // Build shared recommendations with averaged scores
    const sharedRecs: { rec: AreaRec; avgScore: number }[] = [];
    for (const areaName of sharedAreaNames) {
        const recs = userIds
            .map((uid) =>
                (byUser[uid] || []).find((r) => r.areaName === areaName),
            )
            .filter(Boolean) as AreaRec[];
        const avgScore =
            recs.reduce((sum, r) => sum + r.matchScore, 0) / recs.length;
        sharedRecs.push({ rec: recs[0], avgScore });
    }
    sharedRecs.sort((a, b) => b.avgScore - a.avgScore);

    // Per-user recommendations (excluding shared)
    const uniqueByUser: Record<string, AreaRec[]> = {};
    for (const uid of userIds) {
        uniqueByUser[uid] = (byUser[uid] || [])
            .filter((r) => !sharedAreaNames.has(r.areaName))
            .sort((a, b) => b.matchScore - a.matchScore);
    }

    async function handleRefresh() {
        setRefreshing(true);
        try {
            const res = await fetch("/api/recommendations", { method: "POST" });
            if (!res.ok) throw new Error();
            toast.success("Recommendations updated!");
            window.location.reload();
        } catch {
            toast.error("Failed to refresh recommendations");
        } finally {
            setRefreshing(false);
        }
    }

    async function handleDismiss(areaName: string) {
        try {
            const res = await fetch("/api/dismissed-areas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ areaName }),
            });
            if (!res.ok) throw new Error();
            const { dismissedArea } = await res.json();
            setDismissed((prev) => [...prev, dismissedArea]);
            toast.success(`${areaName} dismissed`);
        } catch {
            toast.error("Failed to dismiss area");
        }
    }

    async function handleUndismiss(areaName: string) {
        try {
            const res = await fetch("/api/dismissed-areas", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ areaName }),
            });
            if (!res.ok) throw new Error();
            setDismissed((prev) =>
                prev.filter(
                    (d) =>
                        !(
                            d.areaName === areaName &&
                            d.user.id === currentUserId
                        ),
                ),
            );
            toast.success(`${areaName} restored`);
        } catch {
            toast.error("Failed to restore area");
        }
    }

    const hasAnyRecs = recommendations.length > 0;
    const currentUserIsStale = staleness[currentUserId];

    if (!hasAnyRecs) {
        return (
            <Card>
                <CardContent className="py-8 text-center">
                    <Sparkles className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <h3 className="font-semibold mb-1">
                        No area recommendations yet
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Complete your preferences to get AI-powered
                        neighbourhood recommendations.
                    </p>
                    <Button onClick={handleRefresh} disabled={refreshing}>
                        <RefreshCw
                            className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                        />
                        {refreshing
                            ? "Generating..."
                            : "Generate Recommendations"}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stale banner */}
            {currentUserIsStale && (
                <div className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30 px-4 py-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        Your preferences have changed. Refresh to get updated
                        recommendations.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={refreshing}
                    >
                        <RefreshCw
                            className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                        />
                        {refreshing ? "Updating..." : "Refresh"}
                    </Button>
                </div>
            )}

            {/* Shared recommendations */}
            {sharedRecs.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Users className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">
                            Perfect areas for both of you
                        </h2>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {sharedRecs.map(({ rec, avgScore }) => (
                            <AreaCard
                                key={rec.id}
                                rec={rec}
                                score={avgScore}
                                onDismiss={handleDismiss}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Per-user recommendations */}
            {userIds.length >= 2 ? (
                <div className="grid gap-6 md:grid-cols-2">
                    {users
                        .filter((u) => byUser[u.id]?.length)
                        .map((user) => (
                            <div key={user.id}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-primary" />
                                        <h2 className="text-lg font-semibold">
                                            Best for {user.displayName}
                                        </h2>
                                    </div>
                                    {user.id === currentUserId && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleRefresh}
                                            disabled={refreshing}
                                        >
                                            <RefreshCw
                                                className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
                                            />
                                        </Button>
                                    )}
                                </div>
                                {(uniqueByUser[user.id] || []).length > 0 ? (
                                    <div className="grid gap-4">
                                        {(uniqueByUser[user.id] || []).map(
                                            (rec) => (
                                                <AreaCard
                                                    key={rec.id}
                                                    rec={rec}
                                                    onDismiss={handleDismiss}
                                                />
                                            ),
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        All of {user.displayName}&apos;s top
                                        areas overlap with the shared list
                                        above!
                                    </p>
                                )}
                            </div>
                        ))}
                </div>
            ) : (
                // Only one user has recs — show as a flat grid
                users
                    .filter((u) => byUser[u.id]?.length)
                    .map((user) => (
                        <div key={user.id}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    <h2 className="text-lg font-semibold">
                                        Recommended areas for {user.displayName}
                                    </h2>
                                </div>
                                {user.id === currentUserId && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleRefresh}
                                        disabled={refreshing}
                                    >
                                        <RefreshCw
                                            className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
                                        />
                                    </Button>
                                )}
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {(byUser[user.id] || []).map((rec) => (
                                    <AreaCard
                                        key={rec.id}
                                        rec={rec}
                                        onDismiss={handleDismiss}
                                    />
                                ))}
                            </div>
                            {users
                                .filter((u) => !byUser[u.id]?.length)
                                .map((other) => (
                                    <p
                                        key={other.id}
                                        className="text-sm text-muted-foreground mt-4"
                                    >
                                        Waiting for {other.displayName} to
                                        complete preferences to show shared
                                        recommendations.
                                    </p>
                                ))}
                        </div>
                    ))
            )}

            {/* Dismissed areas */}
            {dismissed.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <ThumbsDown className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium text-muted-foreground">
                            Ruled out areas
                        </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {dismissed.map((d) => (
                            <Badge
                                key={d.id}
                                variant="outline"
                                className="text-muted-foreground gap-1.5 py-1"
                            >
                                <X className="h-3 w-3" />
                                {d.areaName}
                                <span className="text-xs opacity-60">
                                    by {d.user.displayName}
                                </span>
                                {d.user.id === currentUserId && (
                                    <button
                                        className="ml-1 hover:text-primary"
                                        onClick={() =>
                                            handleUndismiss(d.areaName)
                                        }
                                        title="Restore this area"
                                    >
                                        <Undo2 className="h-3 w-3" />
                                    </button>
                                )}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
