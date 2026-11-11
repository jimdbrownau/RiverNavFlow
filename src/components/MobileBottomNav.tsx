import React from 'react';
import { Compass, Waves, MapPin, Navigation, Radio } from 'lucide-react';
import { MarineVisionMode } from '../types/marine';

interface MobileBottomNavProps {
  activeView: 'map' | 'sounder' | 'waypoints' | 'routes' | 'hardware';
  onSelectView: (view: 'map' | 'sounder' | 'waypoints' | 'routes' | 'hardware') => void;
  visionMode: MarineVisionMode;
  depthFt?: number;
  shallowAlarmActive?: boolean;
  waypointsCount?: number;
  isRecordingRoute?: boolean;
  connectedHardwareCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  onSelectView,
  visionMode,
  depthFt,
  shallowAlarmActive = false,
  waypointsCount = 0,
  isRecordingRoute = false,
  connectedHardwareCount = 0,
}) => {
  const isRed = visionMode === 'red';
  const isAmber = visionMode === 'amber';
  const isDay = visionMode === 'day';

  return (
    <nav
      aria-label="Mobile Navigation Bar"
      className={`fixed bottom-0 left-0 right-0 z-40 md:hidden h-14 border-t px-2 flex items-center justify-around select-none backdrop-blur-md transition-colors ${
        isDay
          ? 'bg-white/95 border-slate-200 text-slate-700 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]'
          : isRed
          ? 'bg-[#150202]/95 border-[#450a0a] text-red-400 shadow-[0_-4px_12px_rgba(239,68,68,0.1)]'
          : isAmber
          ? 'bg-[#180e03]/95 border-[#452a0a] text-amber-300 shadow-[0_-4px_12px_rgba(245,158,11,0.1)]'
          : 'bg-slate-950/95 border-slate-800 text-slate-300 shadow-[0_-4px_12px_rgba(0,0,0,0.4)]'
      }`}
    >
      {/* 1. Nautical Chart */}
      <button
        type="button"
        onClick={() => onSelectView('map')}
        className={`flex-1 flex flex-col items-center justify-center h-full min-w-[48px] min-h-[48px] py-1 transition-all cursor-pointer ${
          activeView === 'map'
            ? isDay
              ? 'text-sky-600 font-bold'
              : isRed
              ? 'text-red-300 font-bold'
              : isAmber
              ? 'text-amber-200 font-bold'
              : 'text-sky-400 font-bold'
            : 'opacity-70 hover:opacity-100'
        }`}
      >
        <div className="relative">
          <Compass className={`w-5 h-5 ${activeView === 'map' ? 'scale-110' : ''}`} />
          {activeView === 'map' && (
            <span
              className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                isDay ? 'bg-sky-600' : isRed ? 'bg-red-400' : isAmber ? 'bg-amber-400' : 'bg-sky-400'
              }`}
            />
          )}
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">Chart</span>
      </button>

      {/* 2. Depth Sounder */}
      <button
        type="button"
        onClick={() => onSelectView('sounder')}
        className={`flex-1 flex flex-col items-center justify-center h-full min-w-[48px] min-h-[48px] py-1 transition-all cursor-pointer relative ${
          shallowAlarmActive
            ? 'text-red-500 animate-pulse font-black'
            : activeView === 'sounder'
            ? isDay
              ? 'text-sky-600 font-bold'
              : isRed
              ? 'text-red-300 font-bold'
              : isAmber
              ? 'text-amber-200 font-bold'
              : 'text-sky-400 font-bold'
            : 'opacity-70 hover:opacity-100'
        }`}
      >
        <div className="relative">
          <Waves className={`w-5 h-5 ${activeView === 'sounder' ? 'scale-110' : ''}`} />
          {depthFt !== undefined && (
            <span
              className={`absolute -top-1 -right-3 text-[9px] font-mono px-1 rounded ${
                shallowAlarmActive
                  ? 'bg-red-600 text-white font-bold animate-bounce'
                  : isDay
                  ? 'bg-slate-200 text-slate-800'
                  : 'bg-slate-800 text-sky-300'
              }`}
            >
              {depthFt.toFixed(0)}′
            </span>
          )}
          {activeView === 'sounder' && !shallowAlarmActive && (
            <span
              className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                isDay ? 'bg-sky-600' : isRed ? 'bg-red-400' : isAmber ? 'bg-amber-400' : 'bg-sky-400'
              }`}
            />
          )}
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">
          {shallowAlarmActive ? 'Shallow!' : 'Sounder'}
        </span>
      </button>

      {/* 3. Waypoints */}
      <button
        type="button"
        onClick={() => onSelectView('waypoints')}
        className={`flex-1 flex flex-col items-center justify-center h-full min-w-[48px] min-h-[48px] py-1 transition-all cursor-pointer ${
          activeView === 'waypoints'
            ? isDay
              ? 'text-sky-600 font-bold'
              : isRed
              ? 'text-red-300 font-bold'
              : isAmber
              ? 'text-amber-200 font-bold'
              : 'text-sky-400 font-bold'
            : 'opacity-70 hover:opacity-100'
        }`}
      >
        <div className="relative">
          <MapPin className="w-5 h-5" />
          {waypointsCount > 0 && (
            <span className="absolute -top-1 -right-2 text-[9px] font-mono px-1 rounded bg-emerald-600 text-white font-bold leading-tight">
              {waypointsCount}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">Points</span>
      </button>

      {/* 4. Routes */}
      <button
        type="button"
        onClick={() => onSelectView('routes')}
        className={`flex-1 flex flex-col items-center justify-center h-full min-w-[48px] min-h-[48px] py-1 transition-all cursor-pointer ${
          isRecordingRoute
            ? 'text-red-500 font-bold'
            : activeView === 'routes'
            ? isDay
              ? 'text-sky-600 font-bold'
              : isRed
              ? 'text-red-300 font-bold'
              : isAmber
              ? 'text-amber-200 font-bold'
              : 'text-sky-400 font-bold'
            : 'opacity-70 hover:opacity-100'
        }`}
      >
        <div className="relative">
          <Navigation className="w-5 h-5" />
          {isRecordingRoute && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900 animate-ping" />
          )}
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">
          {isRecordingRoute ? 'Recording' : 'Routes'}
        </span>
      </button>

      {/* 5. Hardware */}
      <button
        type="button"
        onClick={() => onSelectView('hardware')}
        className={`flex-1 flex flex-col items-center justify-center h-full min-w-[48px] min-h-[48px] py-1 transition-all cursor-pointer ${
          activeView === 'hardware'
            ? isDay
              ? 'text-sky-600 font-bold'
              : isRed
              ? 'text-red-300 font-bold'
              : isAmber
              ? 'text-amber-200 font-bold'
              : 'text-sky-400 font-bold'
            : 'opacity-70 hover:opacity-100'
        }`}
      >
        <div className="relative">
          <Radio className="w-5 h-5" />
          {connectedHardwareCount > 0 && (
            <span className="absolute -top-0.5 -right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-white" />
          )}
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">Devices</span>
      </button>
    </nav>
  );
};
