import React from 'react';
import { 
  Battery, 
  BatteryCharging, 
  Zap, 
  Clock, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Moon, 
  X,
  Gauge
} from 'lucide-react';
import { BatteryOptimizationConfig } from '../types/marine';

interface BatterySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  batteryPercent: number | null;
  isCharging: boolean;
  config: BatteryOptimizationConfig;
  onUpdateConfig: (newConfig: BatteryOptimizationConfig) => void;
  isWakeLockActive: boolean;
  onToggleWakeLock: () => void;
}

export const BatterySettingsModal: React.FC<BatterySettingsModalProps> = ({
  isOpen,
  onClose,
  batteryPercent,
  isCharging,
  config,
  onUpdateConfig,
  isWakeLockActive,
  onToggleWakeLock,
}) => {
  if (!isOpen) return null;

  const currentLevel = batteryPercent !== null ? batteryPercent : 85;

  // Runtime estimations based on mode
  const getEstimatedHours = (mode: 'performance' | 'eco' | 'ultra') => {
    const baseHours = (currentLevel / 100) * 5.0; // 5 hours baseline for 100%
    if (mode === 'performance') return (baseHours * 1.0).toFixed(1);
    if (mode === 'eco') return (baseHours * 2.8).toFixed(1);
    return (baseHours * 4.5).toFixed(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Battery className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Battery Optimization & Excursion Mode
              </h2>
              <p className="text-xs text-slate-400">
                Power Management for Extended Waterway Passages
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

        {/* Content */}
        <div className="p-6 space-y-5 text-sm">
          {/* Battery Status Header Strip */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isCharging ? (
                <BatteryCharging className="w-8 h-8 text-emerald-400 animate-pulse" />
              ) : (
                <Battery className="w-8 h-8 text-emerald-400" />
              )}
              <div>
                <div className="text-2xl font-black font-mono tabular-nums text-white">
                  {currentLevel}%
                </div>
                <div className="text-xs text-slate-400">
                  {isCharging ? 'Connected to 12V Boat Power' : 'Running on Internal Battery'}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-mono text-slate-400">Projected Run Time</span>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                ~{getEstimatedHours(config.mode)} hrs
              </div>
            </div>
          </div>

          {/* Mode Selection Cards */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Select Navigation Energy Profile:
            </label>

            {/* Performance Mode */}
            <button
              onClick={() => onUpdateConfig({ ...config, mode: 'performance', gpsThrottlingIntervalMs: 1000, animateCurrents: true })}
              className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                config.mode === 'performance'
                  ? 'bg-sky-500/10 border-sky-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850'
              }`}
            >
              <Zap className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs">Standard High Precision</span>
                  <span className="text-[11px] font-mono text-slate-400">~{getEstimatedHours('performance')} hrs</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  1-second continuous GPS polling, full 60fps current flow animations, continuous 15 pings/s sonar bottom stream.
                </p>
              </div>
            </button>

            {/* Eco Excursion Mode */}
            <button
              onClick={() => onUpdateConfig({ ...config, mode: 'eco', gpsThrottlingIntervalMs: 8000, animateCurrents: false })}
              className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                config.mode === 'eco'
                  ? 'bg-emerald-500/10 border-emerald-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850'
              }`}
            >
              <Gauge className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs">Eco Excursion (Recommended)</span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                      Popular
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">~{getEstimatedHours('eco')} hrs</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Intelligent 8-second GPS throttling with distance-delta threshold, static current vectors, throttled sonar canvas.
                </p>
              </div>
            </button>

            {/* Ultra Saver Mode */}
            <button
              onClick={() => onUpdateConfig({ ...config, mode: 'ultra', gpsThrottlingIntervalMs: 15000, animateCurrents: false })}
              className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                config.mode === 'ultra'
                  ? 'bg-amber-500/10 border-amber-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850'
              }`}
            >
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs">Ultra Passage Saver</span>
                  <span className="text-[11px] font-mono text-amber-400 font-bold">~{getEstimatedHours('ultra')} hrs</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  15-second GPS updates, pauses sonar canvas when speed is low, disables non-essential animations. Best for long days.
                </p>
              </div>
            </button>
          </div>

          {/* Screen Wake Lock & Background Tracking Persistence */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {isWakeLockActive ? (
                  <Unlock className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Lock className="w-4 h-4 text-slate-400" />
                )}
                <div>
                  <div className="text-xs font-semibold text-white">Helm Display Wake Lock</div>
                  <div className="text-[11px] text-slate-400">Keep screen awake while navigating helm mount</div>
                </div>
              </div>

              <button
                onClick={onToggleWakeLock}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  isWakeLockActive ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isWakeLockActive ? 'Active (Awake)' : 'Disabled'}
              </button>
            </div>

            <div className="pt-2 border-t border-slate-850 flex items-start gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span>
                <strong>Background Route Tracking:</strong> Location tracking remains active via high-accuracy background geolocation listeners even if the screen turns off or device is locked.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors cursor-pointer"
          >
            Apply Energy Settings
          </button>
        </div>
      </div>
    </div>
  );
};
