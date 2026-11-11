/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MarineVisionMode, 
  RiverPreset, 
  Waypoint, 
  RouteTrack, 
  TrackPoint, 
  CurrentVector, 
  DepthSounderData, 
  HardwareDevice, 
  BatteryOptimizationConfig 
} from './types/marine';
import { RIVER_PRESETS, generateRiverCurrentVectors } from './services/currentData';
import { WaterwayDetectionService } from './services/waterwayDetector';
import { generateSampleCompletedTrip } from './services/sampleRoutes';
import { NMEAParser } from './services/nmeaSimulator';
import { MarineHardwareManager } from './services/bluetoothHardware';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { TopNav } from './components/TopNav';
import { DashboardHUD } from './components/DashboardHUD';
import { NauticalMap } from './components/NauticalMap';
import { SonarDepthSounder } from './components/SonarDepthSounder';
import { EmergencyBeaconModal } from './components/EmergencyBeaconModal';
import { TermsDisclaimerModal } from './components/TermsDisclaimerModal';
import { OfflineManagerModal } from './components/OfflineManagerModal';
import { BatterySettingsModal } from './components/BatterySettingsModal';
import { HardwareSyncModal } from './components/HardwareSyncModal';
import { WaypointsManagerModal } from './components/WaypointsManagerModal';
import { RoutesManagerModal } from './components/RoutesManagerModal';
import { SocialShareModal } from './components/SocialShareModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminAuthService } from './services/adminAuthService';
import { useFirebase } from './context/FirebaseContext';
import { FirestoreSyncService } from './services/firestoreSyncService';



// Initial default river waypoints (Columbia River presets)
const INITIAL_WAYPOINTS: Waypoint[] = [
  {
    id: 'wp-1',
    name: 'Government Island North Anchorage',
    category: 'anchorage',
    lat: 45.589,
    lng: -122.532,
    depthFt: 18.4,
    notes: 'Good holding in fine sand. Protected from westerly winds.',
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'wp-2',
    name: 'Chinook Landing Public Boat Launch',
    category: 'ramp',
    lat: 45.556,
    lng: -122.392,
    depthFt: 8.5,
    notes: '6-lane paved ramp, floating docks, restroom facilities.',
    createdAt: Date.now() - 172800000,
  },
  {
    id: 'wp-3',
    name: 'Salpare Bay Marine Fuel Dock',
    category: 'fuel',
    lat: 45.597,
    lng: -122.684,
    depthFt: 14.2,
    notes: 'Ethanol-free 89 octane marine gas and ultra-low sulfur diesel.',
    createdAt: Date.now() - 250000000,
  },
  {
    id: 'wp-4',
    name: 'Submerged Wing Dam Hazard Bar',
    category: 'hazard',
    lat: 45.612,
    lng: -121.942,
    depthFt: 3.2,
    notes: 'Extreme hazard at river stage < 6ft. Keep green buoy 100yd to port.',
    createdAt: Date.now() - 300000000,
  },
  {
    id: 'wp-5',
    name: 'Bonneville Navigation Lock Approach',
    category: 'lock',
    lat: 45.644,
    lng: -121.948,
    depthFt: 34.0,
    notes: 'Monitor VHF Ch 14 for Lockmaster clearance. Mooring lines mandatory.',
    createdAt: Date.now() - 400000000,
  },
];

