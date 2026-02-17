import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const BUCKET = "listing-photos"

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

  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 })
  }

  const uploadedUrls: string[] = []

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}` },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large: ${file.name} (max 10MB)` },
        { status: 400 }
      )
    }

    const ext = file.name.split(".").pop() || "jpg"
    const fileName = `${id}/${crypto.randomUUID()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error("Supabase upload error:", error)
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      )
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(fileName)

    uploadedUrls.push(urlData.publicUrl)
  }

  const existingPhotos = (listing.photos as string[]) || []
  const updatedPhotos = [...existingPhotos, ...uploadedUrls]

  await prisma.listing.update({
    where: { id },
    data: { photos: updatedPhotos },
  })

  return NextResponse.json({ photos: updatedPhotos })
}
