import { anthropic } from "./anthropic-client"

interface UserPreferences {
  naturalLight: number
  bedroomsMin: number
  bedroomsMax: number
  outdoorsAccess: number
  publicTransport: number
  budgetMin: number
  budgetMax: number
  petFriendly: boolean
  laundryInUnit: number
  parking: number
  quietNeighbourhood: number
  modernFinishes: number
  storageSpace: number
  gymAmenities: number
  customDesires: { label: string; importance: number }[]
}

interface ListingData {
  title: string
  description: string
  url: string
  address: string
  price: number | null
  bedrooms: number | null
  bathrooms: number | null
  petFriendly: boolean | null
  squareFeet: number | null
  scrapedContent: string | null
}

export interface EvaluationResult {
  overall: number
  breakdown: { category: string; score: number; reasoning: string }[]
  summary: string
}

export async function evaluateListing(
  listing: ListingData,
  preferences: UserPreferences,
  userName: string
): Promise<EvaluationResult> {
  const categories = [
    { name: "Budget", detail: `User budget: $${preferences.budgetMin}–$${preferences.budgetMax}/mo. Listing price: ${listing.price ? `$${listing.price}/mo` : "Not specified"}.` },
    { name: "Bedrooms", detail: `User wants ${preferences.bedroomsMin}–${preferences.bedroomsMax} bedrooms. Listing has: ${listing.bedrooms ?? "Not specified"}.` },
    { name: "Natural Light", detail: `Importance: ${preferences.naturalLight}/10.` },
    { name: "Outdoors Access", detail: `Importance: ${preferences.outdoorsAccess}/10. Look for balcony, patio, nearby parks.` },
    { name: "Public Transport", detail: `Importance: ${preferences.publicTransport}/10. Consider proximity to SkyTrain, bus routes.` },
    { name: "Quiet Neighbourhood", detail: `Importance: ${preferences.quietNeighbourhood}/10.` },
    { name: "In-Unit Laundry", detail: `Importance: ${preferences.laundryInUnit}/10.` },
    { name: "Parking", detail: `Importance: ${preferences.parking}/10.` },
    { name: "Modern Finishes", detail: `Importance: ${preferences.modernFinishes}/10.` },
    { name: "Storage Space", detail: `Importance: ${preferences.storageSpace}/10.` },
    { name: "Gym & Amenities", detail: `Importance: ${preferences.gymAmenities}/10.` },
  ]

  if (preferences.petFriendly) {
    categories.push({
      name: "Pet Friendly",
      detail: `User REQUIRES pet-friendly. Listing says: ${listing.petFriendly === true ? "Yes" : listing.petFriendly === false ? "No" : "Not specified"}.`,
    })
  }

  for (const desire of preferences.customDesires) {
    categories.push({
      name: desire.label,
      detail: `Custom preference. Importance: ${desire.importance}/10.`,
    })
  }

  const categoryList = categories
    .map((c, i) => `${i + 1}. ${c.name}: ${c.detail}`)
    .join("\n")

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

SCORING CATEGORIES (evaluate each 0-10):
${categoryList}

INSTRUCTIONS:
- Score each category from 0 to 10 based on how well the listing matches the user's preferences
- For categories where the listing doesn't provide information, score based on what can be inferred from the description, location, and price point
- For budget: 10 = well within budget, 5 = at budget limit, 0 = way over budget
- For bedrooms: 10 = exact match, lower if outside range
- For boolean requirements (pet friendly): 10 = confirmed yes, 0 = confirmed no, 5 = not specified
- Provide brief reasoning for each score
- Calculate an overall weighted score (weight by the user's importance ratings)

Respond with ONLY valid JSON in this exact format:
{
  "overall": 7.5,
  "breakdown": [
    {"category": "Budget", "score": 8, "reasoning": "At $2000/mo, within the $1500-$2500 range"},
    ...
  ],
  "summary": "Brief 1-2 sentence summary of the listing's fit for this user"
}`

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  })

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => {
      if (block.type === "text") return block.text
      return ""
    })
    .join("")

  // Extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error("Failed to parse AI evaluation response")
  }

  const result = JSON.parse(jsonMatch[0]) as EvaluationResult

  // Clamp scores to 0-10
  result.overall = Math.max(0, Math.min(10, result.overall))
  result.breakdown = result.breakdown.map((b) => ({
    ...b,
    score: Math.max(0, Math.min(10, b.score)),
  }))

  return result
}
