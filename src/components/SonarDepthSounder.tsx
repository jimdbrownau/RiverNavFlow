import React, { useEffect, useRef, useState } from 'react';
import { 
  AlertTriangle, 
  Settings2, 
  Volume2, 
  VolumeX, 
  Activity, 
  Thermometer, 
  Anchor, 
  Radio,
  Sliders
} from 'lucide-react';
import { DepthSounderData, MarineVisionMode } from '../types/marine';

interface SonarDepthSounderProps {
  sounderData: DepthSounderData;
  visionMode: MarineVisionMode;
  onUpdateKeelOffset: (offsetFt: number) => void;
  onUpdateAlarmThreshold: (thresholdFt: number) => void;
  isSimulated: boolean;
  onToggleSimulator: () => void;
}

export const SonarDepthSounder: React.FC<SonarDepthSounderProps> = ({
  sounderData,
  visionMode,
  onUpdateKeelOffset,
  onUpdateAlarmThreshold,
  isSimulated,
  onToggleSimulator,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [depthUnit, setDepthUnit] = useState<'ft' | 'm' | 'fth'>('ft');
  const [alarmMuted, setAlarmMuted] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Sounder history buffer for continuous canvas scroll
  const historyBufferRef = useRef<number[]>([]);

  useEffect(() => {
    // Fill buffer if empty
    if (historyBufferRef.current.length === 0) {
      historyBufferRef.current = Array.from({ length: 120 }, () => sounderData.depthFt + (Math.random() * 0.4 - 0.2));
    } else {
      historyBufferRef.current.push(sounderData.depthFt);
      if (historyBufferRef.current.length > 200) {
        historyBufferRef.current.shift();
      }
    }
  }, [sounderData.depthFt]);

  // Sonar Canvas Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Colors based on vision mode
      let bgGradStart = '#070f1e';
      let bgGradEnd = '#030712';
      let gridColor = 'rgba(56, 189, 248, 0.12)';
      let bottomFillStart = 'rgba(2, 132, 199, 0.6)';
      let bottomFillEnd = 'rgba(12, 74, 110, 0.9)';
      let bottomLineColor = '#38bdf8';
      let fishColor = '#34d399';

      if (visionMode === 'red') {
        bgGradStart = '#180303';
        bgGradEnd = '#0a0101';
        gridColor = 'rgba(239, 68, 68, 0.15)';
        bottomFillStart = 'rgba(185, 28, 28, 0.6)';
        bottomFillEnd = 'rgba(127, 29, 29, 0.9)';
        bottomLineColor = '#ef4444';
        fishColor = '#f87171';
      } else if (visionMode === 'amber') {
        bgGradStart = '#1c1003';
        bgGradEnd = '#0c0701';
        gridColor = 'rgba(245, 158, 11, 0.15)';
        bottomFillStart = 'rgba(217, 119, 6, 0.6)';
        bottomFillEnd = 'rgba(146, 64, 14, 0.9)';
        bottomLineColor = '#f59e0b';
        fishColor = '#fbbf24';
      } else if (visionMode === 'day') {
        bgGradStart = '#f0f9ff';
        bgGradEnd = '#e0f2fe';
        gridColor = 'rgba(2, 132, 199, 0.15)';
        bottomFillStart = 'rgba(14, 165, 233, 0.5)';
        bottomFillEnd = 'rgba(3, 105, 161, 0.8)';
        bottomLineColor = '#0284c7';
        fishColor = '#059669';
      }

      // Clear & Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, bgGradStart);
      bgGrad.addColorStop(1, bgGradEnd);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Depth grid scale (0 to 40 ft or dynamic)
      const maxDisplayDepth = 40;
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;

      for (let d = 5; d <= maxDisplayDepth; d += 5) {
        const y = (d / maxDisplayDepth) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        ctx.fillStyle = visionMode === 'day' ? '#0369a1' : 'rgba(255, 255, 255, 0.4)';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillText(`${d}ft`, 8, y - 3);
      }

      // Draw bottom contour curve
      const buffer = historyBufferRef.current;
      if (buffer.length > 1) {
        const step = width / (buffer.length - 1);

        ctx.beginPath();
        ctx.moveTo(0, height);

        for (let i = 0; i < buffer.length; i++) {
          const depth = buffer[i];
          const y = Math.min(height, (depth / maxDisplayDepth) * height);
          const x = i * step;

          if (i === 0) {
            ctx.lineTo(x, y);
          } else {
            const prevDepth = buffer[i - 1];
            const prevY = Math.min(height, (prevDepth / maxDisplayDepth) * height);
            const prevX = (i - 1) * step;
            const midX = (prevX + x) / 2;
            ctx.quadraticCurveTo(prevX, prevY, midX, (prevY + y) / 2);
          }
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        // Fill riverbed
        const bottomGrad = ctx.createLinearGradient(0, height * 0.3, 0, height);
        bottomGrad.addColorStop(0, bottomFillStart);
        bottomGrad.addColorStop(1, bottomFillEnd);
        ctx.fillStyle = bottomGrad;
        ctx.fill();

        // Stroke riverbed surface
        ctx.beginPath();
        for (let i = 0; i < buffer.length; i++) {
          const depth = buffer[i];
          const y = Math.min(height, (depth / maxDisplayDepth) * height);
          const x = i * step;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = bottomLineColor;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // Draw occasional fish returns/arches
      ctx.strokeStyle = fishColor;
      ctx.lineWidth = 2;
      const fishArch = (fx: number, fy: number) => {
        ctx.beginPath();
        ctx.arc(fx, fy, 8, Math.PI * 0.9, Math.PI * 2.1);
        ctx.stroke();
      };

      const now = Date.now();
      const fishX1 = ((now / 40) % (width + 60)) - 30;
      const fishY1 = height * 0.42 + Math.sin(now / 800) * 8;
      fishArch(fishX1, fishY1);

      // Current Transducer Ping Line (right edge)
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(width - 4, 0);
      ctx.lineTo(width - 4, height);
      ctx.stroke();
      ctx.setLineDash([]);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [visionMode]);

  // Convert depth to active unit
  const formatDepth = (depthFt: number) => {
    if (depthUnit === 'm') {
      return (depthFt * 0.3048).toFixed(1);
    }
    if (depthUnit === 'fth') {
      return (depthFt / 6).toFixed(1);
    }
    return depthFt.toFixed(1);
  };

  const isAlarm = sounderData.depthFt < sounderData.shallowAlarmThresholdFt;

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden">
      {/* Sounder Telemetry Banner */}
      <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Depth Big Digits */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
              Echo Sounder Depth
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-5xl font-black font-mono tabular-nums tracking-tight ${
                isAlarm ? 'text-red-500 animate-pulse' : 'text-sky-400'
              }`}>
                {formatDepth(sounderData.depthFt)}
              </span>
              <div className="flex flex-col">
                <span className="text-base font-bold uppercase font-mono text-slate-300">
                  {depthUnit.toUpperCase()}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  offset +{sounderData.keelOffsetFt.toFixed(1)}ft
                </span>
              </div>
            </div>
          </div>

          <div className="h-10 w-px bg-slate-800 hidden sm:block" />

          {/* Water Temperature & Signal */}
          <div className="hidden sm:flex items-center gap-5">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                Water Temp
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Thermometer className="w-4 h-4 text-emerald-400" />
                <span className="text-xl font-bold font-mono tabular-nums text-emerald-400">
                  {sounderData.waterTempF.toFixed(1)}°F
                </span>
                <span className="text-xs text-slate-400">({sounderData.waterTempC.toFixed(1)}°C)</span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                Sonar Signal
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Activity className="w-4 h-4 text-sky-400" />
                <span className="text-xl font-bold font-mono tabular-nums text-sky-300">
                  {sounderData.signalQualityPercent}%
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-400">
                  CHIRP 200kHz
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Shallow Water Alarm Banner */}
        {isAlarm && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-xs font-semibold animate-bounce">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>SHALLOW DEPTH ALERT &lt; {sounderData.shallowAlarmThresholdFt}ft</span>
            <button
              onClick={() => setAlarmMuted(!alarmMuted)}
              className="p-1 hover:bg-red-900 rounded cursor-pointer ml-1"
              title={alarmMuted ? 'Unmute Alarm' : 'Mute Alarm'}
            >
              {alarmMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* Controls: Units, Keel Offset, Settings */}
        <div className="flex items-center gap-2">
          {/* Unit Toggle Buttons */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800">
            <button
              onClick={() => setDepthUnit('ft')}
              className={`px-2 py-1 text-xs font-mono font-medium rounded cursor-pointer transition-colors ${
                depthUnit === 'ft' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              FT
            </button>
            <button
              onClick={() => setDepthUnit('m')}
              className={`px-2 py-1 text-xs font-mono font-medium rounded cursor-pointer transition-colors ${
                depthUnit === 'm' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              M
            </button>
            <button
              onClick={() => setDepthUnit('fth')}
              className={`px-2 py-1 text-xs font-mono font-medium rounded cursor-pointer transition-colors ${
                depthUnit === 'fth' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              FTH
            </button>
          </div>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              showConfig ? 'bg-sky-600 border-sky-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="Configure Sounder & Keel Offset"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Configuration Panel (collapsible) */}
      {showConfig && (
        <div className="px-6 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center gap-6 text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-400">Keel Offset (Draft):</span>
            <input
              type="range"
              min="0"
              max="5"
              step="0.2"
              value={sounderData.keelOffsetFt}
              onChange={(e) => onUpdateKeelOffset(parseFloat(e.target.value))}
              className="w-28 accent-sky-500"
            />
            <span className="font-mono text-sky-400 font-bold">+{sounderData.keelOffsetFt.toFixed(1)} ft</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-400">Shallow Alarm Threshold:</span>
            <input
              type="range"
              min="2"
              max="12"
              step="0.5"
              value={sounderData.shallowAlarmThresholdFt}
              onChange={(e) => onUpdateAlarmThreshold(parseFloat(e.target.value))}
              className="w-28 accent-red-500"
            />
            <span className="font-mono text-red-400 font-bold">&lt; {sounderData.shallowAlarmThresholdFt.toFixed(1)} ft</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Hardware Mode:</span>
            <button
              onClick={onToggleSimulator}
              className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                isSimulated 
                  ? 'bg-amber-600 text-white' 
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {isSimulated ? 'Simulated Transducer (Active)' : 'Bluetooth Transducer'}
            </button>
          </div>
        </div>
      )}

      {/* Sonar Echosounder Canvas Viewport */}
      <div className="relative flex-1 w-full overflow-hidden bg-slate-950">
        <canvas
          ref={canvasRef}
          width={1000}
          height={500}
          className="w-full h-full object-cover"
        />

        {/* Canvas Overlay Labels */}
        <div className="absolute top-3 left-4 pointer-events-none flex flex-col gap-1 text-[11px] font-mono text-sky-300/80 bg-slate-950/60 p-2 rounded backdrop-blur-xs border border-slate-800">
          <div>RIVERBED CONTINUOUS PROFILE</div>
          <div className="text-[9px] text-slate-400">Ping Rate: 15 pings/s · Scroll Rate: 12 kts</div>
        </div>

        <div className="absolute bottom-3 right-4 pointer-events-none text-[11px] font-mono text-slate-400 bg-slate-950/60 px-2 py-1 rounded backdrop-blur-xs border border-slate-800">
          <span>REAL-TIME DUCER RETURN</span>
        </div>
      </div>
    </div>
  );
};
