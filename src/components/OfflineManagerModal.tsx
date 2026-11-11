import React, { useState, useEffect } from 'react';
import { 
  DownloadCloud, 
  Trash2, 
  CheckCircle, 
  WifiOff, 
  Wifi, 
  HardDrive, 
  AlertCircle, 
  X,
  Compass
} from 'lucide-react';
import { OfflineTileManager, OfflineCacheStats } from '../services/offlineCache';
import { AdminService } from '../services/adminService';
import { FirestoreSyncService } from '../services/firestoreSyncService';

interface OfflineManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  vesselLat: number;
  vesselLng: number;
  riverName: string;
  isOfflineModeForced: boolean;
  onToggleForceOffline: () => void;
  onCacheUpdated: () => void;
}

export const OfflineManagerModal: React.FC<OfflineManagerModalProps> = ({
  isOpen,
  onClose,
  vesselLat,
  vesselLng,
  riverName,
  isOfflineModeForced,
  onToggleForceOffline,
  onCacheUpdated,
}) => {
  const [stats, setStats] = useState<OfflineCacheStats>({ tileCount: 0, estimatedSizeMb: 0, lastUpdated: 0 });
  const [radiusMiles, setRadiusMiles] = useState(5);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState(AdminService.getCurrentUserDownloadStatus());

  const loadStats = async () => {
    const s = await OfflineTileManager.getCacheStats();
    setStats(s);
    setDownloadStatus(AdminService.getCurrentUserDownloadStatus());
  };

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  const handleStartCaching = async () => {
    const currentPerms = AdminService.getCurrentUserDownloadStatus();
    if (!currentPerms.allowed) {
      setMessage(`Access Denied: Your offline pack downloading permissions are currently ${currentPerms.status.toUpperCase()} by fleet administration. Please contact your administrator to grant download authorization.`);
      return;
    }

    setIsDownloading(true);
    setProgress({ current: 0, total: 100 });
    setMessage(null);

    try {
      const res = await OfflineTileManager.cacheRiverReach(
        vesselLat, 
        vesselLng, 
        radiusMiles,
        (current, total) => {
          setProgress({ current, total });
        }
      );
      
      const estimatedPackMb = Number((res.cachedCount * 0.05).toFixed(1));
      const packName = `${riverName} ${radiusMiles}NM High-Res Nautical Pack`;
      AdminService.recordDownload(
        packName,
        riverName,
        estimatedPackMb,
        vesselLat,
        vesselLng
      );

      FirestoreSyncService.recordDownloadLog({
        id: `audit-${Date.now()}`,
        userId: 'current-user',
        userName: 'Skipper',
        vesselName: 'M/Y Pacific Nomad',
        packName,
        riverName,
        packSizeMb: estimatedPackMb,
        timestamp: Date.now(),
        location: `${vesselLat.toFixed(3)}°, ${vesselLng.toFixed(3)}°`,
        ipAddress: '127.0.0.1 (Local Terminal)',
        status: 'completed'
      }).catch(() => {});

      setMessage(`Successfully cached ${res.cachedCount} nautical tiles for ${riverName}!`);
      await loadStats();
      onCacheUpdated();
    } catch (err: any) {
      setMessage(`Cache Error: ${err.message || 'Failed to download tiles'}`);
    } finally {
      setIsDownloading(false);
      setProgress(null);
    }
  };


  const handlePurge = async () => {
    if (window.confirm('Purge all offline cached nautical map tiles?')) {
      await OfflineTileManager.purgeCache();
      await loadStats();
      setMessage('Offline tile cache purged successfully.');
      onCacheUpdated();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <DownloadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Offline Nautical Tile Cache
              </h2>
              <p className="text-xs text-slate-400">
                Remote River Navigation & Zero-Signal Operation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-sm">
          {/* Download Access Permission Status Bar */}
          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono ${
            downloadStatus.allowed
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/60 border-rose-800 text-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${downloadStatus.allowed ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'}`} />
              <span>FLEET DOWNLOAD LICENSE: <strong className="uppercase">{downloadStatus.status}</strong></span>
            </div>
            <span className="text-[11px] opacity-80 font-mono">
              Used: {downloadStatus.usedMb} / {downloadStatus.quotaMb} MB
            </span>
          </div>

          {/* Storage Telemetry Cards */}
          <div className="grid grid-cols-3 gap-3">

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col">
              <span className="text-[10px] uppercase font-mono text-slate-400">Cached Tiles</span>
              <span className="text-xl font-bold font-mono text-sky-400 mt-1">
                {stats.tileCount}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col">
              <span className="text-[10px] uppercase font-mono text-slate-400">Disk Used</span>
              <span className="text-xl font-bold font-mono text-white mt-1">
                {stats.estimatedSizeMb} <span className="text-xs font-normal text-slate-400">MB</span>
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col">
              <span className="text-[10px] uppercase font-mono text-slate-400">Status</span>
              <span className={`text-xs font-bold font-mono mt-2 ${stats.tileCount > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                {stats.tileCount > 0 ? 'READY OFFLINE' : 'NO TILES'}
              </span>
            </div>
          </div>

          {/* Download Corridor Control */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Cache Corridor: <strong className="text-white">{riverName}</strong>
              </span>
              <span className="text-xs font-mono text-sky-400">{radiusMiles} Nautical Miles</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Radius:</span>
              <div className="flex items-center gap-2">
                {[3, 5, 10, 15].map(r => (
                  <button
                    key={r}
                    onClick={() => setRadiusMiles(r)}
                    className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                      radiusMiles === r ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {r} NM
                  </button>
                ))}
              </div>
            </div>

            {progress && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span>Downloading Nautical Tiles...</span>
                  <span>{progress.current} / {progress.total}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-sky-500 transition-all duration-200"
                    style={{ width: `${(progress.current / Math.max(1, progress.total)) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleStartCaching}
              disabled={isDownloading}
              className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isDownloading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow-md'
              }`}
            >
              <DownloadCloud className="w-4 h-4" />
              <span>{isDownloading ? 'Caching Nautical Reach...' : `Download ${radiusMiles} NM River Reach for Offline`}</span>
            </button>
          </div>

          {message && (
            <div className="p-3 rounded-lg bg-sky-950/40 border border-sky-800 text-sky-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* Offline Simulation Mode Switch */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-3">
              {isOfflineModeForced ? (
                <WifiOff className="w-5 h-5 text-amber-400" />
              ) : (
                <Wifi className="w-5 h-5 text-emerald-400" />
              )}
              <div>
                <div className="text-xs font-semibold text-white">Simulate Disconnected Offline Mode</div>
                <div className="text-[11px] text-slate-400">Test how the chartplotter behaves without cell coverage</div>
              </div>
            </div>

            <button
              onClick={onToggleForceOffline}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                isOfflineModeForced ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isOfflineModeForced ? 'Offline Mode ON' : 'Online Mode'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handlePurge}
            disabled={stats.tileCount === 0}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge Cached Tiles</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