export default function App() {
  // Terms Acceptance State (1-click to open and immediately display map)
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(() => {
    return localStorage.getItem('rivernav_terms_accepted') === 'true';
  });
  const [showTermsReview, setShowTermsReview] = useState(false);

  // Active View Tab
  const [activeView, setActiveView] = useState<'map' | 'sounder' | 'waypoints' | 'routes' | 'hardware'>('map');

  // Vision Mode
  const [visionMode, setVisionMode] = useState<MarineVisionMode>('night');

  // Selected River Waterway
  const [selectedRiver, setSelectedRiver] = useState<RiverPreset>(RIVER_PRESETS[0]);

  // Vessel Navigation State
  const [vesselLat, setVesselLat] = useState(selectedRiver.center[0]);
  const [vesselLng, setVesselLng] = useState(selectedRiver.center[1]);
  const [vesselHeadingDeg, setVesselHeadingDeg] = useState(254);
  const [vesselSpeedKnots, setVesselSpeedKnots] = useState(6.4);

  // Hydrodynamic River Currents
  const [currentVectors, setCurrentVectors] = useState<CurrentVector[]>(() => 
    generateRiverCurrentVectors(selectedRiver.center[0], selectedRiver.center[1], selectedRiver.averageFlowKnots)
  );
  const [showCurrentsOverlay, setShowCurrentsOverlay] = useState(true);

  // Depth Sounder State
  const [sounderData, setSounderData] = useState<DepthSounderData>({
    depthFt: 14.8,
    depthMeters: 4.5,
    waterTempF: 64.2,
    waterTempC: 17.9,
    transducerStatus: 'connected',
    signalQualityPercent: 96,
    keelOffsetFt: 0.8,
    shallowAlarmThresholdFt: 4.0,
    isShallowAlarmActive: false,
    history: [],
  });
  const [isSounderSimulated, setIsSounderSimulated] = useState(true);

  // Waypoints & Saved Routes State
  const [waypoints, setWaypoints] = useState<Waypoint[]>(() => {
    const saved = localStorage.getItem('rivernav_waypoints');
    return saved ? JSON.parse(saved) : INITIAL_WAYPOINTS;
  });

  const [savedRoutes, setSavedRoutes] = useState<RouteTrack[]>(() => {
    const saved = localStorage.getItem('rivernav_saved_routes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return [generateSampleCompletedTrip()];
  });

  // Active Route Tracking
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTrackPoints, setCurrentTrackPoints] = useState<TrackPoint[]>([]);
  const [trackedDistanceNm, setTrackedDistanceNm] = useState(0);
  const [trackedDurationSec, setTrackedDurationSec] = useState(0);

  // Battery Optimization & Wake Lock
  const [batteryPercent, setBatteryPercent] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);
  const wakeLockSentinelRef = useRef<any>(null);

  const [batteryConfig, setBatteryConfig] = useState<BatteryOptimizationConfig>({
    mode: 'eco',
    gpsThrottlingIntervalMs: 8000,
    enableWakeLock: true,
    animateCurrents: false,
    dimDisplay: false,
  });

  // Offline Caching State
  const [isOfflineCached, setIsOfflineCached] = useState(false);
  const [isOfflineModeForced, setIsOfflineModeForced] = useState(false);

  // Hardware Devices & Live NMEA Stream
  const [hardwareDevices, setHardwareDevices] = useState<HardwareDevice[]>(() => 
    MarineHardwareManager.getInstance().getDevices()
  );
  const [nmeaLog, setNmeaLog] = useState<string[]>([]);

  // Modals
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const [isBatteryModalOpen, setIsBatteryModalOpen] = useState(false);
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [isWaypointsModalOpen, setIsWaypointsModalOpen] = useState(false);
  const [isRoutesModalOpen, setIsRoutesModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  const handleOpenAdmin = () => {
    if (AdminAuthService.isAuthenticated()) {
      setIsAdminModalOpen(true);
    } else {
      setIsAdminLoginOpen(true);
    }
  };


  // Synchronize CSS class for vision mode on document.body
  useEffect(() => {
    document.body.className = `vision-${visionMode} ${visionMode === 'day' ? 'light' : 'dark'}`;
    if (visionMode === 'day') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, [visionMode]);

  // Persist Waypoints & Routes to localStorage
  useEffect(() => {
    localStorage.setItem('rivernav_waypoints', JSON.stringify(waypoints));
  }, [waypoints]);

  useEffect(() => {
    localStorage.setItem('rivernav_saved_routes', JSON.stringify(savedRoutes));
  }, [savedRoutes]);

  // Firebase User & Firestore Cloud Sync
  const { user: firebaseUser } = useFirebase();

  // Load cloud waypoints on login
  useEffect(() => {
    if (firebaseUser) {
      FirestoreSyncService.fetchWaypoints().then(cloudWaypoints => {
        if (cloudWaypoints && cloudWaypoints.length > 0) {
          setWaypoints(prev => {
            const map = new Map<string, Waypoint>();
            prev.forEach(w => map.set(w.id, w));
            cloudWaypoints.forEach(w => map.set(w.id, w));
            return Array.from(map.values());
          });
        }
      }).catch(() => {});
    }
  }, [firebaseUser]);

  // Sync vessel telemetry to Firestore
  useEffect(() => {
    if (firebaseUser) {
      FirestoreSyncService.updateFleetVesselTelemetry(
        vesselLat,
        vesselLng,
        'M/Y Pacific Nomad',
        selectedRiver.name,
        vesselSpeedKnots,
        vesselHeadingDeg
      ).catch(() => {});
    }
  }, [firebaseUser, vesselLat, vesselLng, selectedRiver.name, vesselSpeedKnots, vesselHeadingDeg]);

  // Automatic River & Location Detection State
  const [isDetectingWaterway, setIsDetectingWaterway] = useState(false);
  const [detectedWaterwayName, setDetectedWaterwayName] = useState<string | null>(null);
  const [gpsAccuracyMeters, setGpsAccuracyMeters] = useState<number | null>(null);
  const [detectionBanner, setDetectionBanner] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const handleAutoDetectWaterway = async () => {
    setIsDetectingWaterway(true);
    setDetectionBanner({ message: 'Requesting GPS fix & detecting local river waterway...', type: 'info' });

    try {
      const detected = await WaterwayDetectionService.detectLocalWaterway();
      const preset = WaterwayDetectionService.toRiverPreset(detected, 14);

      setSelectedRiver(preset);
      setVesselLat(detected.lat);
      setVesselLng(detected.lng);
      setGpsAccuracyMeters(detected.accuracyMeters || 5);
      setDetectedWaterwayName(detected.name);

      // Re-generate hydrodynamic current vectors for detected waterway location
      setCurrentVectors(generateRiverCurrentVectors(detected.lat, detected.lng, detected.estimatedFlowKnots));

      setDetectionBanner({
        message: `Locked onto ${detected.name} (${detected.region}) · GPS accuracy ±${detected.accuracyMeters || 5}m`,
        type: 'success',
      });
      setTimeout(() => setDetectionBanner(null), 6000);
    } catch (err: any) {
      setDetectionBanner({
        message: `Automatic detection error: ${err.message || 'Please check device location permissions.'}`,
        type: 'error',
      });
      setTimeout(() => setDetectionBanner(null), 6000);
    } finally {
      setIsDetectingWaterway(false);
    }
  };

  // Search any location, river name, city, or coordinates
  const handleSearchLocation = async (query: string): Promise<boolean> => {
    setIsDetectingWaterway(true);
    setDetectionBanner({ message: `Locating "${query}"...`, type: 'info' });

    try {
      const detected = await WaterwayDetectionService.searchWaterwayOrPlace(query);
      if (detected) {
        const preset = WaterwayDetectionService.toRiverPreset(detected, 14);
        setSelectedRiver(preset);
        setVesselLat(detected.lat);
        setVesselLng(detected.lng);
        setGpsAccuracyMeters(detected.accuracyMeters || 5);
        setDetectedWaterwayName(detected.name);
        setCurrentVectors(generateRiverCurrentVectors(detected.lat, detected.lng, detected.estimatedFlowKnots));
        setDetectionBanner({
          message: `Arrived at ${detected.name} (${detected.region})`,
          type: 'success',
        });
        setTimeout(() => setDetectionBanner(null), 6000);
        return true;
      } else {
        setDetectionBanner({
          message: `Could not resolve "${query}". Try searching a city name, river, or lat, lng coordinates.`,
          type: 'error',
        });
        setTimeout(() => setDetectionBanner(null), 6000);
        return false;
      }
    } catch {
      setDetectionBanner({
        message: 'Search failed. Please check network connectivity.',
        type: 'error',
      });
      setTimeout(() => setDetectionBanner(null), 5000);
      return false;
    } finally {
      setIsDetectingWaterway(false);
    }
  };

  // Initial location recognition on mount
  const hasAcquiredInitialGpsRef = useRef(false);
  useEffect(() => {
    handleAutoDetectWaterway();
  }, []);

  // Handle Terms Acceptance
  const handleAcceptTerms = () => {
    localStorage.setItem('rivernav_terms_accepted', 'true');
    setHasAcceptedTerms(true);
    setShowTermsReview(false);
    handleAutoDetectWaterway();
  };


  // Screen Wake Lock API: Prevent screen dimming during boat navigation
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockSentinelRef.current = await (navigator as any).wakeLock.request('screen');
        setIsWakeLockActive(true);
        wakeLockSentinelRef.current.addEventListener('release', () => {
          setIsWakeLockActive(false);
        });
      } catch {
        setIsWakeLockActive(false);
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockSentinelRef.current) {
      wakeLockSentinelRef.current.release();
      wakeLockSentinelRef.current = null;
      setIsWakeLockActive(false);
    }
  };

  const handleToggleWakeLock = () => {
    if (isWakeLockActive) {
      releaseWakeLock();
    } else {
      requestWakeLock();
    }
  };

  useEffect(() => {
    if (batteryConfig.enableWakeLock && hasAcceptedTerms) {
      requestWakeLock();
    }
    return () => {
      releaseWakeLock();
    };
  }, [batteryConfig.enableWakeLock, hasAcceptedTerms]);

  // Battery Status API
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryPercent(Math.round(battery.level * 100));
        setIsCharging(battery.charging);

        battery.addEventListener('levelchange', () => {
          setBatteryPercent(Math.round(battery.level * 100));
        });
        battery.addEventListener('chargingchange', () => {
          setIsCharging(battery.charging);
        });
      }).catch(() => {});
    }
  }, []);

  // Geolocation & River Navigation Simulation Loop
  useEffect(() => {
    // Attempt real device geolocation if available
    let watchId: number | null = null;
    if ('geolocation' in navigator && !isOfflineModeForced) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy = Math.round(pos.coords.accuracy || 5);

          setVesselLat(lat);
          setVesselLng(lng);
          setGpsAccuracyMeters(accuracy);

          if (pos.coords.speed !== null && pos.coords.speed > 0.5) {
            setVesselSpeedKnots(pos.coords.speed * 1.94384);
          }
          if (pos.coords.heading !== null && !isNaN(pos.coords.heading)) {
            setVesselHeadingDeg(pos.coords.heading);
          }

          // If this is the first real GPS fix received, lock onto local waterway
          if (!hasAcquiredInitialGpsRef.current) {
            hasAcquiredInitialGpsRef.current = true;
            WaterwayDetectionService.detectLocalWaterway({ customLat: lat, customLng: lng })
              .then(detected => {
                const preset = WaterwayDetectionService.toRiverPreset(detected, 14);
                setSelectedRiver(preset);
                setDetectedWaterwayName(detected.name);
                setCurrentVectors(generateRiverCurrentVectors(detected.lat, detected.lng, detected.estimatedFlowKnots));
                setDetectionBanner({
                  message: `GPS Fix Acquired: Locked onto ${detected.name} (±${accuracy}m)`,
                  type: 'success',
                });
                setTimeout(() => setDetectionBanner(null), 5000);
              })
              .catch(() => {});
          }
        },
        () => {
          // If browser GPS watch position fails or is denied, fallback to IP network detection
          if (!hasAcquiredInitialGpsRef.current) {
            handleAutoDetectWaterway();
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    }


    // Realistic boat drift and progression down river channel
    const simInterval = setInterval(() => {
      setVesselLat(prevLat => {
        // Subtle drift down river course
        const headingRad = (vesselHeadingDeg * Math.PI) / 180;
        const speedDelta = (vesselSpeedKnots / 3600 / 60) * 0.08; // coordinate delta
        const dLat = Math.cos(headingRad) * speedDelta;
        return prevLat + dLat;
      });

      setVesselLng(prevLng => {
        const headingRad = (vesselHeadingDeg * Math.PI) / 180;
        const speedDelta = (vesselSpeedKnots / 3600 / 60) * 0.08;
        const dLng = Math.sin(headingRad) * speedDelta;
        return prevLng + dLng;
      });

      // Realistic Depth Variation (river thalweg vs shoals)
      setSounderData(prev => {
        const randomFluct = (Math.random() - 0.5) * 0.4;
        const newDepth = Math.max(2.1, Number((prev.depthFt + randomFluct).toFixed(1)));
        const isShallow = newDepth < prev.shallowAlarmThresholdFt;

        // Generate NMEA sentences
        const rmc = NMEAParser.createRMC(vesselLat, vesselLng, vesselSpeedKnots, vesselHeadingDeg);
        const { dpt, dbt } = NMEAParser.createDepthSentences(newDepth, prev.keelOffsetFt);
        const mtw = NMEAParser.createWaterTempSentence(prev.waterTempC);

        setNmeaLog(log => [...log.slice(-30), rmc, dpt, dbt, mtw]);

        return {
          ...prev,
          depthFt: newDepth,
          depthMeters: Number((newDepth * 0.3048).toFixed(1)),
          isShallowAlarmActive: isShallow,
        };
      });
    }, 1200);

    return () => {
      clearInterval(simInterval);
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [vesselHeadingDeg, vesselSpeedKnots, vesselLat, vesselLng, isOfflineModeForced]);

  // Active Route Tracking Recording Interval
  useEffect(() => {
    let timer: number | null = null;
    if (isRecording && !isPaused) {
      timer = window.setInterval(() => {
        setTrackedDurationSec(prev => prev + 1);

        // Every 3 seconds, record a trackpoint
        setCurrentTrackPoints(points => {
          const newPt: TrackPoint = {
            lat: vesselLat,
            lng: vesselLng,
            time: Date.now(),
            speedKnots: vesselSpeedKnots,
            headingDeg: vesselHeadingDeg,
            depthFt: sounderData.depthFt,
          };

          if (points.length > 0) {
            const prev = points[points.length - 1];
            // Compute incremental nautical miles
            const R = 3440.065;
            const dLat = ((newPt.lat - prev.lat) * Math.PI) / 180;
            const dLon = ((newPt.lng - prev.lng) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((prev.lat * Math.PI) / 180) *
                Math.cos((newPt.lat * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const inc = R * c;
            setTrackedDistanceNm(d => d + inc);
          }

          return [...points, newPt];
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording, isPaused, vesselLat, vesselLng, vesselSpeedKnots, vesselHeadingDeg, sounderData.depthFt]);

  // Route Tracking Controls
  const handleStartTracking = () => {
    setIsRecording(true);
    setIsPaused(false);
    setCurrentTrackPoints([]);
    setTrackedDistanceNm(0);
    setTrackedDurationSec(0);
  };

  const handlePauseTracking = () => {
    setIsPaused(!isPaused);
  };

  const handleStopTracking = () => {
    if (currentTrackPoints.length > 0) {
      const speeds = currentTrackPoints.map(p => p.speedKnots);
      const depths = currentTrackPoints.map(p => p.depthFt);
      const maxSpd = Math.max(...speeds, 0);
      const avgSpd = speeds.reduce((a, b) => a + b, 0) / speeds.length;
      const minDpt = Math.min(...depths, 99);

      const newRoute: RouteTrack = {
        id: `route-${Date.now()}`,
        name: `${selectedRiver.name.split(' (')[0]} Passage`,
        startTime: currentTrackPoints[0].time,
        endTime: Date.now(),
        points: currentTrackPoints,
        distanceNm: Number(trackedDistanceNm.toFixed(2)),
        maxSpeedKnots: Number(maxSpd.toFixed(1)),
        avgSpeedKnots: Number(avgSpd.toFixed(1)),
        minDepthFt: Number(minDpt.toFixed(1)),
      };

      setSavedRoutes(prev => [newRoute, ...prev]);
      if (firebaseUser) {
        FirestoreSyncService.saveRoute({
          ...newRoute,
          userId: firebaseUser.uid,
          riverName: selectedRiver.name,
          durationSec: Math.round(((newRoute.endTime ?? Date.now()) - newRoute.startTime) / 1000),
          createdAt: newRoute.startTime,
        } as any).catch(() => {});
      }
    }
    setIsRecording(false);
    setIsPaused(false);
  };

  // Quick Mark Waypoint
  const handleQuickMark = () => {
    const newWp: Waypoint = {
      id: `wp-${Date.now()}`,
      name: `Mark #${waypoints.length + 1} (${selectedRiver.name.split(' ')[0]})`,
      category: 'anchorage',
      lat: vesselLat,
      lng: vesselLng,
      depthFt: sounderData.depthFt,
      notes: `Recorded at ${vesselSpeedKnots.toFixed(1)} kts on ${new Date().toLocaleTimeString()}`,
      createdAt: Date.now(),
    };
    setWaypoints(prev => [newWp, ...prev]);
    if (firebaseUser) {
      FirestoreSyncService.saveWaypoint(newWp).catch(() => {});
    }
  };

  // Map Click to Add Waypoint
  const handleMapClickWaypoint = (lat: number, lng: number) => {
    const newWp: Waypoint = {
      id: `wp-${Date.now()}`,
      name: `River Mark #${waypoints.length + 1}`,
      category: 'anchorage',
      lat,
      lng,
      depthFt: sounderData.depthFt,
      createdAt: Date.now(),
    };
    setWaypoints(prev => [newWp, ...prev]);
    if (firebaseUser) {
      FirestoreSyncService.saveWaypoint(newWp).catch(() => {});
    }
  };

  // River Selection
  const handleSelectRiver = (preset: RiverPreset) => {
    setSelectedRiver(preset);
    setVesselLat(preset.center[0]);
    setVesselLng(preset.center[1]);
    setCurrentVectors(generateRiverCurrentVectors(preset.center[0], preset.center[1], preset.averageFlowKnots));
  };

  // Sounder Keel Offset & Alarm
  const handleUpdateKeelOffset = (offsetFt: number) => {
    setSounderData(prev => ({ ...prev, keelOffsetFt: offsetFt }));
  };

  const handleUpdateAlarmThreshold = (thresholdFt: number) => {
    setSounderData(prev => ({ ...prev, shallowAlarmThresholdFt: thresholdFt }));
  };

  const handleToggleSounderSim = () => {
    setIsSounderSimulated(!isSounderSimulated);
  };

  // Center on Boat
  const handleCenterOnBoat = () => {
    // Handled in NauticalMap
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* 1-Click Terms and Limitation Modal on first load */}
      <TermsDisclaimerModal
        isOpen={!hasAcceptedTerms || showTermsReview}
        onAccept={handleAcceptTerms}
        onClose={() => setShowTermsReview(false)}
        isReviewOnly={hasAcceptedTerms}
      />

      {/* Top Navigation Bar: 3-zone Top Bar Contract with Mobile Menu */}
      <TopNav
        activeView={activeView}
        onSelectView={(v) => {
          if (v === 'waypoints') setIsWaypointsModalOpen(true);
          else if (v === 'routes') setIsRoutesModalOpen(true);
          else if (v === 'hardware') setIsHardwareModalOpen(true);
          else setActiveView(v);
        }}
        onOpenSOS={() => setIsSosOpen(true)}
        visionMode={visionMode}
        onOpenOfflineManager={() => setIsOfflineModalOpen(true)}
        onOpenBatterySettings={() => setIsBatteryModalOpen(true)}
        onOpenSocialShare={() => setIsShareModalOpen(true)}
        onOpenTerms={() => setShowTermsReview(true)}
        onAutoDetectLocation={handleAutoDetectWaterway}
        isDetectingLocation={isDetectingWaterway}
        onOpenAdmin={handleOpenAdmin}
      />


      {/* Primary Workspace Stage: On mobile, extends full height so chart occupies maximum screen */}
      <main className="flex-1 w-full h-full relative overflow-hidden flex flex-col pb-14 md:pb-0">
        {/* Marine Telemetry HUD: On mobile, floats as an absolute high-contrast overlay atop the chart; on desktop, renders as a top console ribbon */}
        <DashboardHUD
          sogKnots={vesselSpeedKnots}
          cogDeg={vesselHeadingDeg}
          depthFt={sounderData.depthFt}
          shallowAlarmThresholdFt={sounderData.shallowAlarmThresholdFt}
          onUpdateAlarmThreshold={handleUpdateAlarmThreshold}
          currentSpeedKnots={currentVectors[0]?.speedKnots || 2.4}
          currentDirectionDeg={currentVectors[0]?.directionDeg || 254}
          isRecording={isRecording}
          isPaused={isPaused}
          trackedDistanceNm={trackedDistanceNm}
          trackedDurationSec={trackedDurationSec}
          onStartTracking={handleStartTracking}
          onPauseTracking={handlePauseTracking}
          onStopTracking={handleStopTracking}
          onQuickMarkWaypoint={handleQuickMark}
          visionMode={visionMode}
          onSetVisionMode={setVisionMode}
          batteryPercent={batteryPercent}
          batteryConfig={batteryConfig}
          onOpenBatterySettings={() => setIsBatteryModalOpen(true)}
          onOpenOfflineManager={() => setIsOfflineModalOpen(true)}
          onOpenSocialShare={() => setIsShareModalOpen(true)}
          onOpenSounder={() => setActiveView('sounder')}
          isOfflineCached={isOfflineCached}
        />

        {/* Floating Waterway Detection Notification Toast */}
        {detectionBanner && (
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2.5 backdrop-blur-md transition-all ${
            detectionBanner.type === 'success'
              ? 'bg-emerald-950/95 border border-emerald-500 text-emerald-200 shadow-emerald-950/50'
              : detectionBanner.type === 'error'
              ? 'bg-rose-950/95 border border-rose-500 text-rose-200 shadow-rose-950/50'
              : 'bg-sky-950/95 border border-sky-500 text-sky-200 shadow-sky-950/50'
          }`}>
            {detectionBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : detectionBanner.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Loader2 className="w-4 h-4 text-sky-400 animate-spin shrink-0" />
            )}
            <span>{detectionBanner.message}</span>
          </div>
        )}

        {/* Chart / Sounder Workspace Container */}
        <div className="flex-1 w-full h-full relative overflow-hidden">
          {activeView === 'map' ? (
            <NauticalMap
              vesselLat={vesselLat}
              vesselLng={vesselLng}
              vesselHeadingDeg={vesselHeadingDeg}
              vesselSpeedKnots={vesselSpeedKnots}
              currentVectors={currentVectors}
              waypoints={waypoints}
              recordedTrack={currentTrackPoints}
              visionMode={visionMode}
              batteryConfig={batteryConfig}
              selectedRiver={selectedRiver}
              onSelectRiver={handleSelectRiver}
              onMapClickWaypoint={handleMapClickWaypoint}
              onCenterOnBoat={handleCenterOnBoat}
              showCurrentsOverlay={showCurrentsOverlay}
              onToggleCurrentsOverlay={() => setShowCurrentsOverlay(!showCurrentsOverlay)}
              onAutoDetectWaterway={handleAutoDetectWaterway}
              onSearchWaterway={handleSearchLocation}
              isDetectingWaterway={isDetectingWaterway}
              detectedWaterwayName={detectedWaterwayName}
              gpsAccuracyMeters={gpsAccuracyMeters}
            />
          ) : (
            <SonarDepthSounder
              sounderData={sounderData}
              visionMode={visionMode}
              onUpdateKeelOffset={handleUpdateKeelOffset}
              onUpdateAlarmThreshold={handleUpdateAlarmThreshold}
              isSimulated={isSounderSimulated}
              onToggleSimulator={handleToggleSounderSim}
            />
          )}
        </div>
      </main>


      {/* Mobile Bottom Navigation Bar: Thumb-friendly touch targets for mobile viewports */}
      <MobileBottomNav
        activeView={activeView}
        onSelectView={(v) => {
          if (v === 'waypoints') setIsWaypointsModalOpen(true);
          else if (v === 'routes') setIsRoutesModalOpen(true);
          else if (v === 'hardware') setIsHardwareModalOpen(true);
          else setActiveView(v);
        }}
        visionMode={visionMode}
        depthFt={sounderData.depthFt}
        shallowAlarmActive={sounderData.isShallowAlarmActive}
        waypointsCount={waypoints.length}
        isRecordingRoute={isRecording}
        connectedHardwareCount={hardwareDevices.filter(d => d.connected).length}
      />

      {/* Quiet Technical Footer: Terms Link & Coordinates (Desktop) */}
      <footer className="hidden md:flex h-6 px-4 bg-slate-950 border-t border-slate-900 items-center justify-between text-[10px] font-mono text-slate-500 z-20">
        <div className="flex items-center gap-3">
          <span>{selectedRiver.name.split(' (')[0]}</span>
          <span className="opacity-40">·</span>
          <span>{vesselLat.toFixed(5)}°N, {Math.abs(vesselLng).toFixed(5)}°W</span>
          <span className="opacity-40">·</span>
          <span>WGS-84</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTermsReview(true)}
            className="hover:text-slate-300 transition-colors cursor-pointer"
          >
            Terms & Mariner Limitations
          </button>
          <span className="opacity-40">·</span>
          <span className="text-emerald-500 font-bold">
            {gpsAccuracyMeters ? `GPS LOCK ±${gpsAccuracyMeters}m` : 'GPS ACQUIRING 10Hz'}
          </span>
        </div>
      </footer>


      {/* All Secondary Feature Modals */}
      <EmergencyBeaconModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        vesselLat={vesselLat}
        vesselLng={vesselLng}
        sogKnots={vesselSpeedKnots}
        cogDeg={vesselHeadingDeg}
        depthFt={sounderData.depthFt}
        riverName={selectedRiver.name}
      />

      <OfflineManagerModal
        isOpen={isOfflineModalOpen}
        onClose={() => setIsOfflineModalOpen(false)}
        vesselLat={vesselLat}
        vesselLng={vesselLng}
        riverName={selectedRiver.name}
        isOfflineModeForced={isOfflineModeForced}
        onToggleForceOffline={() => setIsOfflineModeForced(!isOfflineModeForced)}
        onCacheUpdated={() => setIsOfflineCached(true)}
      />

      <BatterySettingsModal
        isOpen={isBatteryModalOpen}
        onClose={() => setIsBatteryModalOpen(false)}
        batteryPercent={batteryPercent}
        isCharging={isCharging}
        config={batteryConfig}
        onUpdateConfig={setBatteryConfig}
        isWakeLockActive={isWakeLockActive}
        onToggleWakeLock={handleToggleWakeLock}
      />

      <HardwareSyncModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
        nmeaLog={nmeaLog}
        devices={hardwareDevices}
        onToggleDevice={(id) => {
          MarineHardwareManager.getInstance().toggleDeviceConnection(id);
          setHardwareDevices([...MarineHardwareManager.getInstance().getDevices()]);
        }}
        onAddSimDevice={(name, type) => {
          MarineHardwareManager.getInstance().addVirtualDevice(name, type);
          setHardwareDevices([...MarineHardwareManager.getInstance().getDevices()]);
        }}
      />

      <WaypointsManagerModal
        isOpen={isWaypointsModalOpen}
        onClose={() => setIsWaypointsModalOpen(false)}
        waypoints={waypoints}
        vesselLat={vesselLat}
        vesselLng={vesselLng}
        vesselDepthFt={sounderData.depthFt}
        onAddWaypoint={(wp) => {
          const newWp: Waypoint = {
            ...wp,
            id: `wp-${Date.now()}`,
            createdAt: Date.now(),
          };
          setWaypoints(prev => [newWp, ...prev]);
          if (firebaseUser) {
            FirestoreSyncService.saveWaypoint(newWp).catch(() => {});
          }
        }}
        onDeleteWaypoint={(id) => {
          setWaypoints(prev => prev.filter(w => w.id !== id));
          if (firebaseUser) {
            FirestoreSyncService.deleteWaypoint(id).catch(() => {});
          }
        }}
        onSelectWaypointOnMap={(lat, lng) => {
          setActiveView('map');
          setVesselLat(lat);
          setVesselLng(lng);
        }}
      />

      <RoutesManagerModal
        isOpen={isRoutesModalOpen}
        onClose={() => setIsRoutesModalOpen(false)}
        savedRoutes={savedRoutes}
        isRecording={isRecording}
        isPaused={isPaused}
        currentTrackPoints={currentTrackPoints}
        trackedDistanceNm={trackedDistanceNm}
        trackedDurationSec={trackedDurationSec}
        onStartTracking={handleStartTracking}
        onPauseTracking={handlePauseTracking}
        onStopTracking={handleStopTracking}
        onDeleteRoute={(id) => {
          setSavedRoutes(prev => prev.filter(r => r.id !== id));
          if (firebaseUser) {
            FirestoreSyncService.deleteRoute(id).catch(() => {});
          }
        }}
        onLoadRouteOnMap={(route) => {
          setActiveView('map');
          if (route.points.length > 0) {
            setVesselLat(route.points[0].lat);
            setVesselLng(route.points[0].lng);
          }
        }}
        onImportRoute={(route) => {
          setSavedRoutes(prev => [route, ...prev]);
        }}
      />

      <SocialShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        vesselLat={vesselLat}
        vesselLng={vesselLng}
        sogKnots={vesselSpeedKnots}
        cogDeg={vesselHeadingDeg}
        depthFt={sounderData.depthFt}
        riverName={selectedRiver.name}
        trackedDistanceNm={trackedDistanceNm}
      />

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={() => {
          setIsAdminLoginOpen(false);
          setIsAdminModalOpen(true);
        }}
      />

      <AdminDashboardModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentVesselLat={vesselLat}
        currentVesselLng={vesselLng}
        currentRiverName={selectedRiver.name}
      />
    </div>
  );
}

