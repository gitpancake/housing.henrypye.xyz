import { anthropic } from "./anthropic-client";

interface UserPreferences {
    naturalLight: boolean;
    bedroomsMin: number;
    bedroomsMax: number;
    outdoorsAccess: boolean;
    publicTransport: boolean;
    budgetMin: number;
    budgetMax: number;
    petFriendly: boolean;
    laundryInUnit: boolean;
    parking: boolean;
    quietNeighbourhood: boolean;
    modernFinishes: boolean;
    storageSpace: boolean;
    gymAmenities: boolean;
    customDesires: { label: string; enabled: boolean }[];
}

interface ListingData {
    title: string;
    description: string;
    url: string;
    address: string;
    price: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    petFriendly: boolean | null;
    squareFeet: number | null;
    scrapedContent: string | null;
}

export interface EvaluationResult {
    overall: number;
    breakdown: { category: string; score: number; reasoning: string }[];
    summary: string;
}

export async function evaluateListing(
    listing: ListingData,
    preferences: UserPreferences,
    userName: string,
): Promise<EvaluationResult> {
    // Always include budget and bedrooms as core categories
    const categories = [
        {
            name: "Budget",
            detail: `User budget: $${preferences.budgetMin}–$${preferences.budgetMax}/mo. Listing price: ${listing.price ? `$${listing.price}/mo` : "Not specified"}.`,
        },
        {
            name: "Bedrooms",
            detail: `User wants ${preferences.bedroomsMin}–${preferences.bedroomsMax} bedrooms. Listing has: ${listing.bedrooms ?? "Not specified"}.`,
        },
    ];

    // Only include preference categories the user marked as important
    const togglePrefs = [
        {
            key: "naturalLight" as const,
            name: "Natural Light",
            detail: "Big windows, south-facing, bright spaces.",
        },
        {
            key: "outdoorsAccess" as const,
            name: "Outdoors Access",
            detail: "Balcony, patio, nearby parks.",
        },
        {
            key: "publicTransport" as const,
            name: "Public Transport",
            detail: "Proximity to SkyTrain, bus routes.",
        },
        {
            key: "quietNeighbourhood" as const,
            name: "Quiet Neighbourhood",
            detail: "Low traffic, residential area.",
        },
        {
            key: "laundryInUnit" as const,
            name: "In-Unit Laundry",
            detail: "Washer/dryer in the unit.",
        },
        {
            key: "parking" as const,
            name: "Parking",
            detail: "Dedicated parking spot included.",
        },
        {
            key: "modernFinishes" as const,
            name: "Modern Finishes",
            detail: "Updated kitchen, fixtures, appliances.",
        },
        {
            key: "storageSpace" as const,
            name: "Storage Space",
            detail: "Closets, storage locker, pantry space.",
        },
        {
            key: "gymAmenities" as const,
            name: "Gym & Amenities",
            detail: "Building gym, pool, common areas.",
        },
    ];

    for (const pref of togglePrefs) {
        if (preferences[pref.key]) {
            categories.push({
                name: pref.name,
                detail: `IMPORTANT to this user. ${pref.detail}`,
            });
        }
    }

    if (preferences.petFriendly) {
        categories.push({
            name: "Pet Friendly",
            detail: `User REQUIRES pet-friendly. Listing says: ${listing.petFriendly === true ? "Yes" : listing.petFriendly === false ? "No" : "Not specified"}.`,
        });
    }

    for (const desire of preferences.customDesires) {
        if (desire.enabled) {
            categories.push({
                name: desire.label,
                detail: `Custom preference — IMPORTANT to this user.`,
            });
        }
    }

    const categoryList = categories
        .map((c, i) => `${i + 1}. ${c.name}: ${c.detail}`)
        .join("\n");

    const importantCount = togglePrefs.filter((p) => preferences[p.key]).length;

    const prompt = `You are evaluating an apartment listing for ${userName} who is searching in the Vancouver / Lower Mainland area.

LISTING DETAILS:
- Title: ${listing.title}
- Price: ${listing.price ? `$${listing.price}/month` : "Not specified"}
- Bedrooms: ${listing.bedrooms ?? "Not specified"}
- Bathrooms: ${listing.bathrooms ?? "Not specified"}
- Square Feet: ${listing.squareFeet ?? "Not specified"}
- Pet Friendly: ${listing.petFriendly === true ? "Yes" : listing.petFriendly === false ? "No" : "Not specified"}
- Address: ${listing.address || "Not specified"}
- URL: ${listing.url || "Not provided"}

LISTING DESCRIPTION:
${listing.description || "No description provided."}

${listing.scrapedContent ? `CONTENT FROM LISTING URL:\n${listing.scrapedContent}` : ""}

USER'S IMPORTANT CATEGORIES (${importantCount} items marked as important, evaluate each 0-10):
${categoryList}

INSTRUCTIONS:
- Score each category from 0 to 10 based on how well the listing matches what the user cares about
- Every category listed above is something this user marked as IMPORTANT — weight them all equally
- Categories NOT listed here are things the user doesn't care about — they are excluded
- For budget: 10 = well within budget, 5 = at budget limit, 0 = way over budget
- For bedrooms: 10 = exact match, lower if outside range
- For pet friendly: 10 = confirmed yes, 0 = confirmed no, 5 = not specified
- For other categories: 10 = listing clearly has this, 0 = clearly doesn't, 5 = can't tell from listing
- Provide brief reasoning for each score
- Calculate an overall score as the average across all categories

Respond with ONLY valid JSON in this exact format:
{
  "overall": 7.5,
  "breakdown": [
    {"category": "Budget", "score": 8, "reasoning": "At $2000/mo, within the $1500-$2500 range"},
    ...
  ],
  "summary": "Brief 1-2 sentence summary of the listing's fit for this user"
}`;

    const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
    });

    const text = response.content
        .filter((block) => block.type === "text")
        .map((block) => {
            if (block.type === "text") return block.text;
            return "";
        })
        .join("");

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("Failed to parse AI evaluation response");
    }

    const result = JSON.parse(jsonMatch[0]) as EvaluationResult;

    // Clamp scores to 0-10
    result.overall = Math.max(0, Math.min(10, result.overall));
    result.breakdown = result.breakdown.map((b) => ({
        ...b,
        score: Math.max(0, Math.min(10, b.score)),
    }));

    return result;
}
