import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
        return NextResponse.json(
            { error: "Listing not found" },
            { status: 404 },
        );
    }

    await prisma.$transaction([
        prisma.listing.update({
            where: { id },
            data: { status: "SELECTED" },
        }),
        prisma.listing.updateMany({
            where: {
                id: { not: id },
                status: { in: ["ACTIVE", "FAVORITE"] },
            },
            data: { status: "ARCHIVED" },
        }),
    ]);

    return NextResponse.json({ success: true });
}
