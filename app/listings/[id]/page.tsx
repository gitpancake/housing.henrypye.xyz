"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
    ArrowLeft,
    ExternalLink,
    MapPin,
    Bed,
    Bath,
    Ruler,
    RefreshCw,
    Star,
} from "lucide-react";
import dynamic from "next/dynamic";
import { PageWrapper } from "@/components/layout/page-wrapper";

const ListingMap = dynamic(
    () => import("@/components/map/listing-map-single"),
    {
        ssr: false,
        loading: () => (
            <div className="h-[250px] rounded-lg border bg-muted animate-pulse" />
        ),
    },
);

interface ScoreBreakdown {
    category: string;
    score: number;
    reasoning: string;
}

interface Score {
    id: string;
    aiOverallScore: number | null;
    aiBreakdown: ScoreBreakdown[] | null;
    aiSummary: string | null;
    manualOverrideScore: number | null;
    user: { id: string; username: string; displayName: string };
}

interface Listing {
    id: string;
    title: string;
    description: string;
    url: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    price: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    petFriendly: boolean | null;
    squareFeet: number | null;
    photos: string[];
    status: string;
    notes: string | null;
    addedByUser: { displayName: string };
    scores: Score[];
    createdAt: string;
}

function scoreColor(score: number): string {
    if (score >= 8) return "text-green-600 dark:text-green-400";
    if (score >= 6) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 4) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
}

function scoreBg(score: number): string {
    if (score >= 8) return "bg-green-100 dark:bg-green-900/30";
    if (score >= 6) return "bg-yellow-100 dark:bg-yellow-900/30";
    if (score >= 4) return "bg-orange-100 dark:bg-orange-900/30";
    return "bg-red-100 dark:bg-red-900/30";
}

