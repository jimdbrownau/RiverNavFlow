import React from 'react';
import { AlertTriangle, CheckCircle, Compass, ShieldAlert, Waves } from 'lucide-react';

interface TermsDisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onClose?: () => void;
  isReviewOnly?: boolean;
}

export const TermsDisclaimerModal: React.FC<TermsDisclaimerModalProps> = ({
  isOpen,
  onAccept,
  onClose,
  isReviewOnly = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">
              Notice to Mariners & Terms of Limitation
            </h2>
            <p className="text-xs text-slate-400">
              RiverNav Nautical Electronic Chart System (ECS)
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-sm text-slate-300 overflow-y-auto max-h-[60vh]">
          <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-900/40 text-amber-200/90 text-xs flex gap-3">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              Navigating rivers entails volatile hazards including shifting sandbars, submerged wing dams, swift cross-currents, floating drift logs, and commercial barge tows.
            </span>
          </div>

          <p>
            Before proceeding, please review and acknowledge the core operational limitations of this navigation application:
          </p>

          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-sky-400 font-bold">•</span>
              <span><strong>Electronic Navigation Aid:</strong> This application is intended strictly as a supplementary situational awareness tool. It does not replace official government hydrographic charts, visual lookout, active depth sounders, or prudent seamanship.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sky-400 font-bold">•</span>
              <span><strong>Dynamic River Hydrodynamics:</strong> River bathymetry and current vectors change rapidly with seasonal river stage, lock operations, dam discharges, and rainfall runoff. Always confirm depth with your onboard transducer.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sky-400 font-bold">•</span>
              <span><strong>Emergency Distress & Satellite Systems:</strong> The SOS beacon feature generates formatted VHF Ch 16 MAYDAY messages and emergency SMS dispatches. In remote river canyons without cellular coverage, rely on dedicated EPIRBs, PLBs, or satellite communicators (e.g., Garmin inReach).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sky-400 font-bold">•</span>
              <span><strong>GPS Accuracy & Battery Stewardship:</strong> Mobile GPS accuracy varies in steep gorges. Maintain alternative navigation resources and monitor battery consumption on extended passages.</span>
            </li>
          </ul>

          <p className="text-xs text-slate-400 pt-2 border-t border-slate-800">
            By accepting, you confirm that you assume all risks associated with vessel operation and navigating inland and tidal waterways.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Waves className="w-4 h-4 text-sky-400" />
            <span>Safe piloting is the skipper's sole responsibility</span>
          </div>

          <div className="flex items-center gap-3">
            {isReviewOnly && onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Close
              </button>
            )}
            <button
              onClick={onAccept}
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-md hover:shadow-sky-500/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Accept Terms & Launch Navigation Map</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
