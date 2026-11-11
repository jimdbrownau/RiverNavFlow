import { RouteTrack, TrackPoint } from '../types/marine';

export class GPXService {
  // Export a RouteTrack to standard GPX 1.1 XML string
  public static exportToGPX(track: RouteTrack): string {
    const creator = 'RiverNav Nautical Chartplotter';
    const timeIso = new Date(track.startTime).toISOString();

    let trkptsXml = '';
    for (const pt of track.points) {
      const ptIso = new Date(pt.time).toISOString();
      trkptsXml += `
      <trkpt lat="${pt.lat.toFixed(6)}" lon="${pt.lng.toFixed(6)}">
        <time>${ptIso}</time>
        <extensions>
          <rivernav:speed_knots>${pt.speedKnots.toFixed(2)}</rivernav:speed_knots>
          <rivernav:depth_ft>${pt.depthFt.toFixed(1)}</rivernav:depth_ft>
          <rivernav:heading_deg>${pt.headingDeg.toFixed(1)}</rivernav:heading_deg>
        </extensions>
      </trkpt>`;
    }

    const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="${creator}"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:rivernav="http://rivernav.marine/schema/1.0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(track.name)}</name>
    <time>${timeIso}</time>
    <desc>River nautical track recorded with RiverNav. Distance: ${track.distanceNm.toFixed(2)} NM, Avg Speed: ${track.avgSpeedKnots.toFixed(1)} kt, Min Depth: ${track.minDepthFt.toFixed(1)} ft.</desc>
  </metadata>
  <trk>
    <name>${escapeXml(track.name)}</name>
    <trkseg>${trkptsXml}
    </trkseg>
  </trk>
</gpx>`;

    return gpx.trim();
  }

  // Trigger browser download of GPX file
  public static downloadGPX(track: RouteTrack): void {
    const gpxData = this.exportToGPX(track);
    const blob = new Blob([gpxData], { type: 'application/gpx+xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = track.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    a.download = `${safeName}_${new Date(track.startTime).toISOString().slice(0, 10)}.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Parse imported GPX file content into RouteTrack
  public static parseGPX(xmlText: string): RouteTrack | null {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const trkptNodes = xmlDoc.getElementsByTagName('trkpt');

      if (trkptNodes.length === 0) {
        return null;
      }

      const nameNode = xmlDoc.getElementsByTagName('name')[0];
      const routeName = nameNode ? nameNode.textContent || 'Imported River Route' : 'Imported River Route';

      const points: TrackPoint[] = [];
      let totalDistNm = 0;
      let maxSpeed = 0;
      let totalSpeed = 0;
      let minDepth = 999;

      for (let i = 0; i < trkptNodes.length; i++) {
        const node = trkptNodes[i];
        const lat = parseFloat(node.getAttribute('lat') || '0');
        const lng = parseFloat(node.getAttribute('lon') || '0');
        const timeEl = node.getElementsByTagName('time')[0];
        const time = timeEl ? new Date(timeEl.textContent || '').getTime() : Date.now() + i * 1000;

        // Custom extensions or default
        const speedEl = node.getElementsByTagName('rivernav:speed_knots')[0];
        const speed = speedEl ? parseFloat(speedEl.textContent || '0') : 5.0;

        const depthEl = node.getElementsByTagName('rivernav:depth_ft')[0];
        const depth = depthEl ? parseFloat(depthEl.textContent || '0') : 12.0;

        points.push({
          lat,
          lng,
          time,
          speedKnots: speed,
          headingDeg: 0,
          depthFt: depth,
        });

        if (speed > maxSpeed) maxSpeed = speed;
        totalSpeed += speed;
        if (depth < minDepth) minDepth = depth;

        if (i > 0) {
          const prev = points[i - 1];
          totalDistNm += calculateDistanceNm(prev.lat, prev.lng, lat, lng);
        }
      }

      return {
        id: `imported-${Date.now()}`,
        name: routeName,
        startTime: points[0]?.time || Date.now(),
        endTime: points[points.length - 1]?.time || Date.now(),
        points,
        distanceNm: Number(totalDistNm.toFixed(2)),
        maxSpeedKnots: Number(maxSpeed.toFixed(1)),
        avgSpeedKnots: points.length > 0 ? Number((totalSpeed / points.length).toFixed(1)) : 0,
        minDepthFt: minDepth === 999 ? 10 : Number(minDepth.toFixed(1)),
      };
    } catch {
      return null;
    }
  }
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function calculateDistanceNm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065; // Nautical miles radius of Earth
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
