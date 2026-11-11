import { RouteTrack, TrackPoint } from '../types/marine';

export function generateSampleCompletedTrip(): RouteTrack {
  const startTime = Date.now() - 3600 * 1000 * 2.2; // 2.2 hours ago
  const startLat = 45.618;
  const startLng = -121.916;
  const totalPoints = 65;
  const points: TrackPoint[] = [];

  let currentLat = startLat;
  let currentLng = startLng;
  let accumulatedDistNm = 0;
  let maxSpeed = 0;
  let totalSpeed = 0;
  let minDepth = 999;

  for (let i = 0; i < totalPoints; i++) {
    const fraction = i / (totalPoints - 1);
    const time = startTime + i * (2.2 * 3600 * 1000 / totalPoints);

    // Progression along river course heading ~255°
    const dLat = -0.0006 + Math.sin(fraction * 6) * 0.0003;
    const dLng = -0.0018 + Math.cos(fraction * 4) * 0.0004;
    currentLat += dLat;
    currentLng += dLng;

    // Realistic boat speed variation (idling out of lock, cruising at 12-15kt, slowing near shallow bend)
    let speed = 4.5;
    if (fraction > 0.15 && fraction < 0.45) {
      speed = 11.2 + Math.sin(fraction * 20) * 3.6; // Cruising
    } else if (fraction >= 0.45 && fraction < 0.65) {
      speed = 13.8 + Math.cos(fraction * 15) * 1.8; // Peak cruising run
    } else if (fraction >= 0.65 && fraction < 0.8) {
      speed = 6.2 + Math.sin(fraction * 10) * 1.5; // Narrow river channel
    } else {
      speed = 5.0 + Math.random() * 1.5; // Approach to marina
    }
    speed = Math.max(2.5, Number(speed.toFixed(1)));
    if (speed > maxSpeed) maxSpeed = speed;
    totalSpeed += speed;

    // Realistic riverbed depth variation (deep channel 25-35ft, crossing sandbar at mile 3.5 dipping to 3.8ft)
    let depth = 22.0;
    if (fraction >= 0.38 && fraction <= 0.48) {
      // Shallow bar transit
      depth = 3.8 + Math.abs(fraction - 0.43) * 35;
    } else if (fraction > 0.48 && fraction < 0.75) {
      // Main river canyon channel
      depth = 28.5 + Math.sin(fraction * 14) * 6.5;
    } else {
      depth = 14.5 + Math.cos(fraction * 10) * 4.0;
    }
    depth = Math.max(3.4, Number(depth.toFixed(1)));
    if (depth < minDepth) minDepth = depth;

    const heading = 250 + Math.sin(fraction * 8) * 15;

    points.push({
      lat: Number(currentLat.toFixed(6)),
      lng: Number(currentLng.toFixed(6)),
      time: Math.round(time),
      speedKnots: speed,
      headingDeg: Math.round(heading),
      depthFt: depth,
    });
  }

  // Calculate total distance
  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1];
    const p2 = points[i];
    const R = 3440.065;
    const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
    const dLon = ((p2.lng - p1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((p1.lat * Math.PI) / 180) *
        Math.cos((p2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    accumulatedDistNm += R * c;
  }

  return {
    id: 'sample-trip-columbia',
    name: 'Columbia River Gorge Passage (Bonneville to Cascade Locks)',
    startTime,
    endTime: points[points.length - 1].time,
    points,
    distanceNm: Number(accumulatedDistNm.toFixed(2)),
    maxSpeedKnots: Number(maxSpeed.toFixed(1)),
    avgSpeedKnots: Number((totalSpeed / points.length).toFixed(1)),
    minDepthFt: Number(minDepth.toFixed(1)),
  };
}
