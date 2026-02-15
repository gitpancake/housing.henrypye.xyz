import { anthropic } from "./anthropic-client"
import { prisma } from "@/lib/db"
import { computePreferencesHash } from "./preferences-hash"

interface UserPreferences {
  naturalLight: boolean
  bedroomsMin: number
  bedroomsMax: number
  outdoorsAccess: boolean
  publicTransport: boolean
  budgetMin: number
  budgetMax: number
  petFriendly: boolean
  laundryInUnit: boolean
  parking: boolean
  quietNeighbourhood: boolean
  modernFinishes: boolean
  storageSpace: boolean
  gymAmenities: boolean
  customDesires: { label: string; enabled: boolean }[]
}

export interface AreaRecommendationResult {
  areaName: string
  matchScore: number
  reasoning: string
  keyHighlights: string[]
  averageRent: string
  transitScore: string
  vibeDescription: string
}

async function recommendAreas(
  preferences: UserPreferences,
  userName: string,
): Promise<AreaRecommendationResult[]> {
  const priorities: string[] = []

  priorities.push(`Budget: $${preferences.budgetMin}-$${preferences.budgetMax}/month CAD`)
  priorities.push(`Bedrooms: ${preferences.bedroomsMin}-${preferences.bedroomsMax}`)

  const togglePrefs = [
    { key: "naturalLight" as const, label: "Lots of natural light (newer buildings, south-facing units)" },
    { key: "outdoorsAccess" as const, label: "Outdoor access (balcony, patio, proximity to parks and trails)" },
    { key: "publicTransport" as const, label: "Excellent public transit (close to SkyTrain stations, frequent bus routes)" },
    { key: "quietNeighbourhood" as const, label: "Quiet, peaceful neighbourhood (residential, low traffic noise)" },
    { key: "laundryInUnit" as const, label: "In-unit laundry (common in newer buildings)" },
    { key: "parking" as const, label: "Parking availability (dedicated spot)" },
    { key: "modernFinishes" as const, label: "Modern finishes and updated appliances" },
    { key: "storageSpace" as const, label: "Good storage space (closets, storage locker)" },
    { key: "gymAmenities" as const, label: "Building amenities (gym, pool, common areas)" },
    { key: "petFriendly" as const, label: "Pet-friendly buildings and nearby parks/trails for pets" },
  ]

  for (const pref of togglePrefs) {
    if (preferences[pref.key]) {
      priorities.push(`IMPORTANT: ${pref.label}`)
    }
  }

  for (const desire of preferences.customDesires) {
    if (desire.enabled) {
      priorities.push(`IMPORTANT: ${desire.label}`)
    }
  }

  const priorityList = priorities.map((p, i) => `${i + 1}. ${p}`).join("\n")

  const prompt = `You are a knowledgeable Vancouver real estate advisor helping ${userName} find the best neighbourhoods to search for an apartment. You have deep knowledge of Vancouver and Greater Vancouver neighbourhoods, their character, rental markets, transit access, and amenities.

USER'S PRIORITIES:
${priorityList}

VANCOUVER NEIGHBOURHOODS TO CONSIDER:
Consider ALL of the following areas across Vancouver and Greater Vancouver. Do not limit yourself to only the City of Vancouver — many renters find excellent value in surrounding municipalities:

**City of Vancouver:**
- Kitsilano (Kits) — Beach area, active lifestyle, moderate-to-high rents
- Mount Pleasant — Trendy, breweries, Main St shops, central location
- Commercial Drive (The Drive) — Eclectic, multicultural, community feel, affordable-ish
- Fairview / South Granville — Central, Granville Island nearby, transit-connected
- West End / English Bay — Dense, walkable, beach access, many older apartments
- Gastown / Chinatown / Strathcona — Historic, arts scene, some rough edges, improving
- Hastings-Sunrise — More affordable, quieter, good parks, growing amenities
- Riley Park / Little Mountain — Residential, Queen Elizabeth Park, family-friendly
- Marpole — Affordable, near YVR, Canada Line access, quieter
- Kerrisdale / Dunbar — Quiet, upscale residential, less transit
- Point Grey / UBC — Near university, quieter, some rental options
- Yaletown / False Creek — Modern condos, walkable, pricey, urban
- Olympic Village — Newer builds, seawall access, modern amenities

**Greater Vancouver:**
- Burnaby (Metrotown area) — Affordable, SkyTrain access, malls, diverse food
- Burnaby (Brentwood/Lougheed) — Newer towers, SkyTrain, growing rapidly
- New Westminster — Very affordable, SkyTrain, historic downtown, river views
- North Vancouver (Lonsdale) — Mountain views, Seabus to downtown, outdoorsy
- North Vancouver (Lynn Valley/Deep Cove) — Nature-focused, quieter, less transit
- Coquitlam/Port Moody — Affordable, Evergreen Line SkyTrain, nature trails
- Richmond (City Centre) — Canada Line, diverse food scene, flat terrain

INSTRUCTIONS:
1. Recommend exactly 6 neighbourhoods ranked by how well they match ${userName}'s priorities
2. Be SPECIFIC and HONEST — if a neighbourhood is noisy, say so. If transit is poor, say so.
3. Match budget to realistic rental prices for the bedroom count they want
4. For each area, give a match score from 0-10 (use the full range — not everything is a 7+)
5. Key highlights should be 3-4 specific, actionable bullet points (not generic platitudes)
6. Average rent should reflect REALISTIC current rental prices for ${preferences.bedroomsMin}-${preferences.bedroomsMax} bedroom apartments
7. Transit score should name specific transit options (e.g., "Expo Line — Commercial-Broadway station, 5 min walk")
8. Vibe description should be a brief, evocative phrase (e.g., "Chill beach town meets yoga studio")
9. Reasoning should be 2-3 sentences explaining WHY this area matches (or partially matches) their priorities
10. If a preference cannot be well-served in Vancouver's rental market, note this honestly

Respond with ONLY valid JSON in this exact format:
{
  "recommendations": [
    {
      "areaName": "Mount Pleasant",
      "matchScore": 8.5,
      "reasoning": "2-3 sentence explanation of why this area fits their needs",
      "keyHighlights": [
        "Specific highlight 1",
        "Specific highlight 2",
        "Specific highlight 3"
      ],
      "averageRent": "$2,200-$2,800 for 1-2BR",
      "transitScore": "Good — #3 Main St bus, 10 min walk to Main St-Science World SkyTrain",
      "vibeDescription": "Trendy, walkable, craft-beer-and-brunch culture"
    }
  ]
}`

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  })

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error("Failed to parse AI area recommendation response")
  }

  const result = JSON.parse(jsonMatch[0]) as {
    recommendations: AreaRecommendationResult[]
  }

  return result.recommendations.map((rec) => ({
    ...rec,
    matchScore: Math.max(0, Math.min(10, rec.matchScore)),
  }))
}

