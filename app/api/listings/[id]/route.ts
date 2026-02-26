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

    // Build update object with only provided fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: Record<string, any> = {};

    if ("title" in data) update.title = data.title;
    if ("description" in data) update.description = data.description;
    if ("url" in data) update.url = data.url;
    if ("price" in data) update.price = data.price ? parseInt(data.price) : null;
    if ("bedrooms" in data) update.bedrooms = data.bedrooms ? parseInt(data.bedrooms) : null;
    if ("bathrooms" in data) update.bathrooms = data.bathrooms ? parseInt(data.bathrooms) : null;
    if ("petFriendly" in data) update.petFriendly = data.petFriendly;
    if ("squareFeet" in data) update.squareFeet = data.squareFeet ? parseInt(data.squareFeet) : null;
    if ("contactPhone" in data) update.contactPhone = data.contactPhone || null;
    if ("parking" in data) update.parking = data.parking || null;
    if ("laundry" in data) update.laundry = data.laundry || null;
    if ("yearBuilt" in data) update.yearBuilt = data.yearBuilt ? parseInt(data.yearBuilt) : null;
    if ("availableDate" in data) update.availableDate = data.availableDate || null;
    if ("neighbourhood" in data) update.neighbourhood = data.neighbourhood || null;
    if ("photos" in data) update.photos = data.photos;
    if ("notes" in data) update.notes = data.notes;
    if ("status" in data) update.status = data.status;
    if ("scrapedContent" in data) update.scrapedContent = data.scrapedContent ?? null;

    // Handle address + geocoding: only re-geocode when address actually changed
    if ("address" in data) {
        update.address = data.address;

        if ("latitude" in data && "longitude" in data) {
            update.latitude = data.latitude ? parseFloat(data.latitude) : null;
            update.longitude = data.longitude ? parseFloat(data.longitude) : null;
        } else {
            // Check if address changed before geocoding
            const existing = await prisma.listing.findUnique({
                where: { id },
                select: { address: true },
            });
            if (data.address && data.address !== existing?.address) {
                const coords = await geocodeAddress(data.address);
                if (coords) {
                    update.latitude = coords.lat;
                    update.longitude = coords.lng;
                }
            }
        }
    } else if ("latitude" in data || "longitude" in data) {
        if ("latitude" in data) update.latitude = data.latitude ? parseFloat(data.latitude) : null;
        if ("longitude" in data) update.longitude = data.longitude ? parseFloat(data.longitude) : null;
    }

    const listing = await prisma.listing.update({
        where: { id },
        data: update,
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
