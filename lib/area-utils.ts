export function getAreaFromAddress(address: string): string {
  if (!address) return "";
  const parts = address.split(",").map((s) => s.trim());
  if (parts.length >= 2) return parts[parts.length - 2];
  return parts[0].length > 20 ? parts[0].slice(0, 20) + "..." : parts[0];
}

export function getEffectiveArea(listing: {
  neighbourhood?: string | null;
  address?: string;
}): string {
  if (listing.neighbourhood) return listing.neighbourhood;
  if (listing.address) return getAreaFromAddress(listing.address);
  return "Other";
}