export async function generateRecommendations(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { preferences: true },
  })

  if (!user?.preferences?.onboardingComplete) return

  const prefs = user.preferences
  const prefsForAI: UserPreferences = {
    naturalLight: prefs.naturalLight,
    bedroomsMin: prefs.bedroomsMin,
    bedroomsMax: prefs.bedroomsMax,
    outdoorsAccess: prefs.outdoorsAccess,
    publicTransport: prefs.publicTransport,
    budgetMin: prefs.budgetMin,
    budgetMax: prefs.budgetMax,
    petFriendly: prefs.petFriendly,
    laundryInUnit: prefs.laundryInUnit,
    parking: prefs.parking,
    quietNeighbourhood: prefs.quietNeighbourhood,
    modernFinishes: prefs.modernFinishes,
    storageSpace: prefs.storageSpace,
    gymAmenities: prefs.gymAmenities,
    customDesires: (prefs.customDesires as { label: string; enabled: boolean }[]) || [],
  }

  const hash = computePreferencesHash(prefsForAI)

  // Skip if recommendations are already fresh
  const existing = await prisma.areaRecommendation.findFirst({
    where: { userId },
    orderBy: { generatedAt: "desc" },
  })

  if (existing && existing.preferencesHash === hash) return

  const areas = await recommendAreas(prefsForAI, user.displayName)

  // Replace old recommendations with new ones
  await prisma.areaRecommendation.deleteMany({ where: { userId } })

  await Promise.all(
    areas.map((area) =>
      prisma.areaRecommendation.create({
        data: {
          userId,
          areaName: area.areaName,
          matchScore: area.matchScore,
          reasoning: area.reasoning,
          keyHighlights: area.keyHighlights,
          averageRent: area.averageRent,
          transitScore: area.transitScore,
          vibeDescription: area.vibeDescription,
          preferencesHash: hash,
          generatedAt: new Date(),
        },
      })
    )
  )
}
