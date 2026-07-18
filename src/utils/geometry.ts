import { Camera, Zone, BlindSpot } from '../types';

/**
 * Calculates whether a specific 2D point (x, y) is monitored by any active camera.
 */
export function isPointMonitored(x: number, y: number, cameras: Camera[]): { monitored: boolean; byCameraId?: string } {
  // Only active cameras provide coverage
  const activeCameras = cameras.filter(c => c.status === 'active');

  for (const cam of activeCameras) {
    // 1. Calculate distance (in layout coordinate space, assuming 4:3 ratio for standard adjustments)
    const dx = x - cam.x;
    const dy = y - cam.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If point is outside camera range, skip
    if (distance > cam.range) continue;

    // 2. Calculate angle relative to camera direction
    // In screen coordinates, y increases downwards, so we adjust atan2 args
    let angleRad = Math.atan2(dy, dx);
    let angleDeg = angleRad * (180 / Math.PI);
    
    // Normalize to [0, 360]
    if (angleDeg < 0) angleDeg += 360;

    // Camera heading (mid-angle)
    const heading = cam.angle;
    const fov = cam.fov;

    // If the camera is a fisheye or has 360 FOV, it has omni-directional coverage within range
    if (fov >= 350) {
      return { monitored: true, byCameraId: cam.id };
    }

    // Calculate angular difference
    let diff = Math.abs(angleDeg - heading);
    if (diff > 180) diff = 360 - diff;

    if (diff <= fov / 2) {
      return { monitored: true, byCameraId: cam.id };
    }
  }

  return { monitored: false };
}

/**
 * Approximates overall security coverage percentage inside all defined zones by sampling points.
 */
export function calculateSiteCoverage(cameras: Camera[], zones: Zone[]): number {
  if (zones.length === 0) return 0;

  let totalSamplePoints = 0;
  let monitoredSamplePoints = 0;

  // We sample each zone in a dense grid to get accurate coverage %
  for (const zone of zones) {
    const stepX = Math.max(1, zone.width / 10);
    const stepY = Math.max(1, zone.height / 10);

    for (let x = zone.x; x < zone.x + zone.width; x += stepX) {
      for (let y = zone.y; y < zone.y + zone.height; y += stepY) {
        totalSamplePoints++;
        const { monitored } = isPointMonitored(x, y, cameras);
        if (monitored) {
          monitoredSamplePoints++;
        }
      }
    }
  }

  if (totalSamplePoints === 0) return 0;
  return Math.round((monitoredSamplePoints / totalSamplePoints) * 100);
}

/**
 * Evaluates current blind spot records dynamically.
 */
export function getDynamicBlindSpots(cameras: Camera[], zones: Zone[]): BlindSpot[] {
  const blindSpots: BlindSpot[] = [];

  // Check each zone for unmonitored segments
  for (const zone of zones) {
    let zoneMonitoredPoints = 0;
    let zoneTotalPoints = 0;

    // Sample coordinates
    const stepX = Math.max(1, zone.width / 12);
    const stepY = Math.max(1, zone.height / 12);

    const blindLocations: { x: number; y: number }[] = [];

    for (let x = zone.x; x < zone.x + zone.width; x += stepX) {
      for (let y = zone.y; y < zone.y + zone.height; y += stepY) {
        zoneTotalPoints++;
        const { monitored } = isPointMonitored(x, y, cameras);
        if (monitored) {
          zoneMonitoredPoints++;
        } else {
          blindLocations.push({ x, y });
        }
      }
    }

    const coveragePct = zoneTotalPoints > 0 ? (zoneMonitoredPoints / zoneTotalPoints) : 1;
    const gapPct = 1 - coveragePct;

    if (gapPct > 0.15) {
      const vulnScore = Math.round(gapPct * 100 * (zone.baseRisk === 'high' ? 1.2 : zone.baseRisk === 'medium' ? 1.0 : 0.8));
      
      let criticality: 'low' | 'medium' | 'high' = 'low';
      if (vulnScore > 50 || zone.baseRisk === 'high') criticality = 'high';
      else if (vulnScore > 25 || zone.baseRisk === 'medium') criticality = 'medium';

      let description = '';
      if (zone.name === 'Secure Server Room') {
        description = 'Primary rack aisle and rear emergency access corridor lack overlapping view cones.';
      } else if (zone.name === 'Main Lobby & Entrance') {
        description = 'The foyer blind spot allows vestibule transit without detection.';
      } else if (zone.name === 'Loading Dock & Freight') {
        description = 'Outer shipping lanes and roll-up bays are unmonitored by the main dome.';
      } else if (zone.name === 'Back Alley Lane') {
        description = 'Blind sector detected at the rear escape stairs due to the inactive western camera.';
      } else {
        description = `Coverage gap of ${Math.round(gapPct * 100)}% detected within ${zone.name}.`;
      }

      blindSpots.push({
        id: `blind-${zone.id}`,
        zoneName: zone.name,
        description,
        vulnerabilityScore: Math.min(100, vulnScore),
        criticality
      });
    }
  }

  return blindSpots;
}

/**
 * Helper to calculate overall security score (0-100) combining coverage, outages, and risk.
 */
export function calculateOverallSecurityScore(cameras: Camera[], zones: Zone[]): number {
  const coverage = calculateSiteCoverage(cameras, zones);
  const totalCams = cameras.length;
  const activeCams = cameras.filter(c => c.status === 'active').length;
  
  if (totalCams === 0) return 0;

  const activeRatio = activeCams / totalCams; // 0 to 1
  
  // Weights: 70% coverage % + 30% active camera ratios
  const baseScore = (coverage * 0.70) + (activeRatio * 100 * 0.30);
  
  // Deduct penalty if crucial high-risk zones have very low coverage
  let penalty = 0;
  for (const zone of zones) {
    if (zone.baseRisk === 'high') {
      const zoneCoverage = calculateSiteCoverage(cameras, [zone]);
      if (zoneCoverage < 50) {
        penalty += 10; // 10 points penalty for poorly covered high risk zones
      }
    }
  }

  return Math.max(0, Math.min(100, Math.round(baseScore - penalty)));
}
