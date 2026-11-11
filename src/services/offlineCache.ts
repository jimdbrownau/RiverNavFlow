export interface TileCoord {
  x: number;
  y: number;
  z: number;
}

export interface OfflineCacheStats {
  tileCount: number;
  estimatedSizeMb: number;
  lastUpdated: number;
}

const CACHE_NAME = 'rivernav-nautical-tiles-v1';

export class OfflineTileManager {
  // Convert lat/long to tile coordinates for given zoom level
  public static lon2tile(lon: number, zoom: number): number {
    return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
  }

  public static lat2tile(lat: number, zoom: number): number {
    return Math.floor(
      ((1 -
        Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) /
          Math.PI) /
        2) *
        Math.pow(2, zoom)
    );
  }

  // Calculate tiles needed for a bounding box across zoom range
  public static getTilesInBounds(
    north: number,
    south: number,
    east: number,
    west: number,
    minZoom: number = 12,
    maxZoom: number = 14
  ): TileCoord[] {
    const tiles: TileCoord[] = [];
    for (let z = minZoom; z <= maxZoom; z++) {
      const minX = this.lon2tile(west, z);
      const maxX = this.lon2tile(east, z);
      const minY = this.lat2tile(north, z);
      const maxY = this.lat2tile(south, z);

      for (let x = Math.min(minX, maxX); x <= Math.max(minX, maxX); x++) {
        for (let y = Math.min(minY, maxY); y <= Math.max(minY, maxY); y++) {
          tiles.push({ x, y, z });
        }
      }
    }
    return tiles;
  }

  // Cache tiles for given river reach
  public static async cacheRiverReach(
    centerLat: number,
    centerLng: number,
    radiusMiles: number = 5,
    onProgress?: (completed: number, total: number) => void
  ): Promise<{ success: boolean; cachedCount: number }> {
    if (!('caches' in window)) {
      throw new Error('Offline CacheStorage is not supported in this browser.');
    }

    const latDelta = radiusMiles / 69.0;
    const lngDelta = radiusMiles / (69.0 * Math.cos((centerLat * Math.PI) / 180));

    const north = centerLat + latDelta;
    const south = centerLat - latDelta;
    const east = centerLng + lngDelta;
    const west = centerLng - lngDelta;

    // Use zoom levels 12 to 14 (optimal for river navigation offline storage without overloading)
    const tiles = this.getTilesInBounds(north, south, east, west, 12, 14);
    const total = tiles.length;

    const cache = await caches.open(CACHE_NAME);
    let completed = 0;

    // Standard OpenTopoMap and OpenStreetMap nautical base URLs
    const template = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    // Batch download with concurrency limit of 6
    const batchSize = 6;
    for (let i = 0; i < tiles.length; i += batchSize) {
      const slice = tiles.slice(i, i + batchSize);
      await Promise.all(
        slice.map(async (t) => {
          const url = template
            .replace('{z}', t.z.toString())
            .replace('{x}', t.x.toString())
            .replace('{y}', t.y.toString());
          try {
            const match = await cache.match(url);
            if (!match) {
              const res = await fetch(url, { mode: 'cors' });
              if (res.ok) {
                await cache.put(url, res);
              }
            }
          } catch {
            // Silently ignore individual tile fetch failures in offline pre-caching
          } finally {
            completed++;
            if (onProgress) {
              onProgress(completed, total);
            }
          }
        })
      );
    }

    localStorage.setItem('rivernav_cache_updated', Date.now().toString());
    return { success: true, cachedCount: completed };
  }

  // Get current cache stats
  public static async getCacheStats(): Promise<OfflineCacheStats> {
    if (!('caches' in window)) {
      return { tileCount: 0, estimatedSizeMb: 0, lastUpdated: 0 };
    }

    try {
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      const tileCount = keys.length;
      // Average raster tile is ~25KB
      const estimatedSizeMb = Number(((tileCount * 25) / 1024).toFixed(2));
      const lastUpdated = parseInt(localStorage.getItem('rivernav_cache_updated') || '0', 10);
      return { tileCount, estimatedSizeMb, lastUpdated };
    } catch {
      return { tileCount: 0, estimatedSizeMb: 0, lastUpdated: 0 };
    }
  }

  // Purge offline tile cache
  public static async purgeCache(): Promise<void> {
    if ('caches' in window) {
      await caches.delete(CACHE_NAME);
      localStorage.removeItem('rivernav_cache_updated');
    }
  }
}
