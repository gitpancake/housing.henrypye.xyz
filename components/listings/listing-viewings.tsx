"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, Plus } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import type { Viewing } from "@/types";

interface ListingViewingsProps {
    viewings: Viewing[];
    onViewingClick: (viewingId: string) => void;
}

export function ListingViewings({
    viewings,
    onViewingClick,
}: ListingViewingsProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        Viewings
                    </CardTitle>
                    <Link href="/calendar">
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
                                    new Date(a.scheduledAt).getTime() -
                                    new Date(b.scheduledAt).getTime(),
                            )
                            .map((v) => (
                                <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => onViewingClick(v.id)}
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
                                                    new Date(v.scheduledAt),
                                                    "EEE, MMM d 'at' h:mm a",
                                                )}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Added by {v.user.displayName}
                                                {v.notes && ` — ${v.notes}`}
                                            </p>
                                        </div>
                                    </div>
                                    {v.status !== "SCHEDULED" && (
                                        <Badge
                                            variant={
                                                v.status === "COMPLETED"
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
    );
}
