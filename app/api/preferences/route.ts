import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const preferences = await prisma.userPreferences.findUnique({
    where: { userId: session.userId },
  })

  return NextResponse.json({ preferences })
}

export async function PUT(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const data = await request.json()

  const preferences = await prisma.userPreferences.upsert({
    where: { userId: session.userId },
    update: {
      naturalLight: data.naturalLight,
      bedroomsMin: data.bedroomsMin,
      bedroomsMax: data.bedroomsMax,
      outdoorsAccess: data.outdoorsAccess,
      publicTransport: data.publicTransport,
      budgetMin: data.budgetMin,
      budgetMax: data.budgetMax,
      petFriendly: data.petFriendly,
      moveInDateStart: data.moveInDateStart ? new Date(data.moveInDateStart) : null,
      moveInDateEnd: data.moveInDateEnd ? new Date(data.moveInDateEnd) : null,
      laundryInUnit: data.laundryInUnit,
      parking: data.parking,
      quietNeighbourhood: data.quietNeighbourhood,
      modernFinishes: data.modernFinishes,
      storageSpace: data.storageSpace,
      gymAmenities: data.gymAmenities,
      customDesires: data.customDesires ?? [],
      onboardingComplete: true,
    },
    create: {
      userId: session.userId,
      naturalLight: data.naturalLight,
      bedroomsMin: data.bedroomsMin,
      bedroomsMax: data.bedroomsMax,
      outdoorsAccess: data.outdoorsAccess,
      publicTransport: data.publicTransport,
      budgetMin: data.budgetMin,
      budgetMax: data.budgetMax,
      petFriendly: data.petFriendly,
      moveInDateStart: data.moveInDateStart ? new Date(data.moveInDateStart) : null,
      moveInDateEnd: data.moveInDateEnd ? new Date(data.moveInDateEnd) : null,
      laundryInUnit: data.laundryInUnit,
      parking: data.parking,
      quietNeighbourhood: data.quietNeighbourhood,
      modernFinishes: data.modernFinishes,
      storageSpace: data.storageSpace,
      gymAmenities: data.gymAmenities,
      customDesires: data.customDesires ?? [],
      onboardingComplete: true,
    },
  })

  return NextResponse.json({ preferences })
}
