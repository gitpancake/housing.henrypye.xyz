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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    ArrowLeft,
    ExternalLink,
    MapPin,
    Bed,
    Bath,
    Ruler,
    RefreshCw,
    Star,
    Pencil,
    Trash2,
    CalendarDays,
    Clock,
    Plus,
    Phone,
    Home,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { ExpenseCalculator } from "@/components/listings/expense-calculator";
import { ViewingModeDialog } from "@/components/calendar/viewing-mode-dialog";
import { PhotoLightbox } from "@/components/ui/photo-lightbox";
import { calculateTakeHome } from "@/lib/tax";
import { scoreColor, scoreBg } from "@/lib/scores";

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

interface ViewingItem {
    id: string;
    scheduledAt: string;
    notes: string | null;
    status: string;
    user: { id: string; displayName: string };
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
    contactPhone: string | null;
    parking: string | null;
    laundry: string | null;
    photos: string[];
    status: string;
    notes: string | null;
    addedByUser: { displayName: string };
    scores: Score[];
    createdAt: string;
}

export default function ListingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [listing, setListing] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);
    const [evaluating, setEvaluating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selecting, setSelecting] = useState(false);
    const [creatingCallTodo, setCreatingCallTodo] = useState(false);
    const [viewings, setViewings] = useState<ViewingItem[]>([]);
    const [selectedViewingId, setSelectedViewingId] = useState<string | null>(
        null,
    );
    const [viewingModeOpen, setViewingModeOpen] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [combinedMonthlyTakeHome, setCombinedMonthlyTakeHome] = useState<
        number | null
    >(null);

    const id = params.id as string;

    function fetchListing() {
        fetch(`/api/listings/${id}`)
            .then((res) => res.json())
            .then((data) => setListing(data.listing))
            .finally(() => setLoading(false));
    }

    function fetchViewings() {
        fetch("/api/viewings")
            .then((res) => res.json())
            .then((data) => {
                const all = data.viewings || [];
                setViewings(
                    all.filter(
                        (v: { listingId: string }) => v.listingId === id,
                    ),
                );
            });
    }

    function fetchBudget() {
        fetch("/api/budget")
            .then((res) => res.json())
            .then((data) => {
                const users = data.users || [];
                let total = 0;
                for (const u of users) {
                    if (u.preferences?.annualSalary) {
                        total += calculateTakeHome(
                            u.preferences.annualSalary,
                        ).monthlyTakeHome;
                    }
                }
                setCombinedMonthlyTakeHome(total > 0 ? total : null);
            });
    }

    useEffect(() => {
        fetchListing();
        fetchViewings();
        fetchBudget();
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

    async function handleDelete() {
        setDeleting(true);
        try {
            const res = await fetch(`/api/listings/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error();
            toast.success("Listing deleted");
            router.push("/listings");
        } catch {
            toast.error("Failed to delete listing");
            setDeleting(false);
        }
    }

    async function handleSelect() {
        setSelecting(true);
        try {
            const res = await fetch(`/api/listings/${id}/select`, {
                method: "POST",
            });
            if (!res.ok) throw new Error();
            toast.success("Congratulations! You've found your new home!");
            setListing({ ...listing!, status: "SELECTED" });
        } catch {
            toast.error("Failed to select listing");
        } finally {
            setSelecting(false);
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

    async function handleCreateCallTodo() {
        if (!listing?.contactPhone) return;
        setCreatingCallTodo(true);
        try {
            const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const res = await fetch("/api/todos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: `Call ${listing.title} — ${listing.contactPhone}`,
                    description: `Follow up on listing: ${listing.title}${listing.address ? ` at ${listing.address}` : ""}`,
                    scheduledAt: deadline.toISOString(),
                    durationMin: 15,
                    link: listing.url || undefined,
                }),
            });
            if (!res.ok) throw new Error();
            toast.success("Call todo created! Check your Tasks page.");
        } catch {
            toast.error("Failed to create todo");
        } finally {
            setCreatingCallTodo(false);
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
                <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div className="flex items-center gap-2">
                        <Link href={`/listings/${id}/edit`}>
                            <Button variant="outline" size="sm">
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        </Link>
                        {(listing.status === "ACTIVE" || listing.status === "FAVORITE") && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        disabled={selecting}
                                    >
                                        <Home className="h-4 w-4 mr-2" />
                                        {selecting ? "Selecting..." : "This is the one!"}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            Select this as your new home?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will mark &quot;{listing.title}&quot; as your
                                            chosen home. All other active listings will be
                                            archived. Their data (viewings, notes, scores)
                                            will be preserved but they&apos;ll move out of
                                            your active view.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleSelect}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            Yes, this is home!
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                        {listing.status !== "SELECTED" && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        disabled={deleting}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        {deleting ? "Deleting..." : "Delete"}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            Delete this listing?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete &quot;
                                            {listing.title}&quot; and all associated
                                            scores. This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>
                                            Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete}>
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Selected banner */}
                    {listing.status === "SELECTED" && (
                        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Home className="h-5 w-5 text-green-600" />
                                <div>
                                    <p className="font-semibold text-green-800 dark:text-green-200">
                                        Your new home!
                                    </p>
                                    <p className="text-sm text-green-600 dark:text-green-400">
                                        This listing has been selected as your chosen apartment.
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground"
                                onClick={async () => {
                                    const res = await fetch(
                                        `/api/listings/${id}`,
                                        {
                                            method: "PUT",
                                            headers: {
                                                "Content-Type":
                                                    "application/json",
                                            },
                                            body: JSON.stringify({
                                                status: "FAVORITE",
                                            }),
                                        },
                                    );
                                    if (res.ok) {
                                        setListing({
                                            ...listing,
                                            status: "FAVORITE",
                                        });
                                        toast.success(
                                            "Selection undone. Other listings remain archived.",
                                        );
                                    }
                                }}
                            >
                                Undo selection
                            </Button>
                        </div>
                    )}

                    {/* Header */}
                    <div>
                        <div className="flex items-start justify-between gap-4">
                            <h1 className="text-2xl font-bold">
                                {listing.title}
                            </h1>
                            {listing.status !== "SELECTED" && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0"
                                    onClick={async () => {
                                        const newStatus =
                                            listing.status === "FAVORITE"
                                                ? "ACTIVE"
                                                : "FAVORITE";
                                        const res = await fetch(
                                            `/api/listings/${id}`,
                                            {
                                                method: "PUT",
                                                headers: {
                                                    "Content-Type":
                                                        "application/json",
                                                },
                                                body: JSON.stringify({
                                                    status: newStatus,
                                                }),
                                            },
                                        );
                                        if (res.ok) {
                                            setListing({
                                                ...listing,
                                                status: newStatus,
                                            });
                                            toast.success(
                                                newStatus === "FAVORITE"
                                                    ? "Added to favourites"
                                                    : "Removed from favourites",
                                            );
                                        }
                                    }}
                                >
                                    <Star
                                        className={`h-5 w-5 ${
                                            listing.status === "FAVORITE"
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-muted-foreground"
                                        }`}
                                    />
                                </Button>
                            )}
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
                                <button
                                    key={i}
                                    type="button"
                                    className="rounded-lg overflow-hidden border cursor-pointer"
                                    onClick={() => {
                                        setLightboxIndex(i);
                                        setLightboxOpen(true);
                                    }}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={url}
                                        alt={`Photo ${i + 1}`}
                                        className="h-48 w-full object-cover"
                                    />
                                </button>
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

                    {/* URL + Phone */}
                    <div className="flex flex-wrap items-center gap-4">
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
                        {listing.contactPhone && (
                            <a
                                href={`tel:${listing.contactPhone}`}
                                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                            >
                                <Phone className="h-3.5 w-3.5" />
                                {listing.contactPhone}
                            </a>
                        )}
                        {listing.contactPhone && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCreateCallTodo}
                                disabled={creatingCallTodo}
                            >
                                <Phone className="h-4 w-4 mr-2" />
                                {creatingCallTodo
                                    ? "Creating..."
                                    : "Add Call Todo"}
                            </Button>
                        )}
                    </div>

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

                    {/* Viewings */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4" />
                                    Viewings
                                </CardTitle>
                                <Link href={`/calendar`}>
                                    <Button variant="outline" size="sm">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Schedule
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {viewings.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No viewings scheduled for this listing.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {viewings
                                        .sort(
                                            (a, b) =>
                                                new Date(
                                                    a.scheduledAt,
                                                ).getTime() -
                                                new Date(
                                                    b.scheduledAt,
                                                ).getTime(),
                                        )
                                        .map((v) => (
                                            <button
                                                key={v.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedViewingId(v.id);
                                                    setViewingModeOpen(true);
                                                }}
                                                className={`w-full flex items-center justify-between rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors cursor-pointer ${
                                                    v.status === "CANCELLED"
                                                        ? "opacity-50"
                                                        : ""
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {format(
                                                                new Date(
                                                                    v.scheduledAt,
                                                                ),
                                                                "EEE, MMM d 'at' h:mm a",
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Added by{" "}
                                                            {v.user.displayName}
                                                            {v.notes &&
                                                                ` — ${v.notes}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                {v.status !== "SCHEDULED" && (
                                                    <Badge
                                                        variant={
                                                            v.status ===
                                                            "COMPLETED"
                                                                ? "secondary"
                                                                : "destructive"
                                                        }
                                                    >
                                                        {v.status}
                                                    </Badge>
                                                )}
                                            </button>
                                        ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Expense Calculator */}
                    <ExpenseCalculator
                        rent={listing.price}
                        monthlyTakeHome={combinedMonthlyTakeHome}
                        hasParking={
                            !!listing.parking &&
                            listing.parking.toLowerCase() !== "no" &&
                            listing.parking.toLowerCase() !== "none"
                        }
                    />

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
            <ViewingModeDialog
                open={viewingModeOpen}
                onClose={() => setViewingModeOpen(false)}
                viewingId={selectedViewingId}
                listingTitle={listing?.title || ""}
            />
            <PhotoLightbox
                photos={photos}
                initialIndex={lightboxIndex}
                open={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
            />
        </PageWrapper>
    );
}
