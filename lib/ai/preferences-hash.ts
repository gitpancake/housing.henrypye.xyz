import { createHash } from "crypto"

interface PreferencesForHash {
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

export function computePreferencesHash(prefs: PreferencesForHash): string {
  const normalized = {
    ...prefs,
    customDesires: [...prefs.customDesires]
      .filter((d) => d.enabled)
      .sort((a, b) => a.label.localeCompare(b.label)),
  }
  const json = JSON.stringify(normalized)
  return createHash("md5").update(json).digest("hex")
}
