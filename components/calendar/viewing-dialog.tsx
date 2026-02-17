"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Trash2, Camera, X, Loader2, ImageIcon } from "lucide-react";
import { format } from "date-fns";

interface ListingOption {
    id: string;
    title: string;
    address: string;
    price: number | null;
}

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
    };
    user: { id: string; displayName: string };
}

interface ViewingDialogProps {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    listings: ListingOption[];
    viewing?: ViewingData | null;
    defaultDate?: string;
    defaultListingId?: string;
}

export function ViewingDialog({
    open,
    onClose,
    onSaved,
    listings,
    viewing,
    defaultDate,
    defaultListingId,
}: ViewingDialogProps) {
    const isEditing = !!viewing;

    const [listingId, setListingId] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("12:00");
    const [notes, setNotes] = useState("");
    const [status, setStatus] = useState("SCHEDULED");
    const [saving, setSaving] = useState(false);

    // Photo state
    const [photos, setPhotos] = useState<string[]>([]);
    const [loadingPhotos, setLoadingPhotos] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadCount, setUploadCount] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (viewing) {
            setListingId(viewing.listingId);
            const dt = new Date(viewing.scheduledAt);
            setDate(format(dt, "yyyy-MM-dd"));
            setTime(format(dt, "HH:mm"));
            setNotes(viewing.notes || "");
            setStatus(viewing.status);
        } else {
            setListingId(defaultListingId || "");
            setDate(defaultDate || format(new Date(), "yyyy-MM-dd"));
            setTime("12:00");
            setNotes("");
            setStatus("SCHEDULED");
            setPhotos([]);
        }
    }, [viewing, defaultDate, defaultListingId, open]);

    const fetchPhotos = useCallback(async (lid: string) => {
        setLoadingPhotos(true);
        try {
            const res = await fetch(`/api/listings/${lid}`);
            if (!res.ok) return;
            const data = await res.json();
            setPhotos((data.listing?.photos as string[]) || []);
        } catch {
            // silently fail — photos are supplementary
        } finally {
            setLoadingPhotos(false);
        }
    }, []);

    // Fetch photos when dialog opens in edit mode
    useEffect(() => {
        if (open && isEditing && viewing?.listingId) {
            fetchPhotos(viewing.listingId);
        }
        if (!open) {
            setPhotos([]);
        }
    }, [open, isEditing, viewing?.listingId, fetchPhotos]);

    async function handleUploadPhotos(files: FileList) {
        if (!listingId || files.length === 0) return;

        setUploading(true);
        setUploadCount(files.length);

        const formData = new FormData();
        for (const file of Array.from(files)) {
            formData.append("photos", file);
        }

        try {
            const res = await fetch(`/api/listings/${listingId}/photos`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Upload failed");
            }

            const data = await res.json();
            setPhotos(data.photos);
            toast.success(
                `${files.length} photo${files.length > 1 ? "s" : ""} uploaded`,
            );
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to upload photos",
            );
        } finally {
            setUploading(false);
            setUploadCount(0);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    async function handleRemovePhoto(url: string) {
        if (!listingId) return;

        const updatedPhotos = photos.filter((p) => p !== url);
        try {
            const listingRes = await fetch(`/api/listings/${listingId}`);
            if (!listingRes.ok) throw new Error();
            const listingData = await listingRes.json();
            const listing = listingData.listing;

            const res = await fetch(`/api/listings/${listingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...listing,
                    photos: updatedPhotos,
                }),
            });

            if (!res.ok) throw new Error();
            setPhotos(updatedPhotos);
            toast.success("Photo removed");
        } catch {
            toast.error("Failed to remove photo");
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!listingId || !date || !time) {
            toast.error("Please select a listing, date, and time");
            return;
        }

        setSaving(true);
        const scheduledAt = new Date(`${date}T${time}:00`).toISOString();

        try {
            const url = isEditing
                ? `/api/viewings/${viewing.id}`
                : "/api/viewings";
            const res = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ listingId, scheduledAt, notes, status }),
            });

            if (!res.ok) throw new Error();
            toast.success(isEditing ? "Viewing updated" : "Viewing scheduled");
            onSaved();
            onClose();
        } catch {
            toast.error("Failed to save viewing");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!viewing) return;
        try {
            const res = await fetch(`/api/viewings/${viewing.id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error();
            toast.success("Viewing deleted");
            onSaved();
            onClose();
        } catch {
            toast.error("Failed to delete viewing");
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Edit Viewing" : "Schedule a Viewing"}
                    </DialogTitle>
                </DialogHeader>

                {isEditing && viewing && (
                    <p className="text-sm text-muted-foreground">
                        Added by {viewing.user.displayName}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Listing</Label>
                        <Select value={listingId} onValueChange={setListingId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a listing" />
                            </SelectTrigger>
                            <SelectContent>
                                {listings.map((l) => (
                                    <SelectItem key={l.id} value={l.id}>
                                        <span className="truncate">
                                            {l.title}
                                        </span>
                                        {l.address && (
                                            <span className="text-muted-foreground ml-2 text-xs">
                                                {l.address}
                                            </span>
                                        )}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Time</Label>
                            <Input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                            />
                        </div>
                    </div>

                    {isEditing && (
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SCHEDULED">
                                        Scheduled
                                    </SelectItem>
                                    <SelectItem value="COMPLETED">
                                        Completed
                                    </SelectItem>
                                    <SelectItem value="CANCELLED">
                                        Cancelled
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Notes (optional)</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Contact info, buzzer code, parking details..."
                            rows={2}
                        />
                    </div>

                    {/* Photos section — only shown when editing */}
                    {isEditing && listingId && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="flex items-center gap-2">
                                        <ImageIcon className="h-4 w-4" />
                                        Photos
                                        {photos.length > 0 && (
                                            <Badge
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                {photos.length}
                                            </Badge>
                                        )}
                                    </Label>
                                    <div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            multiple
                                            className="hidden"
                                            onChange={(e) => {
                                                if (
                                                    e.target.files &&
                                                    e.target.files.length > 0
                                                ) {
                                                    handleUploadPhotos(
                                                        e.target.files,
                                                    );
                                                }
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={uploading}
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                        >
                                            {uploading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Uploading {uploadCount}...
                                                </>
                                            ) : (
                                                <>
                                                    <Camera className="h-4 w-4 mr-2" />
                                                    Add Photos
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {loadingPhotos ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                    </div>
                                ) : photos.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        {photos.map((url, i) => (
                                            <div
                                                key={i}
                                                className="relative group rounded-lg overflow-hidden border"
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={url}
                                                    alt={`Photo ${i + 1}`}
                                                    className="h-24 w-full object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleRemovePhoto(url)
                                                    }
                                                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground text-center py-3">
                                        No photos yet. Take some during your
                                        viewing!
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    <div className="flex items-center justify-between pt-2">
                        {isEditing ? (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            Delete this viewing?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will remove the viewing from
                                            the shared calendar.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>
                                            Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDelete}
                                        >
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        ) : (
                            <div />
                        )}

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving
                                    ? "Saving..."
                                    : isEditing
                                      ? "Update"
                                      : "Schedule"}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
