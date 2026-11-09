import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Globe, Search, Satellite, Map, Radar, FileText, Settings, Eye,
  MapPin, Navigation, Crosshair, Layers, RefreshCw, Download, ExternalLink,
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, XCircle, Loader,
  Zap, Shield, Clock, Activity, Radio, Cpu, Cloud, CloudRain, Sun, Wind,
  Thermometer, Droplets, Eye as EyeIcon, Database, BookOpen, Newspaper,
  Building2, TreePine, Flame, Info, Copy, Check, Target, BarChart3,
  TrendingUp, Compass, Lock
} from 'lucide-react';
import { getApiBase } from '../utils/apiConfig';
import {
  decimalToDms, latLonToMgrs, latLonToGeohash, latLonToUtm,
  getPreciseLocationIntelligence, getSatelliteConstellationTelemetry,
  fetchLiveIssTelemetry, getNasaGibsTileUrl
} from '../utils/satelliteIntelligence';

// ─── API Helper ────────────────────────────────────────────────────────────────
const apiRequest = async (path) => {
  const token = localStorage.getItem('jasper_auth_token') || '';
  const base = getApiBase();
  const res = await fetch(`${base}${path}`, {
    headers: { 'x-jasper-token': token, 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error(`API ${path} returned ${res.status}`);
  return res.json();
};

const apiPost = async (path, body) => {
  const token = localStorage.getItem('jasper_auth_token') || '';
  const base = getApiBase();
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'x-jasper-token': token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`API POST ${path} returned ${res.status}`);
  return res.json();
};

// ─── Haversine distance (km) ───────────────────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(3);
}

// ─── Sub-components ────────────────────────────────────────────────────────────

const StatusDot = ({ online }) =>
  online ? (
    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981] animate-pulse" />
  ) : (
    <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
  );

const ScanLine = () => (
  <div className="relative w-full h-0.5 overflow-hidden rounded">
    <div className="scan-line absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
  </div>
);

const LoadingPulse = ({ label = 'SCANNING...' }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-10">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-ping" />
      <div className="absolute inset-2 rounded-full border-2 border-cyan-400/60 animate-spin" />
      <Crosshair className="absolute inset-0 m-auto text-cyan-400" size={24} />
    </div>
    <p className="text-cyan-400 text-xs font-mono tracking-widest animate-pulse">{label}</p>
  </div>
);

