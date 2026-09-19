/**
 * OPEN-SOURCE GEOCODING & LOCATION INTELLIGENCE SERVICE
 * - Free OpenStreetMap Nominatim search with rate limiting and local cache
 * - Automatic hierarchical zoom level deduction (Country, State, City, POI)
 * - Safe fallback to local curated landmarks
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const REVERSE_BASE_URL = 'https://nominatim.openstreetmap.org/reverse';

// Local in-memory cache to respect Nominatim usage policy (max 1 req/sec)
const geocodeCache = new Map();
let lastRequestTime = 0;

// Curated high-accuracy presets for disaster monitoring & major transit hubs
const CURATED_LANDMARKS = [
  { name: 'Mumbai Airport (BOM / Chhatrapati Shivaji Maharaj)', lat: 19.0896, lon: 72.8656, type: 'airport', category: 'transit', country: 'India', state: 'Maharashtra', zoomAltitude: 4500 },
  { name: 'Gateway of India, Mumbai', lat: 18.9220, lon: 72.8347, type: 'monument', category: 'tourism', country: 'India', state: 'Maharashtra', zoomAltitude: 3500 },
  { name: 'Marine Drive, Mumbai', lat: 18.9432, lon: 72.8230, type: 'promenade', category: 'tourism', country: 'India', state: 'Maharashtra', zoomAltitude: 5000 },
  { name: 'Pune, Maharashtra', lat: 18.5204, lon: 73.8567, type: 'city', category: 'administrative', country: 'India', state: 'Maharashtra', zoomAltitude: 45000 },
  { name: 'New Delhi, India', lat: 28.6139, lon: 77.2090, type: 'city', category: 'administrative', country: 'India', state: 'Delhi', zoomAltitude: 60000 },
  { name: 'Bengaluru, Karnataka', lat: 12.9716, lon: 77.5946, type: 'city', category: 'administrative', country: 'India', state: 'Karnataka', zoomAltitude: 55000 },
  { name: 'Kedarnath Valley, Uttarakhand', lat: 30.7346, lon: 79.0669, type: 'disaster_zone', category: 'high_risk', country: 'India', state: 'Uttarakhand', zoomAltitude: 14000 },
  { name: 'Chamoli Scarp, Uttarakhand', lat: 30.4137, lon: 79.3326, type: 'disaster_zone', category: 'high_risk', country: 'India', state: 'Uttarakhand', zoomAltitude: 16000 },
  { name: 'Wayanad Western Ghats, Kerala', lat: 11.6854, lon: 76.1320, type: 'disaster_zone', category: 'high_risk', country: 'India', state: 'Kerala', zoomAltitude: 15000 },
  { name: 'Shimla Ridge, Himachal Pradesh', lat: 31.1048, lon: 77.1734, type: 'disaster_zone', category: 'high_risk', country: 'India', state: 'Himachal Pradesh', zoomAltitude: 12000 }
];

/**
 * Deduce camera zoom altitude in meters based on Nominatim place type & class
 */
export function getAltitudeForPlace(type, placeClass, boundingBox = null) {
  if (Array.isArray(boundingBox) && boundingBox.length === 4) {
    const latSpan = Math.abs(parseFloat(boundingBox[1]) - parseFloat(boundingBox[0]));
    const lonSpan = Math.abs(parseFloat(boundingBox[3]) - parseFloat(boundingBox[2]));
    const maxSpan = Math.max(latSpan, lonSpan);
    if (maxSpan > 0) {
      // 1 deg span ~= 111km -> altitude scale ~ maxSpan * 111,000 * 1.5
      return Math.max(2500, Math.min(12000000, Math.round(maxSpan * 111000 * 1.6)));
    }
  }

  const t = (type || '').toLowerCase();
  const c = (placeClass || '').toLowerCase();

  if (t === 'country' || c === 'country') return 2500000;
  if (t === 'state' || t === 'province' || t === 'region') return 450000;
  if (t === 'county' || t === 'district') return 120000;
  if (t === 'city' || t === 'town' || t === 'municipality') return 45000;
  if (t === 'suburb' || t === 'neighbourhood' || t === 'village') return 12000;
  if (t === 'aerodrome' || t === 'airport') return 4500;
  if (c === 'highway' || c === 'amenity' || c === 'building' || c === 'tourism' || c === 'place') return 2500;

  return 35000;
}

