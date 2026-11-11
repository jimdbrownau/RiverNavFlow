export type MarineVisionMode = 'day' | 'night' | 'red' | 'amber';

export type MapLayerType = 'satellite' | 'nautical' | 'topo' | 'osm';

export type WaypointCategory = 
  | 'anchorage' 
  | 'ramp' 
  | 'fuel' 
  | 'hazard' 
  | 'marina' 
  | 'fishing' 
  | 'lock';

export interface Waypoint {
  id: string;
  name: string;
  category: WaypointCategory;
  lat: number;
  lng: number;
  depthFt?: number;
  notes?: string;
  createdAt: number;
}

export interface TrackPoint {
  lat: number;
  lng: number;
  time: number;
  speedKnots: number;
  headingDeg: number;
  depthFt: number;
}

export interface RouteTrack {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  points: TrackPoint[];
  distanceNm: number;
  maxSpeedKnots: number;
  avgSpeedKnots: number;
  minDepthFt: number;
}

export interface CurrentVector {
  id: string;
  lat: number;
  lng: number;
  speedKnots: number;
  directionDeg: number; // direction current is flowing towards
  classification: 'slack' | 'moderate' | 'strong' | 'eddy';
  name?: string;
}

export interface DepthSounderData {
  depthFt: number;
  depthMeters: number;
  waterTempF: number;
  waterTempC: number;
  transducerStatus: 'connected' | 'simulated' | 'disconnected';
  signalQualityPercent: number;
  keelOffsetFt: number;
  shallowAlarmThresholdFt: number;
  isShallowAlarmActive: boolean;
  history: { time: number; depthFt: number }[];
}

export interface HardwareDevice {
  id: string;
  name: string;
  type: 'gps' | 'sounder' | 'combo';
  connected: boolean;
  batteryPercent?: number;
  firmware?: string;
  lastSentence?: string;
}

export interface BatteryOptimizationConfig {
  mode: 'performance' | 'eco' | 'ultra';
  gpsThrottlingIntervalMs: number;
  enableWakeLock: boolean;
  animateCurrents: boolean;
  dimDisplay: boolean;
}

export interface RiverPreset {
  id: string;
  name: string;
  region: string;
  center: [number, number];
  zoom: number;
  description: string;
  averageFlowKnots: number;
}
