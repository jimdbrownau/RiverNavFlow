import React, { useState } from 'react';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Search, 
  Anchor, 
  AlertTriangle, 
  Compass, 
  X,
  Navigation,
  Fuel,
  Fish,
  Building2,
  Lock,
  Ship
} from 'lucide-react';
import { Waypoint, WaypointCategory } from '../types/marine';
import { formatCoordinatesDMS } from '../services/currentData';

interface WaypointsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  waypoints: Waypoint[];
  vesselLat: number;
  vesselLng: number;
  vesselDepthFt: number;
  onAddWaypoint: (wp: Omit<Waypoint, 'id' | 'createdAt'>) => void;
  onDeleteWaypoint: (id: string) => void;
  onSelectWaypointOnMap: (lat: number, lng: number) => void;
}

export const WaypointsManagerModal: React.FC<WaypointsManagerModalProps> = ({
  isOpen,
  onClose,
  waypoints,
  vesselLat,
  vesselLng,
  vesselDepthFt,
  onAddWaypoint,
  onDeleteWaypoint,
  onSelectWaypointOnMap,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WaypointCategory | 'all'>('all');
  const [isAdding, setIsAdding] = useState(false);

  // New waypoint form states
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<WaypointCategory>('anchorage');
  const [newNotes, setNewNotes] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [customLat, setCustomLat] = useState(vesselLat.toString());
  const [customLng, setCustomLng] = useState(vesselLng.toString());

  if (!isOpen) return null;

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const lat = useCurrentLocation ? vesselLat : parseFloat(customLat) || vesselLat;
    const lng = useCurrentLocation ? vesselLng : parseFloat(customLng) || vesselLng;

    onAddWaypoint({
      name: newName.trim(),
      category: newCategory,
      lat,
      lng,
      depthFt: vesselDepthFt,
      notes: newNotes.trim() || undefined,
    });

    setNewName('');
    setNewNotes('');
    setIsAdding(false);
  };

  const filteredWaypoints = waypoints.filter(wp => {
    const matchesCategory = selectedCategory === 'all' || wp.category === selectedCategory;
    const matchesSearch = wp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wp.notes && wp.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: WaypointCategory) => {
    switch (category) {
      case 'anchorage': return <Anchor className="w-4 h-4 text-sky-400" />;
      case 'ramp': return <Ship className="w-4 h-4 text-emerald-400" />;
      case 'fuel': return <Fuel className="w-4 h-4 text-amber-400" />;
      case 'hazard': return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'marina': return <Building2 className="w-4 h-4 text-blue-400" />;
      case 'fishing': return <Fish className="w-4 h-4 text-purple-400" />;
      case 'lock': return <Lock className="w-4 h-4 text-fuchsia-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                River Waypoints & Favorite Locations
              </h2>
              <p className="text-xs text-slate-400">
                Categorized Anchorages, Boat Launches, Fuel Docks & Hazard Bars
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAdding ? 'Cancel' : 'New Mark'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Add Waypoint Form (Toggleable) */}
          {isAdding && (
            <form onSubmit={handleSaveNew} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Mark New River Location
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Waypoint Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Government Island North Anchorage"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Category:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-300 font-mono"
                  >
                    <option value="anchorage">⚓ Anchorage</option>
                    <option value="ramp">🚢 Boat Ramp / Launch</option>
                    <option value="fuel">⛽ Fuel Dock</option>
                    <option value="hazard">⚠️ Hazard / Shallow Bar</option>
                    <option value="marina">🏢 Marina / Mooring</option>
                    <option value="fishing">🐟 Fishing Spot</option>
                    <option value="lock">🔒 Lock / Dam</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Notes / Depth / Access:</label>
                <input
                  type="text"
                  placeholder="e.g. Good holding in sand, avoid east wing dike at low water"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white placeholder-slate-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400 font-mono">
                  Coordinates: {vesselLat.toFixed(5)}, {vesselLng.toFixed(5)} (Depth: {vesselDepthFt.toFixed(1)}ft)
                </span>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold cursor-pointer"
                >
                  Save Waypoint
                </button>
              </div>
            </form>
          )}

          {/* Search & Category Filter Buttons */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search waypoints by name or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500"
              />
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'all', label: 'All' },
                { id: 'anchorage', label: 'Anchorages' },
                { id: 'ramp', label: 'Boat Ramps' },
                { id: 'fuel', label: 'Fuel' },
                { id: 'hazard', label: 'Hazards' },
                { id: 'marina', label: 'Marinas' },
                { id: 'fishing', label: 'Fishing' },
                { id: 'lock', label: 'Locks' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`px-3 py-1 rounded-md whitespace-nowrap cursor-pointer transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-sky-600 text-white font-semibold'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Waypoints List */}
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {filteredWaypoints.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No waypoints found matching your filter criteria.
              </div>
            ) : (
              filteredWaypoints.map(wp => {
                const dms = formatCoordinatesDMS(wp.lat, wp.lng);
                return (
                  <div
                    key={wp.id}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-slate-900 mt-0.5">
                        {getCategoryIcon(wp.category)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{wp.name}</span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                            {wp.category}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {dms.full}
                          {wp.depthFt !== undefined && ` · Depth: ${wp.depthFt.toFixed(1)}ft`}
                        </div>
                        {wp.notes && (
                          <p className="text-[11px] text-slate-400 mt-1 italic">
                            "{wp.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onSelectWaypointOnMap(wp.lat, wp.lng);
                          onClose();
                        }}
                        className="p-2 hover:bg-slate-800 text-sky-400 rounded-lg transition-colors cursor-pointer"
                        title="View & Center on Map"
                      >
                        <Navigation className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteWaypoint(wp.id)}
                        className="p-2 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                        title="Delete Waypoint"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            {waypoints.length} Total Waypoints
          </span>
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
