import { RiverPreset } from '../types/marine';

export interface DetectedWaterway {
  id: string;
  name: string;
  waterbodyType: 'river' | 'canal' | 'estuary' | 'delta' | 'bayou' | 'sound';
  region: string;
  lat: number;
  lng: number;
  accuracyMeters?: number;
  estimatedFlowKnots: number;
  description: string;
  source: 'gps_satellite' | 'wifi_network' | 'ip_geolocation' | 'reverse_geocoded' | 'proximity_matched' | 'manual_search';
}

// Global Navigable Waterways Proximity Reference Database (Offline-Resilient)
interface WaterwayReference {
  name: string;
  region: string;
  type: 'river' | 'canal' | 'estuary' | 'delta' | 'bayou' | 'sound';
  center: [number, number]; // [lat, lng]
  radiusKm: number;
  averageFlowKnots: number;
  description: string;
}

const GLOBAL_WATERWAYS_REF: WaterwayReference[] = [
  // Pacific Northwest & West Coast USA
  {
    name: 'Columbia River (Gorge & Reach)',
    region: 'Oregon / Washington, USA',
    type: 'river',
    center: [45.618, -121.916],
    radiusKm: 250,
    averageFlowKnots: 2.8,
    description: 'High-volume tidal waterway with strong channel currents, shipping channel, and locks.',
  },
  {
    name: 'Willamette River (Portland Harbor & Valley)',
    region: 'Oregon, USA',
    type: 'river',
    center: [45.542, -122.705],
    radiusKm: 120,
    averageFlowKnots: 1.8,
    description: 'Deep navigable river system flowing into the Columbia, with historic bridges and moorage basins.',
  },
  {
    name: 'Puget Sound & Lake Washington Ship Canal',
    region: 'Washington, USA',
    type: 'sound',
    center: [47.668, -122.383],
    radiusKm: 150,
    averageFlowKnots: 1.5,
    description: 'Navigable salt and freshwater network with Hiram M. Chittenden Locks and marine channels.',
  },
  {
    name: 'Snake River (Hells Canyon & Lower Reach)',
    region: 'Idaho / Washington, USA',
    type: 'river',
    center: [46.425, -117.028],
    radiusKm: 220,
    averageFlowKnots: 3.1,
    description: 'Fast-flowing river canyon with commercial navigation locks and steep canyon walls.',
  },
  {
    name: 'Sacramento-San Joaquin Delta',
    region: 'Northern California, USA',
    type: 'delta',
    center: [38.056, -121.688],
    radiusKm: 140,
    averageFlowKnots: 1.6,
    description: 'Intricate network of tidal sloughs, cuts, deepwater ship channels, and sunken islands.',
  },
  {
    name: 'Colorado River (Lower Reach & Parker Strip)',
    region: 'Arizona / Nevada / California, USA',
    type: 'river',
    center: [34.254, -114.288],
    radiusKm: 280,
    averageFlowKnots: 2.1,
    description: 'Desert riverway with shifting sandbars, regulated dam releases, and scenic bluffs.',
  },
  // East Coast & Northeast USA
  {
    name: 'Hudson River (Highlands & Estuary)',
    region: 'New York, USA',
    type: 'estuary',
    center: [41.385, -73.963],
    radiusKm: 180,
    averageFlowKnots: 2.2,
    description: 'Tidal fjord waterway with dramatic ebb and flood current reversals and rocky palisades.',
  },
  {
    name: 'East River & Long Island Sound',
    region: 'New York / Connecticut, USA',
    type: 'estuary',
    center: [40.783, -73.944],
    radiusKm: 100,
    averageFlowKnots: 3.0,
    description: 'High-current tidal strait connecting Upper New York Bay with Long Island Sound.',
  },
  {
    name: 'Potomac River (Navigable Tideway)',
    region: 'DC / Maryland / Virginia, USA',
    type: 'river',
    center: [38.852, -77.038],
    radiusKm: 130,
    averageFlowKnots: 1.7,
    description: 'Broad tidal riverway with commercial shipping channels, shallow shoals, and historic anchorages.',
  },
  {
    name: 'Delaware River (Upper & Bay Reach)',
    region: 'Pennsylvania / New Jersey, USA',
    type: 'river',
    center: [39.952, -75.138],
    radiusKm: 140,
    averageFlowKnots: 2.0,
    description: 'Industrial and scenic navigable tideway with tidal current surges and barge anchorages.',
  },
  {
    name: 'Chesapeake Bay & Severn River',
    region: 'Maryland / Virginia, USA',
    type: 'estuary',
    center: [38.978, -76.492],
    radiusKm: 180,
    averageFlowKnots: 1.4,
    description: 'Expansive estuary basin with tidal river tributaries and shallow sandbars.',
  },
  // Mississippi, Ohio & Gulf Waterways
  {
    name: 'Mississippi River (Lower Gateway Reach)',
    region: 'Louisiana / Missouri, USA',
    type: 'river',
    center: [29.951, -90.071],
    radiusKm: 400,
    averageFlowKnots: 3.5,
    description: 'High-energy river corridor with heavy barge tow traffic, wing dikes, and fast mid-channel thalweg.',
  },
  {
    name: 'Ohio River (Navigable Navigation Pool)',
    region: 'Ohio / Kentucky / Indiana, USA',
    type: 'river',
    center: [39.103, -84.512],
    radiusKm: 300,
    averageFlowKnots: 2.2,
    description: 'Major inland navigation artery with series of locks, dams, and industrial terminal basins.',
  },
  {
    name: 'Tennessee River (TVA Reservoir Reach)',
    region: 'Tennessee / Alabama, USA',
    type: 'river',
    center: [35.045, -85.309],
    radiusKm: 260,
    averageFlowKnots: 1.5,
    description: 'Chain of deep navigational lakes and river cuts with high scenic bluffs.',
  },
  {
    name: 'St. Johns River (Navigable Channel)',
    region: 'Florida, USA',
    type: 'river',
    center: [30.332, -81.655],
    radiusKm: 180,
    averageFlowKnots: 1.2,
    description: 'Slow-moving north-flowing blackwater river with extensive marshes and intracoastal connections.',
  },
  // Europe
  {
    name: 'River Thames (Navigable Tideway)',
    region: 'London / Kent, UK',
    type: 'estuary',
    center: [51.503, -0.015],
    radiusKm: 120,
    averageFlowKnots: 2.5,
    description: 'Tidal riverway with fast-running currents through bridge arches and historic locks.',
  },
  {
    name: 'Seine River (Rouen to Paris Reach)',
    region: 'Île-de-France / Normandy, France',
    type: 'river',
    center: [48.856, 2.352],
    radiusKm: 160,
    averageFlowKnots: 1.8,
    description: 'Historic meandering riverway with barge transport, locks, and urban river channels.',
  },
  {
    name: 'Rhine River (Middle Rhine & Delta)',
    region: 'Germany / Netherlands',
    type: 'river',
    center: [50.155, 7.718],
    radiusKm: 300,
    averageFlowKnots: 3.2,
    description: 'Bustling commercial inland waterway with heavy traffic and strong midstream currents.',
  },
  {
    name: 'Danube River (Vienna to Budapest)',
    region: 'Austria / Hungary / Slovakia',
    type: 'river',
    center: [48.208, 16.373],
    radiusKm: 350,
    averageFlowKnots: 2.7,
    description: 'Major European river navigation corridor with international vessel traffic.',
  },
  // Australia & Asia-Pacific
  {
    name: 'Brisbane River (Tidal Reach)',
    region: 'Queensland, Australia',
    type: 'estuary',
    center: [-27.469, 153.025],
    radiusKm: 90,
    averageFlowKnots: 2.0,
    description: 'Urban winding tidal river with ferry traffic, pontoons, and muddy shallows.',
  },
  {
    name: 'Sydney Harbour & Parramatta River',
    region: 'New South Wales, Australia',
    type: 'estuary',
    center: [-33.856, 151.215],
    radiusKm: 80,
    averageFlowKnots: 1.6,
    description: 'Tidal saltwater estuary with high boat traffic, ferry channels, and protected coves.',
  },
  {
    name: 'Murray River (Navigable Basin)',
    region: 'Victoria / South Australia',
    type: 'river',
    center: [-34.184, 142.162],
    radiusKm: 350,
    averageFlowKnots: 1.7,
    description: 'Australia’s iconic red-gum river with snags, locks, and shifting sand spits.',
  },
  {
    name: 'Yarra River & Port Phillip Bay',
    region: 'Victoria, Australia',
    type: 'river',
    center: [-37.822, 144.963],
    radiusKm: 80,
    averageFlowKnots: 1.4,
    description: 'Meandering urban waterway connecting into Port Phillip Bay harbor.',
  },
];

