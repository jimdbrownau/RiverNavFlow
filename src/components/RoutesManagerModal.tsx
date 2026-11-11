import React, { useRef, useState } from 'react';
import { 
  Navigation, 
  Download, 
  Upload, 
  Trash2, 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Compass, 
  Waves, 
  X, 
  FileCode, 
  CheckCircle2,
  BarChart2,
  Sparkles
} from 'lucide-react';
import { RouteTrack, TrackPoint } from '../types/marine';
import { GPXService } from '../services/gpxExporter';
import { TripVisualSummaryReport } from './TripVisualSummaryReport';
import { generateSampleCompletedTrip } from '../services/sampleRoutes';

interface RoutesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedRoutes: RouteTrack[];
  isRecording: boolean;
  isPaused: boolean;
  currentTrackPoints: TrackPoint[];
  trackedDistanceNm: number;
  trackedDurationSec: number;
  onStartTracking: () => void;
  onPauseTracking: () => void;
  onStopTracking: () => void;
  onDeleteRoute: (id: string) => void;
  onLoadRouteOnMap: (route: RouteTrack) => void;
  onImportRoute: (route: RouteTrack) => void;
}

export const RoutesManagerModal: React.FC<RoutesManagerModalProps> = ({
  isOpen,
  onClose,
  savedRoutes,
  isRecording,
  isPaused,
  currentTrackPoints,
  trackedDistanceNm,
  trackedDurationSec,
  onStartTracking,
  onPauseTracking,
  onStopTracking,
  onDeleteRoute,
  onLoadRouteOnMap,
  onImportRoute,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [selectedRouteForReport, setSelectedRouteForReport] = useState<RouteTrack | null>(null);

  if (!isOpen) return null;

  const handleExportGPX = (track: RouteTrack) => {
    GPXService.downloadGPX(track);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const xml = event.target?.result as string;
      const parsed = GPXService.parseGPX(xml);
      if (parsed) {
        onImportRoute(parsed);
        setImportStatus(`Imported "${parsed.name}" (${parsed.points.length} trackpoints, ${parsed.distanceNm} NM)`);
      } else {
        setImportStatus('Invalid GPX file format or no trackpoints found.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const formatDuration = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
    }
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (selectedRouteForReport) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md select-none">
        <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[95vh] h-[90vh]">
          <TripVisualSummaryReport
            route={selectedRouteForReport}
            onBack={() => setSelectedRouteForReport(null)}
            onExportGPX={handleExportGPX}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Saved River Routes & GPX Telemetry
              </h2>
              <p className="text-xs text-slate-400">
                Route Tracking, GPX 1.1 Export & D3 Visual Summary Reports
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const sample = generateSampleCompletedTrip();
                onImportRoute(sample);
                setSelectedRouteForReport(sample);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              title="Inspect Demo Completed Voyage with D3 Charts"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Demo Report</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".gpx"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import GPX</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {importStatus && (
            <div className="p-3 rounded-lg bg-sky-950/40 border border-sky-800 text-sky-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          {/* Active Tracking Status Banner */}
          <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
            isRecording 
              ? 'bg-sky-950/30 border-sky-600/40' 
              : 'bg-slate-950 border-slate-800'
          }`}>
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`} />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  {isRecording ? 'Active Passage Recording' : 'Route Recorder Ready'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-slate-300 mt-1">
                <span>Distance: <strong className="text-sky-400">{trackedDistanceNm.toFixed(2)} NM</strong></span>
                <span>Duration: <strong className="text-white">{formatDuration(trackedDurationSec)}</strong></span>
                <span>Points: <strong className="text-white">{currentTrackPoints.length}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isRecording ? (
                <>
                  <button
                    onClick={onPauseTracking}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    <span>{isPaused ? 'Resume' : 'Pause'}</span>
                  </button>
                  <button
                    onClick={onStopTracking}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Save Route</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={onStartTracking}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-md"
                >
                  <Play className="w-4 h-4" />
                  <span>Start New Tracking</span>
                </button>
              )}
            </div>
          </div>

          {/* Saved Routes List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Saved River Routes History</span>
              <span className="text-xs font-mono text-slate-400">{savedRoutes.length} Routes Saved</span>
            </div>

            {savedRoutes.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl space-y-3">
                <p>No saved routes yet. Start a route recording while navigating to automatically track your river passage and generate D3 visual summary reports.</p>
                <button
                  onClick={() => {
                    const sample = generateSampleCompletedTrip();
                    onImportRoute(sample);
                    setSelectedRouteForReport(sample);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-md transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-200" />
                  <span>Load Sample Trip & View Visual Report</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {savedRoutes.map(route => {
                  const dateStr = new Date(route.startTime).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });

                  return (
                    <div
                      key={route.id}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{route.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">· {dateStr}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 mt-1">
                          <span>Dist: <strong className="text-sky-400">{route.distanceNm.toFixed(2)} NM</strong></span>
                          <span>Avg: <strong className="text-white">{route.avgSpeedKnots.toFixed(1)} kt</strong></span>
                          <span>Max: <strong className="text-white">{route.maxSpeedKnots.toFixed(1)} kt</strong></span>
                          <span>Min Depth: <strong className="text-emerald-400">{route.minDepthFt.toFixed(1)} ft</strong></span>
                          <span>({route.points.length} pts)</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Visual Summary Report Button */}
                        <button
                          onClick={() => setSelectedRouteForReport(route)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 rounded text-xs font-semibold transition-colors cursor-pointer"
                          title="Generate D3 Visual Summary Report"
                        >
                          <BarChart2 className="w-3.5 h-3.5 text-sky-400" />
                          <span>Report</span>
                        </button>
                        <button
                          onClick={() => {
                            onLoadRouteOnMap(route);
                            onClose();
                          }}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded text-xs font-medium transition-colors cursor-pointer"
                          title="Display Route on Chart"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleExportGPX(route)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
                          title="Export standard GPX XML"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>GPX</span>
                        </button>
                        <button
                          onClick={() => onDeleteRoute(route.id)}
                          className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                          title="Delete Route"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
