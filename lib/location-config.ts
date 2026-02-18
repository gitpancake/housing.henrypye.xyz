// Central location configuration — change these values to adapt the app to a different city/region.

export const locationConfig = {
  // General
  cityName: "Vancouver",
  regionName: "Vancouver / Lower Mainland",
  provinceOrState: "BC",
  country: "Canada",
  currency: "CAD",

  // Map defaults
  defaultCenter: [49.2827, -123.1207] as [number, number],

  // UI placeholders
  exampleAddress: "123 Main St, Vancouver, BC",
  exampleNeighbourhood: "West End",

  // Tax configuration
  taxLabel: "BC Provincial Tax",
  federalBasicPersonalAmount: 16129,
  provincialBasicPersonalAmount: 12580,
  federalBrackets: [
    { min: 0, max: 57375, rate: 0.15 },
    { min: 57375, max: 114750, rate: 0.205 },
    { min: 114750, max: 158468, rate: 0.26 },
    { min: 158468, max: 220000, rate: 0.29 },
    { min: 220000, max: Infinity, rate: 0.33 },
  ],
  provincialBrackets: [
    { min: 0, max: 47937, rate: 0.0506 },
    { min: 47937, max: 95875, rate: 0.077 },
    { min: 95875, max: 110076, rate: 0.105 },
    { min: 110076, max: 133664, rate: 0.1229 },
    { min: 133664, max: 181232, rate: 0.147 },
    { min: 181232, max: Infinity, rate: 0.168 },
  ],

  // AI prompts — neighbourhood list for area recommendations
  neighbourhoods: `**City of Vancouver:**
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
- Richmond (City Centre) — Canada Line, diverse food scene, flat terrain`,

  // AI prompts — example listing for parse-listing
  exampleParsedListing: {
    title: "Shoreline West End",
    address: "1763 Comox Street, Vancouver, BC",
    neighbourhood: "West End",
    description:
      "Modern 32-storey tower in the West End with views of English Bay. In-suite laundry, balconies, fitness room, EV charging, and connected to Denman Place Mall.",
  },
}