export default function ListingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [listing, setListing] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);
    const [evaluating, setEvaluating] = useState(false);

    const id = params.id as string;

    function fetchListing() {
        fetch(`/api/listings/${id}`)
            .then((res) => res.json())
            .then((data) => setListing(data.listing))
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        fetchListing();
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    async function handleEvaluate() {
        setEvaluating(true);
        try {
            const res = await fetch(`/api/listings/${id}/evaluate`, {
                method: "POST",
            });
            if (!res.ok) throw new Error();
            toast.success("Evaluation complete!");
            fetchListing();
        } catch {
            toast.error("Evaluation failed. Please try again.");
        } finally {
            setEvaluating(false);
        }
    }

    async function handleOverride(scoreId: string, value: string) {
        const numVal = value === "" ? null : parseFloat(value);
        try {
            await fetch(`/api/listings/${id}/scores/${scoreId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ manualOverrideScore: numVal }),
            });
            toast.success("Score updated");
            fetchListing();
        } catch {
            toast.error("Failed to update score");
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    if (!listing) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-muted-foreground">Listing not found</p>
            </div>
        );
    }

    const photos = listing.photos as string[];

    return (
        <PageWrapper>
            <div className="mx-auto max-w-4xl px-4 py-8">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>

                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <div className="flex items-start justify-between gap-4">
                            <h1 className="text-2xl font-bold">
                                {listing.title}
                            </h1>
                            <Badge
                                variant={
                                    listing.status === "FAVORITE"
                                        ? "default"
                                        : "secondary"
                                }
                            >
                                {listing.status}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Added by {listing.addedByUser.displayName} on{" "}
                            {new Date(listing.createdAt).toLocaleDateString()}
                        </p>
                    </div>

                    {/* Photos */}
                    {photos.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {photos.map((url, i) => (
                                <div
                                    key={i}
                                    className="rounded-lg overflow-hidden border"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={url}
                                        alt={`Photo ${i + 1}`}
                                        className="h-48 w-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Quick stats */}
                    <div className="flex flex-wrap gap-4">
                        {listing.price && (
                            <div className="flex items-center gap-1.5 text-lg font-semibold">
                                <span>
                                    ${listing.price.toLocaleString()}/mo
                                </span>
                            </div>
                        )}
                        {listing.bedrooms != null && (
                            <div className="flex items-center gap-1.5">
                                <Bed className="h-4 w-4 text-muted-foreground" />
                                <span>{listing.bedrooms} bed</span>
                            </div>
                        )}
                        {listing.bathrooms != null && (
                            <div className="flex items-center gap-1.5">
                                <Bath className="h-4 w-4 text-muted-foreground" />
                                <span>{listing.bathrooms} bath</span>
                            </div>
                        )}
                        {listing.squareFeet && (
                            <div className="flex items-center gap-1.5">
                                <Ruler className="h-4 w-4 text-muted-foreground" />
                                <span>{listing.squareFeet} sq ft</span>
                            </div>
                        )}
                        {listing.petFriendly && (
                            <Badge variant="secondary">Pet Friendly</Badge>
                        )}
                    </div>

                    {/* URL */}
                    {listing.url && (
                        <a
                            href={listing.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                            View Original Listing
                        </a>
                    )}

                    {/* Location */}
                    {(listing.address ||
                        (listing.latitude && listing.longitude)) && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Location
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {listing.address && (
                                    <p className="text-sm">{listing.address}</p>
                                )}
                                {listing.latitude && listing.longitude && (
                                    <ListingMap
                                        latitude={listing.latitude}
                                        longitude={listing.longitude}
                                        title={listing.title}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Description */}
                    {listing.description && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Description
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap text-sm">
                                    {listing.description}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Scores */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Star className="h-4 w-4" />
                                    Scores
                                </CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleEvaluate}
                                    disabled={evaluating}
                                >
                                    <RefreshCw
                                        className={`h-4 w-4 mr-2 ${evaluating ? "animate-spin" : ""}`}
                                    />
                                    {evaluating
                                        ? "Evaluating..."
                                        : "Re-evaluate"}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {listing.scores.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground mb-4">
                                        Not yet evaluated
                                    </p>
                                    <Button
                                        onClick={handleEvaluate}
                                        disabled={evaluating}
                                    >
                                        {evaluating
                                            ? "Evaluating..."
                                            : "Run AI Evaluation"}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {listing.scores.map((score) => {
                                        const effectiveScore =
                                            score.manualOverrideScore ??
                                            score.aiOverallScore;
                                        const breakdown = (score.aiBreakdown ??
                                            []) as ScoreBreakdown[];
                                        return (
                                            <div key={score.id}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="font-semibold">
                                                        {score.user.displayName}
                                                    </h3>
                                                    {effectiveScore != null && (
                                                        <span
                                                            className={`text-2xl font-bold tabular-nums ${scoreColor(effectiveScore)}`}
                                                        >
                                                            {effectiveScore.toFixed(
                                                                1,
                                                            )}
                                                            /10
                                                        </span>
                                                    )}
                                                </div>

                                                {score.aiSummary && (
                                                    <p className="text-sm text-muted-foreground mb-3">
                                                        {score.aiSummary}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className="text-sm text-muted-foreground">
                                                        Manual Override:
                                                    </span>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        max={10}
                                                        step={0.5}
                                                        className="w-24"
                                                        placeholder="—"
                                                        defaultValue={
                                                            score.manualOverrideScore ??
                                                            ""
                                                        }
                                                        onBlur={(e) =>
                                                            handleOverride(
                                                                score.id,
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </div>

                                                {breakdown.length > 0 && (
                                                    <Accordion
                                                        type="single"
                                                        collapsible
                                                    >
                                                        <AccordionItem value="breakdown">
                                                            <AccordionTrigger className="text-sm">
                                                                Score Breakdown
                                                            </AccordionTrigger>
                                                            <AccordionContent>
                                                                <div className="space-y-2">
                                                                    {breakdown.map(
                                                                        (
                                                                            item,
                                                                            i,
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    i
                                                                                }
                                                                                className={`rounded-lg p-3 ${scoreBg(item.score)}`}
                                                                            >
                                                                                <div className="flex items-center justify-between mb-1">
                                                                                    <span className="text-sm font-medium">
                                                                                        {
                                                                                            item.category
                                                                                        }
                                                                                    </span>
                                                                                    <span
                                                                                        className={`text-sm font-bold tabular-nums ${scoreColor(item.score)}`}
                                                                                    >
                                                                                        {
                                                                                            item.score
                                                                                        }
                                                                                        /10
                                                                                    </span>
                                                                                </div>
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    {
                                                                                        item.reasoning
                                                                                    }
                                                                                </p>
                                                                            </div>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    </Accordion>
                                                )}

                                                <Separator className="mt-4" />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Notes */}
                    {listing.notes && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-wrap">
                                    {listing.notes}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </PageWrapper>
    );
}
