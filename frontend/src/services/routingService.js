/**
 * OPEN-SOURCE OSRM ROUTING SERVICE & GEODESIC NAVIGATION ENGINE
 * - Free / OpenStreetMap-based routing engine
 * - Real turn-by-turn navigation instructions
 * - Geodesic distance & point-to-polyline deviation detection
 * - Zero API keys required
 */

// Earth radius in meters (WGS84 mean radius)
const EARTH_RADIUS_METERS = 6371008.8;

/**
 * Calculates geodesic distance between two points on WGS84 sphere using Haversine formula
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in meters
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (angle) => (angle * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculates perpendicular distance from a point to a polyline line segment
 * @param {[number, number]} p [lat, lon]
 * @param {[number, number]} a [lat, lon]
 * @param {[number, number]} b [lat, lon]
 * @returns {number} Distance in meters
 */
export function pointToSegmentDistance(p, a, b) {
  const [pLat, pLon] = p;
  const [aLat, aLon] = a;
  const [bLat, bLon] = b;

  // Segment length squared in degrees approximation for projection factor t
  const dx = bLon - aLon;
  const dy = bLat - aLat;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return haversineDistance(pLat, pLon, aLat, aLon);
  }

  // Projection scalar clamped between 0 and 1
  let t = ((pLon - aLon) * dx + (pLat - aLat) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projLon = aLon + t * dx;
  const projLat = aLat + t * dy;

  return haversineDistance(pLat, pLon, projLat, projLon);
}

/**
 * Computes minimum distance from user GPS position to the route polyline
 * @param {{ lat: number, lon: number }} userCoords 
 * @param {Array<[number, number]>} polyline [ [lon, lat], ... ]
 * @returns {number} Minimum distance in meters
 */
export function distanceToRoute(userCoords, polyline) {
  if (!userCoords || !Array.isArray(polyline) || polyline.length < 2) {
    return 0;
  }

  const p = [userCoords.lat, userCoords.lon];
  let minDistance = Infinity;

  for (let i = 0; i < polyline.length - 1; i++) {
    // Note: OSRM GeoJSON stores coordinates as [lon, lat]
    const a = [polyline[i][1], polyline[i][0]];
    const b = [polyline[i + 1][1], polyline[i + 1][0]];
    const dist = pointToSegmentDistance(p, a, b);
    if (dist < minDistance) {
      minDistance = dist;
    }
  }

  return minDistance === Infinity ? 0 : minDistance;
}

/**
 * Detects if the user has deviated significantly from the active route
 * @param {{ lat: number, lon: number }} userCoords 
 * @param {Array<[number, number]>} polyline 
 * @param {number} thresholdMeters Default 65 meters
 * @returns {{ isDeviated: boolean, distanceMeters: number }}
 */
export function detectRouteDeviation(userCoords, polyline, thresholdMeters = 65) {
  const dist = distanceToRoute(userCoords, polyline);
  return {
    isDeviated: dist > thresholdMeters,
    distanceMeters: Math.round(dist)
  };
}

/**
 * Parses maneuver type and modifier into user-friendly icon and description
 */
function formatManeuver(maneuver, stepName) {
  const type = maneuver.type || 'continue';
  const modifier = maneuver.modifier || '';
  let icon = '↑';
  let action = 'Continue';

  switch (type) {
    case 'turn':
      if (modifier.includes('left')) {
        icon = modifier.includes('sharp') ? '⮵' : (modifier.includes('slight') ? '↖' : '↰');
        action = `Turn ${modifier}`;
      } else if (modifier.includes('right')) {
        icon = modifier.includes('sharp') ? '⮴' : (modifier.includes('slight') ? '↗' : '↱');
        action = `Turn ${modifier}`;
      } else {
        icon = '↑';
        action = 'Turn';
      }
      break;
    case 'new name':
      icon = '↑';
      action = 'Continue onto';
      break;
    case 'depart':
      icon = '🚀';
      action = 'Depart towards';
      break;
    case 'arrive':
      icon = '🏁';
      action = 'Arrive at destination';
      break;
    case 'roundabout':
      icon = '🔄';
      action = `Enter roundabout (${modifier || 'exit'})`;
      break;
    case 'fork':
      icon = modifier.includes('left') ? '↖' : '↗';
      action = `Take the ${modifier} fork`;
      break;
    case 'end of road':
      icon = modifier.includes('left') ? '↰' : '↱';
      action = `Turn ${modifier} at end of road`;
      break;
    case 'merge':
      icon = '⤹';
      action = `Merge ${modifier}`;
      break;
    default:
      icon = '↑';
      action = 'Continue onto';
  }

  const name = stepName && stepName.trim() !== '' ? stepName : 'the road';
  const instruction = type === 'arrive' ? 'Arrive at destination' : `${action} ${name}`;

  return { icon, action, instruction };
}

