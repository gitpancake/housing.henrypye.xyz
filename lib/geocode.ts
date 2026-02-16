interface GeocodingResult {
  lat: number;
  lng: number;
}

export async function geocodeAddress(
  address: string,
): Promise<GeocodingResult | null> {
  try {
    const query = encodeURIComponent(address);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=ca`,
      {
        headers: {
          "User-Agent": "NestFinder/1.0 (housing.henrypye.xyz)",
        },
      },
    );

    if (!res.ok) return null;

    const results = await res.json();
    if (!results.length) return null;

    return {
      lat: parseFloat(results[0].lat),
      lng: parseFloat(results[0].lon),
    };
  } catch {
    return null;
  }
}
