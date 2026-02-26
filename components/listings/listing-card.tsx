"use client";

import Link from "next/link";
import { MapPin, Bed, Bath } from "lucide-react";
import { scoreColor, getEffectiveScore } from "@/lib/scores";
import type { Listing } from "@/types";

interface ListingCardProps {
    listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
    const photo = (listing.photos as string[])?.[0];

    return (
        <Link href={`/listings/${listing.id}`}>
            <div
                className={`rounded-lg border border-zinc-200 bg-white overflow-hidden hover:shadow-sm transition-shadow h-full${
                    listing.status === "SELECTED" ? " ring-2 ring-green-500" : ""
                }${listing.status === "ARCHIVED" ? " opacity-60" : ""}`}
            >
                {photo && (
                    <div className="h-36 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={photo}
                            alt={listing.title}
                            className="h-full w-full object-cover"
                        />
                    </div>
                )}
                <div className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold line-clamp-2 text-zinc-900">
                            {listing.title}
                        </h3>
                        {listing.status === "FAVORITE" && (
                            <span className="shrink-0 text-[10px] font-medium text-amber-600">
                                fav
                            </span>
                        )}
                        {listing.status === "SELECTED" && (
                            <span className="shrink-0 text-[10px] font-medium text-green-600">
                                selected
                            </span>
                        )}
                        {listing.status === "ARCHIVED" && (
                            <span className="shrink-0 text-[10px] text-zinc-400">
                                archived
                            </span>
                        )}
                    </div>

                    {listing.address && (
                        <div className="flex items-center gap-1 text-xs text-zinc-500">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="line-clamp-1">
                                {listing.address}
                            </span>
                        </div>
                    )}

                    {listing.neighbourhood && (
                        <span className="inline-block text-[10px] text-zinc-500 border border-zinc-200 rounded px-1.5 py-0.5">
                            {listing.neighbourhood}
                        </span>
                    )}

                    <div className="flex flex-wrap gap-3 text-xs text-zinc-700">
                        {listing.price && (
                            <span className="font-mono">
                                ${listing.price.toLocaleString()}/mo
                            </span>
                        )}
                        {listing.bedrooms != null && (
                            <span className="flex items-center gap-1">
                                <Bed className="h-3 w-3 text-zinc-400" />
                                {listing.bedrooms} bed
                            </span>
                        )}
                        {listing.bathrooms != null && (
                            <span className="flex items-center gap-1">
                                <Bath className="h-3 w-3 text-zinc-400" />
                                {listing.bathrooms} bath
                            </span>
                        )}
                        {listing.petFriendly && (
                            <span className="text-zinc-500">Pet OK</span>
                        )}
                    </div>

                    {listing.scores.length > 0 && (
                        <div className="border-t border-zinc-100 pt-2.5 space-y-1">
                            {listing.scores.map((score) => {
                                const val = getEffectiveScore(score);
                                return (
                                    <div
                                        key={score.id}
                                        className="flex items-center justify-between text-xs"
                                    >
                                        <span className="text-zinc-500">
                                            {score.user.displayName}
                                        </span>
                                        {val != null ? (
                                            <span
                                                className={`font-mono font-semibold ${scoreColor(val)}`}
                                            >
                                                {val.toFixed(1)}/10
                                            </span>
                                        ) : (
                                            <span className="text-zinc-300 text-[10px]">
                                                Pending...
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="text-[10px] text-zinc-400 pt-0.5">
                        Added by {listing.addedByUser.displayName}
                    </div>
                </div>
            </div>
        </Link>
    );
}
