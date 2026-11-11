import { AdminUser, DownloadAccessStatus, DownloadAuditEntry, RiverFleetCluster } from '../types/admin';

const USERS_STORAGE_KEY = 'rivernav_admin_users';
const LOGS_STORAGE_KEY = 'rivernav_admin_audit_logs';

const INITIAL_USERS: AdminUser[] = [
  {
    id: 'usr-admin-1',
    name: 'Jim Brown (Admin)',
    email: 'jimdbrownau@gmail.com',
    role: 'admin',
    vesselName: 'M/Y Pacific Nomad',
    vesselType: 'cruiser',
    vesselMmsi: '338291042',
    downloadAccess: 'granted',
    downloadQuotaMb: 10000,
    downloadUsedMb: 1840,
    downloadPacksCount: 12,
    lastActiveRiver: 'Columbia River',
    lastActiveCity: 'Cascade Locks',
    lastActiveCountry: 'USA',
    lat: 45.618,
    lng: -121.916,
    sogKnots: 6.4,
    cogDeg: 254,
    isOnline: true,
    lastPingTime: Date.now() - 120000,
    licenseKey: 'RNV-ADM-9941-PRO',
  },
  {
    id: 'usr-2',
    name: 'Capt. Marcus Vance',
    email: 'm.vance@pacificmaritime.org',
    role: 'fleet_captain',
    vesselName: 'Columbia Push-Tow 4',
    vesselType: 'tug_tow',
    vesselMmsi: '367129840',
    downloadAccess: 'granted',
    downloadQuotaMb: 8000,
    downloadUsedMb: 3420,
    downloadPacksCount: 18,
    lastActiveRiver: 'Columbia River (Reach)',
    lastActiveCity: 'Portland',
    lastActiveCountry: 'USA',
    lat: 45.589,
    lng: -122.532,
    sogKnots: 7.2,
    cogDeg: 108,
    isOnline: true,
    lastPingTime: Date.now() - 340000,
    licenseKey: 'RNV-NAV-4421-CORP',
  },
  {
    id: 'usr-3',
    name: 'Elena Rostova',
    email: 'elena.rostova@seawind-cruises.com',
    role: 'mariner',
    vesselName: 'S/V Morning Star',
    vesselType: 'sailboat',
    vesselMmsi: '368819230',
    downloadAccess: 'granted',
    downloadQuotaMb: 4000,
    downloadUsedMb: 1200,
    downloadPacksCount: 6,
    lastActiveRiver: 'Willamette River',
    lastActiveCity: 'Portland Harbor',
    lastActiveCountry: 'USA',
    lat: 45.542,
    lng: -122.705,
    sogKnots: 4.8,
    cogDeg: 172,
    isOnline: true,
    lastPingTime: Date.now() - 600000,
    licenseKey: 'RNV-NAV-8193-REC',
  },
  {
    id: 'usr-4',
    name: 'Beau Thibodaux',
    email: 'beau.thibodaux@delta-barge.net',
    role: 'fleet_captain',
    vesselName: 'Bayou Pioneer',
    vesselType: 'tug_tow',
    vesselMmsi: '338771920',
    downloadAccess: 'granted',
    downloadQuotaMb: 12000,
    downloadUsedMb: 7600,
    downloadPacksCount: 32,
    lastActiveRiver: 'Mississippi River (Lower)',
    lastActiveCity: 'New Orleans',
    lastActiveCountry: 'USA',
    lat: 29.951,
    lng: -90.071,
    sogKnots: 8.6,
    cogDeg: 140,
    isOnline: true,
    lastPingTime: Date.now() - 180000,
    licenseKey: 'RNV-FLEET-3301-PRO',
  },
  {
    id: 'usr-5',
    name: 'Julian Hayes',
    email: 'j.hayes@soundcharts.co.uk',
    role: 'surveyor',
    vesselName: 'Thames Hydrographer',
    vesselType: 'commercial',
    vesselMmsi: '235091240',
    downloadAccess: 'granted',
    downloadQuotaMb: 6000,
    downloadUsedMb: 2150,
    downloadPacksCount: 14,
    lastActiveRiver: 'River Thames',
    lastActiveCity: 'Greenwich, London',
    lastActiveCountry: 'UK',
    lat: 51.482,
    lng: -0.007,
    sogKnots: 5.1,
    cogDeg: 84,
    isOnline: true,
    lastPingTime: Date.now() - 420000,
    licenseKey: 'RNV-SURV-1029-UK',
  },
  {
    id: 'usr-6',
    name: 'Chloe Martin',
    email: 'chloe.m@fleuvenav.fr',
    role: 'mariner',
    vesselName: 'Bateau Lumière',
    vesselType: 'cruiser',
    vesselMmsi: '227891040',
    downloadAccess: 'trial',
    downloadQuotaMb: 2000,
    downloadUsedMb: 650,
    downloadPacksCount: 2,
    lastActiveRiver: 'Seine River',
    lastActiveCity: 'Rouen Reach',
    lastActiveCountry: 'France',
    lat: 49.443,
    lng: 1.099,
    sogKnots: 5.6,
    cogDeg: 290,
    isOnline: false,
    lastPingTime: Date.now() - 7200000,
    licenseKey: 'RNV-TRL-9912-FR',
  },
  {
    id: 'usr-7',
    name: 'Lachlan McKay',
    email: 'lmckay@riverferry.com.au',
    role: 'mariner',
    vesselName: 'Moreton Cat',
    vesselType: 'commercial',
    vesselMmsi: '503482910',
    downloadAccess: 'granted',
    downloadQuotaMb: 5000,
    downloadUsedMb: 1980,
    downloadPacksCount: 8,
    lastActiveRiver: 'Brisbane River',
    lastActiveCity: 'Brisbane, QLD',
    lastActiveCountry: 'Australia',
    lat: -27.469,
    lng: 153.025,
    sogKnots: 11.2,
    cogDeg: 42,
    isOnline: true,
    lastPingTime: Date.now() - 90000,
    licenseKey: 'RNV-NAV-7740-AU',
  },
  {
    id: 'usr-8',
    name: 'Travis Campbell',
    email: 'tcampbell@murraypaddle.com.au',
    role: 'mariner',
    vesselName: 'Echuca Pride',
    vesselType: 'cruiser',
    vesselMmsi: '503991230',
    downloadAccess: 'restricted',
    downloadQuotaMb: 3000,
    downloadUsedMb: 2990,
    downloadPacksCount: 15,
    lastActiveRiver: 'Murray River',
    lastActiveCity: 'Echuca, VIC',
    lastActiveCountry: 'Australia',
    lat: -36.126,
    lng: 144.748,
    sogKnots: 4.1,
    cogDeg: 212,
    isOnline: false,
    lastPingTime: Date.now() - 14400000,
    licenseKey: 'RNV-RST-5510-AU',
  },
  {
    id: 'usr-9',
    name: 'Klaus Weber',
    email: 'klaus.weber@rhinesteer.de',
    role: 'fleet_captain',
    vesselName: 'Rhine Express III',
    vesselType: 'tug_tow',
    vesselMmsi: '211489020',
    downloadAccess: 'revoked',
    downloadQuotaMb: 10000,
    downloadUsedMb: 9800,
    downloadPacksCount: 41,
    lastActiveRiver: 'Rhine River',
    lastActiveCity: 'Koblenz',
    lastActiveCountry: 'Germany',
    lat: 50.356,
    lng: 7.599,
    sogKnots: 0.0,
    cogDeg: 0,
    isOnline: false,
    lastPingTime: Date.now() - 86400000,
    licenseKey: 'RNV-RVK-0012-DE',
  },
  {
    id: 'usr-10',
    name: 'Sarah Jennings',
    email: 'sarah.j@hudsonharbor.org',
    role: 'mariner',
    vesselName: 'Hudson Wanderer',
    vesselType: 'sailboat',
    vesselMmsi: '367749010',
    downloadAccess: 'granted',
    downloadQuotaMb: 5000,
    downloadUsedMb: 1450,
    downloadPacksCount: 7,
    lastActiveRiver: 'Hudson River',
    lastActiveCity: 'Beacon / Newburgh',
    lastActiveCountry: 'USA',
    lat: 41.503,
    lng: -73.985,
    sogKnots: 6.2,
    cogDeg: 195,
    isOnline: true,
    lastPingTime: Date.now() - 150000,
    licenseKey: 'RNV-NAV-9042-US',
  },
  {
    id: 'usr-11',
    name: 'Capt. Daniel Ortiz',
    email: 'ortiz@deltasafari.com',
    role: 'mariner',
    vesselName: 'Delta Falcon',
    vesselType: 'skiff',
    vesselMmsi: '338102940',
    downloadAccess: 'granted',
    downloadQuotaMb: 4000,
    downloadUsedMb: 820,
    downloadPacksCount: 4,
    lastActiveRiver: 'Sacramento-San Joaquin Delta',
    lastActiveCity: 'Antioch / Rio Vista',
    lastActiveCountry: 'USA',
    lat: 38.056,
    lng: -121.688,
    sogKnots: 14.5,
    cogDeg: 310,
    isOnline: true,
    lastPingTime: Date.now() - 210000,
    licenseKey: 'RNV-NAV-6612-US',
  },
];

