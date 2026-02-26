"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";
import { useListings } from "@/lib/hooks";
import { isActiveListing } from "@/lib/listing-status";

const ListingsMap = dynamic(() => import("@/components/map/listings-map"), {
    ssr: false,
    loading: () => (
        <div className="flex-1 bg-zinc-50 flex items-center justify-center">
            <p className="text-sm text-zinc-400">Loading map...</p>
        </div>
    ),
});

export default function MapPage() {
    const { listings, loading } = useListings();

    const activeListings = listings.filter((l) => isActiveListing(l.status));
    const mappedCount = activeListings.filter(
        (l) => l.latitude && l.longitude,
    ).length;

    return (
        <div className="flex flex-col h-screen">
            <div className="border-b border-zinc-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        href="/"
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-semibold">Map View</h1>
                        <p className="text-xs text-zinc-500">
                            {loading
                                ? "Loading..."
                                : `${mappedCount} of ${activeListings.length} listings on map`}
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex-1">
                <ListingsMap listings={activeListings} />
            </div>
        </div>
    );
}
