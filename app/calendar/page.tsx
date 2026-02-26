"use client";

import { useEffect, useState } from "react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { CalendarView } from "@/components/calendar/calendar-view";
import type { TodoData } from "@/components/calendar/todo-dialog";
import { useCurrentUser, useListings } from "@/lib/hooks";

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

export default function CalendarPage() {
    const { userId: currentUserId } = useCurrentUser();
    const { listings: allListings, loading: listingsLoading } = useListings();
    const [viewings, setViewings] = useState<ViewingData[]>([]);
    const [todos, setTodos] = useState<TodoData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch("/api/viewings").then((r) => r.json()),
            fetch("/api/todos").then((r) => r.json()),
        ])
            .then(([viewingsData, todosData]) => {
                setViewings(viewingsData.viewings || []);
                setTodos(todosData.todos || []);
            })
            .finally(() => setLoading(false));
    }, []);

    const listings = allListings.map((l) => ({
        id: l.id,
        title: l.title,
        address: l.address,
        price: l.price,
    }));

    if (loading || listingsLoading) {
        return (
            <PageWrapper>
                <div className="flex min-h-[50vh] items-center justify-center">
                    <p className="text-muted-foreground">Loading calendar...</p>
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            <div className="p-4 md:p-6 max-w-6xl mx-auto">
                <CalendarView
                    initialViewings={viewings}
                    initialTodos={todos}
                    listings={listings}
                    currentUserId={currentUserId}
                />
            </div>
        </PageWrapper>
    );
}
