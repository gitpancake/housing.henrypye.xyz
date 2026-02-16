"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ListingForm } from "@/components/listings/listing-form";
import { PageWrapper } from "@/components/layout/page-wrapper";

export default function EditListingPage() {
    const params = useParams();
    const id = params.id as string;
    const [initialData, setInitialData] = useState<Record<
        string,
        unknown
    > | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/listings/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.listing) {
                    const l = data.listing;
                    setInitialData({
                        title: l.title,
                        url: l.url,
                        description: l.description,
                        address: l.address,
                        latitude: l.latitude,
                        longitude: l.longitude,
                        price: l.price != null ? String(l.price) : "",
                        bedrooms: l.bedrooms != null ? String(l.bedrooms) : "",
                        bathrooms:
                            l.bathrooms != null ? String(l.bathrooms) : "",
                        petFriendly: l.petFriendly ?? false,
                        squareFeet:
                            l.squareFeet != null ? String(l.squareFeet) : "",
                        contactPhone: l.contactPhone ?? "",
                        parking: l.parking ?? "",
                        laundry: l.laundry ?? "",
                        yearBuilt:
                            l.yearBuilt != null ? String(l.yearBuilt) : "",
                        availableDate: l.availableDate ?? "",
                        neighbourhood: l.neighbourhood ?? "",
                        photos: l.photos ?? [],
                        scrapedContent: l.scrapedContent ?? "",
                        notes: l.notes ?? "",
                    });
                }
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-muted-foreground">Loading listing...</p>
            </div>
        );
    }

    return (
        <PageWrapper>
            <ListingForm
                listingId={id}
                initialData={initialData ?? undefined}
            />
        </PageWrapper>
    );
}
