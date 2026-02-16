import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

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

    const data = await request.json();

    const listing = await prisma.listing.create({
        data: {
            addedBy: session.userId,
            title: data.title,
            description: data.description || "",
            url: data.url || "",
            address: data.address || "",
            latitude: data.latitude ? parseFloat(data.latitude) : null,
            longitude: data.longitude ? parseFloat(data.longitude) : null,
            price: data.price ? parseInt(data.price) : null,
            bedrooms: data.bedrooms ? parseInt(data.bedrooms) : null,
            bathrooms: data.bathrooms ? parseInt(data.bathrooms) : null,
            petFriendly: data.petFriendly ?? null,
            squareFeet: data.squareFeet ? parseInt(data.squareFeet) : null,
            contactPhone: data.contactPhone || null,
            parking: data.parking || null,
            laundry: data.laundry || null,
            yearBuilt: data.yearBuilt ? parseInt(data.yearBuilt) : null,
            availableDate: data.availableDate || null,
            neighbourhood: data.neighbourhood || null,
            photos: data.photos || [],
            scrapedContent: data.scrapedContent || null,
            notes: data.notes || null,
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
