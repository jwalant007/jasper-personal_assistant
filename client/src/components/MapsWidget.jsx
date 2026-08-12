import React, { useState } from 'react';
import { 
  Globe, 
  Navigation, 
  MapPin, 
  Compass, 
  Layers, 
  Search, 
  Car, 
  Zap, 
  Utensils, 
  Fuel, 
  Crosshair, 
  Building2, 
  ParkingSquare, 
  XCircle, 
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';

export default function MapsWidget({ onClose }) {
  const [activeTab, setActiveTab] = useState('live_location'); // live_location, navigation, traffic, nearby
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaceCategory, setSelectedPlaceCategory] = useState('all');
  const [isTrafficEnabled, setIsTrafficEnabled] = useState(true);
  const [navigationDest, setNavigationDest] = useState('Marine Drive, Mumbai');
  const [isNavigating, setIsNavigating] = useState(false);

  const nearbyPlaces = [
    { name: 'Supercharge EV Station', category: 'ev', distance: '0.4 km', rating: '4.8 ★', status: 'Available (4/6)' },
    { name: 'Taj Mahal Palace Fine Dining', category: 'food', distance: '1.2 km', rating: '4.9 ★', status: 'Open Now' },
    { name: 'Shell Premium Fuel Hub', category: 'fuel', distance: '1.8 km', rating: '4.6 ★', status: '24/7 Open' },
    { name: 'Lilavati Multi-Specialty Hospital', category: 'hospital', distance: '3.1 km', rating: '4.7 ★', status: 'Emergency Ready' },
    { name: 'Smart City Underground Parking', category: 'parking', distance: '0.7 km', rating: '4.5 ★', status: '18 Slots Free' }
  ];

  const filteredPlaces = nearbyPlaces.filter(p => 
    (selectedPlaceCategory === 'all' || p.category === selectedPlaceCategory) &&
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-950/90 border border-blue-500/30 rounded-2xl p-6 text-slate-100 backdrop-blur-xl shadow-2xl max-w-5xl w-full mx-auto relative overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-blue-500/20 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/40 rounded-xl text-blue-400">
            <Globe className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wider text-blue-300 uppercase font-orbitron">Maps & Spatial Intelligence</h2>
            <p className="text-xs text-slate-400 font-mono">Live GPS • Turn-by-Turn Navigation • Traffic Matrix • Nearby Places</p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-all">
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-5 border-b border-slate-800 pb-3">
        {[
          { id: 'live_location', label: 'Live Location', icon: MapPin },
          { id: 'navigation', label: 'Navigation', icon: Navigation },
          { id: 'traffic', label: 'Traffic Layer', icon: Layers },
          { id: 'nearby', label: 'Find Nearby Places', icon: Search },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                active 
                  ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300 shadow-lg shadow-blue-500/10' 
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Interactive Map Visual Area */}
      <div className="relative rounded-2xl bg-slate-900 border border-slate-800 h-72 overflow-hidden mb-5 flex items-center justify-center">
        {/* Synthetic Map Background Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
        
        {/* Traffic Heatmap Visual Overlays if traffic tab or enabled */}
        {(activeTab === 'traffic' || isTrafficEnabled) && (
          <>
            <div className="absolute top-12 left-1/4 w-48 h-2 bg-rose-500/60 rounded-full blur-xs animate-pulse" />
            <div className="absolute bottom-16 right-1/3 w-64 h-2 bg-amber-500/60 rounded-full blur-xs" />
            <div className="absolute top-24 right-1/4 w-32 h-2 bg-emerald-500/60 rounded-full blur-xs" />
          </>
        )}

        {/* Live Location Marker */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center animate-ping absolute" />
          <div className="w-10 h-10 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-xl z-10 text-white">
            <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '10s' }} />
          </div>
          <div className="mt-2 px-3 py-1 bg-slate-950/90 border border-blue-500/40 rounded-full text-[11px] font-mono text-blue-300 shadow-xl z-10 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> 18.9220° N, 72.8347° E • Mumbai
          </div>
        </div>

        {/* Map Floating Controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
          <button 
            onClick={() => setIsTrafficEnabled(!isTrafficEnabled)}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border font-mono flex items-center gap-1 transition-all ${
              isTrafficEnabled ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-slate-950/80 text-slate-400 border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Traffic: {isTrafficEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Tab Specific Content */}
      {activeTab === 'live_location' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <div className="text-slate-400 font-mono text-[10px]">CURRENT CITY</div>
            <div className="font-bold text-slate-200 mt-1">Mumbai, Maharashtra</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">GPS High Precision • 5m accuracy</div>
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <div className="text-slate-400 font-mono text-[10px]">ELEVATION & SPEED</div>
            <div className="font-bold text-slate-200 mt-1">14m ASL • 0 km/h (Stationary)</div>
            <div className="text-[10px] text-blue-400 mt-0.5">Bearing: 184° South-West</div>
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <div className="text-slate-400 font-mono text-[10px]">WEATHER & ROAD HAZARDS</div>
            <div className="font-bold text-slate-200 mt-1">Clear visibility • Dry roads</div>
            <div className="text-[10px] text-amber-400 mt-0.5">No active weather warnings</div>
          </div>
        </div>
      )}

      {activeTab === 'navigation' && (
        <div className="space-y-3 text-xs">
          <div className="flex gap-2">
            <input
              type="text"
              value={navigationDest}
              onChange={(e) => setNavigationDest(e.target.value)}
              placeholder="Enter destination address..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:border-blue-500 outline-none"
            />
            <button
              onClick={() => setIsNavigating(!isNavigating)}
              className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
                isNavigating ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
              }`}
            >
              <Navigation className="w-4 h-4" /> {isNavigating ? 'Cancel Route' : 'Start Navigation'}
            </button>
          </div>

          {isNavigating && (
            <div className="p-4 bg-blue-950/40 border border-blue-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between font-mono text-blue-300">
                <span className="font-bold flex items-center gap-1.5"><Car className="w-4 h-4" /> ETA: 18 mins</span>
                <span>Distance: 6.4 km • Via Eastern Express Highway</span>
              </div>
              <div className="text-slate-300 text-xs flex items-center gap-2">
                <span className="p-1 bg-blue-500/20 rounded text-blue-400 font-bold">100m</span>
                Turn right at Nariman Point Signal toward Promenade.
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'traffic' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Freeway Flow</div>
            <div className="text-slate-300 mt-1 text-[11px]">Coastal Road & Bandra Worli Sea Link flowing smoothly (60-70 km/h).</div>
          </div>
          <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl">
            <div className="font-bold text-amber-400 flex items-center gap-1.5"><Clock className="w-4 h-4" /> Moderate Delay</div>
            <div className="text-slate-300 mt-1 text-[11px]">Dadar Junction heavy volume. +8 mins expected delay.</div>
          </div>
          <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl">
            <div className="font-bold text-rose-400 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Heavy Congestion</div>
            <div className="text-slate-300 mt-1 text-[11px]">BKC Connector roadwork ongoing. Alternate route suggested.</div>
          </div>
        </div>
      )}

      {activeTab === 'nearby' && (
        <div className="space-y-3">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              { id: 'all', label: 'All Places', icon: Search },
              { id: 'ev', label: 'EV Charging', icon: Zap },
              { id: 'food', label: 'Restaurants', icon: Utensils },
              { id: 'fuel', label: 'Gas Stations', icon: Fuel },
              { id: 'hospital', label: 'Hospitals', icon: Building2 },
              { id: 'parking', label: 'Parking', icon: ParkingSquare },
            ].map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedPlaceCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                    selectedPlaceCategory === cat.id 
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' 
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {cat.label}
                </button>
              );
            })}
          </div>

          {/* Places Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {filteredPlaces.map((place, idx) => (
              <div key={idx} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between hover:border-blue-500/30 transition-all">
                <div>
                  <div className="font-bold text-slate-200">{place.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{place.distance} • {place.rating}</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">{place.status}</div>
                </div>
                <button className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded-lg text-[11px] font-bold hover:bg-blue-500/30">
                  Navigate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