/**
 * Fetches real driving route from OpenStreetMap OSRM public routing API
 * @param {{ lat: number, lon: number }} start 
 * @param {{ lat: number, lon: number }} destination 
 * @param {AbortSignal} [signal] 
 * @returns {Promise<Object>} Formatted route object
 */
export async function calculateRoute(start, destination, signal = null) {
  if (!start || !destination) {
    throw new Error('Start and destination coordinates are required.');
  }

  const startLat = Number(start.lat);
  const startLon = Number(start.lon);
  const destLat = Number(destination.lat);
  const destLon = Number(destination.lon);

  if (isNaN(startLat) || isNaN(startLon) || isNaN(destLat) || isNaN(destLon)) {
    throw new Error('Invalid coordinates provided for route calculation.');
  }

  // OSRM expects: {lon1},{lat1};{lon2},{lat2}
  const url = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${destLon},${destLat}?overview=full&geometries=geojson&steps=true&annotations=true`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      signal: signal || controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Routing service returned status: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !Array.isArray(data.routes) || data.routes.length === 0) {
      throw new Error(data.message || 'No route found between these locations.');
    }

    const primaryRoute = data.routes[0];
    const coordinates = primaryRoute.geometry?.coordinates || [];
    const distanceMeters = primaryRoute.distance || 0;
    const durationSeconds = primaryRoute.duration || 0;

    // Process turn-by-turn steps
    const rawLegs = primaryRoute.legs || [];
    const steps = [];

    rawLegs.forEach(leg => {
      if (Array.isArray(leg.steps)) {
        leg.steps.forEach(step => {
          const maneuver = step.maneuver || {};
          const { icon, action, instruction } = formatManeuver(maneuver, step.name);
          steps.push({
            instruction,
            action,
            icon,
            roadName: step.name || 'Unnamed Road',
            distanceMeters: Math.round(step.distance || 0),
            durationSeconds: Math.round(step.duration || 0),
            // step maneuver location is [lon, lat]
            location: maneuver.location ? { lat: maneuver.location[1], lon: maneuver.location[0] } : null,
            type: maneuver.type,
            modifier: maneuver.modifier
          });
        });
      }
    });

    // Compute bounds
    let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
    coordinates.forEach(([lon, lat]) => {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
    });

    return {
      success: true,
      provider: 'OSRM OpenStreetMap',
      coordinates, // Array of [lon, lat]
      distanceMeters: Math.round(distanceMeters),
      distanceKm: (distanceMeters / 1000).toFixed(1),
      durationSeconds: Math.round(durationSeconds),
      durationMinutes: Math.max(1, Math.round(durationSeconds / 60)),
      steps,
      bounds: { minLat, maxLat, minLon, maxLon },
      start: { lat: startLat, lon: startLon },
      destination: { lat: destLat, lon: destLon }
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Routing request timed out. Please check your connection.');
    }
    throw err;
  }
}

/**
 * Finds current active turn instruction based on user's current GPS position
 * @param {{ lat: number, lon: number }} userCoords 
 * @param {Array<Object>} steps 
 * @returns {{ activeStep: Object|null, activeIndex: number, distanceToTurnMeters: number }}
 */
export function findActiveStep(userCoords, steps) {
  if (!userCoords || !Array.isArray(steps) || steps.length === 0) {
    return { activeStep: null, activeIndex: 0, distanceToTurnMeters: 0 };
  }

  // Find the first upcoming step whose maneuver is at least 25m ahead
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (step.location) {
      const dist = haversineDistance(userCoords.lat, userCoords.lon, step.location.lat, step.location.lon);
      if (dist > 25) {
        return {
          activeStep: step,
          activeIndex: i,
          distanceToTurnMeters: Math.round(dist)
        };
      }
    }
  }

  // Fallback to the last step (arrival)
  const lastStep = steps[steps.length - 1];
  const lastDist = lastStep.location
    ? haversineDistance(userCoords.lat, userCoords.lon, lastStep.location.lat, lastStep.location.lon)
    : 0;

  return {
    activeStep: lastStep,
    activeIndex: steps.length - 1,
    distanceToTurnMeters: Math.round(lastDist)
  };
}
