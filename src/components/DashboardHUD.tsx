import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Compass, 
  Waves, 
  Sun, 
  Moon, 
  Eye, 
  Battery, 
  Share2, 
  DownloadCloud, 
  MapPin, 
  Sliders,
  AlertTriangle,
  Plus,
  Minus,
  X,
  ShieldCheck,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { MarineVisionMode, BatteryOptimizationConfig } from '../types/marine';

interface DashboardHUDProps {
  sogKnots: number;
  cogDeg: number;
  depthFt: number;
  shallowAlarmThresholdFt?: number;
  onUpdateAlarmThreshold?: (thresholdFt: number) => void;
  currentSpeedKnots: number;
  currentDirectionDeg: number;
  isRecording: boolean;
  isPaused: boolean;
  trackedDistanceNm: number;
  trackedDurationSec: number;
  onStartTracking: () => void;
  onPauseTracking: () => void;
  onStopTracking: () => void;
  onQuickMarkWaypoint: () => void;
  visionMode: MarineVisionMode;
  onSetVisionMode: (mode: MarineVisionMode) => void;
  batteryPercent: number | null;
  batteryConfig: BatteryOptimizationConfig;
  onOpenBatterySettings: () => void;
  onOpenOfflineManager: () => void;
  onOpenSocialShare: () => void;
  onOpenSounder?: () => void;
  isOfflineCached: boolean;
}

