import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { anthropic } from "@/lib/ai/anthropic-client";

export async function POST(request: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const audioFile = formData.get("audio") as File | null;
        const listingTitle = formData.get("listingTitle") as string | null;

        if (!audioFile) {
            return NextResponse.json(
                { error: "No audio file provided" },
                { status: 400 },
            );
        }

        // Convert audio to base64 for Claude
        const arrayBuffer = await audioFile.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString("base64");

        // Audio content block — the API supports audio/webm but the SDK types
        // only enumerate image/pdf/text media types, so we cast to satisfy TS.
        const audioBlock = {
            type: "document" as const,
            source: {
                type: "base64" as const,
                media_type: "audio/webm",
                data: base64Audio,
            },
        };

        const response = await anthropic.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1500,
            messages: [
                {
                    role: "user",
                    content: [
                        // Audio media_type is supported by the API but not yet typed in the SDK
                        audioBlock as never,
                        {
                            type: "text" as const,
                            text: `You are helping someone take notes during an apartment viewing${listingTitle ? ` for "${listingTitle}"` : ""}.

Listen to this audio recording made during the viewing and produce concise, well-organized notes. Format them as bullet points grouped by topic. Focus on:
- Key observations about the unit (condition, layout, size feel)
- Likes and dislikes mentioned
- Questions raised or concerns noted
- Any specific details about appliances, fixtures, views, noise, light
- Overall impression/vibe

Keep it brief and scannable — these are reference notes for later comparison. Use plain text bullet points with - dashes. No headers or markdown formatting beyond simple dashes.`,
                        },
                    ],
                },
            ],
        });

        const notes = response.content
            .filter((block) => block.type === "text")
            .map((block) => (block.type === "text" ? block.text : ""))
            .join("");

        return NextResponse.json({ notes });
    } catch (err) {
        console.error("Transcription error:", err);
        return NextResponse.json(
            { error: "Failed to process audio" },
            { status: 500 },
        );
    }
}
