/**
 * SINGLE CENTRALIZED SOURCE OF TRUTH FOR RISK CLASSIFICATION
 * Strict Color & Risk Mapping:
 * - 0–30:   SAFE       -> GREEN  (#22c55e)
 * - 31–70:  HIGH RISK  -> YELLOW (#eab308)
 * - 71–100: DANGER     -> RED    (#ef4444)
 */

/**
 * Validates geographic latitude and longitude strictly against WGS84 bounds.
 * Rejects NaN, undefined, null, Infinity, and out-of-range values.
 */
export function isValidCoordinate(lat, lon) {
  const numLat = typeof lat === 'number' ? lat : parseFloat(lat);
  const numLon = typeof lon === 'number' ? lon : parseFloat(lon);
  return (
    Number.isFinite(numLat) &&
    Number.isFinite(numLon) &&
    numLat >= -90 &&
    numLat <= 90 &&
    numLon >= -180 &&
    numLon <= 180
  );
}

export function classifyRisk(score) {
  const numericScore = typeof score === 'number' && Number.isFinite(score)
    ? score
    : (parseFloat(score) || 0);

  if (numericScore <= 30) {
    return {
      score: numericScore,
      level: 'SAFE',
      status: 'SAFE',
      color: 'green',
      hex: '#22c55e',
      borderHex: '#16a34a',
      badge: '🟢 SAFE',
      bgAlpha: 'rgba(34, 197, 94, 0.20)',
      glowColor: 'rgba(34, 197, 94, 0.45)',
      fillAlpha: 0.20,
      outlineAlpha: 0.90,
      pulseSpeed: 180,
      severityTier: 'TIER-1 / NOMINAL',
      description: 'Geological stability baseline normal. Low pore pressure and low hazard likelihood.'
    };
  }

  if (numericScore <= 70) {
    return {
      score: numericScore,
      level: 'HIGH RISK',
      status: 'HIGH RISK',
      color: 'yellow',
      hex: '#eab308',
      borderHex: '#ca8a04',
      badge: '🟡 HIGH RISK',
      bgAlpha: 'rgba(234, 179, 8, 0.25)',
      glowColor: 'rgba(234, 179, 8, 0.50)',
      fillAlpha: 0.25,
      outlineAlpha: 0.90,
      pulseSpeed: 300,
      severityTier: 'TIER-2 / WARNING',
      description: 'Elevated geotechnical risk. Soil saturation and slope steepness indicate heightened vulnerability.'
    };
  }

  return {
    score: numericScore,
    level: 'DANGER',
    status: 'DANGER',
    color: 'red',
    hex: '#ef4444',
    borderHex: '#dc2626',
    badge: '🔴 DANGER',
    bgAlpha: 'rgba(239, 68, 68, 0.32)',
    glowColor: 'rgba(239, 68, 68, 0.65)',
    fillAlpha: 0.32,
    outlineAlpha: 0.95,
    pulseSpeed: 440,
    severityTier: 'TIER-3 / CRITICAL DANGER',
    description: 'Critical danger. Imminent slope failure, structural shearing, or debris movement alert.'
  };
}

/**
 * Normalizes any legacy string level ('SAFE', 'MODERATE', 'HIGH', 'CRITICAL', 'DANGER')
 * to the centralized classification.
 */
export function classifyRiskLevel(levelOrScore) {
  if (typeof levelOrScore === 'number') {
    return classifyRisk(levelOrScore);
  }
  const str = String(levelOrScore || '').toUpperCase();
  if (str === 'SAFE' || str === 'LOW') {
    return classifyRisk(20);
  }
  if (str === 'MODERATE' || str === 'WARNING' || str === 'HIGH RISK' || str === 'HIGH' || str === 'AT RISK') {
    return classifyRisk(55);
  }
  return classifyRisk(85);
}