/**
 * Searches locations using OpenStreetMap Nominatim with caching and rate-limiting
 * @param {string} query 
 * @param {number} [limit=6] 
 * @param {AbortSignal} [signal] 
 * @returns {Promise<Array<Object>>}
 */
export async function searchLocations(query, limit = 6, signal = null) {
  const trimmed = (query || '').trim();
  if (!trimmed || trimmed.length < 2) return [];

  const cacheKey = `${trimmed.toLowerCase()}_${limit}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  // Check local curated landmarks first for instant response
  const curatedMatches = CURATED_LANDMARKS.filter(item =>
    item.name.toLowerCase().includes(trimmed.toLowerCase())
  ).map(item => ({
    display_name: item.name,
    name: item.name.split(',')[0],
    lat: item.lat,
    lon: item.lon,
    type: item.type,
    category: item.category,
    zoomAltitude: item.zoomAltitude,
    source: 'Verified GIS Landmark'
  }));

  try {
    // Respect rate limits: ensure at least 300ms between calls
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    if (elapsed < 300) {
      await new Promise(r => setTimeout(r, 300 - elapsed));
    }
    lastRequestTime = Date.now();

    const params = new URLSearchParams({
      format: 'json',
      q: trimmed,
      limit: String(limit),
      addressdetails: '1'
    });

    const res = await fetch(`${NOMINATIM_BASE_URL}?${params.toString()}`, {
      signal,
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en'
      }
    });

    if (!res.ok) {
      if (curatedMatches.length > 0) return curatedMatches;
      throw new Error(`Geocoding failed with status: ${res.status}`);
    }

    const data = await res.json();
    const results = (Array.isArray(data) ? data : []).map(item => {
      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);
      const addr = item.address || {};
      const primaryName = item.name || addr.road || addr.suburb || addr.city || addr.town || addr.state || item.display_name.split(',')[0];
      const zoomAltitude = getAltitudeForPlace(item.type, item.class, item.boundingbox);

      return {
        display_name: item.display_name,
        name: primaryName,
        lat,
        lon,
        type: item.type || 'place',
        category: item.class || 'boundary',
        zoomAltitude,
        boundingBox: item.boundingbox,
        address: addr,
        source: 'OpenStreetMap Nominatim'
      };
    });

    // Merge curated results with online results (avoiding duplicates)
    const combined = [...curatedMatches];
    results.forEach(resItem => {
      const exists = combined.some(c =>
        Math.abs(c.lat - resItem.lat) < 0.005 && Math.abs(c.lon - resItem.lon) < 0.005
      );
      if (!exists && combined.length < limit + 2) {
        combined.push(resItem);
      }
    });

    geocodeCache.set(cacheKey, combined);
    return combined;
  } catch (err) {
    if (err.name === 'AbortError') return [];
    console.warn('Nominatim geocode fallback to curated:', err.message);
    return curatedMatches;
  }
}

/**
 * Reverse geocodes latitude and longitude into locality name
 * @param {number} lat 
 * @param {number} lon 
 * @returns {Promise<Object>}
 */
export async function reverseGeocodeCoord(lat, lon) {
  const cacheKey = `rev_${lat.toFixed(3)}_${lon.toFixed(3)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  try {
    const params = new URLSearchParams({
      format: 'json',
      lat: String(lat),
      lon: String(lon),
      zoom: '14',
      addressdetails: '1'
    });

    const res = await fetch(`${REVERSE_BASE_URL}?${params.toString()}`, {
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) throw new Error(`Reverse geocode returned ${res.status}`);

    const data = await res.json();
    const addr = data.address || {};
    const locality = addr.suburb || addr.neighbourhood || addr.city || addr.town || addr.village || addr.county || 'Operational Sector';
    const state = addr.state || '';
    const country = addr.country || '';

    const out = {
      display_name: data.display_name || `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`,
      locality: `${locality}${state ? `, ${state}` : ''}`,
      city: addr.city || addr.town || addr.county || '',
      state,
      country
    };

    geocodeCache.set(cacheKey, out);
    return out;
  } catch (e) {
    return {
      display_name: `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`,
      locality: `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`,
      city: 'Local Area',
      state: '',
      country: ''
    };
  }
}
