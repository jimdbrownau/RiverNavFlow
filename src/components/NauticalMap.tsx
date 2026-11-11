import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Compass, 
  Layers, 
  MapPin, 
  Navigation, 
  Plus, 
  Minus, 
  Waves, 
  Anchor, 
  AlertTriangle, 
  Search,
  ExternalLink,
  LocateFixed,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { 
  Waypoint, 
  CurrentVector, 
  MarineVisionMode, 
  RiverPreset, 
  MapLayerType,
  BatteryOptimizationConfig,
  TrackPoint
} from '../types/marine';
import { RIVER_PRESETS } from '../services/currentData';

interface NauticalMapProps {
  vesselLat: number;
  vesselLng: number;
  vesselHeadingDeg: number;
  vesselSpeedKnots: number;
  currentVectors: CurrentVector[];
  waypoints: Waypoint[];
  recordedTrack: TrackPoint[];
  visionMode: MarineVisionMode;
  batteryConfig: BatteryOptimizationConfig;
  selectedRiver: RiverPreset;
  onSelectRiver: (preset: RiverPreset) => void;
  onMapClickWaypoint: (lat: number, lng: number) => void;
  onCenterOnBoat: () => void;
  showCurrentsOverlay: boolean;
  onToggleCurrentsOverlay: () => void;
  onAutoDetectWaterway?: () => Promise<void>;
  onSearchWaterway?: (query: string) => Promise<boolean>;
  isDetectingWaterway?: boolean;
  detectedWaterwayName?: string | null;
  gpsAccuracyMeters?: number | null;
}

