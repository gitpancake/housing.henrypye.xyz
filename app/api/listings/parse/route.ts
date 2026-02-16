import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { parseListing } from "@/lib/ai/parse-listing"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { text } = await request.json()

  if (!text || typeof text !== "string" || text.trim().length < 20) {
    return NextResponse.json(
      { error: "Please paste more listing content to parse" },
      { status: 400 },
    )
  }

  try {
    const parsed = await parseListing(text)
    return NextResponse.json({ parsed })
  } catch {
    return NextResponse.json(
      { error: "Failed to parse listing. Please try again." },
      { status: 500 },
    )
  }
}
