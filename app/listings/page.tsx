"use client";

import { useState } from "react";
import { useListings } from "@/lib/hooks";
import { ListingCard } from "@/components/listings/listing-card";
import { PlanViewingDayDialog } from "@/components/listings/plan-viewing-day-dialog";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";
import {
    RefreshCw,
    CalendarPlus,
} from "lucide-react";
import { toast } from "sonner";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { getEffectiveArea } from "@/lib/area-utils";
import { isActiveListing } from "@/lib/listing-status";
import type { Listing } from "@/types";

type SortOption = "newest" | "price-asc" | "price-desc" | "score-avg";
type ViewMode = "grid" | "by-area";

export default function ListingsPage() {
    const { listings, loading, refetch } = useListings();
    const [sort, setSort] = useState<SortOption>("score-avg");
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [evaluatingAll, setEvaluatingAll] = useState(false);
    const [planArea, setPlanArea] = useState<string | null>(null);
    const [planListings, setPlanListings] = useState<Listing[]>([]);

    const activeListings = listings.filter((l) => isActiveListing(l.status));
    const archivedListings = listings.filter((l) => !isActiveListing(l.status));

    const sorted = [...activeListings].sort((a, b) => {
        switch (sort) {
            case "newest":
                return (
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                );
            case "price-asc":
                return (a.price ?? Infinity) - (b.price ?? Infinity);
            case "price-desc":
                return (b.price ?? 0) - (a.price ?? 0);
            case "score-avg": {
                const avgScore = (l: Listing) => {
                    const scores = l.scores
                        .map((s) => s.manualOverrideScore ?? s.aiOverallScore)
                        .filter((s): s is number => s != null);
                    return scores.length
                        ? scores.reduce((a, b) => a + b, 0) / scores.length
                        : -1;
                };
                return avgScore(b) - avgScore(a);
            }
            default:
                return 0;
        }
    });

    // Group sorted listings by area
    const groupedByArea = sorted.reduce<Record<string, Listing[]>>(
        (acc, listing) => {
            const area = getEffectiveArea(listing);
            if (!acc[area]) acc[area] = [];
            acc[area].push(listing);
            return acc;
        },
        {},
    );

    // Sort area keys: alphabetical, but "Other" always last
    const areaKeys = Object.keys(groupedByArea).sort((a, b) => {
        if (a === "Other") return 1;
        if (b === "Other") return -1;
        return a.localeCompare(b);
    });

    async function handleEvaluateAll() {
        setEvaluatingAll(true);
        try {
            const res = await fetch("/api/listings/evaluate-all", {
                method: "POST",
            });
            if (!res.ok) throw new Error();
            const { evaluated, failed } = await res.json();
            toast.success(
                `Re-evaluated ${evaluated} scores${failed ? ` (${failed} failed)` : ""}`,
            );
            await refetch();
        } catch {
            toast.error("Batch evaluation failed");
        } finally {
            setEvaluatingAll(false);
        }
    }

    function openPlanDialog(area: string) {
        setPlanArea(area);
        setPlanListings(groupedByArea[area] || []);
    }

    return (
        <PageWrapper>
            <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-lg font-semibold">Listings</h1>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            {activeListings.length} active
                            {archivedListings.length > 0 && (
                                <span> · {archivedListings.length} archived</span>
                            )}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex rounded-md border border-zinc-200 bg-white p-0.5 gap-0.5">
                            <button
                                className={`rounded px-2.5 py-1 text-xs transition-colors ${
                                    viewMode === "grid"
                                        ? "bg-zinc-900 text-white"
                                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                                }`}
                                onClick={() => setViewMode("grid")}
                            >
                                Grid
                            </button>
                            <button
                                className={`rounded px-2.5 py-1 text-xs transition-colors ${
                                    viewMode === "by-area"
                                        ? "bg-zinc-900 text-white"
                                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                                }`}
                                onClick={() => setViewMode("by-area")}
                            >
                                By Area
                            </button>
                        </div>
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value as SortOption)}
                            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-zinc-400"
                        >
                            <option value="score-avg">Best Score</option>
                            <option value="newest">Newest First</option>
                            <option value="price-asc">Price: Low-High</option>
                            <option value="price-desc">Price: High-Low</option>
                        </select>
                        <button
                            onClick={handleEvaluateAll}
                            disabled={evaluatingAll || activeListings.length === 0}
                            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-40"
                        >
                            <RefreshCw
                                className={`h-3 w-3 ${evaluatingAll ? "animate-spin" : ""}`}
                            />
                            {evaluatingAll ? "Evaluating..." : "Re-evaluate"}
                        </button>
                        <Link href="/listings/new">
                            <button className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 transition-colors">
                                + Add
                            </button>
                        </Link>
                    </div>
                </div>

                {loading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-64 rounded-lg border border-zinc-200 bg-white animate-pulse"
                            />
                        ))}
                    </div>
                ) : sorted.length === 0 ? (
                    <div className="rounded-lg border border-zinc-200 bg-white p-5 py-16 text-center">
                        <p className="text-sm text-zinc-500 mb-4">
                            No listings yet. Start adding apartments!
                        </p>
                        <Link href="/listings/new">
                            <button className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 transition-colors">
                                + Add Your First Listing
                            </button>
                        </Link>
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {sorted.map((listing) => (
                            <ListingCard key={listing.id} listing={listing} />
                        ))}
                    </div>
                ) : (
                    <Accordion
                        type="multiple"
                        defaultValue={areaKeys}
                        className="space-y-2"
                    >
                        {areaKeys.map((area) => (
                            <AccordionItem
                                key={area}
                                value={area}
                                className="border border-zinc-200 rounded-lg bg-white px-4"
                            >
                                <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-semibold">
                                            {area}
                                        </span>
                                        <span className="text-xs text-zinc-400">
                                            {groupedByArea[area].length}
                                        </span>
                                        <button
                                            className="ml-2 flex items-center gap-1 rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50 transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openPlanDialog(area);
                                            }}
                                        >
                                            <CalendarPlus className="h-3 w-3" />
                                            Plan Viewing Day
                                        </button>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {groupedByArea[area].map((listing) => (
                                            <ListingCard
                                                key={listing.id}
                                                listing={listing}
                                            />
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}

                {/* Archived listings */}
                {!loading && archivedListings.length > 0 && (
                    <div className="mt-6">
                        <Accordion type="single" collapsible>
                            <AccordionItem value="archived" className="border border-zinc-200 rounded-lg bg-white px-4">
                                <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-zinc-400">
                                            Archived
                                        </span>
                                        <span className="text-xs text-zinc-300">
                                            {archivedListings.length}
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-2">
                                        {archivedListings.map((listing) => (
                                            <ListingCard key={listing.id} listing={listing} />
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                )}
            </div>

            {planArea && (
                <PlanViewingDayDialog
                    open={!!planArea}
                    onClose={() => setPlanArea(null)}
                    onScheduled={() => {}}
                    area={planArea}
                    listings={planListings}
                />
            )}
        </PageWrapper>
    );
}
