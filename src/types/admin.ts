export type DownloadAccessStatus = 'granted' | 'restricted' | 'revoked' | 'trial';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'mariner' | 'fleet_captain' | 'surveyor';
  vesselName: string;
  vesselType: 'cruiser' | 'sailboat' | 'tug_tow' | 'skiff' | 'commercial';
  vesselMmsi?: string;
  downloadAccess: DownloadAccessStatus;
  downloadQuotaMb: number;
  downloadUsedMb: number;
  downloadPacksCount: number;
  lastActiveRiver: string;
  lastActiveCity: string;
  lastActiveCountry: string;
  lat: number;
  lng: number;
  sogKnots: number;
  cogDeg: number;
  isOnline: boolean;
  lastPingTime: number;
  accessExpiresAt?: number;
  licenseKey: string;
}

export interface DownloadAuditEntry {
  id: string;
  userId: string;
  userName: string;
  vesselName: string;
  packName: string;
  riverName: string;
  packSizeMb: number;
  timestamp: number;
  location: string;
  ipAddress: string;
  status: 'completed' | 'denied' | 'in_progress';
}

export interface RiverFleetCluster {
  riverName: string;
  region: string;
  userCount: number;
  activeNavigatingCount: number;
  center: [number, number];
}
