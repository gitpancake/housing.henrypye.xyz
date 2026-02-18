"use client";

import { useEffect, useState } from "react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { CalendarView } from "@/components/calendar/calendar-view";
import type { TodoData } from "@/components/calendar/todo-dialog";

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

interface ListingOption {
    id: string;
    title: string;
    address: string;
    price: number | null;
}

export default function CalendarPage() {
    const [viewings, setViewings] = useState<ViewingData[]>([]);
    const [todos, setTodos] = useState<TodoData[]>([]);
    const [listings, setListings] = useState<ListingOption[]>([]);
    const [currentUserId, setCurrentUserId] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch("/api/viewings").then((r) => r.json()),
            fetch("/api/listings").then((r) => r.json()),
            fetch("/api/auth/me").then((r) => r.json()),
            fetch("/api/todos").then((r) => r.json()),
        ])
            .then(([viewingsData, listingsData, meData, todosData]) => {
                setViewings(viewingsData.viewings || []);
                setTodos(todosData.todos || []);
                setListings(
                    (listingsData.listings || []).map(
                        (l: {
                            id: string;
                            title: string;
                            address: string;
                            price: number | null;
                        }) => ({
                            id: l.id,
                            title: l.title,
                            address: l.address,
                            price: l.price,
                        }),
                    ),
                );
                setCurrentUserId(meData.user?.id || "");
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
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
