import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { geocodeAddress } from "@/lib/geocode";
import { listingCreateSchema } from "@/lib/validations";

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const listings = await prisma.listing.findMany({
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
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ listings });
}

export async function POST(request: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const raw = await request.json();
    const parsed = listingCreateSchema.safeParse(raw);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Validation failed", details: parsed.error.flatten() },
            { status: 400 },
        );
    }
    const data = parsed.data;

    // Auto-geocode if address provided but no coordinates
    let latitude = data.latitude ?? null;
    let longitude = data.longitude ?? null;
    if (data.address && !latitude && !longitude) {
        const coords = await geocodeAddress(data.address);
        if (coords) {
            latitude = coords.lat;
            longitude = coords.lng;
        }
    }

    const listing = await prisma.listing.create({
        data: {
            addedBy: session.userId,
            title: data.title,
            description: data.description,
            url: data.url,
            address: data.address,
            latitude,
            longitude,
            price: data.price ?? null,
            bedrooms: data.bedrooms ?? null,
            bathrooms: data.bathrooms ?? null,
            petFriendly: data.petFriendly ?? null,
            squareFeet: data.squareFeet ?? null,
            contactPhone: data.contactPhone ?? null,
            parking: data.parking ?? null,
            laundry: data.laundry ?? null,
            yearBuilt: data.yearBuilt ?? null,
            availableDate: data.availableDate ?? null,
            neighbourhood: data.neighbourhood ?? null,
            photos: data.photos,
            scrapedContent: data.scrapedContent ?? null,
            notes: data.notes ?? null,
        },
        include: {
            addedByUser: {
                select: { id: true, username: true, displayName: true },
            },
        },
    });

    // Auto-create a "Call" todo if the listing has a phone number
    if (data.contactPhone) {
        const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await prisma.todo.create({
            data: {
                userId: session.userId,
                title: `Call ${listing.title} — ${data.contactPhone}`,
                description: `Follow up on listing: ${listing.title}${listing.address ? ` at ${listing.address}` : ""}`,
                scheduledAt: deadline,
                durationMin: 15,
                link: listing.url || null,
            },
        });
    }

    return NextResponse.json({ listing }, { status: 201 });
}
