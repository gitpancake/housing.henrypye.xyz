"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, DollarSign, User } from "lucide-react";

interface Score {
    id: string;
    aiOverallScore: number | null;
    manualOverrideScore: number | null;
    user: {
        id: string;
        username: string;
        displayName: string;
    };
}

interface ListingCardProps {
    listing: {
        id: string;
        title: string;
        address: string;
        price: number | null;
        bedrooms: number | null;
        bathrooms: number | null;
        petFriendly: boolean | null;
        neighbourhood?: string | null;
        photos: string[];
        status: string;
        addedByUser: {
            displayName: string;
        };
        scores: Score[];
        createdAt: string;
    };
}

function getScore(score: Score): number | null {
    return score.manualOverrideScore ?? score.aiOverallScore;
}

function scoreColor(score: number): string {
    if (score >= 8) return "text-green-600 dark:text-green-400";
    if (score >= 6) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 4) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
}

export function ListingCard({ listing }: ListingCardProps) {
    const photo = (listing.photos as string[])?.[0];

    return (
        <Link href={`/listings/${listing.id}`}>
            <Card className={`overflow-hidden hover:shadow-md transition-shadow h-full${listing.status === "SELECTED" ? " ring-2 ring-green-500" : ""}`}>
                {photo && (
                    <div className="h-40 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={photo}
                            alt={listing.title}
                            className="h-full w-full object-cover"
                        />
                    </div>
                )}
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base line-clamp-2">
                            {listing.title}
                        </CardTitle>
                        {listing.status === "FAVORITE" && (
                            <Badge variant="default" className="shrink-0">
                                Fav
                            </Badge>
                        )}
                        {listing.status === "SELECTED" && (
                            <Badge className="shrink-0 bg-green-600 text-white">
                                Selected
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {listing.address && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="line-clamp-1">
                                {listing.address}
                            </span>
                        </div>
                    )}
                    {listing.neighbourhood && (
                        <Badge variant="outline" className="text-xs w-fit">
                            {listing.neighbourhood}
                        </Badge>
                    )}

                    <div className="flex flex-wrap gap-3 text-sm">
                        {listing.price && (
                            <span className="flex items-center gap-1">
                                <DollarSign className="h-3.5 w-3.5" />
                                {listing.price.toLocaleString()}/mo
                            </span>
                        )}
                        {listing.bedrooms != null && (
                            <span className="flex items-center gap-1">
                                <Bed className="h-3.5 w-3.5" />
                                {listing.bedrooms} bed
                            </span>
                        )}
                        {listing.bathrooms != null && (
                            <span className="flex items-center gap-1">
                                <Bath className="h-3.5 w-3.5" />
                                {listing.bathrooms} bath
                            </span>
                        )}
                        {listing.petFriendly && (
                            <Badge variant="secondary" className="text-xs">
                                Pet OK
                            </Badge>
                        )}
                    </div>

                    {listing.scores.length > 0 && (
                        <div className="border-t pt-3 space-y-1">
                            {listing.scores.map((score) => {
                                const val = getScore(score);
                                return (
                                    <div
                                        key={score.id}
                                        className="flex items-center justify-between text-sm"
                                    >
                                        <span className="flex items-center gap-1.5 text-muted-foreground">
                                            <User className="h-3 w-3" />
                                            {score.user.displayName}
                                        </span>
                                        {val != null ? (
                                            <span
                                                className={`font-semibold tabular-nums ${scoreColor(val)}`}
                                            >
                                                {val.toFixed(1)}/10
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">
                                                Pending...
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="text-xs text-muted-foreground pt-1">
                        Added by {listing.addedByUser.displayName}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
