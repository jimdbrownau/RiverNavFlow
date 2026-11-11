import React, { useState } from 'react';
import { 
  AlertOctagon, 
  Menu, 
  X, 
  Compass, 
  Waves, 
  MapPin, 
  Navigation, 
  Radio, 
  DownloadCloud, 
  Battery, 
  Share2, 
  FileText,
  LocateFixed,
  Shield,
  Cloud,
  Check,
  LogIn,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { MarineVisionMode } from '../types/marine';
import { useFirebase } from '../context/FirebaseContext';

interface TopNavProps {
  activeView: 'map' | 'sounder' | 'waypoints' | 'routes' | 'hardware';
  onSelectView: (view: 'map' | 'sounder' | 'waypoints' | 'routes' | 'hardware') => void;
  onOpenSOS: () => void;
  visionMode: MarineVisionMode;
  onOpenOfflineManager?: () => void;
  onOpenBatterySettings?: () => void;
  onOpenSocialShare?: () => void;
  onOpenTerms?: () => void;
  onAutoDetectLocation?: () => void;
  isDetectingLocation?: boolean;
  onOpenAdmin?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeView,
  onSelectView,
  onOpenSOS,
  visionMode,
  onOpenOfflineManager,
  onOpenBatterySettings,
  onOpenSocialShare,
  onOpenTerms,
  onAutoDetectLocation,
  isDetectingLocation,
  onOpenAdmin,
}) => {

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signIn, signOut, isFirestoreConnected } = useFirebase();

  const isRed = visionMode === 'red';
  const isAmber = visionMode === 'amber';
  const isDay = visionMode === 'day';

  const handleMobileNavClick = (view: 'map' | 'sounder' | 'waypoints' | 'routes' | 'hardware') => {
    onSelectView(view);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className={`flex items-center justify-between gap-3 sm:gap-8 px-4 sm:px-6 py-2.5 sm:py-3 border-b select-none transition-colors z-30 ${
        isDay 
          ? 'bg-white border-slate-200 text-slate-900' 
          : isRed 
          ? 'bg-[#150202] border-[#450a0a] text-red-400' 
          : isAmber
          ? 'bg-[#180e03] border-[#452a0a] text-amber-300'
          : 'bg-slate-950 border-slate-800 text-slate-100'
      }`}>
        {/* Left: Brand + Mobile Menu Button */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          {/* Mobile Menu Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 rounded-lg md:hidden transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center ${
              isDay 
                ? 'hover:bg-slate-100 text-slate-700' 
                : 'hover:bg-slate-800/80 text-slate-200'
            }`}
            aria-label="Toggle mobile navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <a 
            href="#chart" 
            onClick={(e) => { e.preventDefault(); onSelectView('map'); }}
            className={`text-base sm:text-lg font-bold tracking-tight whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              isDay ? 'text-slate-900' : isRed ? 'text-red-300' : isAmber ? 'text-amber-300' : 'text-white'
            }`}
          >
            <span>RiverNav</span>
          </a>
          <span className="text-[11px] font-mono opacity-50 hidden sm:inline">v2.4 ECS</span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => onSelectView('map')}
            className={`hover:opacity-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeView === 'map' 
                ? isDay ? 'text-sky-600 font-semibold underline underline-offset-4' : 'text-sky-400 font-semibold underline underline-offset-4'
                : 'opacity-70'
            }`}
          >
            Nautical Chart
          </button>
          <button
            onClick={() => onSelectView('sounder')}
            className={`hover:opacity-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeView === 'sounder' 
                ? isDay ? 'text-sky-600 font-semibold underline underline-offset-4' : 'text-sky-400 font-semibold underline underline-offset-4'
                : 'opacity-70'
            }`}
          >
            Depth Sounder
          </button>
          <button
            onClick={() => onSelectView('waypoints')}
            className={`hover:opacity-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeView === 'waypoints' 
                ? isDay ? 'text-sky-600 font-semibold underline underline-offset-4' : 'text-sky-400 font-semibold underline underline-offset-4'
                : 'opacity-70'
            }`}
          >
            Waypoints
          </button>
          <button
            onClick={() => onSelectView('routes')}
            className={`hover:opacity-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeView === 'routes' 
                ? isDay ? 'text-sky-600 font-semibold underline underline-offset-4' : 'text-sky-400 font-semibold underline underline-offset-4'
                : 'opacity-70'
            }`}
          >
            Saved Routes
          </button>
          <button
            onClick={() => onSelectView('hardware')}
            className={`hover:opacity-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeView === 'hardware' 
                ? isDay ? 'text-sky-600 font-semibold underline underline-offset-4' : 'text-sky-400 font-semibold underline underline-offset-4'
                : 'opacity-70'
            }`}
          >
            Hardware Sync
          </button>

          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ml-1"
              title="Admin Dashboard: User Access & Fleet Tracking"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          )}
        </nav>


        {/* Right Action: Emergency SOS Distress Beacon */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Cloud Sync / Google Login Status */}
          {user ? (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-950/70 border border-sky-500/40 text-xs text-sky-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Firestore Connected" />
              <span className="font-medium max-w-[110px] truncate">{user.displayName || user.email?.split('@')[0]}</span>
              <button
                onClick={() => signOut()}
                className="ml-1 p-0.5 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                title="Sign out of Firebase"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn()}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                isDay
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Sign in with Google to sync river waypoints and routes to Firebase Firestore"
            >
              <Cloud className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden lg:inline">Cloud Sync</span>
            </button>
          )}

          {onAutoDetectLocation && (
            <button
              onClick={onAutoDetectLocation}
              disabled={isDetectingLocation}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                isDetectingLocation
                  ? 'bg-sky-600/30 border-sky-400 text-sky-200 animate-pulse'
                  : isDay
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
              }`}
              title="Recognize live location via GPS/Network"
            >
              <LocateFixed className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline">{isDetectingLocation ? 'Locating...' : 'GPS Fix'}</span>
            </button>
          )}

          <button
            onClick={onOpenSOS}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-md hover:shadow-red-600/30 transition-all cursor-pointer whitespace-nowrap shrink-0 animate-pulse min-h-[38px]"
            title="Activate Emergency SOS Distress Beacon (VHF Ch 16 MAYDAY)"
          >
            <AlertOctagon className="w-4 h-4 shrink-0" />
            <span className="sm:inline">SOS</span>
            <span className="hidden sm:inline">Beacon</span>
          </button>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 md:hidden flex flex-col bg-slate-950/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className={`w-4/5 max-w-xs h-full p-4 flex flex-col justify-between shadow-2xl transition-transform ${
              isDay ? 'bg-white text-slate-900' : 'bg-slate-900 text-slate-100'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/50 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight">RiverNav Navigation</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Navigation Section */}
              <div className="space-y-1">
                <button
                  onClick={() => handleMobileNavClick('map')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer min-h-[44px] ${
                    activeView === 'map'
                      ? 'bg-sky-600 text-white'
                      : isDay ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Compass className="w-4 h-4 text-sky-400" />
                  <span>Nautical Chart</span>
                </button>

                <button
                  onClick={() => handleMobileNavClick('sounder')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer min-h-[44px] ${
                    activeView === 'sounder'
                      ? 'bg-sky-600 text-white'
                      : isDay ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Waves className="w-4 h-4 text-sky-400" />
                  <span>Depth Sounder & Sonar</span>
                </button>

                <button
                  onClick={() => handleMobileNavClick('waypoints')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer min-h-[44px] ${
                    isDay ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>Waypoints & Markers</span>
                </button>

                <button
                  onClick={() => handleMobileNavClick('routes')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer min-h-[44px] ${
                    isDay ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Navigation className="w-4 h-4 text-indigo-400" />
                  <span>Saved Routes & GPX</span>
                </button>

                <button
                  onClick={() => handleMobileNavClick('hardware')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer min-h-[44px] ${
                    isDay ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Radio className="w-4 h-4 text-sky-400" />
                  <span>Marine Hardware & NMEA</span>
                </button>
              </div>

              {/* Cloud Sync / Account Status */}
              <div className="mt-4 pt-3 border-t border-slate-700/50">
                {user ? (
                  <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                      <div className="truncate text-left">
                        <div className="text-xs font-bold text-white truncate">
                          {user.displayName || 'Mariner Account'}
                        </div>
                        <div className="text-[10px] text-sky-400 truncate font-mono">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-rose-300 text-[11px] font-semibold shrink-0 cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      signIn();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-200 text-xs font-bold transition-colors cursor-pointer min-h-[44px]"
                  >
                    <Cloud className="w-4 h-4 text-sky-400" />
                    <span>Sign In with Google (Cloud Sync)</span>
                  </button>
                )}
              </div>

              {/* Quick Tools & Utilities */}
              <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-1">
                <div className="px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                  Quick Utilities
                </div>

                {onOpenAdmin && (
                  <button
                    onClick={() => {
                      onOpenAdmin();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-colors cursor-pointer min-h-[44px]"
                  >
                    <Shield className="w-4 h-4 text-sky-400" />
                    <span>Admin: User Access &amp; Fleet Radar</span>
                  </button>
                )}


                {onAutoDetectLocation && (
                  <button
                    onClick={() => {
                      onAutoDetectLocation();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-400 hover:bg-slate-800/80 transition-colors cursor-pointer min-h-[44px]"
                  >
                    <LocateFixed className="w-4 h-4" />
                    <span>Auto-Detect Current Waterway</span>
                  </button>
                )}

                {onOpenOfflineManager && (
                  <button
                    onClick={() => {
                      onOpenOfflineManager();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer min-h-[44px]"
                  >
                    <DownloadCloud className="w-4 h-4 text-sky-400" />
                    <span>Offline Chart Packs</span>
                  </button>
                )}

                {onOpenBatterySettings && (
                  <button
                    onClick={() => {
                      onOpenBatterySettings();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer min-h-[44px]"
                  >
                    <Battery className="w-4 h-4 text-emerald-400" />
                    <span>Battery Saver & Wake Lock</span>
                  </button>
                )}

                {onOpenSocialShare && (
                  <button
                    onClick={() => {
                      onOpenSocialShare();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer min-h-[44px]"
                  >
                    <Share2 className="w-4 h-4 text-purple-400" />
                    <span>Social Progress Share</span>
                  </button>
                )}

                {onOpenTerms && (
                  <button
                    onClick={() => {
                      onOpenTerms();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer min-h-[44px]"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Terms & Mariner Limitations</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bottom: Emergency SOS Action in Drawer */}
            <div className="pt-3 border-t border-slate-700/50">
              <button
                onClick={() => {
                  onOpenSOS();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg transition-colors cursor-pointer min-h-[44px]"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>Emergency SOS (VHF Ch 16)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
