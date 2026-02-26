import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Archive the currently selected listing and keep everything else archived
    await prisma.listing.updateMany({
        where: { status: "SELECTED" },
        data: { status: "ARCHIVED" },
    });

    return NextResponse.json({ success: true });
}
