import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const viewings = await prisma.viewing.findMany({
        include: {
            listing: {
                select: {
                    id: true,
                    title: true,
                    address: true,
                    price: true,
                    url: true,
                },
            },
            user: {
                select: { id: true, username: true, displayName: true },
            },
        },
        orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json({ viewings });
}

export async function POST(request: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    if (!data.listingId || !data.scheduledAt) {
        return NextResponse.json(
            { error: "listingId and scheduledAt are required" },
            { status: 400 },
        );
    }

    const viewing = await prisma.viewing.create({
        data: {
            listingId: data.listingId,
            userId: session.userId,
            scheduledAt: new Date(data.scheduledAt),
            notes: data.notes || null,
        },
        include: {
            listing: {
                select: {
                    id: true,
                    title: true,
                    address: true,
                    price: true,
                    url: true,
                },
            },
            user: {
                select: { id: true, username: true, displayName: true },
            },
        },
    });

    return NextResponse.json({ viewing }, { status: 201 });
}
