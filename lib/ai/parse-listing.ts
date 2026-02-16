import { anthropic } from "./anthropic-client";

export interface ParsedListing {
    title: string;
    address: string;
    price: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    squareFeet: number | null;
    petFriendly: boolean | null;
    contactPhone: string | null;
    parking: string | null;
    laundry: string | null;
    yearBuilt: number | null;
    availableDate: string | null;
    neighbourhood: string | null;
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
- contactPhone: Phone number for the property/landlord/contact person if listed. Include the full number with area code (e.g. "(778) 655-3101"). null if not found.
- parking: Short description of parking situation (e.g. "Underground, fee not included", "1 spot included", "Street parking only"). null if not mentioned.
- laundry: One of "In-suite", "On-site", "None", or null if not mentioned. "In-suite" means washer/dryer in the unit. "On-site" means shared laundry facilities in the building.
- yearBuilt: The year the building was built as a number (e.g. 2020). null if not mentioned.
- availableDate: When the unit is available (e.g. "Available Now", "Mar 1 2026"). null if not mentioned.
- neighbourhood: The neighbourhood/area name (e.g. "West End", "Kitsilano", "Mount Pleasant"). null if not clear.
- description: Write a clean 2-4 sentence summary of the listing covering: location highlights, key amenities, building features, and any move-in specials. Do NOT include boilerplate, navigation text, or legal disclaimers.

Respond with ONLY valid JSON in this exact format:
{
  "title": "Shoreline West End",
  "address": "1763 Comox Street, Vancouver, BC",
  "price": 1925,
  "bedrooms": 0,
  "bathrooms": 1,
  "squareFeet": 420,
  "petFriendly": null,
  "contactPhone": "(778) 655-3101",
  "parking": "Underground, fee not included",
  "laundry": "In-suite",
  "yearBuilt": 2020,
  "availableDate": "Available Now",
  "neighbourhood": "West End",
  "description": "Modern 32-storey tower in the West End with views of English Bay. In-suite laundry, balconies, fitness room, EV charging, and connected to Denman Place Mall."
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
