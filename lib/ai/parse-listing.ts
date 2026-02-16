import { anthropic } from "./anthropic-client";

export interface ParsedListing {
  title: string;
  address: string;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  petFriendly: boolean | null;
  description: string;
}

export async function parseListing(rawText: string): Promise<ParsedListing> {
  const prompt = `You are extracting structured data from a rental listing that was copy-pasted from a website like apartments.com, rentals.ca, craigslist, etc.

RAW LISTING TEXT:
${rawText.slice(0, 6000)}

Extract the following fields. If a field cannot be determined, use null.

RULES:
- title: The property/building name (e.g. "The Pendrell", "Dogwood"). If no name, use the street address.
- address: Full street address including city and province/postal code if available.
- price: Monthly rent in dollars as a number (no $ sign). If a range is listed, use the LOWEST price.
- bedrooms: Number of bedrooms. If a range (e.g. "1-3 bd"), use the LOWEST number.
- bathrooms: Number of bathrooms. If a range, use the LOWEST number.
- squareFeet: Square footage as a number. If a range, use the LOWEST number.
- petFriendly: true if pets are allowed, false if explicitly not allowed, null if not mentioned.
- description: Write a clean 2-4 sentence summary of the listing covering: location highlights, key amenities, building features, and any move-in specials. Do NOT include boilerplate, navigation text, or legal disclaimers.

Respond with ONLY valid JSON in this exact format:
{
  "title": "The Pendrell",
  "address": "1770 Pendrell St, Vancouver, BC V6G 0C5",
  "price": 2495,
  "bedrooms": 1,
  "bathrooms": 1,
  "squareFeet": 487,
  "petFriendly": true,
  "description": "Modern apartment in Vancouver's West End with rooftop terrace, dog park, and fitness facilities. 1 month free rent promotion available."
}`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => {
      if (block.type === "text") return block.text;
      return "";
    })
    .join("");

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response");
  }

  return JSON.parse(jsonMatch[0]) as ParsedListing;
}
