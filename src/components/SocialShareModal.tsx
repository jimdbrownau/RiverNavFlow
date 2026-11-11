import React, { useState } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  MessageSquare, 
  QrCode, 
  X, 
  Compass, 
  Waves, 
  MapPin,
  ExternalLink
} from 'lucide-react';
import { formatCoordinatesDMS } from '../services/currentData';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  vesselLat: number;
  vesselLng: number;
  sogKnots: number;
  cogDeg: number;
  depthFt: number;
  riverName: string;
  trackedDistanceNm: number;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  onClose,
  vesselLat,
  vesselLng,
  sogKnots,
  cogDeg,
  depthFt,
  riverName,
  trackedDistanceNm,
}) => {
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  if (!isOpen) return null;

  const coords = formatCoordinatesDMS(vesselLat, vesselLng);
  const shareUrl = `${window.location.origin}?lat=${vesselLat.toFixed(5)}&lng=${vesselLng.toFixed(5)}&river=${encodeURIComponent(riverName)}`;

  const shareText = `🚤 RiverNav Live Boating Tracker: Navigating on the ${riverName}. Current position: ${coords.full}, SOG: ${sogKnots.toFixed(1)} kt, Course: ${Math.round(cogDeg)}°, Distance logged: ${trackedDistanceNm.toFixed(2)} NM. Track my live trip: ${shareUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `RiverNav Live Boating Progress - ${riverName}`,
          text: shareText,
          url: shareUrl,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2500);
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleSms = () => {
    window.location.href = `sms:?body=${encodeURIComponent(shareText)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Share Live Trip Progress
              </h2>
              <p className="text-xs text-slate-400">
                Let friends & family follow your waterway passage in real-time
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
          {/* Live Progress Card Preview */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-sky-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Vessel Telemetry
              </span>
              <span className="text-xs text-slate-400">{riverName}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-center">
              <div className="p-2 rounded bg-slate-900 border border-slate-850">
                <div className="text-[10px] text-slate-400 uppercase">Speed (SOG)</div>
                <div className="text-base font-bold text-white mt-0.5">{sogKnots.toFixed(1)} kt</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-850">
                <div className="text-[10px] text-slate-400 uppercase">Heading</div>
                <div className="text-base font-bold text-white mt-0.5">{Math.round(cogDeg)}° M</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-850">
                <div className="text-[10px] text-slate-400 uppercase">Distance</div>
                <div className="text-base font-bold text-sky-400 mt-0.5">{trackedDistanceNm.toFixed(2)} NM</div>
              </div>
            </div>

            <div className="text-xs font-mono text-slate-400 flex items-center justify-between pt-1">
              <span>Position: {coords.full}</span>
              <span>Depth: {depthFt.toFixed(1)} ft</span>
            </div>
          </div>

          {/* Quick Sharing Options */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-2 p-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer shadow-md"
            >
              <Share2 className="w-4 h-4" />
              <span>Native Share Sheet</span>
            </button>

            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 p-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer shadow-md"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp / Chat</span>
            </button>
          </div>

          {/* Copy Shareable Link */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400">
              Live Public Share Link:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 truncate select-all"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
