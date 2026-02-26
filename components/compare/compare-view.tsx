"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Columns3,
    X,
    Plus,
    Bed,
    Bath,
    Ruler,
    DollarSign,
    MapPin,
    Star,
    StickyNote,
    ImageIcon,
    Monitor,
} from "lucide-react";
import Link from "next/link";
import { scoreColor, scoreBg, getEffectiveScore } from "@/lib/scores";
import type { Listing, ScoreBreakdown } from "@/types";

interface CompareViewProps {
    listings: Listing[];
    users: { id: string; username: string; displayName: string }[];
}

export function CompareView({ listings, users }: CompareViewProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const selected = listings.filter((l) => selectedIds.includes(l.id));
    const available = listings.filter((l) => !selectedIds.includes(l.id));

    function addListing(id: string) {
        if (selectedIds.length < 4) {
            setSelectedIds([...selectedIds, id]);
        }
    }

    function removeListing(id: string) {
        setSelectedIds(selectedIds.filter((sid) => sid !== id));
    }

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
            {/* Desktop-only notice for mobile */}
            <div className="md:hidden">
                <Card>
                    <CardContent className="py-12 text-center">
                        <Monitor className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h2 className="text-lg font-semibold mb-2">
                            Desktop Only
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            Side-by-side comparison works best on a larger
                            screen. Open this page on your laptop or desktop.
                        </p>
                        <Link href="/listings">
                            <Button variant="outline">Back to Listings</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Desktop comparison */}
            <div className="hidden md:block space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Columns3 className="h-6 w-6" />
                            Compare Listings
                        </h1>
                        <p className="text-muted-foreground">
                            Select up to 4 listings to compare side by side
                        </p>
                    </div>
                </div>

                {/* Listing picker */}
                {available.length > 0 && selectedIds.length < 4 && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">
                                Add a listing to compare
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {available.map((l) => (
                                    <Button
                                        key={l.id}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addListing(l.id)}
                                        className="text-xs"
                                    >
                                        <Plus className="h-3 w-3 mr-1" />
                                        {l.title}
                                        {l.price
                                            ? ` — $${l.price.toLocaleString()}`
                                            : ""}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Comparison grid */}
                {selected.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Columns3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                                No listings selected
                            </h3>
                            <p className="text-muted-foreground">
                                Pick listings above to start comparing them side
                                by side.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {/* Header row with photos */}
                        <div
                            className={`grid gap-4`}
                            style={{
                                gridTemplateColumns: `repeat(${selected.length}, 1fr)`,
                            }}
                        >
                            {selected.map((listing) => {
                                const photos =
                                    (listing.photos as string[]) || [];
                                return (
                                    <Card
                                        key={listing.id}
                                        className="overflow-hidden"
                                    >
                                        {photos.length > 0 && (
                                            <div className="h-40 overflow-hidden">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={photos[0]}
                                                    alt={listing.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        )}
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <Link
                                                        href={`/listings/${listing.id}`}
                                                        className="font-semibold text-sm hover:underline line-clamp-2"
                                                    >
                                                        {listing.title}
                                                    </Link>
                                                    {listing.status ===
                                                        "FAVORITE" && (
                                                        <Badge
                                                            variant="default"
                                                            className="text-[10px] mt-1"
                                                        >
                                                            Favourite
                                                        </Badge>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="shrink-0 h-7 w-7"
                                                    onClick={() =>
                                                        removeListing(
                                                            listing.id,
                                                        )
                                                    }
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* Details comparison */}
                        <Card>
                            <CardContent className="p-0">
                                {/* Price */}
                                <CompareRow
                                    label="Price"
                                    icon={
                                        <DollarSign className="h-3.5 w-3.5" />
                                    }
                                    count={selected.length}
                                >
                                    {selected.map((l) => (
                                        <div
                                            key={l.id}
                                            className="text-lg font-bold"
                                        >
                                            {l.price
                                                ? `$${l.price.toLocaleString()}/mo`
                                                : "—"}
                                        </div>
                                    ))}
                                </CompareRow>

                                {/* Location */}
                                <CompareRow
                                    label="Location"
                                    icon={<MapPin className="h-3.5 w-3.5" />}
                                    count={selected.length}
                                >
                                    {selected.map((l) => (
                                        <div key={l.id} className="text-sm">
                                            {l.address || "—"}
                                            {l.neighbourhood && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px] mt-1 block w-fit"
                                                >
                                                    {l.neighbourhood}
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                                </CompareRow>

                                {/* Bedrooms */}
                                <CompareRow
                                    label="Bedrooms"
                                    icon={<Bed className="h-3.5 w-3.5" />}
                                    count={selected.length}
                                >
                                    {selected.map((l) => (
                                        <div
                                            key={l.id}
                                            className="text-sm font-medium"
                                        >
                                            {l.bedrooms != null
                                                ? `${l.bedrooms} bed`
                                                : "—"}
                                        </div>
                                    ))}
                                </CompareRow>

                                {/* Bathrooms */}
                                <CompareRow
                                    label="Bathrooms"
                                    icon={<Bath className="h-3.5 w-3.5" />}
                                    count={selected.length}
                                >
                                    {selected.map((l) => (
                                        <div
                                            key={l.id}
                                            className="text-sm font-medium"
                                        >
                                            {l.bathrooms != null
                                                ? `${l.bathrooms} bath`
                                                : "—"}
                                        </div>
                                    ))}
                                </CompareRow>

                                {/* Sq Ft */}
                                <CompareRow
                                    label="Size"
                                    icon={<Ruler className="h-3.5 w-3.5" />}
                                    count={selected.length}
                                >
                                    {selected.map((l) => (
                                        <div
                                            key={l.id}
                                            className="text-sm font-medium"
                                        >
                                            {l.squareFeet
                                                ? `${l.squareFeet} sq ft`
                                                : "—"}
                                        </div>
                                    ))}
                                </CompareRow>

                                {/* Pet Friendly */}
                                <CompareRow
                                    label="Pet Friendly"
                                    count={selected.length}
                                >
                                    {selected.map((l) => (
                                        <div key={l.id} className="text-sm">
                                            {l.petFriendly === true ? (
                                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs">
                                                    Yes
                                                </Badge>
                                            ) : l.petFriendly === false ? (
                                                <Badge
                                                    variant="destructive"
                                                    className="text-xs"
                                                >
                                                    No
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    Unknown
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </CompareRow>

                                {/* Parking */}
                                <CompareRow
                                    label="Parking"
                                    count={selected.length}
                                >
                                    {selected.map((l) => (
                                        <div key={l.id} className="text-sm">
                                            {l.parking || (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </CompareRow>

                                {/* Laundry */}
                                <CompareRow
                                    label="Laundry"
                                    count={selected.length}
                                >
                                    {selected.map((l) => (
                                        <div key={l.id} className="text-sm">
                                            {l.laundry || (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </CompareRow>

                                {/* Scores */}
                                <CompareRow
                                    label="Scores"
                                    icon={<Star className="h-3.5 w-3.5" />}
                                    count={selected.length}
                                    highlight
                                >
                                    {selected.map((l) => (
                                        <div key={l.id} className="space-y-1">
                                            {users.map((u) => {
                                                const score = l.scores.find(
                                                    (s) => s.user.id === u.id,
                                                );
                                                const val = score
                                                    ? getEffectiveScore(score)
                                                    : null;
                                                return (
                                                    <div
                                                        key={u.id}
                                                        className="flex items-center justify-between gap-2"
                                                    >
                                                        <span className="text-xs text-muted-foreground">
                                                            {u.displayName}
                                                        </span>
                                                        {val != null ? (
                                                            <span
                                                                className={`text-sm font-bold tabular-nums ${scoreColor(val)}`}
                                                            >
                                                                {val.toFixed(1)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">
                                                                —
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {(() => {
                                                const allScores = l.scores
                                                    .map(getEffectiveScore)
                                                    .filter(
                                                        (v): v is number =>
                                                            v != null,
                                                    );
                                                if (allScores.length === 0)
                                                    return null;
                                                const avg =
                                                    allScores.reduce(
                                                        (a, b) => a + b,
                                                        0,
                                                    ) / allScores.length;
                                                return (
                                                    <div
                                                        className={`rounded px-2 py-1 mt-1 text-center ${scoreBg(avg)}`}
                                                    >
                                                        <span
                                                            className={`text-sm font-bold ${scoreColor(avg)}`}
                                                        >
                                                            Avg:{" "}
                                                            {avg.toFixed(1)}/10
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    ))}
                                </CompareRow>

                                {/* AI Summary */}
                                <CompareRow
                                    label="AI Summary"
                                    count={selected.length}
                                >
                                    {selected.map((l) => (
                                        <div key={l.id} className="space-y-1">
                                            {l.scores.map(
                                                (s) =>
                                                    s.aiSummary && (
                                                        <div
                                                            key={s.id}
                                                            className="text-xs"
                                                        >
                                                            <span className="font-medium">
                                                                {
                                                                    s.user
                                                                        .displayName
                                                                }
                                                                :
                                                            </span>{" "}
                                                            <span className="text-muted-foreground">
                                                                {s.aiSummary}
                                                            </span>
                                                        </div>
                                                    ),
                                            )}
                                            {l.scores.every(
                                                (s) => !s.aiSummary,
                                            ) && (
                                                <span className="text-xs text-muted-foreground">
                                                    Not evaluated
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </CompareRow>

                                {/* Viewing Notes */}
                                <CompareRow
                                    label="Viewing Notes"
                                    icon={
                                        <StickyNote className="h-3.5 w-3.5" />
                                    }
                                    count={selected.length}
                                >
                                    {selected.map((l) => {
                                        const completedViewings =
                                            (l.viewings ?? []).filter(
                                                (v) =>
                                                    (v.viewingNotes ?? []).length > 0,
                                            );
                                        if (completedViewings.length === 0) {
                                            return (
                                                <div
                                                    key={l.id}
                                                    className="text-xs text-muted-foreground"
                                                >
                                                    No viewing notes yet
                                                </div>
                                            );
                                        }
                                        return (
                                            <div
                                                key={l.id}
                                                className="space-y-2"
                                            >
                                                {completedViewings.map((v) =>
                                                    (v.viewingNotes ?? []).map(
                                                        (note) => (
                                                            <div
                                                                key={note.id}
                                                                className="text-xs space-y-1"
                                                            >
                                                                <p className="font-medium">
                                                                    {note.title}
                                                                </p>
                                                                {note.notes && (
                                                                    <p className="text-muted-foreground line-clamp-3">
                                                                        {
                                                                            note.notes
                                                                        }
                                                                    </p>
                                                                )}
                                                                {(
                                                                    note.photos as string[]
                                                                ).length >
                                                                    0 && (
                                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                                        <ImageIcon className="h-3 w-3" />
                                                                        {
                                                                            (
                                                                                note.photos as string[]
                                                                            )
                                                                                .length
                                                                        }{" "}
                                                                        photos
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ),
                                                    ),
                                                )}
                                            </div>
                                        );
                                    })}
                                </CompareRow>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}

function CompareRow({
    label,
    icon,
    children,
    count,
    highlight,
}: {
    label: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    count: number;
    highlight?: boolean;
}) {
    return (
        <div
            className={`border-b last:border-0 ${highlight ? "bg-muted/30" : ""}`}
        >
            <div className="px-4 py-3">
                <div className="flex items-center gap-1.5 mb-2">
                    {icon}
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {label}
                    </span>
                </div>
                <div
                    className="grid gap-4"
                    style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}