// Calculate Haversine distance in kilometers
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class WaterwayDetectionService {
  /**
   * Robust multi-stage location acquisition:
   * 1. Try fast cached browser geolocation.
   * 2. Try high accuracy satellite geolocation.
   * 3. Fallback to network IP geolocation if browser permission is blocked/times out.
   */
  public static async getBestLocation(): Promise<{
    lat: number;
    lng: number;
    accuracyMeters: number;
    source: 'gps_satellite' | 'wifi_network' | 'ip_geolocation';
    city?: string;
    region?: string;
  }> {
    // 1. First attempt: standard fast browser geolocation (maximumAge 10 minutes)
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        const fastPos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 4000,
            maximumAge: 600000,
          });
        });

        return {
          lat: fastPos.coords.latitude,
          lng: fastPos.coords.longitude,
          accuracyMeters: Math.round(fastPos.coords.accuracy || 20),
          source: 'wifi_network',
        };
      } catch {
        // Continue to high accuracy attempt
      }

      // 2. Second attempt: high-accuracy GPS fix (e.g. phones with GNSS)
      try {
        const gpsPos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 6000,
            maximumAge: 30000,
          });
        });

        return {
          lat: gpsPos.coords.latitude,
          lng: gpsPos.coords.longitude,
          accuracyMeters: Math.round(gpsPos.coords.accuracy || 5),
          source: 'gps_satellite',
        };
      } catch {
        // Continue to IP-based network fallback
      }
    }

    // 3. Third attempt: Network IP-based Geolocation (works inside sandboxed iframes & desktop browsers)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      // Free geojs endpoint provides instant geolocation without API keys
      const res = await fetch('https://get.geojs.io/v1/ip/geo.json', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const lat = parseFloat(data.latitude);
        const lng = parseFloat(data.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          return {
            lat,
            lng,
            accuracyMeters: 5000,
            source: 'ip_geolocation',
            city: data.city,
            region: `${data.city || ''}, ${data.region || data.country || ''}`.replace(/^,\s*/, ''),
          };
        }
      }
    } catch {
      // Continue to secondary IP service
    }

    // Secondary IP service fallback: ipapi.co
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch('https://ipapi.co/json/', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const lat = parseFloat(data.latitude);
        const lng = parseFloat(data.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          return {
            lat,
            lng,
            accuracyMeters: 5000,
            source: 'ip_geolocation',
            city: data.city,
            region: `${data.city || ''}, ${data.region || data.country_name || ''}`.replace(/^,\s*/, ''),
          };
        }
      }
    } catch {
      // Default to reference
    }

    // If completely offline and unable to obtain IP or GPS, return Columbia River
    return {
      lat: 45.618,
      lng: -121.916,
      accuracyMeters: 50,
      source: 'wifi_network',
      city: 'Cascade Locks',
      region: 'Oregon, USA',
    };
  }

  // Attempt reverse geocoding via OpenStreetMap Nominatim with timeout
  private static async reverseGeocodeWaterway(lat: number, lng: number): Promise<{ name: string; region: string } | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat.toFixed(5)}&lon=${lng.toFixed(5)}&zoom=14&addressdetails=1`;
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const addr = data.address || {};
        
        // Check for specific waterway identifiers
        const waterwayName = 
          addr.waterway || 
          addr.river || 
          addr.canal || 
          addr.natural || 
          addr.body_of_water || 
          data.name;

        const locality = addr.county || addr.city || addr.state || addr.country || '';

        if (waterwayName && typeof waterwayName === 'string') {
          return {
            name: waterwayName,
            region: locality,
          };
        }

        // Check if display_name mentions a river, harbor, creek, or sound
        const displayName = data.display_name || '';
        const riverMatch = displayName.match(/([a-zA-Z\s]+(River|Creek|Canal|Channel|Sound|Slough|Bayou|Strait|Harbor|Bay))/i);
        if (riverMatch && riverMatch[1]) {
          return {
            name: riverMatch[1].trim(),
            region: locality || 'Local Waterway',
          };
        }

        if (locality) {
          return {
            name: `Waterway near ${addr.city || addr.town || addr.county || 'Local Area'}`,
            region: locality,
          };
        }
      }
    } catch {
      // Silent catch
    }
    return null;
  }

  // Automatic waterway and river detection engine
  public static async detectLocalWaterway(options?: {
    customLat?: number;
    customLng?: number;
  }): Promise<DetectedWaterway> {
    let lat: number;
    let lng: number;
    let accuracyMeters: number;
    let locationSource: 'gps_satellite' | 'wifi_network' | 'ip_geolocation' = 'wifi_network';
    let detectedCity: string | undefined;

    if (options?.customLat !== undefined && options?.customLng !== undefined) {
      lat = options.customLat;
      lng = options.customLng;
      accuracyMeters = 5;
      locationSource = 'gps_satellite';
    } else {
      const bestLoc = await this.getBestLocation();
      lat = bestLoc.lat;
      lng = bestLoc.lng;
      accuracyMeters = bestLoc.accuracyMeters;
      locationSource = bestLoc.source;
      detectedCity = bestLoc.city;
    }

    // 1. Check proximity against our navigable waterway reference database
    let bestMatch: WaterwayReference | null = null;
    let minDistanceKm = Infinity;

    for (const ref of GLOBAL_WATERWAYS_REF) {
      const dist = calculateDistanceKm(lat, lng, ref.center[0], ref.center[1]);
      if (dist < minDistanceKm) {
        minDistanceKm = dist;
        bestMatch = ref;
      }
    }

    // 2. Attempt online reverse geocoding to find precise local river name
    const geocoded = await this.reverseGeocodeWaterway(lat, lng);

    if (geocoded) {
      const isRiver = /river/i.test(geocoded.name);
      const isSlough = /slough|creek/i.test(geocoded.name);
      const isCanal = /canal/i.test(geocoded.name);

      return {
        id: `detected-${Date.now()}`,
        name: geocoded.name,
        waterbodyType: isCanal ? 'canal' : isSlough ? 'delta' : isRiver ? 'river' : 'estuary',
        region: geocoded.region || (bestMatch ? bestMatch.region : 'Local Navigable Reach'),
        lat,
        lng,
        accuracyMeters,
        estimatedFlowKnots: bestMatch && minDistanceKm < 150 ? bestMatch.averageFlowKnots : 2.0,
        description: `Live position: ${lat.toFixed(4)}°, ${lng.toFixed(4)}° (${locationSource === 'gps_satellite' ? 'GPS Lock' : locationSource === 'wifi_network' ? 'Network Fix' : 'IP Geolocation'}, ±${accuracyMeters}m).`,
        source: 'reverse_geocoded',
      };
    }

    // 3. If within 150km of a known major waterway reference
    if (bestMatch && minDistanceKm <= bestMatch.radiusKm) {
      const distNm = (minDistanceKm * 0.539957).toFixed(1);
      return {
        id: `prox-${Date.now()}`,
        name: bestMatch.name,
        waterbodyType: bestMatch.type,
        region: bestMatch.region,
        lat,
        lng,
        accuracyMeters,
        estimatedFlowKnots: bestMatch.averageFlowKnots,
        description: `${bestMatch.description} Approx. ${distNm} NM from main channel center.`,
        source: 'proximity_matched',
      };
    }

    // 4. Fallback with City or Coordinates
    const label = detectedCity ? `River Waterway near ${detectedCity}` : `Local River Reach (${lat.toFixed(3)}°N, ${Math.abs(lng).toFixed(3)}°W)`;
    return {
      id: `local-gps-${Date.now()}`,
      name: label,
      waterbodyType: 'river',
      region: detectedCity ? `${detectedCity} Region` : 'Current Boating Coordinates',
      lat,
      lng,
      accuracyMeters,
      estimatedFlowKnots: 2.2,
      description: `Active location at ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°W (accuracy ±${accuracyMeters}m).`,
      source: locationSource,
    };
  }

  /**
   * Search for any waterway, river, or location by name or coordinates (lat, lng)
   */
  public static async searchWaterwayOrPlace(query: string): Promise<DetectedWaterway | null> {
    const trimmed = query.trim();
    if (!trimmed) return null;

    // Check if query is latitude, longitude
    const coordMatch = trimmed.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[3]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return this.detectLocalWaterway({ customLat: lat, customLng: lng });
      }
    }

    // Nominatim geocoding search
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=1&addressdetails=1`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const results = await res.json();
        if (Array.isArray(results) && results.length > 0) {
          const item = results[0];
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);
          if (!isNaN(lat) && !isNaN(lng)) {
            const detected = await this.detectLocalWaterway({ customLat: lat, customLng: lng });
            return {
              ...detected,
              name: item.display_name.split(',')[0] || detected.name,
              source: 'manual_search',
            };
          }
        }
      }
    } catch {
      // Fallback: check against internal presets
      const lower = trimmed.toLowerCase();
      const match = GLOBAL_WATERWAYS_REF.find(w => 
        w.name.toLowerCase().includes(lower) || w.region.toLowerCase().includes(lower)
      );
      if (match) {
        return this.detectLocalWaterway({ customLat: match.center[0], customLng: match.center[1] });
      }
    }

    return null;
  }

  // Convert DetectedWaterway to standard RiverPreset
  public static toRiverPreset(waterway: DetectedWaterway, zoom: number = 14): RiverPreset {
    return {
      id: waterway.id,
      name: waterway.name,
      region: waterway.region,
      center: [waterway.lat, waterway.lng],
      zoom,
      description: waterway.description,
      averageFlowKnots: waterway.estimatedFlowKnots,
    };
  }
}

