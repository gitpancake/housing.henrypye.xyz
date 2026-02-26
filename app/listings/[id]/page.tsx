"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
    Star,
    Phone,
    Home,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { ExpenseCalculator } from "@/components/listings/expense-calculator";
import { ViewingModeDialog } from "@/components/calendar/viewing-mode-dialog";
import { PhotoLightbox } from "@/components/ui/photo-lightbox";
import { calculateTakeHome } from "@/lib/tax";
import type { Listing, Viewing } from "@/types";
import { ListingScores } from "@/components/listings/listing-scores";
import { ListingViewings } from "@/components/listings/listing-viewings";

const ListingMap = dynamic(
    () => import("@/components/map/listing-map-single"),
    {
        ssr: false,
        loading: () => (
            <div className="h-[250px] rounded-lg border border-zinc-200 bg-zinc-50 animate-pulse" />
        ),
    },
);

export default function ListingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [listing, setListing] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);
    const [evaluating, setEvaluating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selecting, setSelecting] = useState(false);
    const [creatingCallTodo, setCreatingCallTodo] = useState(false);
    const [viewings, setViewings] = useState<Viewing[]>([]);
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
                <p className="text-sm text-zinc-400">Loading...</p>
            </div>
        );
    }

    if (!listing) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-sm text-zinc-400">Listing not found</p>
            </div>
        );
    }

    const photos = listing.photos as string[];

    return (
        <PageWrapper>
            <div className="max-w-4xl p-8">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => router.back()}
                        className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1"
                    >
                        <ArrowLeft className="h-3 w-3" />
                        Back
                    </button>
                    <div className="flex items-center gap-2">
                        <Link href={`/listings/${id}/edit`}>
                            <button className="rounded border border-zinc-200 px-2.5 py-1 text-xs text-zinc-700 hover:bg-zinc-50 transition-colors">
                                Edit
                            </button>
                        </Link>
                        {(listing.status === "ACTIVE" || listing.status === "FAVORITE") && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <button
                                        className="rounded bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-40"
                                        disabled={selecting}
                                    >
                                        {selecting ? "Selecting..." : "This is the one!"}
                                    </button>
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
                                    <button
                                        className="text-xs text-red-400 hover:text-red-500 transition-colors disabled:opacity-40"
                                        disabled={deleting}
                                    >
                                        {deleting ? "Deleting..." : "Delete"}
                                    </button>
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
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
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
                        <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Home className="h-4 w-4 text-green-600" />
                                <div>
                                    <p className="text-sm font-medium text-green-800">
                                        Your new home!
                                    </p>
                                    <p className="text-xs text-green-600">
                                        This listing has been selected as your chosen apartment.
                                    </p>
                                </div>
                            </div>
                            <button
                                className="text-xs text-zinc-500 hover:text-zinc-900 underline transition-colors"
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
                            </button>
                        </div>
                    )}

                    {/* Header */}
                    <div>
                        <div className="flex items-start justify-between gap-4">
                            <h1 className="text-lg font-semibold">
                                {listing.title}
                            </h1>
                            {listing.status !== "SELECTED" && (
                                <button
                                    className="shrink-0 p-1"
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
                                        className={`h-4 w-4 ${
                                            listing.status === "FAVORITE"
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-zinc-300"
                                        }`}
                                    />
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">
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
                                    className="rounded-lg overflow-hidden border border-zinc-200 cursor-pointer"
                                    onClick={() => {
                                        setLightboxIndex(i);
                                        setLightboxOpen(true);
                                    }}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={url}
                                        alt={`Photo ${i + 1}`}
                                        className="h-44 w-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Quick stats */}
                    <div className="flex flex-wrap gap-4 text-sm text-zinc-700">
                        {listing.price && (
                            <span className="font-mono font-semibold">
                                ${listing.price.toLocaleString()}/mo
                            </span>
                        )}
                        {listing.bedrooms != null && (
                            <span className="flex items-center gap-1">
                                <Bed className="h-3.5 w-3.5 text-zinc-400" />
                                {listing.bedrooms} bed
                            </span>
                        )}
                        {listing.bathrooms != null && (
                            <span className="flex items-center gap-1">
                                <Bath className="h-3.5 w-3.5 text-zinc-400" />
                                {listing.bathrooms} bath
                            </span>
                        )}
                        {listing.squareFeet && (
                            <span className="flex items-center gap-1">
                                <Ruler className="h-3.5 w-3.5 text-zinc-400" />
                                {listing.squareFeet} sq ft
                            </span>
                        )}
                        {listing.petFriendly && (
                            <span className="text-zinc-500">Pet Friendly</span>
                        )}
                    </div>

                    {/* URL + Phone */}
                    <div className="flex flex-wrap items-center gap-4">
                        {listing.url && (
                            <a
                                href={listing.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-900 underline"
                            >
                                <ExternalLink className="h-3 w-3" />
                                View Original Listing
                            </a>
                        )}
                        {listing.contactPhone && (
                            <a
                                href={`tel:${listing.contactPhone}`}
                                className="inline-flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-900 underline"
                            >
                                <Phone className="h-3 w-3" />
                                {listing.contactPhone}
                            </a>
                        )}
                        {listing.contactPhone && (
                            <button
                                onClick={handleCreateCallTodo}
                                disabled={creatingCallTodo}
                                className="text-xs text-zinc-500 hover:text-zinc-900 underline disabled:opacity-40"
                            >
                                {creatingCallTodo
                                    ? "Creating..."
                                    : "Add Call Todo"}
                            </button>
                        )}
                    </div>

                    {/* Location */}
                    {(listing.address ||
                        (listing.latitude && listing.longitude)) && (
                        <div className="rounded-lg border border-zinc-200 bg-white p-5">
                            <div className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-3 flex items-center gap-1.5">
                                <MapPin className="h-3 w-3" />
                                Location
                            </div>
                            {listing.address && (
                                <p className="text-sm text-zinc-700 mb-3">{listing.address}</p>
                            )}
                            {listing.latitude && listing.longitude && (
                                <ListingMap
                                    latitude={listing.latitude}
                                    longitude={listing.longitude}
                                    title={listing.title}
                                />
                            )}
                        </div>
                    )}

                    {/* Description */}
                    {listing.description && (
                        <div className="rounded-lg border border-zinc-200 bg-white p-5">
                            <div className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-3">
                                Description
                            </div>
                            <p className="whitespace-pre-wrap text-sm text-zinc-700">
                                {listing.description}
                            </p>
                        </div>
                    )}

                    {/* Scores */}
                    <ListingScores
                        listingId={id}
                        scores={listing.scores}
                        evaluating={evaluating}
                        onEvaluate={handleEvaluate}
                        onRefresh={fetchListing}
                    />

                    {/* Viewings */}
                    <ListingViewings
                        viewings={viewings}
                        onViewingClick={(viewingId) => {
                            setSelectedViewingId(viewingId);
                            setViewingModeOpen(true);
                        }}
                    />

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
                        <div className="rounded-lg border border-zinc-200 bg-white p-5">
                            <div className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-3">
                                Notes
                            </div>
                            <p className="text-sm text-zinc-700 whitespace-pre-wrap">
                                {listing.notes}
                            </p>
                        </div>
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
