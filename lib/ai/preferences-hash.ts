import { createHash } from "crypto"
import type { UserPreferences } from "./evaluate-listing"

export function computePreferencesHash(prefs: UserPreferences): string {
  const normalized = {
    ...prefs,
    customDesires: [...prefs.customDesires]
      .filter((d) => d.enabled)
      .sort((a, b) => a.label.localeCompare(b.label)),
  }
  const json = JSON.stringify(normalized)
  return createHash("md5").update(json).digest("hex")
}
