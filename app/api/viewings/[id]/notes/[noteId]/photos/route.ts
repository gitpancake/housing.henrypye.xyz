import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { uploadPhotos } from "@/lib/photos"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id, noteId } = await params

  const note = await prisma.viewingNote.findUnique({
    where: { id: noteId },
    select: { photos: true },
  })

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 })
  }

  const formData = await request.formData()
  const files = formData.getAll("photos") as File[]

  const result = await uploadPhotos(files, `viewing-notes/${id}/${noteId}`)
  if (result.error) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.status }
    )
  }

  const existingPhotos = (note.photos as string[]) || []
  const updatedPhotos = [...existingPhotos, ...result.urls]

  const updated = await prisma.viewingNote.update({
    where: { id: noteId },
    data: { photos: updatedPhotos },
  })

  return NextResponse.json({ note: updated })
}
