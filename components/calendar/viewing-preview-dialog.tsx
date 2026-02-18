"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    ExternalLink,
    MapPin,
    Clock,
    Pencil,
    StickyNote,
    Camera,
    ImageIcon,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface ViewingData {
    id: string;
    listingId: string;
    scheduledAt: string;
    notes: string | null;
    status: string;
    listing: {
        id: string;
        title: string;
        address: string;
        price: number | null;
        url: string;
    };
    user: { id: string; displayName: string };
}

interface ViewingNoteData {
    id: string;
    title: string;
    notes: string | null;
    photos: string[];
}

interface ViewingPreviewDialogProps {
    open: boolean;
    onClose: () => void;
    onEdit: () => void;
    onStartViewing: () => void;
    viewing: ViewingData | null;
}

function statusBadge(status: string) {
    switch (status) {
        case "SCHEDULED":
            return <Badge variant="secondary">Scheduled</Badge>;
        case "COMPLETED":
            return <Badge variant="default">Completed</Badge>;
        case "CANCELLED":
            return <Badge variant="destructive">Cancelled</Badge>;
        default:
            return null;
    }
}

export function ViewingPreviewDialog({
    open,
    onClose,
    onEdit,
    onStartViewing,
    viewing,
}: ViewingPreviewDialogProps) {
    const [viewingNotes, setViewingNotes] = useState<ViewingNoteData[]>([]);
    const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

    const fetchViewingNotes = useCallback(async () => {
        if (!viewing) return;
        try {
            const res = await fetch(`/api/viewings/${viewing.id}/notes`);
            if (!res.ok) return;
            const data = await res.json();
            setViewingNotes(data.notes || []);
        } catch {
            // silently fail
        }
    }, [viewing]);

    useEffect(() => {
        if (open && viewing) {
            fetchViewingNotes();
        }
        if (!open) {
            setViewingNotes([]);
            setExpandedNoteId(null);
        }
    }, [open, viewing, fetchViewingNotes]);

    if (!viewing) return null;

    const dt = new Date(viewing.scheduledAt);

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-sm max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg leading-tight">
                        {viewing.listing.title}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    {/* Price + Status */}
                    <div className="flex items-center justify-between">
                        {viewing.listing.price ? (
                            <span className="text-lg font-semibold">
                                ${viewing.listing.price.toLocaleString()}/mo
                            </span>
                        ) : (
                            <span className="text-sm text-muted-foreground">
                                No price listed
                            </span>
                        )}
                        {statusBadge(viewing.status)}
                    </div>

                    {/* Address */}
                    {viewing.listing.address && (
                        <div className="flex items-start gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <span>{viewing.listing.address}</span>
                        </div>
                    )}

                    {/* Time */}
                    <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{format(dt, "EEEE, MMMM d 'at' h:mm a")}</span>
                    </div>

                    {/* Added by */}
                    <p className="text-xs text-muted-foreground">
                        Added by {viewing.user.displayName}
                    </p>

                    {/* Notes */}
                    {viewing.notes && (
                        <div className="flex items-start gap-2 text-sm bg-muted/50 rounded-lg p-3">
                            <StickyNote className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <span className="whitespace-pre-wrap">
                                {viewing.notes}
                            </span>
                        </div>
                    )}

                    {/* Unit notes from viewing mode */}
                    {viewingNotes.length > 0 && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Units Viewed ({viewingNotes.length})
                                </p>
                                {viewingNotes.map((note) => {
                                    const photos =
                                        (note.photos as string[]) || [];
                                    const isExpanded =
                                        expandedNoteId === note.id;
                                    return (
                                        <div
                                            key={note.id}
                                            className="rounded-lg border overflow-hidden"
                                        >
                                            <button
                                                type="button"
                                                className="w-full flex items-center justify-between p-2.5 hover:bg-muted/50 transition-colors"
                                                onClick={() =>
                                                    setExpandedNoteId(
                                                        isExpanded
                                                            ? null
                                                            : note.id,
                                                    )
                                                }
                                            >
                                                <div className="text-left">
                                                    <p className="text-sm font-medium">
                                                        {note.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {photos.length} photo
                                                        {photos.length !== 1
                                                            ? "s"
                                                            : ""}
                                                        {note.notes &&
                                                            " · has notes"}
                                                    </p>
                                                </div>
                                                {isExpanded ? (
                                                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                                                )}
                                            </button>

                                            {isExpanded && (
                                                <div className="px-2.5 pb-2.5 space-y-2">
                                                    <Separator />
                                                    {note.notes && (
                                                        <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-2">
                                                            {note.notes}
                                                        </p>
                                                    )}
                                                    {photos.length > 0 && (
                                                        <div className="grid grid-cols-3 gap-1.5">
                                                            {photos.map(
                                                                (url, i) => (
                                                                    <div
                                                                        key={i}
                                                                        className="rounded-lg overflow-hidden border"
                                                                    >
                                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                        <img
                                                                            src={
                                                                                url
                                                                            }
                                                                            alt={`${note.title} photo ${i + 1}`}
                                                                            className="h-20 w-full object-cover"
                                                                        />
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-2 pt-1">
                        <Button
                            onClick={onStartViewing}
                            className="w-full"
                            type="button"
                        >
                            <Camera className="h-4 w-4 mr-2" />
                            {viewingNotes.length > 0
                                ? "Continue Viewing"
                                : "Start Viewing"}
                        </Button>

                        {viewing.listing.url && (
                            <a
                                href={viewing.listing.url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    type="button"
                                >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View Original Listing
                                </Button>
                            </a>
                        )}

                        <Link href={`/listings/${viewing.listing.id}`}>
                            <Button
                                variant="outline"
                                className="w-full"
                                type="button"
                            >
                                View Listing Details
                            </Button>
                        </Link>

                        <Button
                            onClick={onEdit}
                            variant="outline"
                            className="w-full"
                            type="button"
                        >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Viewing
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
