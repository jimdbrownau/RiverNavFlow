import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  Users, 
  Shield, 
  MapPin, 
  DownloadCloud, 
  Search, 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  FileDown, 
  Radio, 
  Compass, 
  Sliders, 
  RefreshCw,
  Trash2,
  Lock,
  Unlock,
  Key,
  Globe2,
  Navigation2,
  LogOut,
  KeyRound
} from 'lucide-react';
import { AdminUser, DownloadAccessStatus, DownloadAuditEntry } from '../types/admin';
import { AdminService } from '../services/adminService';
import { AdminAuthService } from '../services/adminAuthService';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVesselLat: number;
  currentVesselLng: number;
  currentRiverName: string;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  currentVesselLat,
  currentVesselLng,
  currentRiverName,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'map' | 'audit'>('overview');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<DownloadAuditEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DownloadAccessStatus>('all');
  
  // New User Form State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserVessel, setNewUserVessel] = useState('');
  const [newUserVesselType, setNewUserVesselType] = useState<'cruiser' | 'sailboat' | 'tug_tow' | 'skiff' | 'commercial'>('cruiser');
  const [newUserRiver, setNewUserRiver] = useState('Columbia River');
  const [newUserCity, setNewUserCity] = useState('Portland');
  const [newUserCountry, setNewUserCountry] = useState('USA');
  const [newUserQuotaMb, setNewUserQuotaMb] = useState(5000);
  const [newUserStatus, setNewUserStatus] = useState<DownloadAccessStatus>('granted');

  // Edit Quota State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editQuotaValue, setEditQuotaValue] = useState<number>(5000);

  // Password change modal state
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError(null);

    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordChangeError('New passwords do not match.');
      return;
    }

    const res = AdminAuthService.changePassword(currentPasswordInput, newPasswordInput);
    if (!res.success) {
      setPasswordChangeError(res.error || 'Failed to update passkey.');
    } else {
      setPasswordChangeSuccess(true);
      setTimeout(() => {
        setShowChangePasswordModal(false);
        setPasswordChangeSuccess(false);
        setCurrentPasswordInput('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
      }, 1400);
    }
  };

  // Leaflet map ref for User Geographic Location Radar tab
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const loadData = () => {
    // Keep admin user's location synced with live vessel coordinates
    AdminService.updateCurrentUserLocation(currentVesselLat, currentVesselLng, currentRiverName);
    const u = AdminService.getUsers();
    const l = AdminService.getAuditLogs();
    setUsers(u);
    setAuditLogs(l);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, currentVesselLat, currentVesselLng, currentRiverName]);

  // Handle status toggle for user
  const handleToggleStatus = (userId: string, currentStatus: DownloadAccessStatus) => {
    const nextStatus: DownloadAccessStatus = 
      currentStatus === 'granted' ? 'revoked' : 'granted';
    AdminService.updateUserDownloadAccess(userId, nextStatus);
    loadData();
  };

  const handleSetStatus = (userId: string, status: DownloadAccessStatus) => {
    AdminService.updateUserDownloadAccess(userId, status);
    loadData();
  };

  const handleSaveQuota = (userId: string) => {
    AdminService.updateUserQuota(userId, editQuotaValue);
    setEditingUserId(null);
    loadData();
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Remove this vessel and user account from fleet registry?')) {
      AdminService.deleteUser(userId);
      loadData();
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    // Approximate coords based on selected river
    let lat = 45.618;
    let lng = -121.916;
    if (newUserRiver.toLowerCase().includes('mississippi')) {
      lat = 29.951; lng = -90.071;
    } else if (newUserRiver.toLowerCase().includes('thames')) {
      lat = 51.482; lng = -0.007;
    } else if (newUserRiver.toLowerCase().includes('brisbane')) {
      lat = -27.469; lng = 153.025;
    } else if (newUserRiver.toLowerCase().includes('hudson')) {
      lat = 41.503; lng = -73.985;
    }

    AdminService.addUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: 'mariner',
      vesselName: newUserVessel.trim() || 'Unassigned Vessel',
      vesselType: newUserVesselType,
      downloadAccess: newUserStatus,
      downloadQuotaMb: newUserQuotaMb,
      riverName: newUserRiver,
      city: newUserCity,
      country: newUserCountry,
      lat,
      lng,
    });

    setShowAddUserModal(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserVessel('');
    loadData();
  };

  // Export audit logs as CSV
  const handleExportCSV = () => {
    const headers = ['Timestamp', 'User', 'Vessel', 'Action / Pack', 'River', 'Size MB', 'Status', 'Location', 'IP'];
    const rows = auditLogs.map(l => [
      new Date(l.timestamp).toISOString(),
      `"${l.userName}"`,
      `"${l.vesselName}"`,
      `"${l.packName}"`,
      `"${l.riverName}"`,
      l.packSizeMb.toFixed(1),
      l.status.toUpperCase(),
      `"${l.location}"`,
      l.ipAddress,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rivernav-fleet-download-audit-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Initialize and update Leaflet Map in "Live User Map Radar" tab
  useEffect(() => {
    if (activeTab !== 'map' || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [30, 0],
        zoom: 2,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 17,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [activeTab]);

  // Update map markers whenever users change or map tab activates
  useEffect(() => {
    if (activeTab !== 'map' || !mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    users.forEach(u => {
      const isGranted = u.downloadAccess === 'granted' || u.downloadAccess === 'trial';
      const markerColor = u.role === 'admin' 
        ? '#38bdf8' 
        : isGranted 
        ? '#34d399' 
        : '#f87171';

      const iconHtml = `
        <div style="
          width: 32px; 
          height: 32px; 
          background: #090d16; 
          border: 2px solid ${markerColor}; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.6);
          color: ${markerColor};
          font-family: monospace;
          font-size: 11px;
          cursor: pointer;
        ">
          ${u.role === 'admin' ? '⚓' : '⛵'}
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'user-radar-pin',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([u.lat, u.lng], { icon: customIcon });

      const popupHtml = `
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; padding: 6px; min-width: 200px;">
          <div style="font-weight: 700; font-size: 13px; color: #0284c7;">${u.vesselName}</div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">Skipper: ${u.name}</div>
          <div style="font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 4px; margin-top: 4px;">
            <strong>Waterway:</strong> ${u.lastActiveRiver}<br/>
            <strong>Coordinates:</strong> ${u.lat.toFixed(4)}°, ${u.lng.toFixed(4)}°<br/>
            <strong>Download Access:</strong> <span style="font-weight: 700; color: ${isGranted ? '#16a34a' : '#dc2626'}">${u.downloadAccess.toUpperCase()}</span><br/>
            <strong>Offline Quota:</strong> ${u.downloadUsedMb} / ${u.downloadQuotaMb} MB (${u.downloadPacksCount} packs)
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      markersLayerRef.current?.addLayer(marker);
    });
  }, [activeTab, users]);

  // Fly to user on map
  const handleFlyToUser = (lat: number, lng: number) => {
    setActiveTab('map');
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([lat, lng], 13, { duration: 1.5 });
      }
    }, 200);
  };

  if (!isOpen) return null;

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.vesselName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lastActiveRiver.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lastActiveCity.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || u.downloadAccess === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate Overview Stats
  const totalUsers = users.length;
  const activeOnline = users.filter(u => u.isOnline).length;
  const grantedCount = users.filter(u => u.downloadAccess === 'granted' || u.downloadAccess === 'trial').length;
  const revokedCount = users.filter(u => u.downloadAccess === 'revoked' || u.downloadAccess === 'restricted').length;
  const totalDownloadedMb = users.reduce((acc, u) => acc + u.downloadUsedMb, 0);
  const totalPacks = users.reduce((acc, u) => acc + u.downloadPacksCount, 0);
  const fleetClusters = AdminService.getRiverFleetClusters(users);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md select-none animate-fade-in">
      <div className="w-full max-w-6xl max-h-[92vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Fleet Administration Console</h2>
                <span className="text-[10px] font-mono font-bold bg-sky-600/30 text-sky-300 px-2 py-0.5 rounded border border-sky-500/40">
                  SUPERUSER ACCESS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                User download access control &amp; worldwide vessel geographic tracking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Authenticated Master Admin Badge */}
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div className="text-left leading-tight">
                <div className="text-[11px] font-mono font-bold text-cyan-300">
                  {AdminAuthService.getActiveSession()?.email || AdminAuthService.getMasterEmail()}
                </div>
                <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                  Root Admin
                </div>
              </div>
            </div>

            {/* Change Master Passkey Button */}
            <button
              onClick={() => {
                setShowChangePasswordModal(true);
                setPasswordChangeError(null);
                setPasswordChangeSuccess(false);
                setCurrentPasswordInput('');
                setNewPasswordInput('');
                setConfirmPasswordInput('');
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700/60"
              title="Change master passkey"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Passkey</span>
            </button>

            {/* Log Out Button */}
            <button
              onClick={() => {
                AdminAuthService.logout();
                onClose();
              }}
              className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Lock admin console and log out"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Log Out</span>
            </button>

            <button
              onClick={loadData}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Refresh live fleet telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close admin dashboard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="px-5 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between gap-4 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>Fleet Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>User Access &amp; Downloads</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                {users.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Navigation2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Vessel Radar</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>Download Logs</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                {auditLogs.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg shadow transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register User</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer"
              title="Export Download & Access Audit CSV"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* TAB 1: OVERVIEW & FLEET METRICS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Primary KPI Ribbon */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Registered Skippers</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-3xl font-black font-mono tabular-nums text-white">{totalUsers}</span>
                    <span className="text-xs text-emerald-400 font-semibold">{activeOnline} active now</span>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Download Access Granted</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-3xl font-black font-mono tabular-nums text-emerald-400">{grantedCount}</span>
                    <span className="text-xs text-slate-400 font-mono">
                      {Math.round((grantedCount / Math.max(1, totalUsers)) * 100)}% of fleet
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Restricted / Revoked</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-3xl font-black font-mono tabular-nums text-rose-400">{revokedCount}</span>
                    <span className="text-xs text-rose-400/80 font-mono">Offline blocked</span>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Total Cached Data</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-3xl font-black font-mono tabular-nums text-sky-400">
                      {(totalDownloadedMb / 1024).toFixed(1)} <span className="text-sm font-normal text-slate-400">GB</span>
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{totalPacks} packs</span>
                  </div>
                </div>
              </div>

              {/* Geographic Distribution by Waterway */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Geographic River Fleet Concentrations</h3>
                    <p className="text-xs text-slate-400">Real-time user vessel distribution across monitored waterways</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('map')}
                    className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View on Full Radar Map</span>
                    <span>&rarr;</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {fleetClusters.map((cluster, idx) => (
                    <div 
                      key={idx}
                      onClick={() => handleFlyToUser(cluster.center[0], cluster.center[1])}
                      className="p-3 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 group-hover:scale-105 transition-transform">
                          <Compass className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                            {cluster.riverName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {cluster.region}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black font-mono text-white tabular-nums">
                          {cluster.userCount} <span className="text-[10px] font-normal text-slate-400">vessels</span>
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono">
                          {cluster.activeNavigatingCount} underway
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Access Control Summary Card */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Download Licensing Policy Engine</h3>
                    <p className="text-xs text-slate-400">
                      Configure baseline restrictions for high-resolution vector and bathymetry tile downloading
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="text-xs font-bold text-sky-400 hover:text-sky-300 cursor-pointer"
                  >
                    Manage User Permissions &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between text-emerald-400 font-bold mb-1">
                      <span>GRANTED USERS</span>
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <p className="text-slate-400 text-[11px] font-sans">
                      Authorized to download unlimited 5NM–20NM offline river tile packs with bathymetry.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between text-amber-400 font-bold mb-1">
                      <span>TRIAL USERS</span>
                      <Sliders className="w-4 h-4" />
                    </div>
                    <p className="text-slate-400 text-[11px] font-sans">
                      Capped at 2,000 MB download quota. Waterway telemetry streams in real-time.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between text-rose-400 font-bold mb-1">
                      <span>REVOKED USERS</span>
                      <Lock className="w-4 h-4" />
                    </div>
                    <p className="text-slate-400 text-[11px] font-sans">
                      Offline downloads locked. Vessel must maintain active satellite or cellular connection.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER ACCESS & DOWNLOAD MANAGEMENT TABLE */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by skipper, vessel name, river, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Status Segmented Filter */}
                <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto">
                  {(['all', 'granted', 'trial', 'restricted', 'revoked'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer capitalize whitespace-nowrap ${
                        statusFilter === st
                          ? 'bg-sky-600 text-white font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* High-Density User Registry Table */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                      <tr>
                        <th className="py-3 px-4">Skipper &amp; Vessel</th>
                        <th className="py-3 px-4">Current Waterway Location</th>
                        <th className="py-3 px-4">Download Access</th>
                        <th className="py-3 px-4">Offline Quota Used</th>
                        <th className="py-3 px-4 text-right">Access Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500 font-mono">
                            No users match current filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map(user => {
                          const isAccessAllowed = user.downloadAccess === 'granted' || user.downloadAccess === 'trial';
                          const quotaPercent = Math.min(100, Math.round((user.downloadUsedMb / Math.max(1, user.downloadQuotaMb)) * 100));

                          return (
                            <tr key={user.id} className="hover:bg-slate-900/60 transition-colors">
                              {/* Skipper & Vessel */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                    user.role === 'admin'
                                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                                      : 'bg-slate-800 text-slate-300'
                                  }`}>
                                    {user.vesselType === 'sailboat' ? '⛵' : user.vesselType === 'tug_tow' ? '🚢' : '⚓'}
                                  </div>
                                  <div>
                                    <div className="font-bold text-white flex items-center gap-1.5">
                                      <span>{user.name}</span>
                                      {user.role === 'admin' && (
                                        <span className="text-[9px] bg-sky-600/30 text-sky-300 px-1 rounded font-mono">
                                          ADMIN
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                      {user.vesselName} · <span className="font-mono text-slate-500">{user.email}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Waterway Location */}
                              <td className="py-3 px-4">
                                <div>
                                  <div className="font-semibold text-slate-200 flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                    <span>{user.lastActiveRiver}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    {user.lastActiveCity}, {user.lastActiveCountry} · <span className="font-mono">{user.lat.toFixed(3)}°, {user.lng.toFixed(3)}°</span>
                                  </div>
                                </div>
                              </td>

                              {/* Download Access Status */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <select
                                    value={user.downloadAccess}
                                    onChange={(e) => handleSetStatus(user.id, e.target.value as DownloadAccessStatus)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer capitalize ${
                                      user.downloadAccess === 'granted'
                                        ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-300'
                                        : user.downloadAccess === 'trial'
                                        ? 'bg-amber-950/60 border-amber-600/50 text-amber-300'
                                        : user.downloadAccess === 'restricted'
                                        ? 'bg-orange-950/60 border-orange-600/50 text-orange-300'
                                        : 'bg-rose-950/60 border-rose-600/50 text-rose-300'
                                    }`}
                                  >
                                    <option value="granted" className="bg-slate-900 text-white">Granted (Full)</option>
                                    <option value="trial" className="bg-slate-900 text-white">Trial (Capped)</option>
                                    <option value="restricted" className="bg-slate-900 text-white">Restricted (Stream Only)</option>
                                    <option value="revoked" className="bg-slate-900 text-white">Revoked (Blocked)</option>
                                  </select>
                                </div>
                              </td>

                              {/* Quota Progress */}
                              <td className="py-3 px-4">
                                <div className="w-36">
                                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                                    <span className="text-white font-bold">{user.downloadUsedMb} MB</span>
                                    <span>/ {user.downloadQuotaMb} MB</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full transition-all ${
                                        quotaPercent > 90 ? 'bg-rose-500' : quotaPercent > 70 ? 'bg-amber-500' : 'bg-sky-500'
                                      }`}
                                      style={{ width: `${quotaPercent}%` }}
                                    />
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    {user.downloadPacksCount} offline packs cached
                                  </div>
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Toggle Button */}
                                  <button
                                    onClick={() => handleToggleStatus(user.id, user.downloadAccess)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                                      isAccessAllowed
                                        ? 'bg-rose-950/50 hover:bg-rose-900 text-rose-300 border border-rose-800'
                                        : 'bg-emerald-950/50 hover:bg-emerald-900 text-emerald-300 border border-emerald-800'
                                    }`}
                                    title={isAccessAllowed ? 'Revoke offline downloading license' : 'Grant offline downloading license'}
                                  >
                                    {isAccessAllowed ? (
                                      <>
                                        <Lock className="w-3 h-3" />
                                        <span>Revoke</span>
                                      </>
                                    ) : (
                                      <>
                                        <Unlock className="w-3 h-3" />
                                        <span>Grant</span>
                                      </>
                                    )}
                                  </button>

                                  {/* Fly to Location on Radar Map */}
                                  <button
                                    onClick={() => handleFlyToUser(user.lat, user.lng)}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                                    title="Locate vessel on Geographic Map Radar"
                                  >
                                    <Navigation2 className="w-3.5 h-3.5 text-sky-400" />
                                  </button>

                                  {/* Delete User */}
                                  {user.role !== 'admin' && (
                                    <button
                                      onClick={() => handleDeleteUser(user.id)}
                                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                      title="Remove vessel from registry"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE GEOGRAPHIC USER LOCATION RADAR (MAP) */}
          {activeTab === 'map' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Worldwide River Fleet Telemetry Radar</span>
                    <span className="text-xs font-mono text-emerald-400">({users.length} vessels tracked)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live geographic positioning of vessels and ski-captains across monitored inland rivers and deltas
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" />
                    <span className="text-slate-300">Admin Vessel</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#34d399]" />
                    <span className="text-slate-300">Download License Active</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f87171]" />
                    <span className="text-slate-300">Access Revoked</span>
                  </div>
                </div>
              </div>

              {/* Map Canvas Frame */}
              <div className="w-full h-[460px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative">
                <div ref={mapContainerRef} className="w-full h-full z-10" />
              </div>

              {/* Fleet Location Roster Quick-Jump */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <div className="text-xs font-bold text-white mb-2">Click to Center on Vessel:</div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => handleFlyToUser(u.lat, u.lng)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <span className="text-sky-400">{u.vesselName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({u.lastActiveCity})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DOWNLOAD AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Offline Pack Download &amp; Security Audit Trail</h3>
                  <p className="text-xs text-slate-400">
                    Comprehensive log of all tile pack requests, geographic origin, and licensing enforcement events
                  </p>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg shadow cursor-pointer transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Download Audit CSV</span>
                </button>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase text-slate-400">
                      <tr>
                        <th className="py-2.5 px-4">Timestamp</th>
                        <th className="py-2.5 px-4">Skipper / Vessel</th>
                        <th className="py-2.5 px-4">Download Pack / Event</th>
                        <th className="py-2.5 px-4">Size</th>
                        <th className="py-2.5 px-4">Origin / Coordinates</th>
                        <th className="py-2.5 px-4">Enforcement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans text-slate-300">
                      {auditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-900/60 transition-colors">
                          <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString()} · {new Date(log.timestamp).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="font-bold text-white">{log.userName}</span>
                            <span className="text-slate-400 text-[11px] block">{log.vesselName}</span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-200">
                            {log.packName}
                          </td>
                          <td className="py-2.5 px-4 font-mono">
                            {log.packSizeMb > 0 ? `${log.packSizeMb.toFixed(1)} MB` : '—'}
                          </td>
                          <td className="py-2.5 px-4 text-[11px] text-slate-400">
                            <div>{log.location}</div>
                            <span className="font-mono text-[10px] text-slate-500">{log.ipAddress}</span>
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              log.status === 'completed'
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                                : 'bg-rose-950/60 text-rose-300 border border-rose-800'
                            }`}>
                              {log.status === 'completed' ? 'Allowed' : 'Blocked'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span>Fleet Status: Nominal</span>
            <span className="opacity-30">·</span>
            <span>Security Rules: Active</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer transition-colors"
          >
            Close Dashboard
          </button>
        </div>
      </div>

      {/* REGISTER NEW USER MODAL POPUP */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4 text-slate-100 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <Plus className="w-4 h-4 text-sky-400" />
                <span>Register New Fleet Vessel &amp; Skipper</span>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Skipper Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Capt. William Drake"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. drake@navmaritime.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Vessel Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. S/V Sea Quest"
                    value={newUserVessel}
                    onChange={(e) => setNewUserVessel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Vessel Type</label>
                  <select
                    value={newUserVesselType}
                    onChange={(e) => setNewUserVesselType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="cruiser">Cruiser / Motor</option>
                    <option value="sailboat">Sailboat / S/V</option>
                    <option value="tug_tow">Tug &amp; Barge Tow</option>
                    <option value="skiff">Skiff / Jet Boat</option>
                    <option value="commercial">Commercial Vessel</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Primary River Waterway</label>
                  <select
                    value={newUserRiver}
                    onChange={(e) => setNewUserRiver(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="Columbia River">Columbia River</option>
                    <option value="Willamette River">Willamette River</option>
                    <option value="Mississippi River">Mississippi River</option>
                    <option value="Hudson River">Hudson River</option>
                    <option value="Sacramento-San Joaquin Delta">Sacramento Delta</option>
                    <option value="River Thames">River Thames (UK)</option>
                    <option value="Brisbane River">Brisbane River (AU)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Initial Download Quota</label>
                  <select
                    value={newUserQuotaMb}
                    onChange={(e) => setNewUserQuotaMb(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value={2000}>2,000 MB (Standard)</option>
                    <option value={5000}>5,000 MB (Extended)</option>
                    <option value={10000}>10,000 MB (Professional)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Download Permission Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewUserStatus('granted')}
                    className={`py-2 px-3 rounded-lg border text-center font-bold cursor-pointer transition-all ${
                      newUserStatus === 'granted'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Granted
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewUserStatus('restricted')}
                    className={`py-2 px-3 rounded-lg border text-center font-bold cursor-pointer transition-all ${
                      newUserStatus === 'restricted'
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Restricted
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg cursor-pointer"
                >
                  Register &amp; Issue License
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Master Passkey Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Change Master Passkey
              </h3>
              <button
                onClick={() => setShowChangePasswordModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5 mt-4 text-xs">
              {passwordChangeError && (
                <div className="p-3 bg-red-950/70 border border-red-500/40 rounded-xl text-red-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{passwordChangeError}</span>
                </div>
              )}

              {passwordChangeSuccess && (
                <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-emerald-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Passkey successfully updated and secured!</span>
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1">Current Master Passkey</label>
                <input
                  type="password"
                  required
                  placeholder="Enter current passkey"
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">New Master Passkey (min 8 characters)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Enter new master passkey"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Confirm New Passkey</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Confirm new master passkey"
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                Master administrator passkey guards all global fleet registries and user map licensing controls.
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordChangeSuccess}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Update Passkey</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
