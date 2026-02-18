"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    CalendarDays,
    MapPin,
    Clock,
    ExternalLink,
    Bed,
    Bath,
    DollarSign,
    Star,
    Navigation,
    ArrowDown,
} from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";
import Link from "next/link";
import dynamic from "next/dynamic";

const ViewingRouteMap = dynamic(
    () => import("@/components/map/viewing-route-map"),
    {
        ssr: false,
        loading: () => (
            <div className="h-[200px] rounded-lg border bg-muted animate-pulse" />
        ),
    },
);

interface ViewingScore {
    aiOverallScore: number | null;
    manualOverrideScore: number | null;
    user: { id: string; displayName: string };
}

interface ViewingListing {
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
    scores: ViewingScore[];
}

interface UpcomingViewing {
    id: string;
    scheduledAt: string | Date;
    notes: string | null;
    status: string;
    listing: ViewingListing;
    user: { id: string; displayName: string };
}

interface ViewingDayBannerProps {
    viewings: UpcomingViewing[];
}

function scoreColor(score: number): string {
    if (score >= 8) return "text-green-600 dark:text-green-400";
    if (score >= 6) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 4) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
}

function getDirectionsUrl(from: string, to: string): string {
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=transit`;
}

export function ViewingDayBanner({ viewings }: ViewingDayBannerProps) {
    if (viewings.length === 0) return null;

    const todayViewings = viewings.filter((v) =>
        isToday(new Date(v.scheduledAt)),
    );
    const tomorrowViewings = viewings.filter((v) =>
        isTomorrow(new Date(v.scheduledAt)),
    );

    if (todayViewings.length === 0 && tomorrowViewings.length === 0)
        return null;

    return (
        <div className="space-y-4">
            {todayViewings.length > 0 && (
                <ViewingDayCard
                    label="Today's Viewings"
                    highlight
                    viewings={todayViewings}
                />
            )}
            {tomorrowViewings.length > 0 && (
                <ViewingDayCard
                    label="Tomorrow's Viewings"
                    highlight={todayViewings.length === 0}
                    viewings={tomorrowViewings}
                />
            )}
        </div>
    );
}

function ViewingDayCard({
    label,
    highlight,
    viewings,
}: {
    label: string;
    highlight: boolean;
    viewings: UpcomingViewing[];
}) {
    return (
        <Card
            className={highlight ? "border-primary/50 bg-primary/[0.02]" : ""}
        >
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    {label}
                    <Badge variant="secondary" className="text-xs">
                        {viewings.length} viewing
                        {viewings.length !== 1 ? "s" : ""}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Route map */}
                {(() => {
                    const stops = viewings
                        .filter(
                            (v) =>
                                v.listing.latitude != null &&
                                v.listing.longitude != null,
                        )
                        .map((v) => ({
                            label: v.listing.title,
                            time: format(new Date(v.scheduledAt), "h:mm a"),
                            lat: v.listing.latitude!,
                            lng: v.listing.longitude!,
                        }));
                    if (stops.length < 2) return null;
                    return <ViewingRouteMap stops={stops} />;
                })()}

                {viewings.map((viewing, idx) => {
                    const dt = new Date(viewing.scheduledAt);
                    const listing = viewing.listing;
                    const photos = (listing.photos as string[]) || [];
                    const nextViewing = viewings[idx + 1];

                    return (
                        <div key={viewing.id}>
                            <div className="rounded-lg border p-4 space-y-3">
                                {/* Time + title header */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Clock className="h-4 w-4 text-primary shrink-0" />
                                            <span className="font-semibold text-sm">
                                                {format(dt, "h:mm a")}
                                            </span>
                                        </div>
                                        <Link
                                            href={`/listings/${listing.id}`}
                                            className="font-semibold hover:underline line-clamp-1"
                                        >
                                            {listing.title}
                                        </Link>
                                    </div>
                                    {photos.length > 0 && (
                                        <div className="rounded-lg overflow-hidden border shrink-0 w-16 h-16">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={photos[0]}
                                                alt={listing.title}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Key details */}
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                    {listing.price && (
                                        <span className="flex items-center gap-1">
                                            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                                            ${listing.price.toLocaleString()}/mo
                                        </span>
                                    )}
                                    {listing.bedrooms != null && (
                                        <span className="flex items-center gap-1">
                                            <Bed className="h-3.5 w-3.5 text-muted-foreground" />
                                            {listing.bedrooms} bed
                                        </span>
                                    )}
                                    {listing.bathrooms != null && (
                                        <span className="flex items-center gap-1">
                                            <Bath className="h-3.5 w-3.5 text-muted-foreground" />
                                            {listing.bathrooms} bath
                                        </span>
                                    )}
                                    {listing.neighbourhood && (
                                        <Badge
                                            variant="secondary"
                                            className="text-xs"
                                        >
                                            {listing.neighbourhood}
                                        </Badge>
                                    )}
                                </div>

                                {/* Address + directions */}
                                {listing.address && (
                                    <div className="flex items-start gap-2 text-sm">
                                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                        <span className="flex-1">
                                            {listing.address}
                                        </span>
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.address)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs shrink-0"
                                            >
                                                <Navigation className="h-3 w-3 mr-1" />
                                                Directions
                                            </Button>
                                        </a>
                                    </div>
                                )}

                                {/* Scores */}
                                {listing.scores.length > 0 && (
                                    <div className="flex items-center gap-3">
                                        <Star className="h-3.5 w-3.5 text-muted-foreground" />
                                        {listing.scores.map((s) => {
                                            const val =
                                                s.manualOverrideScore ??
                                                s.aiOverallScore;
                                            if (val == null) return null;
                                            return (
                                                <span
                                                    key={s.user.id}
                                                    className="text-xs"
                                                >
                                                    <span className="text-muted-foreground">
                                                        {s.user.displayName}:
                                                    </span>{" "}
                                                    <span
                                                        className={`font-bold ${scoreColor(val)}`}
                                                    >
                                                        {val.toFixed(1)}
                                                    </span>
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Viewing notes */}
                                {viewing.notes && (
                                    <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1.5">
                                        {viewing.notes}
                                    </p>
                                )}

                                {/* Quick actions */}
                                <div className="flex gap-2">
                                    {listing.url && (
                                        <a
                                            href={listing.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs"
                                            >
                                                <ExternalLink className="h-3 w-3 mr-1" />
                                                Listing
                                            </Button>
                                        </a>
                                    )}
                                    <Link href={`/listings/${listing.id}`}>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs"
                                        >
                                            Details
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            {/* Directions between viewings */}
                            {nextViewing &&
                                listing.address &&
                                nextViewing.listing.address && (
                                    <div className="flex items-center justify-center py-2">
                                        <a
                                            href={getDirectionsUrl(
                                                listing.address,
                                                nextViewing.listing.address,
                                            )}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                                        >
                                            <ArrowDown className="h-3 w-3" />
                                            Get directions to next viewing
                                            <ArrowDown className="h-3 w-3" />
                                        </a>
                                    </div>
                                )}
                        </div>
                    );
                })}

                {/* Added by info */}
                <p className="text-xs text-muted-foreground text-center pt-1">
                    Added by{" "}
                    {[...new Set(viewings.map((v) => v.user.displayName))].join(
                        " & ",
                    )}
                </p>
            </CardContent>
        </Card>
    );
}
