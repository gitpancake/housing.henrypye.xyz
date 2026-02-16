import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { geocodeAddress } from "@/lib/geocode";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const listing = await prisma.listing.findUnique({
        where: { id },
        include: {
            addedByUser: {
                select: { id: true, username: true, displayName: true },
            },
            scores: {
                include: {
                    user: {
                        select: { id: true, username: true, displayName: true },
                    },
                },
            },
        },
    });

    if (!listing) {
        return NextResponse.json(
            { error: "Listing not found" },
            { status: 404 },
        );
    }

    return NextResponse.json({ listing });
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    // Auto-geocode if address provided but no coordinates
    let latitude = data.latitude ? parseFloat(data.latitude) : null;
    let longitude = data.longitude ? parseFloat(data.longitude) : null;
    if (data.address && !latitude && !longitude) {
        const coords = await geocodeAddress(data.address);
        if (coords) {
            latitude = coords.lat;
            longitude = coords.lng;
        }
    }

    const listing = await prisma.listing.update({
        where: { id },
        data: {
            title: data.title,
            description: data.description,
            url: data.url,
            address: data.address,
            latitude,
            longitude,
            price: data.price ? parseInt(data.price) : null,
            bedrooms: data.bedrooms ? parseInt(data.bedrooms) : null,
            bathrooms: data.bathrooms ? parseInt(data.bathrooms) : null,
            petFriendly: data.petFriendly,
            squareFeet: data.squareFeet ? parseInt(data.squareFeet) : null,
            contactPhone: data.contactPhone || null,
            parking: data.parking || null,
            laundry: data.laundry || null,
            yearBuilt: data.yearBuilt ? parseInt(data.yearBuilt) : null,
            availableDate: data.availableDate || null,
            neighbourhood: data.neighbourhood || null,
            photos: data.photos,
            notes: data.notes,
            status: data.status,
            scrapedContent: data.scrapedContent ?? null,
        },
    });

    return NextResponse.json({ listing });
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.listing.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
