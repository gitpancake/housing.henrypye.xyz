import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { geocodeAddress } from "@/lib/geocode";
import { listingUpdateSchema } from "@/lib/validations";

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
    const raw = await request.json();
    const parsed = listingUpdateSchema.safeParse(raw);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Validation failed", details: parsed.error.flatten() },
            { status: 400 },
        );
    }
    const data = parsed.data;

    // Handle address + geocoding: only re-geocode when address actually changed
    if ("address" in data && data.address !== undefined) {
        if (!("latitude" in data) || !("longitude" in data)) {
            const existing = await prisma.listing.findUnique({
                where: { id },
                select: { address: true },
            });
            if (data.address && data.address !== existing?.address) {
                const coords = await geocodeAddress(data.address);
                if (coords) {
                    data.latitude = coords.lat;
                    data.longitude = coords.lng;
                }
            }
        }
    }

    const listing = await prisma.listing.update({
        where: { id },
        data,
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
