import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { uploadPhotos } from "@/lib/photos"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { photos: true },
  })

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 })
  }

  const formData = await request.formData()
  const files = formData.getAll("photos") as File[]

  const result = await uploadPhotos(files, id)
  if (result.error) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.status }
    )
  }

  const existingPhotos = (listing.photos as string[]) || []
  const updatedPhotos = [...existingPhotos, ...result.urls]

  await prisma.listing.update({
    where: { id },
    data: { photos: updatedPhotos },
  })

  return NextResponse.json({ photos: updatedPhotos })
}
