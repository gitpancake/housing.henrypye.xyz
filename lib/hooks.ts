"use client";

import { useEffect, useState } from "react";
import type { Listing } from "@/types";

export function useCurrentUser() {
    const [userId, setUserId] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/auth/me")
            .then((r) => r.json())
            .then((data) => setUserId(data.user?.id || ""))
            .finally(() => setLoading(false));
    }, []);

    return { userId, loading };
}

export function useListings() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);

    function fetchListings() {
        return fetch("/api/listings")
            .then((res) => res.json())
            .then((data) => setListings(data.listings || []))
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        fetchListings();
    }, []);

    return { listings, loading, refetch: fetchListings };
}
