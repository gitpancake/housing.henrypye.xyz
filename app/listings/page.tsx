"use client";

import { useEffect, useState } from "react";
import { ListingCard } from "@/components/listings/listing-card";
import { PlanViewingDayDialog } from "@/components/listings/plan-viewing-day-dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
    Plus,
    RefreshCw,
    LayoutGrid,
    MapPin,
    CalendarPlus,
} from "lucide-react";
import { toast } from "sonner";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { getEffectiveArea } from "@/lib/area-utils";

type Listing = {
    id: string;
    title: string;
    address: string;
    price: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    petFriendly: boolean | null;
    neighbourhood?: string | null;
    contactPhone?: string | null;
    photos: string[];
    status: string;
    addedByUser: { displayName: string };
    scores: {
        id: string;
        aiOverallScore: number | null;
        manualOverrideScore: number | null;
        user: { id: string; username: string; displayName: string };
    }[];
    createdAt: string;
};

type SortOption = "newest" | "price-asc" | "price-desc" | "score-avg";
type ViewMode = "grid" | "by-area";

export default function ListingsPage() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState<SortOption>("score-avg");
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [evaluatingAll, setEvaluatingAll] = useState(false);
    const [planArea, setPlanArea] = useState<string | null>(null);
    const [planListings, setPlanListings] = useState<Listing[]>([]);

    useEffect(() => {
        fetch("/api/listings")
            .then((res) => res.json())
            .then((data) => setListings(data.listings || []))
            .finally(() => setLoading(false));
    }, []);

    const sorted = [...listings].sort((a, b) => {
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
            const listingsRes = await fetch("/api/listings");
            const data = await listingsRes.json();
            setListings(data.listings || []);
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
            <div className="mx-auto max-w-6xl px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Listings</h1>
                        <p className="text-muted-foreground">
                            {listings.length} apartment
                            {listings.length !== 1 ? "s" : ""} tracked
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex rounded-md border">
                            <Button
                                variant={
                                    viewMode === "grid" ? "secondary" : "ghost"
                                }
                                size="sm"
                                className="rounded-r-none"
                                onClick={() => setViewMode("grid")}
                            >
                                <LayoutGrid className="h-4 w-4 mr-1.5" />
                                Grid
                            </Button>
                            <Button
                                variant={
                                    viewMode === "by-area"
                                        ? "secondary"
                                        : "ghost"
                                }
                                size="sm"
                                className="rounded-l-none"
                                onClick={() => setViewMode("by-area")}
                            >
                                <MapPin className="h-4 w-4 mr-1.5" />
                                By Area
                            </Button>
                        </div>
                        <Select
                            value={sort}
                            onValueChange={(v) => setSort(v as SortOption)}
                        >
                            <SelectTrigger className="w-[160px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">
                                    Newest First
                                </SelectItem>
                                <SelectItem value="price-asc">
                                    Price: Low-High
                                </SelectItem>
                                <SelectItem value="price-desc">
                                    Price: High-Low
                                </SelectItem>
                                <SelectItem value="score-avg">
                                    Best Score
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            onClick={handleEvaluateAll}
                            disabled={evaluatingAll || listings.length === 0}
                        >
                            <RefreshCw
                                className={`h-4 w-4 mr-2 ${evaluatingAll ? "animate-spin" : ""}`}
                            />
                            {evaluatingAll
                                ? "Evaluating..."
                                : "Re-evaluate All"}
                        </Button>
                        <Link href="/listings/new">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add
                            </Button>
                        </Link>
                    </div>
                </div>

                {loading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-64 rounded-lg border bg-muted animate-pulse"
                            />
                        ))}
                    </div>
                ) : sorted.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground mb-4">
                            No listings yet. Start adding apartments!
                        </p>
                        <Link href="/listings/new">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Listing
                            </Button>
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
                                className="border rounded-lg px-4"
                            >
                                <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold text-base">
                                            {area}
                                        </span>
                                        <Badge variant="secondary">
                                            {groupedByArea[area].length}
                                        </Badge>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="ml-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openPlanDialog(area);
                                            }}
                                        >
                                            <CalendarPlus className="h-3.5 w-3.5 mr-1.5" />
                                            Plan Viewing Day
                                        </Button>
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
