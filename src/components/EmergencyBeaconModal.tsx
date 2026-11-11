import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertOctagon, 
  Copy, 
  Check, 
  Send, 
  Radio, 
  Volume2, 
  VolumeX, 
  MapPin, 
  Compass, 
  Waves, 
  X,
  PhoneCall
} from 'lucide-react';
import { formatCoordinatesDMS } from '../services/currentData';

interface EmergencyBeaconModalProps {
  isOpen: boolean;
  onClose: () => void;
  vesselLat: number;
  vesselLng: number;
  sogKnots: number;
  cogDeg: number;
  depthFt: number;
  riverName: string;
}

export const EmergencyBeaconModal: React.FC<EmergencyBeaconModalProps> = ({
  isOpen,
  onClose,
  vesselLat,
  vesselLng,
  sogKnots,
  cogDeg,
  depthFt,
  riverName,
}) => {
  const [distressNature, setDistressNature] = useState('Grounding / Adrift in Dangerous Current');
  const [copied, setCopied] = useState(false);
  const [isStrobeActive, setIsStrobeActive] = useState(false);
  const [isAudioSosActive, setIsAudioSosActive] = useState(false);
  const [customPhone, setCustomPhone] = useState('911');

  const audioContextRef = useRef<AudioContext | null>(null);
  const sosIntervalRef = useRef<number | null>(null);

  const coords = formatCoordinatesDMS(vesselLat, vesselLng);

  // International VHF Channel 16 MAYDAY Script
  const maydayScript = `MAYDAY, MAYDAY, MAYDAY.
THIS IS PLEASURE CRAFT ON ${riverName.toUpperCase()}.
MMSI / CALLSIGN: RIVER-NAV-LOCAL.
POSITION: ${coords.full} (${vesselLat.toFixed(5)}, ${vesselLng.toFixed(5)}).
NATURE OF DISTRESS: ${distressNature.toUpperCase()}.
CURRENT HEADING: ${Math.round(cogDeg)}° AT ${sogKnots.toFixed(1)} KNOTS. WATER DEPTH: ${depthFt.toFixed(1)} FT.
REQUESTING IMMEDIATE ASSISTANCE. OVER.`;

  const smsText = `EMERGENCY SOS: Boat in distress on ${riverName}. Position: ${coords.full} (https://maps.google.com/?q=${vesselLat},${vesselLng}). Nature: ${distressNature}. SOG: ${sogKnots.toFixed(1)}kt, Depth: ${depthFt.toFixed(1)}ft. Need immediate marine rescue.`;

  // Morse SOS Audio Synthesizer
  const playMorseTone = (durationMs: number) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + durationMs / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {
      // Audio autoplay restrictions fallback
    }
  };

  useEffect(() => {
    if (isAudioSosActive) {
      // Loop SOS pattern: · · · — — — · · ·
      let step = 0;
      const pattern = [
        120, 100, 120, 100, 120, 300, // S
        360, 100, 360, 100, 360, 300, // O
        120, 100, 120, 100, 120, 1000 // S
      ];

      const runPattern = () => {
        if (!isAudioSosActive) return;
        const dur = pattern[step];
        const isTone = step % 2 === 0;
        if (isTone) {
          playMorseTone(dur);
        }
        step = (step + 1) % pattern.length;
        sosIntervalRef.current = window.setTimeout(runPattern, dur);
      };

      runPattern();
    } else {
      if (sosIntervalRef.current) {
        clearTimeout(sosIntervalRef.current);
      }
    }

    return () => {
      if (sosIntervalRef.current) {
        clearTimeout(sosIntervalRef.current);
      }
    };
  }, [isAudioSosActive]);

  const handleCopy = () => {
    navigator.clipboard.writeText(maydayScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSms = () => {
    const encoded = encodeURIComponent(smsText);
    window.location.href = `sms:${customPhone}?body=${encoded}`;
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-md overflow-y-auto ${
      isStrobeActive ? 'bg-red-950/90 animate-pulse' : 'bg-black/85'
    }`}>
      <div className="w-full max-w-2xl bg-slate-950 border-2 border-red-600 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto text-slate-100">
        {/* Distress Header */}
        <div className="px-6 py-4 bg-red-900/60 border-b border-red-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-600 text-white animate-bounce">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-wide">
                  EMERGENCY SOS DISTRESS BEACON
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-red-500 text-white font-bold animate-pulse">
                  Active
                </span>
              </div>
              <p className="text-xs text-red-200">
                Inland Maritime & River Emergency Guidance
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Exact GPS Coordinates Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-400" />
                Vessel Exact Position (WGS-84)
              </span>
              <span className="text-xs font-mono text-sky-400 font-bold">{riverName}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 uppercase">DMS Coordinates (Radio Standard)</div>
                <div className="text-base font-mono font-black text-white tracking-tight mt-0.5">
                  {coords.full}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Decimal Degrees (GPS Link)</div>
                <div className="text-base font-mono font-bold text-sky-300 mt-0.5">
                  {vesselLat.toFixed(6)}, {vesselLng.toFixed(6)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-1">
              <span>SOG: <strong className="text-white">{sogKnots.toFixed(1)} kts</strong></span>
              <span>COG: <strong className="text-white">{Math.round(cogDeg)}° M</strong></span>
              <span>Depth: <strong className="text-white">{depthFt.toFixed(1)} ft</strong></span>
            </div>
          </div>

          {/* Distress Situation Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Distress Situation:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                'Grounding / Adrift in Dangerous Current',
                'Collision / Severe Hull Breach & Taking Water',
                'Engine Breakdown in River Channel',
                'Medical Emergency / Severe Injury',
                'Man Overboard (MOB) in River',
                'Fire / Danger of Exploding',
              ].map(nature => (
                <button
                  key={nature}
                  onClick={() => setDistressNature(nature)}
                  className={`text-left px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                    distressNature === nature
                      ? 'bg-red-600/30 border-red-500 text-white font-semibold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  {nature}
                </button>
              ))}
            </div>
          </div>

          {/* International VHF Ch 16 MAYDAY Script */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-red-400" />
                VHF Channel 16 Broadcast Script (Read aloud on radio)
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-amber-200 whitespace-pre-wrap leading-relaxed select-all">
              {maydayScript}
            </pre>
          </div>

          {/* Audio & Optical Strobe Signals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => setIsAudioSosActive(!isAudioSosActive)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                isAudioSosActive
                  ? 'bg-amber-600 border-amber-400 text-white animate-pulse'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {isAudioSosActive ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isAudioSosActive ? 'Halt Morse SOS Audio' : 'Transmit Morse SOS Audio'}</span>
            </button>

            <button
              onClick={() => setIsStrobeActive(!isStrobeActive)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                isStrobeActive
                  ? 'bg-red-600 border-red-400 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>{isStrobeActive ? 'Stop Optical Beacon' : 'Activate Optical Night Beacon'}</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Emergency SMS Recipient:</span>
            <input
              type="text"
              value={customPhone}
              onChange={(e) => setCustomPhone(e.target.value)}
              className="w-24 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-white"
              placeholder="911"
            />
          </div>

          <button
            onClick={handleSms}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow-lg hover:shadow-red-500/30 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Dispatch Emergency SMS & Location</span>
          </button>
        </div>
      </div>
    </div>
  );
};
