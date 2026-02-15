"use client";

import { useEffect, useState } from "react";
import { ListingCard } from "@/components/listings/listing-card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageWrapper } from "@/components/layout/page-wrapper";

type Listing = {
    id: string;
    title: string;
    address: string;
    price: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    petFriendly: boolean | null;
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

export default function ListingsPage() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState<SortOption>("newest");

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
                                    Price: Low→High
                                </SelectItem>
                                <SelectItem value="price-desc">
                                    Price: High→Low
                                </SelectItem>
                                <SelectItem value="score-avg">
                                    Best Score
                                </SelectItem>
                            </SelectContent>
                        </Select>
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
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {sorted.map((listing) => (
                            <ListingCard key={listing.id} listing={listing} />
                        ))}
                    </div>
                )}
            </div>
        </PageWrapper>
    );
}