export const NauticalMap: React.FC<NauticalMapProps> = ({
  vesselLat,
  vesselLng,
  vesselHeadingDeg,
  vesselSpeedKnots,
  currentVectors,
  waypoints,
  recordedTrack,
  visionMode,
  batteryConfig,
  selectedRiver,
  onSelectRiver,
  onMapClickWaypoint,
  showCurrentsOverlay,
  onToggleCurrentsOverlay,
  onAutoDetectWaterway,
  onSearchWaterway,
  isDetectingWaterway,
  detectedWaterwayName,
  gpsAccuracyMeters,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const seamarksLayerRef = useRef<L.TileLayer | null>(null);
  const vesselMarkerRef = useRef<L.Marker | null>(null);
  const trackPolylineRef = useRef<L.Polyline | null>(null);
  const currentMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const waypointsLayerRef = useRef<L.LayerGroup | null>(null);

  const [activeLayerType, setActiveLayerType] = useState<MapLayerType>('satellite');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showRiverSelector, setShowRiverSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);


  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [vesselLat, vesselLng],
        zoom: selectedRiver.zoom,
        zoomControl: false,
        attributionControl: false,
      });

      mapInstanceRef.current = map;

      // Click to add waypoint
      map.on('click', (e: L.LeafletMouseEvent) => {
        onMapClickWaypoint(e.latlng.lat, e.latlng.lng);
      });

      // Layer groups
      currentMarkersLayerRef.current = L.layerGroup().addTo(map);
      waypointsLayerRef.current = L.layerGroup().addTo(map);
      trackPolylineRef.current = L.polyline([], {
        color: '#38bdf8',
        weight: 4,
        opacity: 0.85,
        dashArray: '4, 8'
      }).addTo(map);

      // Automatically invalidate size when container or orientation changes
      const resizeObserver = new ResizeObserver(() => {

        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);

      return () => {
        resizeObserver.disconnect();
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }
  }, []);


  // Update Base Tile Layer based on activeLayerType
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }
    if (seamarksLayerRef.current) {
      map.removeLayer(seamarksLayerRef.current);
    }

    let url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    let maxZoom = 18;

    if (activeLayerType === 'osm') {
      url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      maxZoom = 19;
    } else if (activeLayerType === 'topo') {
      url = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      maxZoom = 17;
    } else if (activeLayerType === 'nautical') {
      // OpenTopoMap with OpenSeaMap nautical seamarks
      url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      maxZoom = 18;
    }

    baseTileLayerRef.current = L.tileLayer(url, {
      maxZoom,
      crossOrigin: true,
    }).addTo(map);

    // OpenSeaMap Seamarks layer (buoys, beacons, river lights)
    if (activeLayerType === 'nautical' || activeLayerType === 'satellite') {
      seamarksLayerRef.current = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
        maxZoom: 18,
        crossOrigin: true,
        opacity: 0.9,
      }).addTo(map);
    }
  }, [activeLayerType]);

  // Update Vessel Marker & Heading Cone
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const vesselHtml = `
      <div style="position: relative; width: 44px; height: 44px; display: flex; items-center; justify-content: center;">
        <!-- Heading line -->
        <div style="
          position: absolute; 
          top: 0; 
          left: 50%; 
          width: 2px; 
          height: 18px; 
          background: #38bdf8; 
          transform-origin: bottom center; 
          transform: translateX(-50%) rotate(${vesselHeadingDeg}deg);
          box-shadow: 0 0 6px rgba(56, 189, 248, 0.8);
        "></div>
        <!-- Vessel Hull Icon -->
        <div style="
          width: 24px; 
          height: 24px; 
          background: #0284c7; 
          border: 2px solid #ffffff; 
          border-radius: 50% 50% 30% 30%; 
          transform: rotate(${vesselHeadingDeg}deg); 
          box-shadow: 0 2px 8px rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 10px;
        ">
          <div style="width: 4px; height: 4px; background: white; border-radius: 50%;"></div>
        </div>
      </div>
    `;

    const customIcon = L.divIcon({
      html: vesselHtml,
      className: 'vessel-marker-icon',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    if (!vesselMarkerRef.current) {
      vesselMarkerRef.current = L.marker([vesselLat, vesselLng], { icon: customIcon, zIndexOffset: 1000 }).addTo(map);
    } else {
      vesselMarkerRef.current.setLatLng([vesselLat, vesselLng]);
      vesselMarkerRef.current.setIcon(customIcon);
    }
  }, [vesselLat, vesselLng, vesselHeadingDeg, vesselSpeedKnots]);

  // Update Recorded Track Polyline
  useEffect(() => {
    if (!trackPolylineRef.current) return;
    const latLngs = recordedTrack.map(pt => [pt.lat, pt.lng] as [number, number]);
    trackPolylineRef.current.setLatLngs(latLngs);
  }, [recordedTrack]);

  // Update Current Vectors Overlay
  useEffect(() => {
    if (!currentMarkersLayerRef.current) return;
    currentMarkersLayerRef.current.clearLayers();

    if (!showCurrentsOverlay) return;

    currentVectors.forEach(vec => {
      const isEddy = vec.classification === 'eddy';
      const isStrong = vec.classification === 'strong';
      const isSlack = vec.classification === 'slack';

      const color = isEddy 
        ? '#c084fc' 
        : isStrong 
        ? '#f43f5e' 
        : isSlack 
        ? '#2dd4bf' 
        : '#f59e0b';

      const arrowLength = Math.max(14, Math.min(32, vec.speedKnots * 8));

      const arrowHtml = `
        <div style="
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center; 
          pointer-events: auto;
          cursor: pointer;
        ">
          <div style="
            transform: rotate(${vec.directionDeg}deg); 
            transform-origin: center center;
            color: ${color};
            filter: drop-shadow(0 1px 2px rgba(0,0,0,0.8));
          ">
            <svg width="${arrowLength}" height="${arrowLength}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"></line>
              <polyline points="5 12 12 5 19 12"></polyline>
            </svg>
          </div>
          <div style="
            font-size: 9px; 
            font-family: 'JetBrains Mono', monospace; 
            font-weight: 700;
            background: rgba(15, 23, 42, 0.85); 
            color: ${color}; 
            padding: 1px 3px; 
            border-radius: 3px; 
            margin-top: 1px;
            white-space: nowrap;
            border: 1px solid ${color}40;
          ">
            ${vec.speedKnots.toFixed(1)}kt
          </div>
        </div>
      `;

      const currentIcon = L.divIcon({
        html: arrowHtml,
        className: 'current-vector-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([vec.lat, vec.lng], { icon: currentIcon });
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; padding: 4px;">
          <strong>${vec.name || 'River Flow Vector'}</strong><br/>
          Current Speed: <strong>${vec.speedKnots} kts</strong><br/>
          Flow Direction: <strong>${vec.directionDeg}°</strong> (${vec.classification.toUpperCase()})
        </div>
      `);
      currentMarkersLayerRef.current?.addLayer(marker);
    });
  }, [currentVectors, showCurrentsOverlay]);

  // Update Waypoint Markers
  useEffect(() => {
    if (!waypointsLayerRef.current) return;
    waypointsLayerRef.current.clearLayers();

    waypoints.forEach(wp => {
      let iconColor = '#38bdf8';
      let symbol = '📍';

      switch (wp.category) {
        case 'anchorage': iconColor = '#38bdf8'; symbol = '⚓'; break;
        case 'ramp': iconColor = '#34d399'; symbol = '🚢'; break;
        case 'fuel': iconColor = '#fbbf24'; symbol = '⛽'; break;
        case 'hazard': iconColor = '#f87171'; symbol = '⚠️'; break;
        case 'marina': iconColor = '#60a5fa'; symbol = '🏢'; break;
        case 'fishing': iconColor = '#a78bfa'; symbol = '🐟'; break;
        case 'lock': iconColor = '#e879f9'; symbol = '🔒'; break;
      }

      const wpHtml = `
        <div style="
          width: 28px; 
          height: 28px; 
          background: #0f172a; 
          border: 2px solid ${iconColor}; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
          font-size: 13px;
          cursor: pointer;
        ">
          ${symbol}
        </div>
      `;

      const wpIcon = L.divIcon({
        html: wpHtml,
        className: 'custom-wp-icon',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([wp.lat, wp.lng], { icon: wpIcon });
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; padding: 4px;">
          <strong style="font-size: 13px;">${wp.name}</strong><br/>
          <span style="color: #64748b; text-transform: uppercase; font-size: 10px;">${wp.category}</span>
          ${wp.depthFt ? `<br/>Recorded Depth: <strong>${wp.depthFt.toFixed(1)} ft</strong>` : ''}
          ${wp.notes ? `<p style="margin-top: 4px; font-size: 11px;">${wp.notes}</p>` : ''}
        </div>
      `);
      waypointsLayerRef.current?.addLayer(marker);
    });
  }, [waypoints]);

  // Center on River preset change
  const handleSelectRiver = (preset: RiverPreset) => {
    onSelectRiver(preset);
    setShowRiverSelector(false);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(preset.center, preset.zoom, { duration: 1.2 });
    }
  };

  const handleCenterOnBoat = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([vesselLat, vesselLng], 14, { duration: 0.8 });
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Map Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Map Navigation HUD Controls */}

      {/* Top Left: River Reach Selector & Auto-Detection Trigger */}
      <div className="absolute top-18 md:top-4 left-3 md:left-4 z-20 flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowRiverSelector(!showRiverSelector)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg border border-slate-700/80 shadow-lg backdrop-blur-sm transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-sky-400" />
            <span className="truncate max-w-[170px] sm:max-w-none">{selectedRiver.name}</span>
          </button>

          {showRiverSelector && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2.5 z-30 space-y-2">
              {/* Search input for any river, city, or coordinates */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search river, city, or lat,lng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && searchQuery.trim() && onSearchWaterway) {
                      setIsSearchingLocation(true);
                      const ok = await onSearchWaterway(searchQuery.trim());
                      setIsSearchingLocation(false);
                      if (ok) setShowRiverSelector(false);
                    }
                  }}
                  className="w-full px-3 py-2 pr-12 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                />
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (onSearchWaterway && searchQuery.trim()) {
                        setIsSearchingLocation(true);
                        const ok = await onSearchWaterway(searchQuery.trim());
                        setIsSearchingLocation(false);
                        if (ok) setShowRiverSelector(false);
                      }
                    }}
                    disabled={isSearchingLocation}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] bg-sky-600 hover:bg-sky-500 text-white px-2 py-1 rounded cursor-pointer font-semibold"
                  >
                    {isSearchingLocation ? '...' : 'Search'}
                  </button>
                )}
              </div>

              {/* Auto-Detect My River Action in Menu */}
              {onAutoDetectWaterway && (
                <button
                  onClick={async () => {
                    setShowRiverSelector(false);
                    await onAutoDetectWaterway();
                  }}
                  disabled={isDetectingWaterway}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-200 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5">
                    {isDetectingWaterway ? (
                      <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
                    ) : (
                      <LocateFixed className="w-4 h-4 text-sky-400" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        Auto-Detect My River
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-sky-500/30 text-sky-300 font-mono">GPS</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Locks onto nearest waterway via live location
                      </div>
                    </div>
                  </div>
                </button>
              )}

              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Select Known River Waterway
              </div>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {RIVER_PRESETS.filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.region.toLowerCase().includes(searchQuery.toLowerCase())).map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      handleSelectRiver(preset);
                      setSearchQuery('');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer flex flex-col ${
                      selectedRiver.id === preset.id
                        ? 'bg-sky-600 text-white font-medium'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="font-semibold">{preset.name}</span>
                    <span className="text-[10px] opacity-70">{preset.region} · Avg Flow {preset.averageFlowKnots} kt</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dedicated One-Tap Auto-Detect Location Button */}
        {onAutoDetectWaterway && (
          <button
            onClick={onAutoDetectWaterway}
            disabled={isDetectingWaterway}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border shadow-lg backdrop-blur-sm transition-all cursor-pointer ${
              isDetectingWaterway
                ? 'bg-sky-700/80 border-sky-400 text-white animate-pulse'
                : 'bg-slate-900/90 hover:bg-slate-900 text-slate-200 hover:text-white border-slate-700'
            }`}
            title="Automatically detect current river, location, and flow velocity using GPS"
          >
            {isDetectingWaterway ? (
              <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
            ) : (
              <LocateFixed className="w-4 h-4 text-emerald-400" />
            )}
            <span className="hidden sm:inline">
              {isDetectingWaterway ? 'Detecting River...' : 'Auto-Detect'}
            </span>
            {gpsAccuracyMeters && !isDetectingWaterway && (
              <span className="text-[10px] font-mono text-emerald-400 hidden md:inline">
                ±{gpsAccuracyMeters}m
              </span>
            )}
          </button>
        )}
      </div>

      {/* Top Right: Layer Switcher & Current Overlay Toggle */}
      <div className="absolute top-18 md:top-4 right-3 md:right-4 z-20 flex items-center gap-2">
        {/* Toggle Real-time Current Speed Overlay */}
        <button
          onClick={onToggleCurrentsOverlay}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border shadow-lg backdrop-blur-sm transition-all cursor-pointer ${
            showCurrentsOverlay
              ? 'bg-sky-600 border-sky-400 text-white'
              : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:bg-slate-900'
          }`}
          title="Toggle River Current Speed Overlays"
        >
          <Waves className="w-4 h-4" />
          <span className="hidden sm:inline">Current Overlays</span>
        </button>

        {/* Layer Selector */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="p-2 bg-slate-900/90 hover:bg-slate-900 text-white rounded-lg border border-slate-700 shadow-lg backdrop-blur-sm transition-all cursor-pointer"
            title="Chart Layers (Satellite, Nautical Seamarks, Topo, OSM)"
          >
            <Layers className="w-4 h-4 text-sky-400" />
          </button>

          {showLayerMenu && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-30 space-y-1">
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Base Chart Layer
              </div>
              <button
                onClick={() => { setActiveLayerType('satellite'); setShowLayerMenu(false); }}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  activeLayerType === 'satellite' ? 'bg-sky-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Satellite Imagery (HD)
              </button>
              <button
                onClick={() => { setActiveLayerType('nautical'); setShowLayerMenu(false); }}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  activeLayerType === 'nautical' ? 'bg-sky-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Nautical Seamarks
              </button>
              <button
                onClick={() => { setActiveLayerType('topo'); setShowLayerMenu(false); }}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  activeLayerType === 'topo' ? 'bg-sky-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Bathymetry / Topo
              </button>
              <button
                onClick={() => { setActiveLayerType('osm'); setShowLayerMenu(false); }}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  activeLayerType === 'osm' ? 'bg-sky-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Standard River Chart
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Right: Zoom & Center on Boat Controls */}
      <div className="absolute bottom-20 md:bottom-6 right-4 z-20 flex flex-col items-center gap-2">
        {/* Center on Vessel Button */}
        <button
          onClick={handleCenterOnBoat}
          className="p-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl border border-sky-400 shadow-xl cursor-pointer transition-all hover:scale-105"
          title="Center map on vessel"
        >
          <Navigation className="w-5 h-5" />
        </button>

        {/* Zoom In/Out */}
        <div className="flex flex-col bg-slate-900/90 border border-slate-700 rounded-xl shadow-xl backdrop-blur-sm overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="p-2.5 hover:bg-slate-800 text-white transition-colors cursor-pointer border-b border-slate-800"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2.5 hover:bg-slate-800 text-white transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Left: River Current Legend */}
      {showCurrentsOverlay && (
        <div className="absolute bottom-20 md:bottom-6 left-4 z-20 hidden sm:flex items-center gap-3 px-3 py-2 bg-slate-950/85 border border-slate-800 rounded-lg backdrop-blur-sm text-[11px] font-mono text-slate-300">
          <span className="text-slate-400 uppercase font-bold text-[9px]">Current Speed:</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2dd4bf]" />
            <span>&lt; 1 kt (Slack)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
            <span>1-2.5 kt</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]" />
            <span>&gt; 2.5 kt (Swift)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c084fc]" />
            <span>Eddy</span>
          </div>
        </div>
      )}
    </div>
  );
};