export const DashboardHUD: React.FC<DashboardHUDProps> = ({
  sogKnots,
  cogDeg,
  depthFt,
  shallowAlarmThresholdFt,
  onUpdateAlarmThreshold,
  currentSpeedKnots,
  currentDirectionDeg,
  isRecording,
  isPaused,
  trackedDistanceNm,
  trackedDurationSec,
  onStartTracking,
  onPauseTracking,
  onStopTracking,
  onQuickMarkWaypoint,
  visionMode,
  onSetVisionMode,
  batteryPercent,
  batteryConfig,
  onOpenBatterySettings,
  onOpenOfflineManager,
  onOpenSocialShare,
  onOpenSounder,
  isOfflineCached,
}) => {
  const [showThresholdPanel, setShowThresholdPanel] = useState(false);
  const [isMobileMinimized, setIsMobileMinimized] = useState(false);

  const threshold = shallowAlarmThresholdFt ?? 4.0;
  const isShallow = depthFt < threshold;
  const isRed = visionMode === 'red';
  const isAmber = visionMode === 'amber';
  const isDay = visionMode === 'day';

  const formatDuration = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
    }
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // High-contrast color styling for bright sunlight and dark conditions
  const overlayThemeClasses = isDay
    ? 'bg-white/98 border-slate-300 text-slate-950 shadow-2xl shadow-slate-900/25 ring-1 ring-slate-900/5'
    : isRed
    ? 'bg-[#150202]/98 border-[#520909] text-red-300 shadow-2xl shadow-red-950/60 ring-1 ring-red-500/20'
    : isAmber
    ? 'bg-[#180e03]/98 border-[#522d09] text-amber-300 shadow-2xl shadow-amber-950/60 ring-1 ring-amber-500/20'
    : 'bg-slate-950/98 border-slate-700/80 text-slate-100 shadow-2xl shadow-black/70 ring-1 ring-white/10';

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. MOBILE SCREEN LAYOUT: High-Contrast Floating Overlay atop Navigation  */}
      {/* Occupies ZERO separate screen height; chart occupies full mobile screen!  */}
      {/* ========================================================================= */}
      <div className="block md:hidden absolute top-2.5 left-2.5 right-2.5 z-30 pointer-events-none select-none">
        {/* Minimized Ultra-Compact Capsule */}
        {isMobileMinimized ? (
          <div className="flex justify-end pointer-events-auto">
            <button
              type="button"
              onClick={() => setIsMobileMinimized(false)}
              className={`flex items-center gap-3 px-3 py-1.5 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${overlayThemeClasses}`}
              title="Expand telemetry dashboard overlay"
            >
              <div className="flex items-center gap-2 text-xs font-mono font-black">
                <span>{sogKnots.toFixed(1)} <span className="text-[10px] opacity-70">kt</span></span>
                <span className="opacity-30">·</span>
                <span>{Math.round(cogDeg)}°</span>
                <span className="opacity-30">·</span>
                <span className={isShallow ? 'text-red-500 font-black animate-pulse' : ''}>
                  {depthFt.toFixed(1)} <span className="text-[10px] opacity-70">ft</span>
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 opacity-70 ml-1" />
            </button>
          </div>
        ) : (
          /* Full At-A-Glance High-Contrast Mobile Navigation Overlay */
          <div className={`pointer-events-auto rounded-2xl border backdrop-blur-md transition-all ${overlayThemeClasses}`}>
            <div className="flex items-center justify-between px-3 py-2">
              {/* Telemetry Metric Pods (Bold, Instant Sunlight Readability) */}
              <div className="flex items-center gap-2.5 sm:gap-4 flex-1">
                {/* SOG Pod */}
                <div className="flex flex-col">
                  <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-widest opacity-60 leading-none">
                    SOG
                  </span>
                  <div className="flex items-baseline mt-0.5">
                    <span className="text-xl sm:text-2xl font-black font-mono tabular-nums leading-none">
                      {sogKnots.toFixed(1)}
                    </span>
                    <span className="text-[10px] font-mono font-bold opacity-60 ml-0.5">kt</span>
                  </div>
                </div>

                <div className="h-7 w-px bg-current opacity-20" />

                {/* COG Pod */}
                <div className="flex flex-col">
                  <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-widest opacity-60 leading-none">
                    COG
                  </span>
                  <div className="flex items-baseline mt-0.5">
                    <span className="text-xl sm:text-2xl font-black font-mono tabular-nums leading-none">
                      {Math.round(cogDeg).toString().padStart(3, '0')}°
                    </span>
                    <span className="text-[10px] font-mono font-bold opacity-60 ml-0.5">M</span>
                  </div>
                </div>

                <div className="h-7 w-px bg-current opacity-20" />

                {/* DEPTH Pod with One-Touch Threshold Settings */}
                <div 
                  onClick={() => setShowThresholdPanel(!showThresholdPanel)}
                  className={`flex flex-col px-1.5 py-0.5 rounded-lg cursor-pointer transition-all ${
                    isShallow
                      ? 'bg-red-600 text-white font-black animate-pulse ring-2 ring-red-400'
                      : 'hover:bg-slate-500/10'
                  }`}
                  title="Depth below transducer. Tap to adjust shallow alarm threshold."
                >
                  <div className="flex items-center gap-1">
                    <span className={`text-[8px] sm:text-[9px] uppercase font-bold tracking-widest leading-none ${isShallow ? 'text-red-100' : 'opacity-60'}`}>
                      DEPTH
                    </span>
                    {isShallow && (
                      <span className="text-[8px] font-black uppercase bg-white text-red-600 px-1 rounded animate-bounce">
                        SHALLOW
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline mt-0.5">
                    <span className={`text-xl sm:text-2xl font-black font-mono tabular-nums leading-none ${isShallow ? 'text-white' : ''}`}>
                      {depthFt.toFixed(1)}
                    </span>
                    <span className={`text-[10px] font-mono font-bold ml-0.5 ${isShallow ? 'text-red-100' : 'opacity-60'}`}>ft</span>
                  </div>
                </div>

                <div className="h-7 w-px bg-current opacity-20" />

                {/* RIVER FLOW Pod */}
                <div className="flex flex-col">
                  <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-widest opacity-60 leading-none">
                    FLOW
                  </span>
                  <div className="flex items-baseline mt-0.5">
                    <span className="text-base sm:text-xl font-black font-mono tabular-nums text-sky-500 dark:text-sky-400 leading-none">
                      {currentSpeedKnots.toFixed(1)}
                    </span>
                    <span className="text-[10px] font-mono font-bold opacity-60 ml-0.5">kt</span>
                  </div>
                </div>
              </div>

              {/* Mobile Quick Navigation Actions */}
              <div className="flex items-center gap-1.5 ml-2 shrink-0">
                {/* One-Tap Waypoint Mark */}
                <button
                  type="button"
                  onClick={onQuickMarkWaypoint}
                  className={`p-2 rounded-xl transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center ${
                    isDay 
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300' 
                      : 'bg-slate-800/80 hover:bg-slate-700 text-emerald-400 border border-slate-700'
                  }`}
                  title="Mark current location as waypoint"
                >
                  <MapPin className="w-4 h-4 text-emerald-500" />
                </button>

                {/* Route Track Toggle */}
                <button
                  type="button"
                  onClick={isRecording ? (isPaused ? onStartTracking : onPauseTracking) : onStartTracking}
                  className={`p-2 rounded-xl transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center border ${
                    isRecording
                      ? 'bg-red-500/15 border-red-500/50 text-red-500'
                      : isDay
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-sky-400 border-slate-700'
                  }`}
                  title={isRecording ? (isPaused ? 'Resume route tracking' : 'Pause tracking') : 'Start route tracking'}
                >
                  {isRecording ? (
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    </div>
                  ) : (
                    <Play className="w-4 h-4 text-emerald-500" />
                  )}
                </button>

                {/* Minimize Overlay Toggle */}
                <button
                  type="button"
                  onClick={() => setIsMobileMinimized(true)}
                  className="p-1 rounded-lg opacity-50 hover:opacity-100 transition-opacity cursor-pointer ml-0.5"
                  title="Minimize telemetry overlay for maximum chart view"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Prominent High-Visibility Shallow Depth Warning Banner on Mobile */}
            {isShallow && (
              <div 
                onClick={onOpenSounder}
                className="mx-2 mb-2 p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-red-600/40 animate-pulse border border-red-300 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-white animate-bounce shrink-0" />
                  <span className="tracking-wide">
                    SHALLOW DEPTH: {depthFt.toFixed(1)} FT &lt; {threshold.toFixed(1)} FT LIMIT
                  </span>
                </div>
                <span className="text-[10px] underline font-sans ml-2 shrink-0">Open Sounder &rarr;</span>
              </div>
            )}
          </div>
        )}

        {/* Easy-Access Threshold Popover (Mobile Positioning) */}
        {showThresholdPanel && (
          <div className="pointer-events-auto mt-2 w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 text-slate-100 space-y-3 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">Shallow Alarm Limit</span>
              </div>
              <button
                onClick={() => setShowThresholdPanel(false)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-mono text-slate-400">Alarm Trigger Level</span>
                <span className="text-xl font-black font-mono text-amber-400 tabular-nums">
                  &lt; {threshold.toFixed(1)} <span className="text-xs font-normal text-slate-400">FT</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onUpdateAlarmThreshold && onUpdateAlarmThreshold(Math.max(1.5, Number((threshold - 0.5).toFixed(1))))}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onUpdateAlarmThreshold && onUpdateAlarmThreshold(Math.min(20.0, Number((threshold + 0.5).toFixed(1))))}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <input
                type="range"
                min="1.5"
                max="15.0"
                step="0.5"
                value={threshold}
                onChange={(e) => onUpdateAlarmThreshold && onUpdateAlarmThreshold(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>1.5 ft (Skiff)</span>
                <span>15.0 ft (Deep Draft)</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-mono text-slate-400">Quick Draft Presets:</span>
              <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
                {[
                  { label: '3.0 ft', val: 3.0 },
                  { label: '4.0 ft', val: 4.0 },
                  { label: '5.0 ft', val: 5.0 },
                  { label: '8.0 ft', val: 8.0 },
                ].map(preset => (
                  <button
                    key={preset.val}
                    onClick={() => {
                      onUpdateAlarmThreshold && onUpdateAlarmThreshold(preset.val);
                      setShowThresholdPanel(false);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-center transition-colors cursor-pointer ${
                      threshold === preset.val
                        ? 'bg-amber-600 text-white font-bold'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP SCREEN LAYOUT: Standard Bridge Telemetry Ribbon               */}
      {/* ========================================================================= */}
      <div className={`hidden md:block border-b px-4 py-2 select-none transition-colors ${
        isDay 
          ? 'bg-slate-100 border-slate-300 text-slate-800' 
          : isRed 
          ? 'bg-[#180303] border-[#450a0a] text-red-200' 
          : isAmber
          ? 'bg-[#1f1103] border-[#452a0a] text-amber-200'
          : 'bg-slate-900/95 border-slate-800 text-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Core Navigation Telemetry */}
          <div className="flex items-center gap-6 flex-wrap">
            {/* SOG */}
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono tracking-wider opacity-60">SOG (Speed)</span>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold font-mono tabular-nums">
                  {sogKnots.toFixed(1)}
                </span>
                <span className="text-[11px] font-mono opacity-60 ml-1">kts</span>
              </div>
            </div>

            <div className="h-7 w-px bg-current opacity-15" />

            {/* COG */}
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono tracking-wider opacity-60">COG (Course)</span>
              <div className="flex items-baseline gap-1">
                <Compass className="w-4 h-4 opacity-70 mt-0.5" />
                <span className="text-2xl font-bold font-mono tabular-nums">
                  {Math.round(cogDeg).toString().padStart(3, '0')}°
                </span>
                <span className="text-[11px] font-mono opacity-60">M</span>
              </div>
            </div>

            <div className="h-7 w-px bg-current opacity-15" />

            {/* Sounder Depth with Easy-Access Threshold Settings */}
            <div className="relative">
              <div 
                className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all select-none ${
                  isShallow 
                    ? 'bg-red-600/30 border-2 border-red-500 text-red-100 shadow-lg shadow-red-600/50 animate-pulse ring-2 ring-red-500/50' 
                    : 'border border-transparent hover:bg-slate-800/40'
                }`}
              >
                <div 
                  onClick={onOpenSounder}
                  className="cursor-pointer"
                  title={isShallow ? `CRITICAL SHALLOW DEPTH ALERT: ${depthFt.toFixed(1)}ft < ${threshold.toFixed(1)}ft safe threshold! Click to open Depth Sounder.` : 'Click to open Depth Sounder'}
                >
                  <span className="text-[10px] uppercase font-mono tracking-wider opacity-60 flex items-center gap-1">
                    Depth
                    {isShallow && <span className="text-[9px] uppercase font-black text-red-400 animate-bounce">· SHALLOW</span>}
                  </span>
                  <div className="flex items-baseline">
                    <span className={`text-2xl font-bold font-mono tabular-nums ${isShallow ? 'text-red-300 font-black' : ''}`}>
                      {depthFt.toFixed(1)}
                    </span>
                    <span className="text-[11px] font-mono opacity-60 ml-1">ft</span>
                  </div>
                </div>

                {/* Easy-Access Threshold Settings Trigger */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowThresholdPanel(!showThresholdPanel);
                  }}
                  className={`p-1.5 rounded-md hover:bg-slate-700/70 transition-colors cursor-pointer ${
                    showThresholdPanel 
                      ? 'bg-sky-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                  title="Quick settings: adjust shallow water alarm threshold without opening sounder view"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Desktop Threshold Settings Panel Popover */}
              {showThresholdPanel && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 z-50 text-slate-100 space-y-3 backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white">Shallow Alarm Limit</span>
                    </div>
                    <button
                      onClick={() => setShowThresholdPanel(false)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-mono text-slate-400">Alarm Trigger Level</span>
                      <span className="text-xl font-black font-mono text-amber-400 tabular-nums">
                        &lt; {threshold.toFixed(1)} <span className="text-xs font-normal text-slate-400">FT</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onUpdateAlarmThreshold && onUpdateAlarmThreshold(Math.max(1.5, Number((threshold - 0.5).toFixed(1))))}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 transition-colors cursor-pointer"
                        title="Decrease by 0.5 ft"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onUpdateAlarmThreshold && onUpdateAlarmThreshold(Math.min(20.0, Number((threshold + 0.5).toFixed(1))))}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 transition-colors cursor-pointer"
                        title="Increase by 0.5 ft"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <input
                      type="range"
                      min="1.5"
                      max="15.0"
                      step="0.5"
                      value={threshold}
                      onChange={(e) => onUpdateAlarmThreshold && onUpdateAlarmThreshold(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>1.5 ft (Skiff)</span>
                      <span>15.0 ft (Deep Draft)</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-mono text-slate-400">River Draft Presets:</span>
                    <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
                      {[
                        { label: '3.0 ft', val: 3.0 },
                        { label: '4.0 ft', val: 4.0 },
                        { label: '5.0 ft', val: 5.0 },
                        { label: '8.0 ft', val: 8.0 },
                      ].map(preset => (
                        <button
                          key={preset.val}
                          onClick={() => onUpdateAlarmThreshold && onUpdateAlarmThreshold(preset.val)}
                          className={`py-1 px-1.5 rounded text-center transition-colors cursor-pointer ${
                            threshold === preset.val
                              ? 'bg-amber-600 text-white font-bold'
                              : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={`p-2 rounded-lg text-xs font-mono flex items-center gap-2 ${
                    isShallow
                      ? 'bg-rose-950/60 border border-rose-800 text-rose-300'
                      : 'bg-emerald-950/40 border border-emerald-800 text-emerald-300'
                  }`}>
                    {isShallow ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
                        <div className="leading-tight">
                          <div className="font-bold">ALARM ACTIVE</div>
                          <div className="text-[10px] opacity-90">{depthFt.toFixed(1)}ft is shallower than {threshold.toFixed(1)}ft</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div className="leading-tight">
                          <div className="font-bold">SAFE CLEARANCE</div>
                          <div className="text-[10px] opacity-90">+{(depthFt - threshold).toFixed(1)}ft margin above alarm limit</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Prominent Visual Depth Alarm Flasher Indicator */}
            {isShallow && (
              <button
                onClick={onOpenSounder}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-xl shadow-red-600/60 border-2 border-red-200 animate-pulse transition-all cursor-pointer whitespace-nowrap"
                title="Depth is below shallow safe margin! Click to inspect active Sonar Depth Sounder."
              >
                <AlertTriangle className="w-4 h-4 text-white animate-bounce shrink-0" />
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-[11px] font-black tracking-wider flex items-center gap-1 text-white">
                    SHALLOW WATER ALARM
                  </span>
                  <span className="text-[10px] font-mono text-red-100 font-semibold">
                    {depthFt.toFixed(1)} FT &lt; {threshold.toFixed(1)} FT LIMIT
                  </span>
                </div>
              </button>
            )}

            <div className="h-7 w-px bg-current opacity-15" />

            {/* River Current Overlay Telemetry */}
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono tracking-wider opacity-60">River Flow</span>
              <div className="flex items-baseline gap-1">
                <Waves className="w-3.5 h-3.5 opacity-70 text-sky-400" />
                <span className="text-xl font-bold font-mono tabular-nums text-sky-400">
                  {currentSpeedKnots.toFixed(1)}
                </span>
                <span className="text-[11px] font-mono opacity-60">kt</span>
                <span className="text-[11px] font-mono opacity-50 ml-1">@{Math.round(currentDirectionDeg)}°</span>
              </div>
            </div>
          </div>

          {/* Desktop Tracking Controls & Utilities */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Trip Tracker Strip */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono ${
              isRecording 
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' 
                : isDay 
                ? 'bg-white border-slate-300 text-slate-700' 
                : 'bg-slate-800/80 border-slate-700 text-slate-300'
            }`}>
              {isRecording ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span>{trackedDistanceNm.toFixed(2)} NM</span>
                  <span className="opacity-40">·</span>
                  <span>{formatDuration(trackedDurationSec)}</span>
                  <button
                    onClick={onPauseTracking}
                    className="p-1 hover:bg-slate-700/50 rounded cursor-pointer"
                    title={isPaused ? 'Resume tracking' : 'Pause tracking'}
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                  <button
                    onClick={onStopTracking}
                    className="p-1 hover:bg-slate-700/50 rounded cursor-pointer"
                    title="Finish and save route"
                  >
                    <Square className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </>
              ) : (
                <button
                  onClick={onStartTracking}
                  className="flex items-center gap-1.5 font-medium hover:text-sky-400 transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Track Route</span>
                </button>
              )}
            </div>

            {/* Quick Mark Location */}
            <button
              onClick={onQuickMarkWaypoint}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                isDay 
                  ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50' 
                  : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
              title="Mark current boat position as favorite waypoint"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mark Location</span>
            </button>

            {/* Battery Status & Optimizer */}
            <button
              onClick={onOpenBatterySettings}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded-lg border transition-colors cursor-pointer ${
                batteryConfig.mode !== 'performance' ? 'border-emerald-500/40 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
              title={`Battery Mode: ${batteryConfig.mode.toUpperCase()}`}
            >
              <Battery className="w-4 h-4 text-emerald-400" />
              <span className="tabular-nums">{batteryPercent !== null ? `${batteryPercent}%` : 'ECO'}</span>
            </button>

            {/* Offline Cache Status */}
            <button
              onClick={onOpenOfflineManager}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                isOfflineCached 
                  ? 'border-sky-500/40 text-sky-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
              title="Offline Map & Tile Manager"
            >
              <DownloadCloud className="w-4 h-4" />
              <span className="text-[11px]">Offline</span>
            </button>

            {/* Share Live Trip */}
            <button
              onClick={onOpenSocialShare}
              className="p-1.5 rounded-lg border border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors cursor-pointer"
              title="Share Live Trip Progress"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Vision Modes Switcher */}
            <div className="flex items-center p-0.5 rounded-lg bg-black/20 border border-slate-700/50">
              <button
                onClick={() => onSetVisionMode('day')}
                className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                  visionMode === 'day' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Daylight High Contrast"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onSetVisionMode('night')}
                className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                  visionMode === 'night' ? 'bg-slate-700 text-sky-300 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Night Mode"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onSetVisionMode('red')}
                className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                  visionMode === 'red' ? 'bg-red-950 text-red-400 border border-red-800' : 'text-red-700 hover:text-red-400'
                }`}
                title="Scotopic Red Night Vision"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onSetVisionMode('amber')}
                className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                  visionMode === 'amber' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'text-amber-700 hover:text-amber-400'
                }`}
                title="Scotopic Amber Radar Vision"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
