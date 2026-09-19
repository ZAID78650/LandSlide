/**
 * HIGH-ACCURACY GPS FILTERING & NOISE SMOOTHING ENGINE
 * - Separates true raw WGS84 GPS measurements from visual rendered position
 * - Multi-stage accuracy thresholding & outlier rejection
 * - Adaptive Exponential Smoothing based on accuracy uncertainty
 * - Forward-azimuth bearing calculation for smooth heading orientation
 */

import { haversineDistance } from './routingService.js';

export class GpsFilter {
  constructor(options = {}) {
    this.accuracyThreshold = options.accuracyThreshold || 85; // Max allowed uncertainty in meters
    this.maxSpeedMps = options.maxSpeedMps || 120; // 430 km/h sanity threshold
    this.lastRaw = null;
    this.filtered = null;
    this.history = [];
    this.maxHistoryLength = 10;
  }

  /**
   * Calculates initial bearing between two geographic points
   * @param {number} lat1 
   * @param {number} lon1 
   * @param {number} lat2 
   * @param {number} lon2 
   * @returns {number} Bearing in degrees (0 - 360)
   */
  static calculateBearing(lat1, lon1, lat2, lon2) {
    const toRad = (d) => (d * Math.PI) / 180;
    const toDeg = (r) => (r * 180) / Math.PI;

    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const deltaLambda = toRad(lon2 - lon1);

    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x =
      Math.cos(phi1) * Math.sin(phi2) -
      Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

    const theta = Math.atan2(y, x);
    return (toDeg(theta) + 360) % 360;
  }

  /**
   * Ingests a new raw GeolocationPosition and returns filtered and validated telemetry
   * @param {GeolocationPosition} position 
   * @returns {Object} Validated telemetry
   */
  update(position) {
    if (!position || !position.coords) {
      return { isValid: false, reason: 'INVALID_POSITION_OBJECT' };
    }

    const {
      latitude,
      longitude,
      accuracy = 10,
      altitude = null,
      heading = null,
      speed = null
    } = position.coords;

    const timestamp = position.timestamp || Date.now();

    const rawLat = Number(latitude);
    const rawLon = Number(longitude);
    const accMeters = Number(accuracy) || 10;

    // 1. Basic WGS84 coordinate boundary check
    if (isNaN(rawLat) || isNaN(rawLon) || rawLat < -90 || rawLat > 90 || rawLon < -180 || rawLon > 180) {
      return { isValid: false, reason: 'COORDINATES_OUT_OF_BOUNDS' };
    }

    const rawMeasurement = {
      lat: rawLat,
      lon: rawLon,
      accuracy: accMeters,
      altitude: altitude !== null ? Number(altitude) : null,
      heading: heading !== null && !isNaN(heading) ? Number(heading) : null,
      speed: speed !== null && !isNaN(speed) ? Number(speed) : null,
      timestamp
    };

    // 2. Initial state initialization
    if (!this.lastRaw || !this.filtered) {
      this.lastRaw = rawMeasurement;
      this.filtered = { lat: rawLat, lon: rawLon };
      this.history = [rawMeasurement];

      return {
        isValid: true,
        raw: rawMeasurement,
        filtered: { lat: rawLat, lon: rawLon },
        speedKmh: rawMeasurement.speed ? (rawMeasurement.speed * 3.6).toFixed(1) : '0.0',
        headingDeg: rawMeasurement.heading !== null ? Math.round(rawMeasurement.heading) : 0,
        accuracyM: Math.round(accMeters),
        timestamp
      };
    }

    // 3. Outlier rejection: Check impossible jumps
    const dtSeconds = Math.max(0.2, (timestamp - this.lastRaw.timestamp) / 1000);
    const displacementMeters = haversineDistance(this.lastRaw.lat, this.lastRaw.lon, rawLat, rawLon);
    const apparentSpeed = displacementMeters / dtSeconds;

    // If reading jumped at supersonic speed and accuracy is poor, clamp or reject
    if (apparentSpeed > this.maxSpeedMps && accMeters > 30) {
      return {
        isValid: false,
        reason: 'MULTIPATH_SPIKE_REJECTED',
        raw: rawMeasurement,
        filtered: { ...this.filtered },
        speedKmh: '0.0',
        headingDeg: 0,
        accuracyM: Math.round(accMeters),
        timestamp
      };
    }

    // 4. Adaptive Exponential Smoothing (EMA)
    // High accuracy (<10m) -> higher alpha (0.65 - fast response)
    // Low accuracy (>50m) -> lower alpha (0.15 - noise rejection)
    let alpha = 0.55;
    if (accMeters <= 8) {
      alpha = 0.75;
    } else if (accMeters <= 20) {
      alpha = 0.50;
    } else if (accMeters <= 50) {
      alpha = 0.30;
    } else {
      alpha = 0.15;
    }

    // Compute smoothed coordinates
    const smoothedLat = this.filtered.lat + alpha * (rawLat - this.filtered.lat);
    const smoothedLon = this.filtered.lon + alpha * (rawLon - this.filtered.lon);

    this.filtered = {
      lat: parseFloat(smoothedLat.toFixed(6)),
      lon: parseFloat(smoothedLon.toFixed(6))
    };

    // 5. Bearing / Heading Determination
    let finalHeading = rawMeasurement.heading;
    if (finalHeading === null || isNaN(finalHeading)) {
      // Calculate bearing from previous raw location if distance is > 2 meters
      if (displacementMeters > 2) {
        finalHeading = GpsFilter.calculateBearing(this.lastRaw.lat, this.lastRaw.lon, rawLat, rawLon);
      } else if (this.history.length > 0 && this.history[this.history.length - 1].heading !== null) {
        finalHeading = this.history[this.history.length - 1].heading;
      } else {
        finalHeading = 0;
      }
    }

    rawMeasurement.heading = finalHeading;

    // 6. Speed Determination
    let finalSpeedMps = rawMeasurement.speed;
    if (finalSpeedMps === null || isNaN(finalSpeedMps)) {
      finalSpeedMps = Math.min(apparentSpeed, 80); // Fallback to distance/time
    }

    const speedKmh = (finalSpeedMps * 3.6).toFixed(1);

    // Update history
    this.lastRaw = rawMeasurement;
    this.history.push(rawMeasurement);
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }

    return {
      isValid: true,
      raw: rawMeasurement,
      filtered: { ...this.filtered },
      speedKmh,
      headingDeg: Math.round(finalHeading),
      accuracyM: Math.round(accMeters),
      altitudeM: rawMeasurement.altitude !== null ? Math.round(rawMeasurement.altitude) : null,
      timestamp
    };
  }

  /**
   * Resets the filter state
   */
  reset() {
    this.lastRaw = null;
    this.filtered = null;
    this.history = [];
  }
}

// Export singleton helper
export const gpsFilterInstance = new GpsFilter();
