import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateRecommendations } from "@/lib/ai/recommend-areas";
import { preferencesSchema } from "@/lib/validations";

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await prisma.userPreferences.findUnique({
        where: { userId: session.userId },
    });

    return NextResponse.json({ preferences });
}

export async function PUT(request: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const raw = await request.json();
    const parsed = preferencesSchema.safeParse(raw);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Validation failed", details: parsed.error.flatten() },
            { status: 400 },
        );
    }
    const data = parsed.data;

    const prefsData = {
        naturalLight: data.naturalLight,
        bedroomsMin: data.bedroomsMin,
        bedroomsMax: data.bedroomsMax,
        outdoorsAccess: data.outdoorsAccess,
        publicTransport: data.publicTransport,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        petFriendly: data.petFriendly,
        moveInDateStart: data.moveInDateStart
            ? new Date(data.moveInDateStart)
            : null,
        moveInDateEnd: data.moveInDateEnd
            ? new Date(data.moveInDateEnd)
            : null,
        laundryInUnit: data.laundryInUnit,
        parking: data.parking,
        quietNeighbourhood: data.quietNeighbourhood,
        modernFinishes: data.modernFinishes,
        storageSpace: data.storageSpace,
        gymAmenities: data.gymAmenities,
        customDesires: data.customDesires,
        onboardingComplete: true,
    };

    const preferences = await prisma.userPreferences.upsert({
        where: { userId: session.userId },
        update: prefsData,
        create: { userId: session.userId, ...prefsData },
    });

    // Fire-and-forget: regenerate area recommendations in the background
    generateRecommendations(session.userId).catch((err) =>
        console.error("Background recommendation generation failed:", err),
    );

    return NextResponse.json({ preferences });
}