const ConfidenceBadge = ({ level }) => {
  const map = {
    HIGH:   'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    LOW:    'bg-red-500/20 text-red-400 border-red-500/40',
  };
  return (
    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${map[level] || map.MEDIUM}`}>
      {level}
    </span>
  );
};

const CopyBtn = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button onClick={copy} className="ml-1 text-cyan-500 hover:text-cyan-300 transition-colors">
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
};

// ─── Satellite Constellation Radar (SVG) ──────────────────────────────────────
const ConstellationRadar = ({ satellites = [] }) => {
  const svgSize = 200;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const r = 85;

  return (
    <div className="flex flex-col items-center">
      <svg width={svgSize} height={svgSize} className="block">
        {/* Background rings */}
        {[0.33, 0.66, 1].map((f, i) => (
          <circle key={i} cx={cx} cy={cy} r={r * f} fill="none" stroke="#00f3ff" strokeWidth={0.5} strokeOpacity={0.2} />
        ))}
        {/* Crosshairs */}
        <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="#00f3ff" strokeWidth={0.5} strokeOpacity={0.15} />
        <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#00f3ff" strokeWidth={0.5} strokeOpacity={0.15} />

        {/* Animated sweep */}
        <path
          d={`M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx + r * 0.95} ${cy + r * 0.3}`}
          fill="url(#sweepGrad)"
          className="radar-sweep"
          opacity="0.35"
        />
        <defs>
          <radialGradient id="sweepGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
            gradientTransform={`translate(${cx},${cy}) scale(${r})`}>
            <stop offset="0%" stopColor="#00f3ff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#00f3ff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Satellite dots */}
        {satellites.map((sat, i) => {
          const angle = (sat.azimuth * Math.PI) / 180 - Math.PI / 2;
          const dist = ((90 - sat.elevation) / 90) * r;
          const x = cx + dist * Math.cos(angle);
          const y = cy + dist * Math.sin(angle);
          const color = sat.constellation === 'GPS' ? '#00f3ff' : sat.constellation === 'GALILEO' ? '#3b82f6' : '#10b981';
          return (
            <g key={sat.prn || i}>
              <circle cx={x} cy={y} r={4} fill={color} opacity={0.9} />
              <text x={x + 6} y={y + 4} fontSize="8" fill={color} fontFamily="monospace">{sat.prn}</text>
            </g>
          );
        })}

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={4} fill="#00f3ff" />

        {/* Labels */}
        <text x={cx} y={cy - r - 5} textAnchor="middle" fontSize="8" fill="#00f3ff" fillOpacity="0.5" fontFamily="monospace">N</text>
        <text x={cx + r + 5} y={cy + 3} textAnchor="start" fontSize="8" fill="#00f3ff" fillOpacity="0.5" fontFamily="monospace">E</text>
        <text x={cx} y={cy + r + 12} textAnchor="middle" fontSize="8" fill="#00f3ff" fillOpacity="0.5" fontFamily="monospace">S</text>
        <text x={cx - r - 5} y={cy + 3} textAnchor="end" fontSize="8" fill="#00f3ff" fillOpacity="0.5" fontFamily="monospace">W</text>
      </svg>

      {/* Legend */}
      <div className="flex gap-4 mt-2 text-[10px] font-mono">
        {[['GPS', '#00f3ff'], ['GALILEO', '#3b82f6'], ['GLONASS', '#10b981']].map(([name, color]) => (
          <span key={name} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
            {name}
          </span>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function IntelligenceCommandCenterWidget({ onClose }) {
  const [activeTab, setActiveTab] = useState(0);
  const [activity, setActivity] = useState([]);

  const addActivity = useCallback((msg, type = 'info') => {
    setActivity(prev => [
      { msg, type, ts: new Date().toISOString() },
      ...prev.slice(0, 29)
    ]);
  }, []);

  const tabs = [
    { label: 'OVERVIEW',       icon: <Globe size={14} /> },
    { label: 'OSINT',          icon: <Search size={14} /> },
    { label: 'GPS INTEL',      icon: <Navigation size={14} /> },
    { label: 'SATELLITE',      icon: <Satellite size={14} /> },
    { label: 'GEO ANALYSIS',   icon: <Map size={14} /> },
    { label: 'ENVIRONMENT',    icon: <Cloud size={14} /> },
    { label: 'REPORTS',        icon: <FileText size={14} /> },
    { label: 'SETTINGS',       icon: <Settings size={14} /> },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black/95 text-gray-100 overflow-hidden">
      {/* ── Header ── */}
      <div className="flex-shrink-0 relative border-b border-cyan-900/50 bg-black px-4 py-2">
        <ScanLine />
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Radar className="text-cyan-400 animate-spin [animation-duration:8s]" size={22} />
              <div className="absolute inset-0 rounded-full bg-cyan-400/10 animate-ping" />
            </div>
            <div>
              <h1 className="font-mono text-sm font-bold tracking-[0.2em] text-cyan-400">
                J.A.S.P.E.R INTELLIGENCE COMMAND CENTER
              </h1>
              <p className="font-mono text-[9px] text-cyan-700 tracking-widest">
                JOINT ANALYSIS &amp; SPATIAL PATTERN EVALUATION RECONNAISSANCE
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              SECURE CHANNEL ACTIVE
            </span>
            <button
              onClick={onClose}
              className="ml-2 text-gray-500 hover:text-red-400 transition-colors font-mono text-xs border border-gray-700 hover:border-red-500 px-2 py-1 rounded"
            >
              ✕ CLOSE
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-0.5 mt-2 overflow-x-auto scrollbar-none">
          {tabs.map((t, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] tracking-widest rounded-t border-b-2 whitespace-nowrap transition-all ${
                activeTab === i
                  ? 'border-cyan-400 text-cyan-400 bg-cyan-400/10'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 0 && <OverviewTab addActivity={addActivity} activity={activity} />}
        {activeTab === 1 && <OsintTab addActivity={addActivity} />}
        {activeTab === 2 && <GpsTab addActivity={addActivity} />}
        {activeTab === 3 && <SatelliteTab addActivity={addActivity} />}
        {activeTab === 4 && <GeoAnalysisTab addActivity={addActivity} />}
        {activeTab === 5 && <EnvironmentTab addActivity={addActivity} />}
        {activeTab === 6 && <ReportsTab addActivity={addActivity} />}
        {activeTab === 7 && <SettingsTab />}
      </div>

      <style>{`
        @keyframes scanMove {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .scan-line { animation: scanMove 2.5s linear infinite; }

        @keyframes radarSweep {
          from { transform-origin: ${200/2}px ${200/2}px; transform: rotate(0deg); }
          to   { transform-origin: ${200/2}px ${200/2}px; transform: rotate(360deg); }
        }
        .radar-sweep { animation: radarSweep 4s linear infinite; transform-origin: 100px 100px; }

        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #00f3ff33; border-radius: 2px; }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════
function OverviewTab({ addActivity, activity }) {
  const [sources, setSources] = useState(null);
  const [iss, setIss] = useState(null);
  const [layers, setLayers] = useState([]);
  const [quickLat, setQuickLat] = useState('');
  const [quickLon, setQuickLon] = useState('');
  const [quickResult, setQuickResult] = useState(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    apiRequest('/api/osint/sources/status')
      .then(d => { setSources(d); addActivity('Data source status fetched'); })
      .catch(() => setSources({ error: true }));
    fetchLiveIssTelemetry()
      .then(d => { setIss(d); addActivity('ISS telemetry received'); })
      .catch(() => {});
    apiRequest('/api/satellite/layers')
      .then(d => setLayers(Array.isArray(d) ? d : d.layers || []))
      .catch(() => {});
  }, [addActivity]);

  const handleScan = async () => {
    const lat = parseFloat(quickLat);
    const lon = parseFloat(quickLon);
    if (isNaN(lat) || isNaN(lon)) return;
    setScanning(true);
    addActivity(`Quick scan initiated: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    try {
      const geo = await apiRequest(`/api/geo/reverse?lat=${lat}&lon=${lon}`);
      setQuickResult(geo);
      addActivity(`Reverse geocode: ${geo.display_name || 'resolved'}`);
    } catch (e) {
      setQuickResult({ error: e.message });
    }
    setScanning(false);
  };

  const onlineCount = sources && !sources.error
    ? Object.values(sources).filter(v => v === true || v?.online === true || v?.status === 'online').length
    : 0;

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Quick Scan Bar */}
      <div className="lg:col-span-3 bg-gray-900/60 border border-cyan-900/40 rounded-lg p-4">
        <p className="font-mono text-xs text-cyan-600 mb-2 tracking-widest">▶ QUICK COORDINATE SCAN</p>
        <div className="flex gap-2 flex-wrap">
          <input
            value={quickLat} onChange={e => setQuickLat(e.target.value)} placeholder="Latitude"
            className="bg-black border border-cyan-900 rounded px-3 py-1.5 font-mono text-sm text-cyan-300 w-36 focus:outline-none focus:border-cyan-500"
          />
          <input
            value={quickLon} onChange={e => setQuickLon(e.target.value)} placeholder="Longitude"
            className="bg-black border border-cyan-900 rounded px-3 py-1.5 font-mono text-sm text-cyan-300 w-36 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={handleScan} disabled={scanning}
            className="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500 text-cyan-400 font-mono text-xs rounded hover:bg-cyan-500/20 transition-all flex items-center gap-2"
          >
            {scanning ? <Loader size={12} className="animate-spin" /> : <Crosshair size={12} />}
            SCAN
          </button>
        </div>
        {quickResult && !quickResult.error && (
          <p className="font-mono text-xs text-emerald-400 mt-2">
            ✓ {quickResult.display_name || JSON.stringify(quickResult)}
          </p>
        )}
        {quickResult?.error && (
          <p className="font-mono text-xs text-red-400 mt-2">✕ {quickResult.error}</p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="bg-gray-900/60 border border-cyan-900/40 rounded-lg p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-cyan-500 font-mono text-xs tracking-widest mb-1">
          <Database size={12} /> DATA SOURCES
        </div>
        {sources?.error ? (
          <p className="text-red-400 text-xs font-mono">Source status unavailable</p>
        ) : sources ? (
          <div className="space-y-1.5">
            {Object.entries(sources).map(([k, v]) => {
              const online = v === true || v?.online === true || v?.status === 'online';
              return (
                <div key={k} className="flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-400 uppercase">{k.replace(/_/g, ' ')}</span>
                  <span className="flex items-center gap-1.5">
                    <StatusDot online={online} />
                    <span className={online ? 'text-emerald-400' : 'text-red-400'}>{online ? 'ONLINE' : 'OFFLINE'}</span>
                  </span>
                </div>
              );
            })}
            <p className="text-cyan-600 text-[10px] font-mono mt-2 border-t border-cyan-900/30 pt-2">
              {onlineCount} sources active
            </p>
          </div>
        ) : (
          <LoadingPulse label="FETCHING SOURCES..." />
        )}
      </div>

      {/* ISS Card */}
      <div className="bg-gray-900/60 border border-blue-900/40 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-400 font-mono text-xs tracking-widest mb-3">
          <Satellite size={12} /> ISS LIVE POSITION
        </div>
        {iss ? (
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Latitude</span>
              <span className="text-blue-300">{(iss.latitude || iss.lat || 0).toFixed(4)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Longitude</span>
              <span className="text-blue-300">{(iss.longitude || iss.lon || 0).toFixed(4)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Altitude</span>
              <span className="text-blue-300">{(iss.altitude || 408).toFixed(1)} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Velocity</span>
              <span className="text-blue-300">{(iss.velocity || 27600).toFixed(0)} km/h</span>
            </div>
            <a href="https://spotthestation.nasa.gov/" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-500 hover:text-blue-300 mt-2">
              <ExternalLink size={10} /> NASA Station Tracker
            </a>
          </div>
        ) : (
          <LoadingPulse label="ORBITAL LOCK..." />
        )}
      </div>

      {/* Activity Timeline */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4 max-h-64 overflow-y-auto scrollbar-thin">
        <div className="flex items-center gap-2 text-gray-400 font-mono text-xs tracking-widest mb-3">
          <Activity size={12} /> ACTIVITY TIMELINE
        </div>
        {activity.length === 0 ? (
          <p className="text-gray-600 text-xs font-mono">No recent activity</p>
        ) : (
          <div className="space-y-1.5">
            {activity.map((a, i) => (
              <div key={i} className="flex gap-2 text-[10px] font-mono">
                <span className="text-gray-600 shrink-0">{new Date(a.ts).toLocaleTimeString()}</span>
                <span className="text-gray-300">{a.msg}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Satellite Layers */}
      <div className="lg:col-span-3 bg-gray-900/60 border border-purple-900/40 rounded-lg p-4">
        <div className="flex items-center gap-2 text-purple-400 font-mono text-xs tracking-widest mb-3">
          <Layers size={12} /> AVAILABLE SATELLITE LAYERS
        </div>
        {layers.length === 0 ? (
          <p className="text-gray-500 text-xs font-mono">Loading layers...</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {layers.map((l, i) => (
              <span key={i} className="text-[10px] font-mono px-2 py-1 bg-purple-900/20 border border-purple-800/40 rounded text-purple-300">
                {typeof l === 'string' ? l : l.name || l.id}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — OSINT EXPLORER
// ═══════════════════════════════════════════════════════════════════════════════
function OsintTab({ addActivity }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const categories = ['All', 'Geographic', 'News', 'Encyclopedic', 'Infrastructure'];

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    addActivity(`OSINT search: "${query}" [${category}]`);
    try {
      const data = await apiRequest(`/api/osint/search?q=${encodeURIComponent(query)}`);
      const raw = Array.isArray(data) ? data : data.results || data.items || [];
      setResults(raw);
      addActivity(`OSINT returned ${raw.length} results`);
    } catch (e) {
      setError(e.message);
      addActivity(`OSINT error: ${e.message}`, 'error');
    }
    setLoading(false);
  };

  const filtered = category === 'All' ? results : results.filter(r => {
    const src = (r.source || r.type || '').toLowerCase();
    if (category === 'News')          return src.includes('news');
    if (category === 'Encyclopedic')  return src.includes('wiki');
    if (category === 'Geographic')    return src.includes('geo') || src.includes('osm');
    if (category === 'Infrastructure') return src.includes('infra') || src.includes('osm');
    return true;
  });

  return (
    <div className="p-4 space-y-4">
      {/* Search bar */}
      <div className="bg-gray-900/60 border border-cyan-900/40 rounded-lg p-4">
        <p className="font-mono text-xs text-cyan-600 mb-2 tracking-widest">▶ OSINT INTELLIGENCE SEARCH</p>
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-2.5 text-cyan-700" />
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="Enter search query..."
              className="w-full pl-9 pr-4 py-2 bg-black border border-cyan-900 rounded font-mono text-sm text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button onClick={search} disabled={loading}
            className="px-4 py-2 bg-cyan-500/10 border border-cyan-500 text-cyan-400 font-mono text-xs rounded hover:bg-cyan-500/20 transition-all flex items-center gap-1.5">
            {loading ? <Loader size={12} className="animate-spin" /> : <Search size={12} />} SEARCH
          </button>
        </div>
        {/* Category filters */}
        <div className="flex gap-1.5 flex-wrap">
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1 font-mono text-[10px] rounded border transition-all ${
                category === c
                  ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10'
                  : 'border-gray-700 text-gray-500 hover:border-gray-500'
              }`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading && <LoadingPulse label="SCANNING OPEN SOURCES..." />}
      {error && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 font-mono text-xs text-red-400">
          <AlertTriangle size={14} className="inline mr-2" />ERROR: {error}
        </div>
      )}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.length > 1 && (
            <div className="bg-blue-900/20 border border-blue-800/40 rounded px-3 py-2 font-mono text-[10px] text-blue-400 flex items-center gap-2">
              <TrendingUp size={12} /> Cross-reference active — {filtered.length} sources matched query
            </div>
          )}
          {filtered.map((r, i) => (
            <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-lg p-4 hover:border-cyan-900/60 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-mono text-sm text-cyan-300 flex-1">{r.title || r.name || 'Result'}</h3>
                <div className="flex items-center gap-2 shrink-0">
                  <ConfidenceBadge level={r.confidence || 'MEDIUM'} />
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-cyan-700 hover:text-cyan-400">
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
              <p className="text-gray-400 text-xs mb-2 leading-relaxed">{r.description || r.snippet || r.summary || ''}</p>
              <div className="flex items-center gap-3 text-[10px] font-mono text-gray-600">
                {r.source && <span className="bg-gray-800 px-2 py-0.5 rounded">{r.source}</span>}
                {r.timestamp && <span className="flex items-center gap-1"><Clock size={9} />{new Date(r.timestamp).toLocaleString()}</span>}
                {r.url && <span className="truncate max-w-[200px] text-gray-700">{r.url}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && !error && filtered.length === 0 && query && (
        <div className="text-center py-10 font-mono text-xs text-gray-600">
          <Shield size={32} className="mx-auto mb-3 opacity-30" />
          No results returned for this query
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3 — GPS INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════════════════
function GpsTab({ addActivity }) {
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [geoData, setGeoData] = useState(null);
  const [satellites, setSatellites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const derived = (() => {
    const la = parseFloat(lat);
    const lo = parseFloat(lon);
    if (isNaN(la) || isNaN(lo)) return null;
    return {
      dmsLat: decimalToDms(la, true),
      dmsLon: decimalToDms(lo, false),
      mgrs:   latLonToMgrs(la, lo),
      geohash: latLonToGeohash(la, lo),
      utm:    latLonToUtm(la, lo),
    };
  })();

  const fetchData = async () => {
    const la = parseFloat(lat);
    const lo = parseFloat(lon);
    if (isNaN(la) || isNaN(lo)) return;
    setLoading(true);
    addActivity(`GPS analysis: ${la.toFixed(4)}, ${lo.toFixed(4)}`);
    try {
      const [rev, elev, tz, country] = await Promise.allSettled([
        apiRequest(`/api/geo/reverse?lat=${la}&lon=${lo}`),
        apiRequest(`/api/geo/elevation?lat=${la}&lon=${lo}`),
        apiRequest(`/api/geo/timezone?lat=${la}&lon=${lo}`),
        apiRequest(`/api/geo/country?lat=${la}&lon=${lo}`),
      ]);
      setGeoData({
        reverse: rev.status === 'fulfilled' ? rev.value : null,
        elevation: elev.status === 'fulfilled' ? elev.value : null,
        timezone: tz.status === 'fulfilled' ? tz.value : null,
        country: country.status === 'fulfilled' ? country.value : null,
      });
      const sats = getSatelliteConstellationTelemetry(la, lo);
      setSatellites(sats);
      addActivity('GPS data resolved');
    } catch (e) {
      addActivity(`GPS fetch error: ${e.message}`, 'error');
    }
    setLoading(false);
  };

  const getMyLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(pos.coords.latitude.toFixed(6));
        setLon(pos.coords.longitude.toFixed(6));
        setLocating(false);
        addActivity('User location obtained via browser geolocation');
      },
      err => {
        addActivity(`Geolocation denied: ${err.message}`, 'error');
        setLocating(false);
      }
    );
  };

  return (
    <div className="p-4 space-y-4">
      {/* Input */}
      <div className="bg-gray-900/60 border border-cyan-900/40 rounded-lg p-4">
        <p className="font-mono text-xs text-cyan-600 mb-3 tracking-widest">▶ GPS COORDINATE ANALYSIS</p>
        <div className="flex gap-2 flex-wrap">
          <input value={lat} onChange={e => setLat(e.target.value)} placeholder="Latitude"
            className="bg-black border border-cyan-900 rounded px-3 py-1.5 font-mono text-sm text-cyan-300 w-40 focus:outline-none focus:border-cyan-500" />
          <input value={lon} onChange={e => setLon(e.target.value)} placeholder="Longitude"
            className="bg-black border border-cyan-900 rounded px-3 py-1.5 font-mono text-sm text-cyan-300 w-40 focus:outline-none focus:border-cyan-500" />
          <button onClick={fetchData} disabled={loading}
            className="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500 text-cyan-400 font-mono text-xs rounded hover:bg-cyan-500/20 transition-all flex items-center gap-1.5">
            {loading ? <Loader size={12} className="animate-spin" /> : <Crosshair size={12} />} ANALYZE
          </button>
          <button onClick={getMyLocation} disabled={locating}
            className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500 text-emerald-400 font-mono text-xs rounded hover:bg-emerald-500/20 transition-all flex items-center gap-1.5">
            {locating ? <Loader size={12} className="animate-spin" /> : <MapPin size={12} />} MY LOCATION
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Coordinate formats */}
        {derived && (
          <div className="bg-gray-900/60 border border-cyan-900/40 rounded-lg p-4">
            <p className="font-mono text-xs text-cyan-600 mb-3 tracking-widest">▶ COORDINATE FORMATS</p>
            <div className="space-y-2.5 font-mono text-xs">
              {[
                ['Decimal', `${parseFloat(lat).toFixed(6)}, ${parseFloat(lon).toFixed(6)}`],
                ['DMS Lat', derived.dmsLat],
                ['DMS Lon', derived.dmsLon],
                ['MGRS', derived.mgrs],
                ['UTM', derived.utm],
                ['Geohash', derived.geohash],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-2 border-b border-gray-800/60 pb-2">
                  <span className="text-gray-500 w-24 shrink-0">{label}</span>
                  <span className="text-cyan-300 font-mono flex-1">{value}</span>
                  <CopyBtn text={value} />
                </div>
              ))}
            </div>
            {/* RTK indicators */}
            <div className="mt-3 p-2 bg-black/40 rounded border border-cyan-900/20">
              <p className="text-[10px] font-mono text-cyan-700 mb-1">RTK PRECISION</p>
              <div className="flex gap-1">
                {['FIX', 'FLOAT', 'DGPS', 'RTK'].map((m, i) => (
                  <span key={m} className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                    i < 2 ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : 'border-gray-700 text-gray-600'
                  }`}>{m}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Location details */}
        {geoData && (
          <div className="bg-gray-900/60 border border-blue-900/40 rounded-lg p-4">
            <p className="font-mono text-xs text-blue-600 mb-3 tracking-widest">▶ LOCATION INTELLIGENCE</p>
            <div className="space-y-2 font-mono text-xs">
              {geoData.reverse && (
                <div className="pb-2 border-b border-gray-800/60">
                  <span className="text-gray-500">Address</span>
                  <p className="text-blue-300 mt-0.5">{geoData.reverse.display_name || 'N/A'}</p>
                </div>
              )}
              {geoData.elevation && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Elevation</span>
                  <span className="text-blue-300">{geoData.elevation.elevation || geoData.elevation.results?.[0]?.elevation || 'N/A'} m</span>
                </div>
              )}
              {geoData.timezone && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Timezone</span>
                  <span className="text-blue-300">{geoData.timezone.timeZoneId || geoData.timezone.timezone || 'N/A'}</span>
                </div>
              )}
              {geoData.country && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Country</span>
                    <span className="text-blue-300">{geoData.country.name || geoData.country.country || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Capital</span>
                    <span className="text-blue-300">{geoData.country.capital || 'N/A'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Satellite Radar */}
        {satellites.length > 0 && (
          <div className="bg-gray-900/60 border border-emerald-900/40 rounded-lg p-4">
            <p className="font-mono text-xs text-emerald-600 mb-3 tracking-widest">▶ CONSTELLATION RADAR</p>
            <ConstellationRadar satellites={satellites} />
            {/* Signal quality bars */}
            <div className="mt-4 space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin">
              {satellites.slice(0, 10).map((s, i) => (
                <div key={i} className="flex items-center gap-2 font-mono text-[10px]">
                  <span className="text-gray-500 w-10">{s.prn}</span>
                  <div className="flex-1 bg-gray-800 rounded h-1.5">
                    <div className="h-1.5 rounded bg-emerald-500"
                      style={{ width: `${Math.min(100, (s.snr || s.signal || 50))}%` }} />
                  </div>
                  <span className="text-gray-500 w-8">{s.snr || s.signal || 50} dB</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!derived && !loading && (
          <div className="lg:col-span-2 text-center py-16 font-mono text-xs text-gray-600">
            <Navigation size={32} className="mx-auto mb-3 opacity-20" />
            Enter coordinates above to begin GPS analysis
          </div>
        )}
        {loading && <div className="lg:col-span-2"><LoadingPulse label="ACQUIRING SIGNAL..." /></div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4 — SATELLITE INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════════════════
function SatelliteTab({ addActivity }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const tileLayerRef = useRef(null);
  const issMarkerRef = useRef(null);
  const radarLayerRef = useRef(null);

  const [selectedLayer, setSelectedLayer] = useState('trueColor');
  const [daysAgo, setDaysAgo] = useState(1);
  const [showRadar, setShowRadar] = useState(false);
  const [issPos, setIssPos] = useState(null);
  const [layerInfo, setLayerInfo] = useState(null);
  const [mapLat, setMapLat] = useState('40.0');
  const [mapLon, setMapLon] = useState('-74.0');

  const satelliteLayers = [
    { id: 'trueColor',         label: 'True Color',          color: '#3b82f6' },
    { id: 'falseColor',        label: 'False Color',         color: '#10b981' },
    { id: 'ndvi',              label: 'NDVI Vegetation',     color: '#22c55e' },
    { id: 'blackMarble',       label: 'Black Marble',        color: '#6366f1' },
    { id: 'landSurfaceTemp',   label: 'Land Surface Temp',   color: '#f59e0b' },
    { id: 'activeFires',       label: 'Active Fires',        color: '#ef4444' },
    { id: 'aerosol',           label: 'Aerosol',             color: '#8b5cf6' },
    { id: 'weatherRadar',      label: 'Weather Radar',       color: '#00f3ff' },
  ];

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const map = L.map(mapRef.current, { center: [40, -74], zoom: 4 });
    mapInstance.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19, opacity: 0.3
    }).addTo(map);

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update satellite tile layer
  useEffect(() => {
    if (!mapInstance.current) return;
    if (tileLayerRef.current) {
      mapInstance.current.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }
    try {
      const tileUrl = getNasaGibsTileUrl(selectedLayer, daysAgo);
      if (tileUrl) {
        tileLayerRef.current = L.tileLayer(tileUrl, { opacity: 0.8, maxZoom: 9 }).addTo(mapInstance.current);
      }
    } catch (e) {}
  }, [selectedLayer, daysAgo]);

  // ISS tracking
  useEffect(() => {
    const updateIss = async () => {
      try {
        const d = await fetchLiveIssTelemetry();
        if (!d) return;
        const lat = d.latitude || d.lat || 0;
      const lon = d.longitude || d.lon || 0;
        setIssPos(d);
        if (mapInstance.current) {
          if (issMarkerRef.current) {
            mapInstance.current.removeLayer(issMarkerRef.current);
          }
          const icon = L.divIcon({
            html: `<div style="background:#3b82f6;border:2px solid #fff;border-radius:50%;width:14px;height:14px;box-shadow:0 0 8px #3b82f6"></div>`,
            iconSize: [14, 14], iconAnchor: [7, 7]
          });
          issMarkerRef.current = L.marker([lat, lon], { icon })
            .bindPopup(`<b style="color:#3b82f6">ISS</b><br>Alt: ${(d.altitude||408).toFixed(1)} km<br>Vel: ${(d.velocity||27600).toFixed(0)} km/h`)
            .addTo(mapInstance.current);
        }
      } catch (e) {}
    };
    updateIss();
    const interval = setInterval(updateIss, 15000);
    return () => clearInterval(interval);
  }, []);

  // Radar overlay
  useEffect(() => {
    if (!mapInstance.current) return;
    if (radarLayerRef.current) {
      mapInstance.current.removeLayer(radarLayerRef.current);
      radarLayerRef.current = null;
    }
    if (showRadar) {
      apiRequest('/api/satellite/weather-radar')
        .then(data => {
          const frames = data.radar?.past || data.frames || [];
          const latest = frames[frames.length - 1];
          if (latest?.path) {
            radarLayerRef.current = L.tileLayer(
              `https://tilecache.rainviewer.com${latest.path}/256/{z}/{x}/{y}/2/1_1.png`,
              { opacity: 0.5 }
            ).addTo(mapInstance.current);
          }
        })
        .catch(() => {});
    }
  }, [showRadar]);

  const flyTo = () => {
    const la = parseFloat(mapLat);
    const lo = parseFloat(mapLon);
    if (!isNaN(la) && !isNaN(lo) && mapInstance.current) {
      mapInstance.current.setView([la, lo], 7);
      addActivity(`Map centered: ${la.toFixed(4)}, ${lo.toFixed(4)}`);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Layer selector */}
      <div className="bg-gray-900/60 border border-purple-900/40 rounded-lg p-4">
        <p className="font-mono text-xs text-purple-500 mb-3 tracking-widest">▶ SATELLITE LAYER SELECTION</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {satelliteLayers.map(l => (
            <button key={l.id} onClick={() => { setSelectedLayer(l.id); addActivity(`Layer: ${l.label}`); }}
              className={`px-3 py-1.5 font-mono text-[10px] rounded border transition-all ${
                selectedLayer === l.id
                  ? 'border-purple-500 text-purple-300 bg-purple-500/15'
                  : 'border-gray-700 text-gray-500 hover:border-gray-500'
              }`}
              style={selectedLayer === l.id ? { borderColor: l.color, color: l.color } : {}}>
              {l.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono text-xs">
            <Clock size={12} className="text-gray-500" />
            <label className="text-gray-500">Days ago:</label>
            <input type="range" min="0" max="13" value={daysAgo} onChange={e => setDaysAgo(+e.target.value)}
              className="w-32 accent-purple-500" />
            <span className="text-purple-300 w-4">{daysAgo}</span>
          </div>
          <label className="flex items-center gap-2 font-mono text-xs text-gray-400 cursor-pointer">
            <input type="checkbox" checked={showRadar} onChange={e => setShowRadar(e.target.checked)}
              className="accent-cyan-500" />
            <CloudRain size={12} /> Weather Radar
          </label>
        </div>
      </div>

      {/* Map fly-to control */}
      <div className="flex gap-2 items-center">
        <input value={mapLat} onChange={e => setMapLat(e.target.value)} placeholder="Lat"
          className="bg-black border border-gray-700 rounded px-3 py-1.5 font-mono text-xs text-cyan-300 w-28 focus:outline-none focus:border-cyan-500" />
        <input value={mapLon} onChange={e => setMapLon(e.target.value)} placeholder="Lon"
          className="bg-black border border-gray-700 rounded px-3 py-1.5 font-mono text-xs text-cyan-300 w-28 focus:outline-none focus:border-cyan-500" />
        <button onClick={flyTo} className="px-3 py-1.5 bg-blue-500/10 border border-blue-500 text-blue-400 font-mono text-xs rounded hover:bg-blue-500/20 flex items-center gap-1.5">
          <Compass size={12} /> FLY TO
        </button>
        <a href={`https://worldview.earthdata.nasa.gov/?l=VIIRS_NOAA20_CorrectedReflectance_TrueColor&t=${new Date().toISOString().slice(0,10)}`}
          target="_blank" rel="noopener noreferrer"
          className="px-3 py-1.5 bg-gray-800 border border-gray-700 text-gray-400 font-mono text-xs rounded hover:border-gray-500 flex items-center gap-1.5">
          <ExternalLink size={12} /> NASA Worldview
        </a>
        <a href="https://browser.dataspace.copernicus.eu/" target="_blank" rel="noopener noreferrer"
          className="px-3 py-1.5 bg-gray-800 border border-gray-700 text-gray-400 font-mono text-xs rounded hover:border-gray-500 flex items-center gap-1.5">
          <ExternalLink size={12} /> Copernicus
        </a>
      </div>

      {/* Leaflet Map */}
      <div ref={mapRef} className="rounded-lg border border-gray-700 overflow-hidden" style={{ height: 500 }} />

      {/* ISS info */}
      {issPos && (
        <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg p-3 font-mono text-xs flex flex-wrap gap-4">
          <span className="text-blue-400 font-bold">▶ ISS LIVE</span>
          <span className="text-gray-400">Lat: <span className="text-blue-300">{(issPos.latitude||issPos.lat||0).toFixed(3)}°</span></span>
          <span className="text-gray-400">Lon: <span className="text-blue-300">{(issPos.longitude||issPos.lon||0).toFixed(3)}°</span></span>
          <span className="text-gray-400">Alt: <span className="text-blue-300">{(issPos.altitude||408).toFixed(1)} km</span></span>
          <span className="text-gray-400">Vel: <span className="text-blue-300">{(issPos.velocity||27600).toFixed(0)} km/h</span></span>
        </div>
      )}

      {/* Layer info */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-3 font-mono text-xs grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ['Layer', satelliteLayers.find(l => l.id === selectedLayer)?.label || selectedLayer],
          ['Source', 'NASA GIBS / EOSDIS'],
          ['Resolution', '250m - 1km'],
          ['Update Freq', 'Daily / Near-real-time'],
        ].map(([k, v]) => (
          <div key={k}>
            <p className="text-gray-600 mb-0.5">{k}</p>
            <p className="text-gray-300">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 5 — GEOSPATIAL ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════
function GeoAnalysisTab({ addActivity }) {
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [radius, setRadius] = useState('1000');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  // Distance calculator
  const [dLat1, setDLat1] = useState(''); const [dLon1, setDLon1] = useState('');
  const [dLat2, setDLat2] = useState(''); const [dLon2, setDLon2] = useState('');
  const [distance, setDistance] = useState(null);

  const categoryIcons = {
    amenity: <Building2 size={12} />, natural: <TreePine size={12} />,
    highway: <Navigation size={12} />, shop: <BarChart3 size={12} />,
    leisure: <Activity size={12} />, tourism: <Globe size={12} />,
  };

  const analyze = async () => {
    const la = parseFloat(lat); const lo = parseFloat(lon);
    if (isNaN(la) || isNaN(lo)) return;
    setLoading(true);
    addActivity(`Geospatial analysis: ${la.toFixed(4)}, ${lo.toFixed(4)}`);
    try {
      const [rev, country, env, infra, wiki] = await Promise.allSettled([
        apiRequest(`/api/geo/reverse?lat=${la}&lon=${lo}`),
        apiRequest(`/api/geo/country?lat=${la}&lon=${lo}`),
        apiRequest(`/api/geo/environmental?lat=${la}&lon=${lo}`),
        apiRequest(`/api/geo/infrastructure?lat=${la}&lon=${lo}&radius=${radius}`),
        apiRequest(`/api/osint/wiki-geo?lat=${la}&lon=${lo}`),
      ]);
      setData({
        reverse:  rev.status === 'fulfilled'     ? rev.value     : null,
        country:  country.status === 'fulfilled' ? country.value : null,
        env:      env.status === 'fulfilled'     ? env.value     : null,
        infra:    infra.status === 'fulfilled'   ? infra.value   : null,
        wiki:     wiki.status === 'fulfilled'    ? wiki.value    : null,
      });
      addActivity('Geospatial analysis complete');
    } catch (e) {
      addActivity(`Analysis error: ${e.message}`, 'error');
    }
    setLoading(false);
  };

  const exportGeoJSON = () => {
    if (!data) return;
    const la = parseFloat(lat); const lo = parseFloat(lon);
    const gj = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lo, la] },
        properties: {
          address: data.reverse?.display_name,
          country: data.country,
          environment: data.env,
          timestamp: new Date().toISOString(),
        }
      }]
    };
    const blob = new Blob([JSON.stringify(gj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `jasper-geo-${la.toFixed(4)}_${lo.toFixed(4)}.geojson`;
    a.click(); URL.revokeObjectURL(url);
  };

  const calcDistance = () => {
    const la1 = parseFloat(dLat1), lo1 = parseFloat(dLon1);
    const la2 = parseFloat(dLat2), lo2 = parseFloat(dLon2);
    if ([la1,lo1,la2,lo2].some(isNaN)) return;
    setDistance(haversine(la1,lo1,la2,lo2));
  };

  return (
    <div className="p-4 space-y-4">
      {/* Input */}
      <div className="bg-gray-900/60 border border-cyan-900/40 rounded-lg p-4">
        <p className="font-mono text-xs text-cyan-600 mb-3 tracking-widest">▶ GEOSPATIAL ANALYSIS ENGINE</p>
        <div className="flex gap-2 flex-wrap">
          <input value={lat} onChange={e => setLat(e.target.value)} placeholder="Latitude"
            className="bg-black border border-cyan-900 rounded px-3 py-1.5 font-mono text-sm text-cyan-300 w-36 focus:outline-none focus:border-cyan-500" />
          <input value={lon} onChange={e => setLon(e.target.value)} placeholder="Longitude"
            className="bg-black border border-cyan-900 rounded px-3 py-1.5 font-mono text-sm text-cyan-300 w-36 focus:outline-none focus:border-cyan-500" />
          <input value={radius} onChange={e => setRadius(e.target.value)} placeholder="Radius (m)"
            className="bg-black border border-gray-700 rounded px-3 py-1.5 font-mono text-sm text-gray-400 w-28 focus:outline-none focus:border-gray-500" />
          <button onClick={analyze} disabled={loading}
            className="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500 text-cyan-400 font-mono text-xs rounded hover:bg-cyan-500/20 flex items-center gap-1.5">
            {loading ? <Loader size={12} className="animate-spin" /> : <Target size={12} />} ANALYZE
          </button>
          {data && (
            <button onClick={exportGeoJSON}
              className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500 text-emerald-400 font-mono text-xs rounded hover:bg-emerald-500/20 flex items-center gap-1.5">
              <Download size={12} /> GEOJSON
            </button>
          )}
        </div>
      </div>

      {loading && <LoadingPulse label="RUNNING GEOSPATIAL ANALYSIS..." />}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Location Overview */}
          {data.reverse && (
            <div className="bg-gray-900/60 border border-cyan-900/40 rounded-lg p-4">
              <p className="font-mono text-xs text-cyan-600 mb-2 tracking-widest">▶ LOCATION OVERVIEW</p>
              <p className="text-cyan-300 text-sm font-mono leading-relaxed">{data.reverse.display_name}</p>
              {data.reverse.address && (
                <div className="mt-2 space-y-1 font-mono text-xs">
                  {Object.entries(data.reverse.address).slice(0, 6).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-gray-500 capitalize">{k.replace(/_/g,' ')}</span>
                      <span className="text-gray-300">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Country Intelligence */}
          {data.country && (
            <div className="bg-gray-900/60 border border-blue-900/40 rounded-lg p-4">
              <p className="font-mono text-xs text-blue-500 mb-2 tracking-widest">▶ COUNTRY INTELLIGENCE</p>
              <div className="font-mono text-xs space-y-2">
                {data.country.flag && <p className="text-3xl">{data.country.flag}</p>}
                {[
                  ['Country', data.country.name || data.country.country],
                  ['Capital', data.country.capital],
                  ['Population', data.country.population?.toLocaleString?.()],
                  ['Languages', Array.isArray(data.country.languages) ? data.country.languages.join(', ') : data.country.languages],
                  ['Currency', data.country.currency],
                  ['Region', data.country.region],
                ].filter(([,v]) => v).map(([k,v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-gray-500">{k}</span>
                    <span className="text-blue-300 text-right max-w-[180px]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Environmental */}
          {data.env && (
            <div className="bg-gray-900/60 border border-emerald-900/40 rounded-lg p-4">
              <p className="font-mono text-xs text-emerald-600 mb-2 tracking-widest">▶ ENVIRONMENTAL DATA</p>
              <div className="font-mono text-xs space-y-2">
                {[
                  ['Temperature', data.env.temperature !== undefined ? `${data.env.temperature}°C` : data.env.current?.temperature],
                  ['Humidity', data.env.humidity !== undefined ? `${data.env.humidity}%` : data.env.current?.humidity],
                  ['Wind Speed', data.env.wind_speed !== undefined ? `${data.env.wind_speed} m/s` : data.env.current?.wind_speed],
                  ['UV Index', data.env.uv_index !== undefined ? data.env.uv_index : data.env.current?.uv_index],
                  ['Cloud Cover', data.env.cloud_cover !== undefined ? `${data.env.cloud_cover}%` : data.env.current?.cloud_cover],
                  ['Visibility', data.env.visibility !== undefined ? `${data.env.visibility} km` : data.env.current?.visibility],
                ].filter(([,v]) => v !== undefined && v !== null).map(([k,v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-gray-500">{k}</span>
                    <span className="text-emerald-300">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Infrastructure */}
          {data.infra && (
            <div className="bg-gray-900/60 border border-yellow-900/40 rounded-lg p-4">
              <p className="font-mono text-xs text-yellow-600 mb-2 tracking-widest">▶ NEARBY INFRASTRUCTURE</p>
              <div className="space-y-1.5 max-h-56 overflow-y-auto scrollbar-thin">
                {(Array.isArray(data.infra) ? data.infra : data.infra.elements || data.infra.features || []).slice(0, 20).map((el, i) => {
                  const tags = el.tags || el.properties || {};
                  const name = tags.name || tags.amenity || tags.shop || el.type || 'Unknown';
                  const cat = Object.keys(categoryIcons).find(c => tags[c]) || 'amenity';
                  return (
                    <div key={i} className="flex items-center gap-2 font-mono text-xs text-gray-300">
                      <span className="text-yellow-600">{categoryIcons[cat] || <Building2 size={12}/>}</span>
                      <span className="flex-1 truncate">{name}</span>
                      {tags.amenity && <span className="text-gray-600 text-[9px]">{tags.amenity}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Wikipedia */}
          {data.wiki && (
            <div className="bg-gray-900/60 border border-purple-900/40 rounded-lg p-4 md:col-span-2">
              <p className="font-mono text-xs text-purple-500 mb-2 tracking-widest">▶ WIKIPEDIA GEO CONTEXT</p>
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                {(Array.isArray(data.wiki) ? data.wiki : data.wiki.geonames || data.wiki.results || []).slice(0, 8).map((w, i) => (
                  <div key={i} className="border border-gray-800 rounded p-3">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-mono text-xs text-purple-300">{w.title || w.name}</h4>
                      {(w.wikipediaUrl || w.url) && (
                        <a href={w.wikipediaUrl?.startsWith('http') ? w.wikipediaUrl : `https://${w.wikipediaUrl}`}
                          target="_blank" rel="noopener noreferrer" className="text-purple-700 hover:text-purple-400 shrink-0">
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                    <p className="text-gray-500 text-[10px] mt-1 leading-relaxed">{w.summary || w.description || ''}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Distance Calculator */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
        <p className="font-mono text-xs text-gray-500 mb-3 tracking-widest">▶ HAVERSINE DISTANCE CALCULATOR</p>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[9px] text-gray-600">POINT A</label>
            <div className="flex gap-1">
              <input value={dLat1} onChange={e => setDLat1(e.target.value)} placeholder="Lat"
                className="bg-black border border-gray-700 rounded px-2 py-1 font-mono text-xs text-gray-300 w-24 focus:outline-none focus:border-cyan-500" />
              <input value={dLon1} onChange={e => setDLon1(e.target.value)} placeholder="Lon"
                className="bg-black border border-gray-700 rounded px-2 py-1 font-mono text-xs text-gray-300 w-24 focus:outline-none focus:border-cyan-500" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[9px] text-gray-600">POINT B</label>
            <div className="flex gap-1">
              <input value={dLat2} onChange={e => setDLat2(e.target.value)} placeholder="Lat"
                className="bg-black border border-gray-700 rounded px-2 py-1 font-mono text-xs text-gray-300 w-24 focus:outline-none focus:border-cyan-500" />
              <input value={dLon2} onChange={e => setDLon2(e.target.value)} placeholder="Lon"
                className="bg-black border border-gray-700 rounded px-2 py-1 font-mono text-xs text-gray-300 w-24 focus:outline-none focus:border-cyan-500" />
            </div>
          </div>
          <button onClick={calcDistance}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 text-gray-400 font-mono text-xs rounded hover:border-gray-500 flex items-center gap-1.5">
            <Zap size={12} /> CALCULATE
          </button>
          {distance !== null && (
            <div className="bg-black border border-cyan-900 rounded px-4 py-1.5 font-mono text-sm text-cyan-400">
              {distance} km
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 6 — ENVIRONMENTAL MONITORING
// ═══════════════════════════════════════════════════════════════════════════════
function EnvironmentTab({ addActivity }) {
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [envData, setEnvData] = useState(null);
  const [ndvi, setNdvi] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    const la = parseFloat(lat); const lo = parseFloat(lon);
    if (isNaN(la) || isNaN(lo)) return;
    setLoading(true);
    addActivity(`Environmental scan: ${la.toFixed(4)}, ${lo.toFixed(4)}`);
    try {
      const [env, nd] = await Promise.allSettled([
        apiRequest(`/api/geo/environmental?lat=${la}&lon=${lo}`),
        apiRequest(`/api/satellite/ndvi?lat=${la}&lon=${lo}`),
      ]);
      setEnvData(env.status === 'fulfilled' ? env.value : null);
      setNdvi(nd.status === 'fulfilled' ? nd.value : null);
      addActivity('Environmental data loaded');
    } catch (e) {
      addActivity(`Env error: ${e.message}`, 'error');
    }
    setLoading(false);
  };

  const env = envData?.current || envData || {};
  const forecast = envData?.forecast || envData?.daily || [];

  const weatherFields = [
    { key: ['temperature','temp'],    label: 'Temperature',  icon: <Thermometer size={14}/>, unit: '°C', color: 'text-orange-400' },
    { key: ['humidity'],              label: 'Humidity',     icon: <Droplets size={14}/>,    unit: '%',  color: 'text-blue-400'   },
    { key: ['wind_speed','wind'],     label: 'Wind Speed',   icon: <Wind size={14}/>,        unit: ' m/s', color: 'text-cyan-400' },
    { key: ['cloud_cover','clouds'],  label: 'Cloud Cover',  icon: <Cloud size={14}/>,       unit: '%',  color: 'text-gray-400'   },
    { key: ['uv_index','uv'],         label: 'UV Index',     icon: <Sun size={14}/>,         unit: '',   color: 'text-yellow-400' },
    { key: ['visibility'],            label: 'Visibility',   icon: <EyeIcon size={14}/>,     unit: ' km', color: 'text-emerald-400'},
    { key: ['precipitation','precip'],label: 'Precipitation',icon: <CloudRain size={14}/>,   unit: ' mm', color: 'text-indigo-400' },
  ];

  const getVal = (obj, keys) => {
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null) return obj[k];
    }
    return null;
  };

  return (
    <div className="p-4 space-y-4">
      {/* Input */}
      <div className="bg-gray-900/60 border border-emerald-900/40 rounded-lg p-4">
        <p className="font-mono text-xs text-emerald-600 mb-3 tracking-widest">▶ ENVIRONMENTAL MONITORING</p>
        <div className="flex gap-2 flex-wrap">
          <input value={lat} onChange={e => setLat(e.target.value)} placeholder="Latitude"
            className="bg-black border border-emerald-900 rounded px-3 py-1.5 font-mono text-sm text-emerald-300 w-36 focus:outline-none focus:border-emerald-500" />
          <input value={lon} onChange={e => setLon(e.target.value)} placeholder="Longitude"
            className="bg-black border border-emerald-900 rounded px-3 py-1.5 font-mono text-sm text-emerald-300 w-36 focus:outline-none focus:border-emerald-500" />
          <button onClick={fetch} disabled={loading}
            className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500 text-emerald-400 font-mono text-xs rounded hover:bg-emerald-500/20 flex items-center gap-1.5">
            {loading ? <Loader size={12} className="animate-spin" /> : <Activity size={12} />} SCAN ENVIRONMENT
          </button>
        </div>
      </div>

      {loading && <LoadingPulse label="SAMPLING ENVIRONMENT..." />}

      {envData && (
        <>
          {/* Current conditions */}
          <div className="bg-gray-900/60 border border-emerald-900/40 rounded-lg p-4">
            <p className="font-mono text-xs text-emerald-600 mb-3 tracking-widest">▶ CURRENT CONDITIONS</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {weatherFields.map(({ key, label, icon, unit, color }) => {
                const val = getVal(env, key);
                if (val === null) return null;
                return (
                  <div key={label} className="bg-black/40 rounded-lg p-3 border border-gray-800">
                    <div className={`flex items-center gap-1.5 mb-1 ${color}`}>{icon}<span className="font-mono text-[10px]">{label}</span></div>
                    <p className={`font-mono text-lg font-bold ${color}`}>{typeof val === 'number' ? val.toFixed(1) : val}{unit}</p>
                  </div>
                );
              })}
            </div>
            <p className="font-mono text-[9px] text-gray-700 mt-3">
              Source: Open-Meteo API · Updated: Hourly · Data: CC BY 4.0
            </p>
          </div>

          {/* 3-day forecast */}
          {forecast.length > 0 && (
            <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
              <p className="font-mono text-xs text-gray-500 mb-3 tracking-widest">▶ FORECAST</p>
              <div className="overflow-x-auto">
                <table className="w-full font-mono text-xs">
                  <thead>
                    <tr className="text-gray-600 border-b border-gray-800">
                      {['Date','Temp Max','Temp Min','Rain','Wind'].map(h => (
                        <th key={h} className="text-left pb-2 pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.slice(0, 3).map((d, i) => (
                      <tr key={i} className="border-b border-gray-800/40 text-gray-300">
                        <td className="py-2 pr-4">{d.date || d.time || `Day ${i+1}`}</td>
                        <td className="py-2 pr-4 text-orange-400">{d.temperature_2m_max ?? d.temp_max ?? '—'}°</td>
                        <td className="py-2 pr-4 text-blue-400">{d.temperature_2m_min ?? d.temp_min ?? '—'}°</td>
                        <td className="py-2 pr-4 text-indigo-400">{d.precipitation_sum ?? d.rain ?? '—'} mm</td>
                        <td className="py-2 pr-4 text-cyan-400">{d.wind_speed_10m_max ?? d.wind ?? '—'} m/s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* NDVI Panel */}
      {ndvi && (
        <div className="bg-gray-900/60 border border-green-900/40 rounded-lg p-4">
          <p className="font-mono text-xs text-green-600 mb-3 tracking-widest">▶ NDVI VEGETATION ANALYSIS</p>
          <div className="font-mono text-xs space-y-2">
            {Object.entries(ndvi).slice(0, 8).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-gray-500 capitalize">{k.replace(/_/g,' ')}</span>
                <span className="text-green-400">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
              </div>
            ))}
          </div>
          <p className="font-mono text-[9px] text-gray-700 mt-3">
            Source: NASA MODIS / Sentinel-2 · NDVI range: −1 (water/bare) to +1 (dense vegetation)
          </p>
        </div>
      )}

      {/* Fire & Aerosol monitoring info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-900/10 border border-red-900/40 rounded-lg p-4">
          <p className="font-mono text-xs text-red-500 mb-2 tracking-widest flex items-center gap-2">
            <Flame size={12} /> ACTIVE FIRE MONITORING
          </p>
          <p className="text-gray-400 text-xs font-mono leading-relaxed mb-3">
            NASA FIRMS (Fire Information for Resource Management System) provides near real-time active fire data from MODIS and VIIRS satellite instruments.
          </p>
          <a href="https://firms.modaps.eosdis.nasa.gov/" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300 font-mono text-xs">
            <ExternalLink size={11} /> Open NASA FIRMS
          </a>
        </div>
        <div className="bg-purple-900/10 border border-purple-900/40 rounded-lg p-4">
          <p className="font-mono text-xs text-purple-500 mb-2 tracking-widest flex items-center gap-2">
            <Wind size={12} /> AEROSOL / SMOKE MONITORING
          </p>
          <p className="text-gray-400 text-xs font-mono leading-relaxed mb-3">
            NASA GIBS Aerosol Optical Depth (MODIS/MAIAC) tracks smoke, dust, and aerosol concentration globally at 1km resolution.
          </p>
          <a href="https://worldview.earthdata.nasa.gov/?l=MODIS_Terra_Aerosol" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 font-mono text-xs">
            <ExternalLink size={11} /> NASA Worldview Aerosol Layer
          </a>
        </div>
      </div>

      <div className="bg-yellow-900/10 border border-yellow-900/40 rounded-lg p-3 font-mono text-[10px] text-yellow-700">
        <AlertTriangle size={11} className="inline mr-1.5" />
        DISCLAIMER: Environmental data is sourced from open APIs and may not reflect real-time conditions. Do not use for safety-critical decisions.
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 7 — INTELLIGENCE REPORTS
// ═══════════════════════════════════════════════════════════════════════════════
function ReportsTab({ addActivity }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({
    title: '', lat: '', lon: '', locationName: '', analystNotes: '', investigationType: 'general'
  });

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiRequest('/api/intelligence/reports');
      setReports(Array.isArray(d) ? d : d.reports || []);
      addActivity(`${Array.isArray(d) ? d.length : d.reports?.length || 0} reports loaded`);
    } catch (e) {
      addActivity(`Reports load error: ${e.message}`, 'error');
    }
    setLoading(false);
  }, [addActivity]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const generateReport = async () => {
    if (!form.title) return;
    setGenerating(true);
    addActivity(`Generating report: "${form.title}"`);
    try {
      const lat = parseFloat(form.lat); const lon = parseFloat(form.lon);
      const result = await apiPost('/api/intelligence/report', {
        title: form.title,
        coordinates: { lat: isNaN(lat) ? 0 : lat, lon: isNaN(lon) ? 0 : lon },
        locationName: form.locationName,
        investigationType: form.investigationType,
        analystNotes: form.analystNotes,
      });
      addActivity(`Report generated: ${result.id || result.reportId || 'done'}`);
      setShowForm(false);
      setForm({ title:'', lat:'', lon:'', locationName:'', analystNotes:'', investigationType:'general' });
      await loadReports();
    } catch (e) {
      addActivity(`Report error: ${e.message}`, 'error');
    }
    setGenerating(false);
  };

  const downloadReport = (report) => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jasper-report-${report.id || Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const invTypes = ['general','geospatial','osint','environmental','infrastructure','security'];

  return (
    <div className="p-4 space-y-4">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-gray-500 tracking-widest">▶ INTELLIGENCE REPORTS</p>
        <div className="flex gap-2">
          <button onClick={loadReports} disabled={loading}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 text-gray-400 font-mono text-xs rounded hover:border-gray-500 flex items-center gap-1.5">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> REFRESH
          </button>
          <button onClick={() => setShowForm(v => !v)}
            className="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500 text-cyan-400 font-mono text-xs rounded hover:bg-cyan-500/20 flex items-center gap-1.5">
            <FileText size={12} /> GENERATE REPORT
          </button>
        </div>
      </div>

      {/* Report form */}
      {showForm && (
        <div className="bg-gray-900/60 border border-cyan-900/40 rounded-lg p-4 space-y-3">
          <p className="font-mono text-xs text-cyan-600 tracking-widest">▶ NEW INTELLIGENCE REPORT</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="font-mono text-[9px] text-gray-600 block mb-1">REPORT TITLE *</label>
              <input value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} placeholder="Enter report title..."
                className="w-full bg-black border border-cyan-900 rounded px-3 py-2 font-mono text-sm text-cyan-300 focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="font-mono text-[9px] text-gray-600 block mb-1">LATITUDE</label>
              <input value={form.lat} onChange={e => setForm(f=>({...f,lat:e.target.value}))} placeholder="e.g. 40.7128"
                className="w-full bg-black border border-gray-700 rounded px-3 py-2 font-mono text-sm text-gray-300 focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="font-mono text-[9px] text-gray-600 block mb-1">LONGITUDE</label>
              <input value={form.lon} onChange={e => setForm(f=>({...f,lon:e.target.value}))} placeholder="e.g. -74.0060"
                className="w-full bg-black border border-gray-700 rounded px-3 py-2 font-mono text-sm text-gray-300 focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="font-mono text-[9px] text-gray-600 block mb-1">LOCATION NAME</label>
              <input value={form.locationName} onChange={e => setForm(f=>({...f,locationName:e.target.value}))} placeholder="Descriptive location name"
                className="w-full bg-black border border-gray-700 rounded px-3 py-2 font-mono text-sm text-gray-300 focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="font-mono text-[9px] text-gray-600 block mb-1">INVESTIGATION TYPE</label>
              <select value={form.investigationType} onChange={e => setForm(f=>({...f,investigationType:e.target.value}))}
                className="w-full bg-black border border-gray-700 rounded px-3 py-2 font-mono text-sm text-gray-300 focus:outline-none focus:border-cyan-500">
                {invTypes.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="font-mono text-[9px] text-gray-600 block mb-1">ANALYST NOTES</label>
              <textarea value={form.analystNotes} onChange={e => setForm(f=>({...f,analystNotes:e.target.value}))}
                rows={3} placeholder="Enter analyst observations and notes..."
                className="w-full bg-black border border-gray-700 rounded px-3 py-2 font-mono text-sm text-gray-300 focus:outline-none focus:border-cyan-500 resize-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={generateReport} disabled={generating || !form.title}
              className="px-4 py-2 bg-cyan-500/10 border border-cyan-500 text-cyan-400 font-mono text-xs rounded hover:bg-cyan-500/20 flex items-center gap-1.5">
              {generating ? <Loader size={12} className="animate-spin" /> : <Zap size={12} />}
              {generating ? 'GENERATING...' : 'GENERATE'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-400 font-mono text-xs rounded hover:border-gray-500">
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Reports list */}
      {loading && <LoadingPulse label="LOADING REPORTS..." />}
      {!loading && reports.length === 0 && (
        <div className="text-center py-16 font-mono text-xs text-gray-600">
          <FileText size={32} className="mx-auto mb-3 opacity-20" />
          No intelligence reports found
        </div>
      )}
      <div className="space-y-3">
        {reports.map((r, i) => (
          <div key={r.id || i} className="bg-gray-900/60 border border-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-[10px] text-gray-600 bg-gray-800 px-2 py-0.5 rounded">#{r.id || i+1}</span>
                  <ConfidenceBadge level={r.confidence || r.classification || 'MEDIUM'} />
                  {r.investigationType && (
                    <span className="font-mono text-[9px] text-gray-600 uppercase">{r.investigationType}</span>
                  )}
                </div>
                <h3 className="font-mono text-sm text-cyan-300 truncate">{r.title}</h3>
                <div className="flex items-center gap-3 mt-1 font-mono text-[10px] text-gray-600">
                  {r.locationName && <span><MapPin size={9} className="inline mr-1" />{r.locationName}</span>}
                  {r.createdAt && <span><Clock size={9} className="inline mr-1" />{new Date(r.createdAt).toLocaleDateString()}</span>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => downloadReport(r)}
                  className="p-1.5 bg-gray-800 border border-gray-700 rounded hover:border-cyan-800 text-gray-400 hover:text-cyan-400 transition-colors">
                  <Download size={12} />
                </button>
                <button onClick={() => setExpanded(expanded === i ? null : i)}
                  className="p-1.5 bg-gray-800 border border-gray-700 rounded hover:border-cyan-800 text-gray-400 hover:text-cyan-400 transition-colors">
                  {expanded === i ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>
            </div>
            {expanded === i && (
              <div className="border-t border-gray-800 p-4 bg-black/20">
                <pre className="font-mono text-[10px] text-gray-400 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto scrollbar-thin">
                  {JSON.stringify(r, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 8 — SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════
function SettingsTab() {
  const [nasaToken, setNasaToken]       = useState(() => localStorage.getItem('nasa_earthdata_token') || '');
  const [opencageKey, setOpencageKey]   = useState(() => localStorage.getItem('opencage_api_key') || '');
  const [defaultZoom, setDefaultZoom]   = useState(() => localStorage.getItem('map_default_zoom') || '4');
  const [defaultLayer, setDefaultLayer] = useState(() => localStorage.getItem('map_default_layer') || 'trueColor');
  const [saved, setSaved] = useState(false);
  const [cleared, setCleared] = useState(false);

  const saveSettings = () => {
    if (nasaToken)    localStorage.setItem('nasa_earthdata_token', nasaToken);
    if (opencageKey)  localStorage.setItem('opencage_api_key', opencageKey);
    localStorage.setItem('map_default_zoom', defaultZoom);
    localStorage.setItem('map_default_layer', defaultLayer);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const clearHistory = () => {
    ['jasper_activity_log', 'jasper_scan_history'].forEach(k => localStorage.removeItem(k));
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  };

  const dataSources = [
    { name: 'OpenStreetMap / Nominatim', license: 'ODbL 1.0',  url: 'https://www.openstreetmap.org/copyright' },
    { name: 'Open-Meteo',                license: 'CC BY 4.0',  url: 'https://open-meteo.com' },
    { name: 'NASA GIBS / EOSDIS',        license: 'Public Domain', url: 'https://earthdata.nasa.gov' },
    { name: 'NASA FIRMS',                license: 'Public Domain', url: 'https://firms.modaps.eosdis.nasa.gov' },
    { name: 'RainViewer',                license: 'Free tier',  url: 'https://www.rainviewer.com' },
    { name: 'Open-Elevation',            license: 'CC BY 4.0',  url: 'https://open-elevation.com' },
    { name: 'REST Countries',            license: 'MPL 2.0',    url: 'https://restcountries.com' },
    { name: 'GeoNames Wikipedia',        license: 'CC BY 3.0',  url: 'https://www.geonames.org' },
    { name: 'Overpass API (OSM)',         license: 'ODbL 1.0',   url: 'https://overpass-api.de' },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Optional API Keys */}
      <div className="bg-gray-900/60 border border-yellow-900/40 rounded-lg p-4">
        <p className="font-mono text-xs text-yellow-600 mb-1 tracking-widest flex items-center gap-2">
          <Lock size={12} /> OPTIONAL API KEYS
        </p>
        <p className="font-mono text-[10px] text-gray-600 mb-4">
          These are convenience settings stored in your browser's localStorage only. They are never sent to JASPER servers.
        </p>
        <div className="space-y-3">
          <div>
            <label className="font-mono text-[10px] text-gray-500 block mb-1">NASA EARTHDATA TOKEN (optional)</label>
            <input type="password" value={nasaToken} onChange={e => setNasaToken(e.target.value)}
              placeholder="Paste NASA Earthdata token here..."
              className="w-full bg-black border border-gray-700 rounded px-3 py-2 font-mono text-sm text-gray-300 focus:outline-none focus:border-yellow-500" />
            <p className="font-mono text-[9px] text-gray-700 mt-1">
              Get one at: <a href="https://urs.earthdata.nasa.gov/" target="_blank" rel="noopener noreferrer" className="text-yellow-700 hover:text-yellow-500">urs.earthdata.nasa.gov</a>
            </p>
          </div>
          <div>
            <label className="font-mono text-[10px] text-gray-500 block mb-1">OPENCAGE API KEY (optional)</label>
            <input type="password" value={opencageKey} onChange={e => setOpencageKey(e.target.value)}
              placeholder="Paste OpenCage geocoding key here..."
              className="w-full bg-black border border-gray-700 rounded px-3 py-2 font-mono text-sm text-gray-300 focus:outline-none focus:border-yellow-500" />
            <p className="font-mono text-[9px] text-gray-700 mt-1">
              Get one at: <a href="https://opencagedata.com/" target="_blank" rel="noopener noreferrer" className="text-yellow-700 hover:text-yellow-500">opencagedata.com</a>
            </p>
          </div>
        </div>
      </div>

      {/* Map preferences */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
        <p className="font-mono text-xs text-gray-500 mb-3 tracking-widest">▶ MAP PREFERENCES</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="font-mono text-[10px] text-gray-500 block mb-1">DEFAULT ZOOM LEVEL</label>
            <input type="number" min="1" max="18" value={defaultZoom} onChange={e => setDefaultZoom(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded px-3 py-2 font-mono text-sm text-gray-300 focus:outline-none focus:border-cyan-500" />
          </div>
          <div>
            <label className="font-mono text-[10px] text-gray-500 block mb-1">DEFAULT LAYER</label>
            <select value={defaultLayer} onChange={e => setDefaultLayer(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded px-3 py-2 font-mono text-sm text-gray-300 focus:outline-none focus:border-cyan-500">
              {['trueColor','falseColor','ndvi','blackMarble','activeFires','aerosol','weatherRadar'].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button onClick={saveSettings}
          className="px-4 py-2 bg-cyan-500/10 border border-cyan-500 text-cyan-400 font-mono text-xs rounded hover:bg-cyan-500/20 flex items-center gap-1.5">
          {saved ? <Check size={12} /> : <CheckCircle2 size={12} />}
          {saved ? 'SAVED!' : 'SAVE SETTINGS'}
        </button>
        <button onClick={clearHistory}
          className="px-4 py-2 bg-red-900/20 border border-red-700/40 text-red-400 font-mono text-xs rounded hover:bg-red-900/30 flex items-center gap-1.5">
          <XCircle size={12} />
          {cleared ? 'CLEARED!' : 'CLEAR HISTORY'}
        </button>
      </div>

      {/* Data sources */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
        <p className="font-mono text-xs text-gray-500 mb-3 tracking-widest flex items-center gap-2">
          <BookOpen size={12} /> DATA SOURCES &amp; LICENSES
        </p>
        <div className="space-y-2">
          {dataSources.map((s, i) => (
            <div key={i} className="flex items-center justify-between font-mono text-xs border-b border-gray-800/60 pb-2">
              <div>
                <a href={s.url} target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  {s.name}<ExternalLink size={9} />
                </a>
              </div>
              <span className="text-gray-600 text-[10px]">{s.license}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Legal disclaimer */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-4">
        <p className="font-mono text-xs text-gray-600 mb-2 flex items-center gap-2"><Shield size={12} /> LEGAL DISCLAIMER</p>
        <p className="font-mono text-[10px] text-gray-700 leading-relaxed">
          J.A.S.P.E.R. Intelligence Command Center aggregates data exclusively from free, open-source, and publicly available APIs and databases. All data is provided for informational and research purposes only. No proprietary, classified, or restricted data sources are accessed. The accuracy, completeness, or timeliness of this data is not guaranteed. Users are solely responsible for ensuring their use complies with all applicable laws and regulations in their jurisdiction. This tool does not perform any surveillance, tracking of individuals, or collection of private data. All satellite imagery is sourced from publicly accessible NASA and ESA repositories. Location data obtained via browser geolocation is used only for the user's own device and is never transmitted without explicit user action.
        </p>
      </div>
    </div>
  );
}