const INITIAL_LOGS: DownloadAuditEntry[] = [
  {
    id: 'log-1',
    userId: 'usr-admin-1',
    userName: 'Jim Brown (Admin)',
    vesselName: 'M/Y Pacific Nomad',
    packName: 'Columbia River Gorge High-Res Bathymetry Pack',
    riverName: 'Columbia River',
    packSizeMb: 142.5,
    timestamp: Date.now() - 1800000,
    location: 'Cascade Locks, OR (45.618°N, -121.916°W)',
    ipAddress: '198.51.100.24',
    status: 'completed',
  },
  {
    id: 'log-2',
    userId: 'usr-2',
    userName: 'Capt. Marcus Vance',
    vesselName: 'Columbia Push-Tow 4',
    packName: 'Lower Columbia Shipping Channel Seamarks Pack',
    riverName: 'Columbia River (Reach)',
    packSizeMb: 188.0,
    timestamp: Date.now() - 4200000,
    location: 'Portland, OR (45.589°N, -122.532°W)',
    ipAddress: '198.51.100.89',
    status: 'completed',
  },
  {
    id: 'log-3',
    userId: 'usr-4',
    userName: 'Beau Thibodaux',
    vesselName: 'Bayou Pioneer',
    packName: 'Mississippi Deep Thalweg Vector Pack',
    riverName: 'Mississippi River',
    packSizeMb: 312.0,
    timestamp: Date.now() - 9600000,
    location: 'New Orleans, LA (29.951°N, -90.071°W)',
    ipAddress: '203.0.113.14',
    status: 'completed',
  },
  {
    id: 'log-4',
    userId: 'usr-9',
    userName: 'Klaus Weber',
    vesselName: 'Rhine Express III',
    packName: 'Middle Rhine High-Density Depth Contours',
    riverName: 'Rhine River',
    packSizeMb: 420.0,
    timestamp: Date.now() - 86400000,
    location: 'Koblenz, Germany (50.356°N, 7.599°E)',
    ipAddress: '198.51.100.198',
    status: 'denied',
  },
  {
    id: 'log-5',
    userId: 'usr-7',
    userName: 'Lachlan McKay',
    vesselName: 'Moreton Cat',
    packName: 'Brisbane Tidal Reach Ferry Corridor Pack',
    riverName: 'Brisbane River',
    packSizeMb: 95.4,
    timestamp: Date.now() - 21600000,
    location: 'Brisbane, QLD (27.469°S, 153.025°E)',
    ipAddress: '139.130.4.5',
    status: 'completed',
  },
];

