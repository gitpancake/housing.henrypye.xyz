"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Phone, MapPin } from "lucide-react";
import { format, addMinutes, parse } from "date-fns";

interface AreaListing {
    id: string;
    title: string;
    address: string;
    contactPhone?: string | null;
    price?: number | null;
}

interface PlanViewingDayDialogProps {
    open: boolean;
    onClose: () => void;
    onScheduled: () => void;
    area: string;
    listings: AreaListing[];
}

export function PlanViewingDayDialog({
    open,
    onClose,
    onScheduled,
    area,
    listings,
}: PlanViewingDayDialogProps) {
    const [date, setDate] = useState(
        format(new Date(), "yyyy-MM-dd"),
    );
    const [startTime, setStartTime] = useState("10:00");
    const [interval, setInterval] = useState("30");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(
        new Set(listings.map((l) => l.id)),
    );
    const [submitting, setSubmitting] = useState(false);

    const selectedCount = selectedIds.size;
    const intervalMin = parseInt(interval);

    function toggleListing(id: string) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    function getPreview() {
        if (selectedCount === 0) return null;
        const start = parse(startTime, "HH:mm", new Date());
        const end = addMinutes(start, (selectedCount - 1) * intervalMin);
        return `${selectedCount} viewing${selectedCount !== 1 ? "s" : ""}, ${format(start, "h:mma").toLowerCase()} \u2013 ${format(end, "h:mma").toLowerCase()}`;
    }

    async function handleSubmit() {
        if (selectedCount === 0) return;
        setSubmitting(true);

        try {
            const selectedListings = listings.filter((l) =>
                selectedIds.has(l.id),
            );

            // Create viewings with staggered times
            const baseDate = parse(
                `${date} ${startTime}`,
                "yyyy-MM-dd HH:mm",
                new Date(),
            );

            for (let i = 0; i < selectedListings.length; i++) {
                const scheduledAt = addMinutes(baseDate, i * intervalMin);
                await fetch("/api/viewings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        listingId: selectedListings[i].id,
                        scheduledAt: scheduledAt.toISOString(),
                        notes: `Viewing day: ${area}`,
                    }),
                });
            }

            // Create a summary todo
            const description = selectedListings
                .map((l, i) => {
                    const time = format(
                        addMinutes(baseDate, i * intervalMin),
                        "h:mma",
                    ).toLowerCase();
                    return `${time} \u2014 ${l.title}${l.contactPhone ? ` (${l.contactPhone})` : ""}`;
                })
                .join("\n");

            await fetch("/api/todos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: `Viewing day: ${area} (${selectedCount} place${selectedCount !== 1 ? "s" : ""})`,
                    description,
                    scheduledAt: baseDate.toISOString(),
                    durationMin: selectedCount * intervalMin,
                    location: area,
                }),
            });

            toast.success(
                `Scheduled ${selectedCount} viewing${selectedCount !== 1 ? "s" : ""} in ${area}`,
            );
            onScheduled();
            onClose();
        } catch {
            toast.error("Failed to schedule viewings");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Plan Viewing Day — {area}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <Label>Date</Label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Start Time</Label>
                            <Input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Interval</Label>
                            <Select
                                value={interval}
                                onValueChange={setInterval}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="15">15 min</SelectItem>
                                    <SelectItem value="30">30 min</SelectItem>
                                    <SelectItem value="45">45 min</SelectItem>
                                    <SelectItem value="60">60 min</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Select listings to visit</Label>
                        <div className="space-y-2 max-h-60 overflow-y-auto rounded-md border p-3">
                            {listings.map((listing) => (
                                <label
                                    key={listing.id}
                                    className="flex items-start gap-3 cursor-pointer hover:bg-muted/50 rounded p-1.5 -m-1.5"
                                >
                                    <Checkbox
                                        checked={selectedIds.has(listing.id)}
                                        onCheckedChange={() =>
                                            toggleListing(listing.id)
                                        }
                                        className="mt-0.5"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">
                                            {listing.title}
                                            {listing.price && (
                                                <span className="text-muted-foreground font-normal ml-2">
                                                    ${listing.price.toLocaleString()}/mo
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                            <span className="flex items-center gap-1 truncate">
                                                <MapPin className="h-3 w-3 shrink-0" />
                                                {listing.address}
                                            </span>
                                            {listing.contactPhone && (
                                                <span className="flex items-center gap-1 shrink-0">
                                                    <Phone className="h-3 w-3" />
                                                    {listing.contactPhone}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {getPreview() && (
                        <p className="text-sm text-muted-foreground">
                            {getPreview()}
                        </p>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting || selectedCount === 0}
                        >
                            {submitting ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : null}
                            Schedule {selectedCount} Viewing
                            {selectedCount !== 1 ? "s" : ""}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
