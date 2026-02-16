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

    return NextResponse.json({ listing }, { status: 201 });
}
