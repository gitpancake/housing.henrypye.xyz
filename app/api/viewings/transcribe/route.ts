import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { anthropic } from "@/lib/ai/anthropic-client";

export async function POST(request: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const transcript = body.transcript as string | undefined;
        const listingTitle = body.listingTitle as string | undefined;

        if (!transcript || !transcript.trim()) {
            return NextResponse.json(
                { error: "No transcript provided" },
                { status: 400 },
            );
        }

        const response = await anthropic.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1500,
            messages: [
                {
                    role: "user",
                    content: `You are helping someone take notes during an apartment viewing${listingTitle ? ` for "${listingTitle}"` : ""}.

Below is a raw voice transcript recorded during the viewing. Clean it up into concise, well-organized notes. Format them as bullet points grouped by topic. Focus on:
- Key observations about the unit (condition, layout, size feel)
- Likes and dislikes mentioned
- Questions raised or concerns noted
- Any specific details about appliances, fixtures, views, noise, light
- Overall impression/vibe

Keep it brief and scannable — these are reference notes for later comparison. Use plain text bullet points with - dashes. No headers or markdown formatting beyond simple dashes. Ignore filler words, false starts, and repetition.

TRANSCRIPT:
${transcript}`,
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
            { error: "Failed to process transcript" },
            { status: 500 },
        );
    }
}