export class AdminService {
  public static getUsers(): AdminUser[] {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    this.saveUsers(INITIAL_USERS);
    return INITIAL_USERS;
  }

  public static saveUsers(users: AdminUser[]): void {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  public static getAuditLogs(): DownloadAuditEntry[] {
    try {
      const stored = localStorage.getItem(LOGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(INITIAL_LOGS));
    return INITIAL_LOGS;
  }

  public static saveAuditLogs(logs: DownloadAuditEntry[]): void {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
  }

  public static updateUserDownloadAccess(userId: string, newStatus: DownloadAccessStatus): AdminUser | null {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return null;

    users[idx].downloadAccess = newStatus;
    this.saveUsers(users);

    // Log the access change
    const logs = this.getAuditLogs();
    const auditEntry: DownloadAuditEntry = {
      id: `log-perm-${Date.now()}`,
      userId,
      userName: users[idx].name,
      vesselName: users[idx].vesselName,
      packName: `Download Access Status changed to ${newStatus.toUpperCase()}`,
      riverName: users[idx].lastActiveRiver,
      packSizeMb: 0,
      timestamp: Date.now(),
      location: `${users[idx].lastActiveCity}, ${users[idx].lastActiveCountry}`,
      ipAddress: '127.0.0.1 (Admin Console)',
      status: 'completed',
    };
    this.saveAuditLogs([auditEntry, ...logs.slice(0, 49)]);

    return users[idx];
  }

  public static updateUserQuota(userId: string, quotaMb: number): void {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      users[idx].downloadQuotaMb = quotaMb;
      this.saveUsers(users);
    }
  }

  public static addUser(data: {
    name: string;
    email: string;
    role: 'admin' | 'mariner' | 'fleet_captain' | 'surveyor';
    vesselName: string;
    vesselType: 'cruiser' | 'sailboat' | 'tug_tow' | 'skiff' | 'commercial';
    downloadAccess: DownloadAccessStatus;
    downloadQuotaMb: number;
    riverName: string;
    city: string;
    country: string;
    lat: number;
    lng: number;
  }): AdminUser {
    const users = this.getUsers();
    const newUser: AdminUser = {
      id: `usr-${Date.now()}`,
      name: data.name,
      email: data.email,
      role: data.role,
      vesselName: data.vesselName,
      vesselType: data.vesselType,
      downloadAccess: data.downloadAccess,
      downloadQuotaMb: data.downloadQuotaMb,
      downloadUsedMb: 0,
      downloadPacksCount: 0,
      lastActiveRiver: data.riverName,
      lastActiveCity: data.city,
      lastActiveCountry: data.country,
      lat: data.lat,
      lng: data.lng,
      sogKnots: 0,
      cogDeg: 0,
      isOnline: true,
      lastPingTime: Date.now(),
      licenseKey: `RNV-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}-${data.country.substring(0, 2).toUpperCase()}`,
    };

    const updated = [newUser, ...users];
    this.saveUsers(updated);
    return newUser;
  }

  public static deleteUser(userId: string): void {
    const users = this.getUsers();
    this.saveUsers(users.filter(u => u.id !== userId));
  }

  public static updateCurrentUserLocation(lat: number, lng: number, riverName: string): void {
    const users = this.getUsers();
    const adminIdx = users.findIndex(u => u.role === 'admin' || u.email === 'jimdbrownau@gmail.com');
    if (adminIdx !== -1) {
      users[adminIdx].lat = lat;
      users[adminIdx].lng = lng;
      users[adminIdx].lastActiveRiver = riverName;
      users[adminIdx].lastPingTime = Date.now();
      this.saveUsers(users);
    }
  }

  public static recordDownload(packName: string, riverName: string, sizeMb: number, userLat?: number, userLng?: number): DownloadAuditEntry {
    const users = this.getUsers();
    const adminUser = users.find(u => u.role === 'admin') || users[0];

    // Check quota and status
    const isGranted = adminUser.downloadAccess === 'granted' || adminUser.downloadAccess === 'trial';
    const status = isGranted ? 'completed' : 'denied';

    if (isGranted) {
      adminUser.downloadUsedMb += sizeMb;
      adminUser.downloadPacksCount += 1;
      this.saveUsers(users);
    }

    const newLog: DownloadAuditEntry = {
      id: `log-${Date.now()}`,
      userId: adminUser.id,
      userName: adminUser.name,
      vesselName: adminUser.vesselName,
      packName,
      riverName,
      packSizeMb: sizeMb,
      timestamp: Date.now(),
      location: userLat !== undefined && userLng !== undefined 
        ? `${userLat.toFixed(3)}°N, ${userLng.toFixed(3)}°W` 
        : `${adminUser.lastActiveCity}, ${adminUser.lastActiveCountry}`,
      ipAddress: '198.51.100.24',
      status,
    };

    const logs = this.getAuditLogs();
    this.saveAuditLogs([newLog, ...logs.slice(0, 49)]);
    return newLog;
  }

  public static getCurrentUserDownloadStatus(): {
    allowed: boolean;
    status: DownloadAccessStatus;
    usedMb: number;
    quotaMb: number;
    remainingMb: number;
  } {
    const users = this.getUsers();
    const admin = users.find(u => u.role === 'admin') || users[0];
    const allowed = admin.downloadAccess === 'granted' || admin.downloadAccess === 'trial';
    return {
      allowed,
      status: admin.downloadAccess,
      usedMb: admin.downloadUsedMb,
      quotaMb: admin.downloadQuotaMb,
      remainingMb: Math.max(0, admin.downloadQuotaMb - admin.downloadUsedMb),
    };
  }

  public static getRiverFleetClusters(users: AdminUser[]): RiverFleetCluster[] {
    const map = new Map<string, { riverName: string; region: string; userCount: number; activeCount: number; lats: number[]; lngs: number[] }>();

    users.forEach(u => {
      const key = u.lastActiveRiver;
      const existing = map.get(key) || {
        riverName: u.lastActiveRiver,
        region: `${u.lastActiveCity}, ${u.lastActiveCountry}`,
        userCount: 0,
        activeCount: 0,
        lats: [],
        lngs: [],
      };
      existing.userCount += 1;
      if (u.isOnline) existing.activeCount += 1;
      existing.lats.push(u.lat);
      existing.lngs.push(u.lng);
      map.set(key, existing);
    });

    return Array.from(map.values()).map(c => ({
      riverName: c.riverName,
      region: c.region,
      userCount: c.userCount,
      activeNavigatingCount: c.activeCount,
      center: [
        c.lats.reduce((a, b) => a + b, 0) / c.lats.length,
        c.lngs.reduce((a, b) => a + b, 0) / c.lngs.length,
      ],
    }));
  }
}
