import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Bluetooth, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Terminal, 
  Sliders, 
  Cpu, 
  X,
  Compass,
  Activity
} from 'lucide-react';
import { HardwareDevice } from '../types/marine';
import { MarineHardwareManager } from '../services/bluetoothHardware';

interface HardwareSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  nmeaLog: string[];
  devices: HardwareDevice[];
  onToggleDevice: (id: string) => void;
  onAddSimDevice: (name: string, type: 'gps' | 'sounder') => void;
}

export const HardwareSyncModal: React.FC<HardwareSyncModalProps> = ({
  isOpen,
  onClose,
  nmeaLog,
  devices,
  onToggleDevice,
  onAddSimDevice,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [customDeviceName, setCustomDeviceName] = useState('');
  const [customDeviceType, setCustomDeviceType] = useState<'gps' | 'sounder'>('sounder');

  if (!isOpen) return null;

  const hardwareManager = MarineHardwareManager.getInstance();
  const isBluetoothSupported = hardwareManager.isWebBluetoothSupported();

  const handleScanBluetooth = async (type: 'gps' | 'sounder') => {
    setIsScanning(true);
    setScanError(null);
    try {
      await hardwareManager.connectBluetoothDevice(type);
    } catch (err: any) {
      setScanError(err.message || 'Bluetooth connection failed.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddVirtual = () => {
    if (!customDeviceName.trim()) return;
    onAddSimDevice(customDeviceName, customDeviceType);
    setCustomDeviceName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <Bluetooth className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Marine Hardware Synchronization
              </h2>
              <p className="text-xs text-slate-400">
                Bluetooth GPS Units, NMEA 0183/2000 Transducers & Sounders
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

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Bluetooth Connection Actions */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Wireless Marine Bluetooth Bridge
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Web Bluetooth: <strong className={isBluetoothSupported ? 'text-emerald-400' : 'text-amber-400'}>
                  {isBluetoothSupported ? 'SUPPORTED' : 'SIMULATION ONLY'}
                </strong>
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleScanBluetooth('gps')}
                disabled={isScanning}
                className="flex items-center gap-2 px-3 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Pair Bluetooth GPS Puck</span>
              </button>

              <button
                onClick={() => handleScanBluetooth('sounder')}
                disabled={isScanning}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Pair BLE Depth Sounder</span>
              </button>
            </div>

            {scanError && (
              <p className="text-xs text-rose-400 pt-1">
                {scanError}
              </p>
            )}
          </div>

          {/* Connected Marine Hardware Devices */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Active Marine Devices</span>
              <span className="text-xs font-mono text-slate-400">{devices.length} Devices Registered</span>
            </div>

            <div className="space-y-2">
              {devices.map(dev => (
                <div
                  key={dev.id}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${dev.connected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                      {dev.type === 'gps' ? <Compass className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">{dev.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {dev.type.toUpperCase()} · FW: {dev.firmware || '1.0'} · Battery: {dev.batteryPercent || 90}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onToggleDevice(dev.id)}
                      className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                        dev.connected ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {dev.connected ? 'SYNCHRONIZED' : 'STANDBY'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Add Custom Simulated Marine Instrument */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. Raymarine Axiom NMEA Bridge"
              value={customDeviceName}
              onChange={(e) => setCustomDeviceName(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white placeholder-slate-500"
            />
            <select
              value={customDeviceType}
              onChange={(e) => setCustomDeviceType(e.target.value as any)}
              className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-300 font-mono"
            >
              <option value="sounder">Sounder Transducer</option>
              <option value="gps">GPS Puck</option>
            </select>
            <button
              onClick={handleAddVirtual}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold cursor-pointer"
            >
              Add Device
            </button>
          </div>

          {/* Live NMEA 0183 Telemetry Stream Console */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-sky-400" />
                Live NMEA 0183 Raw Sentence Stream ($GPRMC, $SDDPT, $SDMTW)
              </span>
              <span className="text-[10px] font-mono text-emerald-400 animate-pulse">● STREAMING 10Hz</span>
            </div>

            <div className="p-3 bg-black/90 border border-slate-800 rounded-lg h-36 font-mono text-[11px] text-emerald-400/90 overflow-y-auto space-y-1">
              {nmeaLog.slice(-10).map((line, idx) => (
                <div key={idx} className="leading-tight">
                  <span className="text-slate-600 select-none mr-2">&gt;</span>
                  {line}
                </div>
              ))}
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
