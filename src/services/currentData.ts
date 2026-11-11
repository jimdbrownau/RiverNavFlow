import { CurrentVector, RiverPreset } from '../types/marine';

export const RIVER_PRESETS: RiverPreset[] = [
  {
    id: 'columbia',
    name: 'Columbia River (Gorge & Estuary)',
    region: 'Pacific Northwest, USA',
    center: [45.618, -121.916],
    zoom: 14,
    description: 'High-volume tidal waterway with strong channel currents, commercial barge traffic, and Bonneville Dam reach.',
    averageFlowKnots: 2.8,
  },
  {
    id: 'hudson',
    name: 'Hudson River (Highlands & Estuary)',
    region: 'New York, USA',
    center: [41.385, -73.963],
    zoom: 14,
    description: 'Deep tidal fjord river with pronounced semi-diurnal ebb and flood currents and rocky navigation bluffs.',
    averageFlowKnots: 2.2,
  },
  {
    id: 'mississippi',
    name: 'Mississippi River (Lower Reach)',
    region: 'Louisiana / Missouri, USA',
    center: [29.951, -90.071],
    zoom: 13,
    description: 'Powerful river artery with heavy siltation, shifting sandbars, wing dikes, and fast mid-channel thalweg.',
    averageFlowKnots: 3.4,
  },
  {
    id: 'sacramento',
    name: 'Sacramento-San Joaquin Delta',
    region: 'California, USA',
    center: [38.056, -121.688],
    zoom: 14,
    description: 'Complex network of tidal sloughs, shallow cuts, sunken islands, and variable current reversals.',
    averageFlowKnots: 1.6,
  },
  {
    id: 'thames',
    name: 'River Thames (Navigable Tideway)',
    region: 'London / Kent, UK',
    center: [51.503, -0.015],
    zoom: 14,
    description: 'Extreme tidal range with fast-flowing river currents around bridge piers and historic mooring channels.',
    averageFlowKnots: 2.5,
  },
];

// Generate dynamic current vectors along a river stretch around a center point
export function generateRiverCurrentVectors(centerLat: number, centerLng: number, baseSpeed: number = 2.4): CurrentVector[] {
  const vectors: CurrentVector[] = [];
  const latStep = 0.004;
  const lngStep = 0.005;

  let idCounter = 1;
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      const lat = centerLat + dy * latStep + (Math.sin(dx * 1.5) * 0.001);
      const lng = centerLng + dx * lngStep + (Math.cos(dy * 1.5) * 0.001);

      // Current direction generally follows river gradient (~250° to 270° downstream or based on location)
      const baseDir = 255 + Math.sin(lat * 100 + lng * 100) * 20;
      
      // Speed variation: thalweg (middle channel) has higher speed, near banks has slower or eddy currents
      const distFromCenter = Math.sqrt(dy * dy + dx * dx);
      let speed = baseSpeed * (1 - distFromCenter * 0.12) + (Math.sin(dy * 3 + dx * 2) * 0.4);
      speed = Math.max(0.4, Number(speed.toFixed(1)));

      let classification: 'slack' | 'moderate' | 'strong' | 'eddy' = 'moderate';
      if (distFromCenter > 2.8 && Math.sin(dx * 7) > 0.4) {
        classification = 'eddy';
        speed = Math.max(0.6, Number((speed * 0.6).toFixed(1)));
      } else if (speed > 2.8) {
        classification = 'strong';
      } else if (speed < 1.2) {
        classification = 'slack';
      }

      vectors.push({
        id: `cur-${idCounter++}`,
        lat,
        lng,
        speedKnots: speed,
        directionDeg: Math.round(baseDir % 360),
        classification,
        name: classification === 'eddy' ? 'Bank Counter-Eddy' : classification === 'strong' ? 'Channel Main Thalweg' : 'River Flow'
      });
    }
  }

  return vectors;
}

// Convert coordinates to nautical formatted string (Degrees, Minutes, Seconds)
export function formatCoordinatesDMS(lat: number, lng: number): { latDms: string; lngDms: string; full: string } {
  const formatSingle = (val: number, isLat: boolean) => {
    const dir = isLat ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W');
    const abs = Math.abs(val);
    const deg = Math.floor(abs);
    const minFloat = (abs - deg) * 60;
    const min = Math.floor(minFloat);
    const sec = Math.round((minFloat - min) * 60);
    return `${deg}°${min.toString().padStart(2, '0')}'${sec.toString().padStart(2, '0')}"${dir}`;
  };

  const latDms = formatSingle(lat, true);
  const lngDms = formatSingle(lng, false);

  return {
    latDms,
    lngDms,
    full: `${latDms} ${lngDms}`,
  };
}
