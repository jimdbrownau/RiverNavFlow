import { HardwareDevice } from '../types/marine';

export interface BluetoothConnectionCallbacks {
  onStatusChange: (device: HardwareDevice) => void;
  onSentenceReceived: (sentence: string) => void;
  onError: (msg: string) => void;
}

export class MarineHardwareManager {
  private static instance: MarineHardwareManager;
  private connectedDevices: Map<string, HardwareDevice> = new Map();
  private callbacks: Set<BluetoothConnectionCallbacks> = new Set();
  private simulationInterval: number | null = null;

  private constructor() {
    // Initial devices
    this.connectedDevices.set('sim-gps', {
      id: 'sim-gps',
      name: 'Simulated High-Precision Marine GPS (10Hz)',
      type: 'gps',
      connected: true,
      batteryPercent: 94,
      firmware: 'v2.4-NMEA',
    });
    this.connectedDevices.set('sim-depth', {
      id: 'sim-depth',
      name: 'Simulated Dual-Freq CHIRP Transducer (200kHz)',
      type: 'sounder',
      connected: true,
      batteryPercent: 88,
      firmware: 'CHIRP-v4.1',
    });
  }

  public static getInstance(): MarineHardwareManager {
    if (!MarineHardwareManager.instance) {
      MarineHardwareManager.instance = new MarineHardwareManager();
    }
    return MarineHardwareManager.instance;
  }

  public subscribe(callbacks: BluetoothConnectionCallbacks): () => void {
    this.callbacks.add(callbacks);
    return () => {
      this.callbacks.delete(callbacks);
    };
  }

  public getDevices(): HardwareDevice[] {
    return Array.from(this.connectedDevices.values());
  }

  public isWebBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  // Attempt real Web Bluetooth Scan & Pair
  public async connectBluetoothDevice(type: 'gps' | 'sounder'): Promise<HardwareDevice | null> {
    if (!this.isWebBluetoothSupported()) {
      throw new Error('Web Bluetooth API is not supported in this browser. Please use Chrome/Edge or enable simulated hardware.');
    }

    try {
      // standard Bluetooth GATT request for marine instruments
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['generic_access', 'battery_service', 0x1819]
      });

      const newDev: HardwareDevice = {
        id: device.id,
        name: device.name || `${type === 'gps' ? 'Bluetooth GPS Puck' : 'BLE Marine Transducer'}`,
        type,
        connected: true,
        batteryPercent: 95,
        firmware: 'BLE-1.0',
      };

      this.connectedDevices.set(newDev.id, newDev);
      this.callbacks.forEach(cb => cb.onStatusChange(newDev));
      return newDev;
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        this.callbacks.forEach(cb => cb.onError(err.message || 'Failed to connect Bluetooth marine device.'));
      }
      return null;
    }
  }

  public toggleDeviceConnection(id: string): void {
    const dev = this.connectedDevices.get(id);
    if (dev) {
      dev.connected = !dev.connected;
      this.connectedDevices.set(id, { ...dev });
      this.callbacks.forEach(cb => cb.onStatusChange({ ...dev }));
    }
  }

  public addVirtualDevice(name: string, type: 'gps' | 'sounder'): HardwareDevice {
    const id = `virt-${Date.now()}`;
    const dev: HardwareDevice = {
      id,
      name,
      type,
      connected: true,
      batteryPercent: 100,
      firmware: 'SIM-SYNC',
    };
    this.connectedDevices.set(id, dev);
    this.callbacks.forEach(cb => cb.onStatusChange(dev));
    return dev;
  }

  public broadcastSentence(sentence: string) {
    this.callbacks.forEach(cb => cb.onSentenceReceived(sentence));
  }
}
