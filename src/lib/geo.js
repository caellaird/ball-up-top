// Client-side map helpers — Nominatim (OpenStreetMap) geocoding + reverse geocoding.
// No API key required; low-volume browser usage is allowed by Nominatim's policy.

export function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.7613;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

export async function searchLocations(query, userLat, userLng) {
  if (!query || query.trim().length < 3) return [];
  try {
    let url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&addressdetails=1&limit=8`;
    // Nominatim biases result priority toward the given coordinates.
    if (userLat != null && userLng != null) {
      url += `&lat=${userLat}&lon=${userLng}`;
    }
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (!res.ok) return [];
    const data = await res.json();
    let results = (data || []).map((d) => ({
      name: (d.name || d.display_name || '').split(',').slice(0, 2).join(', ').trim() || d.display_name,
      address: d.display_name,
      lat: parseFloat(d.lat),
      lng: parseFloat(d.lon),
    }));
    // Sort by distance from the user so the closest matches appear first.
    if (userLat != null && userLng != null) {
      results.sort((a, b) =>
        haversineMiles(userLat, userLng, a.lat, a.lng) - haversineMiles(userLat, userLng, b.lat, b.lng)
      );
    }
    return results;
  } catch (e) {
    return [];
  }
}

export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) return { name: 'Current Location', address: 'Current Location', lat, lng };
    const d = await res.json();
    return {
      name: d.name || (d.display_name || '').split(',')[0] || 'Current Location',
      address: d.display_name || 'Current Location',
      lat,
      lng,
    };
  } catch (e) {
    return { name: 'Current Location', address: 'Current Location', lat, lng };
  }
}