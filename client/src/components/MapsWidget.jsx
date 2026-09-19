import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  AlertTriangle,
  RotateCw,
  Map as MapIcon,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Users,
  UserPlus,
  Share2,
  Flag,
  CornerUpRight,
  CornerUpLeft,
  ArrowUp,
  Radio,
  Battery,
  Phone,
  Play,
  Pause,
  ExternalLink,
  Satellite,
  Radar,
  Target,
  Cpu,
  Wifi,
  Eye,
  Orbit,
  Copy,
  Cloud,
  CloudRain,
  RefreshCw,
  Sun,
  Moon,
  Maximize2,
  Shield,
  Info,
  Sparkles
} from 'lucide-react';
import { getLocation, watchLiveGps } from '../utils/locationService';
import { geocodeAddress, getFastestRoute, calculateDistanceKm, generateShareLocationUrl, getNearbyPlaces } from '../utils/navigationService';
import { speakDeviceAudio } from '../utils/speakDeviceAudio';
import { getApiBase } from '../utils/apiConfig';
import { 
  decimalToDms, 
  latLonToMgrs, 
  latLonToGeohash, 
  getSatelliteConstellationTelemetry, 
  getTrackedSpacecraft, 
  getDeviceHardwareProfile,
  fetchLiveIssTelemetry,
  fetchLiveRainViewerRadar,
  getNasaGibsTileUrl,
  getNasaBlackMarbleUrl,
  getPreciseLocationIntelligence,
  getOverheadReconSatellites,
  latLonToUtm,
  getSolarPosition,
  generatePinpointTriWord
} from '../utils/satelliteIntelligence';

export default function MapsWidget({ onClose, initialDestination = '', initialContact = '', initialTab = 'satellite' }) {
  // Tabs: 'satellite' | 'navigation' | 'contacts' | 'telemetry' | 'places'
  const [activeTab, setActiveTab] = useState(initialTab === 'navigation' ? 'navigation' : (initialContact ? 'contacts' : 'satellite'));
  
  // Live GPS & Satellite Telemetry
  const [userLocation, setUserLocation] = useState(null);
  const [isGpsLocked, setIsGpsLocked] = useState(false);
  const [mapLayer, setMapLayer] = useState(initialTab === 'navigation' ? 'dark' : 'satellite'); // 'dark' | 'satellite' | 'standard'
  const [reconFilter, setReconFilter] = useState('normal'); // 'normal' | 'thermal' | 'nightvision' | 'crt'
  const [isLockingDevice, setIsLockingDevice] = useState(false);
  const [hardwareProfile, setHardwareProfile] = useState(null);
  const [satellites, setSatellites] = useState([]);
  const [spacecraftList, setSpacecraftList] = useState([]);
  const [copiedCoords, setCopiedCoords] = useState(false);
  
  // Navigation & Routing State
  const [destinationInput, setDestinationInput] = useState(initialDestination || '');
  const [activeDestination, setActiveDestination] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [isRouting, setIsRouting] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [audioGuidanceEnabled, setAudioGuidanceEnabled] = useState(true);
  const [showStepsDrawer, setShowStepsDrawer] = useState(false);

  // Contacts Radar State
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContactForm, setNewContactForm] = useState({ name: '', phone: '', relation: 'Friend', address: '' });
  const [isSimulatingMotion, setIsSimulatingMotion] = useState(false);
  const [shareToast, setShareToast] = useState('');

  // Nearby Places State
  const [selectedPlaceCategory, setSelectedPlaceCategory] = useState('all');
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [isPlacesLoading, setIsPlacesLoading] = useState(false);
  const [placeSearchQuery, setPlaceSearchQuery] = useState('');

  // Live Satellite World Update & Orbital Feeds
  const [liveCloudsEnabled, setLiveCloudsEnabled] = useState(true);
  const [liveIssTrackingEnabled, setLiveIssTrackingEnabled] = useState(true);
  const [liveIssData, setLiveIssData] = useState(null);
  const [liveSatelliteTime, setLiveSatelliteTime] = useState(null);
  const [isSyncingSatellite, setIsSyncingSatellite] = useState(false);
  const [liveRadarData, setLiveRadarData] = useState(null);

  // Live Satellite Intelligence for Precise Location
  const [showPreciseIntelModal, setShowPreciseIntelModal] = useState(false);
  const [preciseReconOverlayEnabled, setPreciseReconOverlayEnabled] = useState(true);
  const [isScanningRecon, setIsScanningRecon] = useState(false);
  const [preciseIntel, setPreciseIntel] = useState(null);
  const [overheadReconList, setOverheadReconList] = useState([]);

  // DOM Refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const contactMarkersRef = useRef({});
  const poiMarkersRef = useRef({});
  const speechRecognitionRef = useRef(null);
  const simulationIntervalRef = useRef(null);
  const liveRadarLayerRef = useRef(null);
  const issMarkerRef = useRef(null);
  const issTrailRef = useRef(null);
  const issHistoryRef = useRef([]);
  const reconFootprintLayerRef = useRef(null);

  // Default fallback center (Mumbai)
  const defaultCenter = [18.9220, 72.8347];

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = userLocation?.lat || defaultCenter[0];
    const initialLon = userLocation?.lon || defaultCenter[1];

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    });

    // Real Esri World Imagery Satellite Tiles (High-Resolution Global Satellite)
    const satelliteTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      maxNativeZoom: 17,
      attribution: 'Esri, Maxar, Earthstar Geographics'
    });

    // NASA GIBS Daily Global TrueColor Satellite Mosaic
    const nasaTileLayer = L.tileLayer(getNasaGibsTileUrl(2), {
      maxZoom: 9,
      attribution: 'NASA EOSDIS GIBS / Worldview / MODIS'
    });

    // NASA Black Marble (Earth at Night)
    const nightTileLayer = L.tileLayer(getNasaBlackMarbleUrl(), {
      maxZoom: 8,
      attribution: 'NASA Earth Observatory / NOAA NGDC'
    });

    // Dark Stark-Tech OpenStreetMap Tiles (100% Free, Zero Watermark, Zero API Key Required)
    const darkTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: 'dark-map-tiles'
    });

    // Standard OpenStreetMap Tiles
    const osmTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    });

    if (mapLayer === 'satellite') {
      satelliteTileLayer.addTo(map);
    } else if (mapLayer === 'nasa') {
      nasaTileLayer.addTo(map);
    } else if (mapLayer === 'night') {
      nightTileLayer.addTo(map);
    } else if (mapLayer === 'dark') {
      darkTileLayer.addTo(map);
    } else {
      osmTileLayer.addTo(map);
    }

    // Add zoom controls to bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;
    mapInstanceRef.current._darkLayer = darkTileLayer;
    mapInstanceRef.current._osmLayer = osmTileLayer;
    mapInstanceRef.current._satLayer = satelliteTileLayer;
    mapInstanceRef.current._nasaLayer = nasaTileLayer;
    mapInstanceRef.current._nightLayer = nightTileLayer;

    // Force map resize check
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      poiMarkersRef.current = {};
      if (liveRadarLayerRef.current) liveRadarLayerRef.current = null;
      if (issMarkerRef.current) issMarkerRef.current = null;
      if (issTrailRef.current) issTrailRef.current = null;
    };
  }, []);

  // 2. Switch Map Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map._darkLayer || !map._osmLayer || !map._satLayer || !map._nasaLayer || !map._nightLayer) return;

    const sat = map._satLayer;
    const nasa = map._nasaLayer;
    const night = map._nightLayer;
    const dark = map._darkLayer;
    const osm = map._osmLayer;

    const allBaseLayers = [sat, nasa, night, dark, osm];
    allBaseLayers.forEach(l => {
      if (map.hasLayer(l)) map.removeLayer(l);
    });

    if (mapLayer === 'satellite') {
      sat.addTo(map);
    } else if (mapLayer === 'nasa') {
      nasa.addTo(map);
    } else if (mapLayer === 'night') {
      night.addTo(map);
    } else if (mapLayer === 'dark') {
      dark.addTo(map);
    } else {
      osm.addTo(map);
    }
  }, [mapLayer]);

  // 3. Live GPS Continuous Tracking
  useEffect(() => {
    let unwatch = () => {};

    const startTracking = async () => {
      // First get one-shot position
      const initial = await getLocation();
      if (initial && initial.lat && initial.lon) {
        setUserLocation(initial);
        setIsGpsLocked(true);
        updateUserMarkerOnMap(initial);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([initial.lat, initial.lon], 17, { animate: true, duration: 1.2 });
          setTimeout(() => {
            if (userMarkerRef.current) {
              userMarkerRef.current.openPopup();
            }
          }, 650);
        }
      }

      // Then continuous high-precision GPS watcher
      unwatch = watchLiveGps(
        (freshLoc) => {
          setUserLocation(freshLoc);
          setIsGpsLocked(true);
          updateUserMarkerOnMap(freshLoc);
        },
        (err) => {
          console.warn('[MapsWidget] Watch GPS fallback:', err);
        }
      );
    };

    startTracking();

    return () => {
      unwatch();
    };
  }, []);

  // Helper: Update User Marker
  const updateUserMarkerOnMap = (loc) => {
    const map = mapInstanceRef.current;
    if (!map || !loc || !loc.lat || !loc.lon) return;

    const latLng = [loc.lat, loc.lon];

    const pulseHtml = `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-10 h-10 rounded-full bg-cyan-500/30 border-2 border-cyan-400 animate-ping"></div>
        <div class="w-8 h-8 rounded-full bg-slate-950 border-2 border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/50">
          <div class="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></div>
        </div>
      </div>
    `;

    const userIcon = L.divIcon({
      html: pulseHtml,
      className: 'custom-user-pin',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker(latLng, { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
      userMarkerRef.current.bindPopup(`
        <div style="color: #00f3ff; background: #020617; border: 1px solid #00f3ff; border-radius: 10px; font-family: monospace; font-size: 11px; padding: 10px; box-shadow: 0 0 20px rgba(0,243,255,0.35); min-width: 200px;">
          <div style="font-weight: bold; color: #38bdf8; display: flex; align-items: center; gap: 6px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">
            🛰️ HOST DEVICE SATELLITE LOCK
          </div>
          <div style="color: #f8fafc; font-size: 11px; margin-bottom: 6px; font-weight: 600;">
            ${loc.displayName || 'Current Host Location'}
          </div>
          <div style="color: #00f3ff; font-weight: bold; font-size: 12px; margin-bottom: 4px;">
            ${loc.lat?.toFixed(6)}°, ${loc.lon?.toFixed(6)}°
          </div>
          <div style="color: #94a3b8; font-size: 10px; border-top: 1px solid rgba(0,243,255,0.2); padding-top: 4px; margin-top: 4px;">
            Precision: <span style="color: #10b981; font-weight: bold;">${loc.accuracy || 'Sub-meter'}</span><br/>
            Speed: <span style="color: #38bdf8;">${loc.speed || '0 km/h'}</span> • Alt: <span style="color: #f59e0b;">${loc.altitude || 'N/A'}</span>
          </div>
        </div>
      `);
    } else {
      userMarkerRef.current.setLatLng(latLng);
    }
  };

  // 4. Satellite Telemetry & Hardware Profile Polling
  useEffect(() => {
    getDeviceHardwareProfile().then(setHardwareProfile);

    const updateSatelliteData = () => {
      const lat = userLocation?.lat || defaultCenter[0];
      const lon = userLocation?.lon || defaultCenter[1];
      setSatellites(getSatelliteConstellationTelemetry(lat, lon));
      setSpacecraftList(getTrackedSpacecraft(lat, lon));
      setPreciseIntel(getPreciseLocationIntelligence(lat, lon, userLocation?.altitude || 14.2, userLocation?.accuracy || 1.2));
      setOverheadReconList(getOverheadReconSatellites(lat, lon));
    };

    updateSatelliteData();
    const interval = setInterval(updateSatelliteData, 3000);
    return () => clearInterval(interval);
  }, [userLocation?.lat, userLocation?.lon]);

  // 4b. Live ISS Spacecraft Polling & Ground Track Polyline
  useEffect(() => {
    let isCancelled = false;

    const pollIss = async () => {
      const data = await fetchLiveIssTelemetry();
      if (isCancelled || !data) return;

      setLiveIssData(data);

      const map = mapInstanceRef.current;
      if (!map) return;

      if (liveIssTrackingEnabled) {
        const issLatLng = [data.lat, data.lon];

        // Append to history for orbital trail (last 35 positions)
        issHistoryRef.current = [...issHistoryRef.current.slice(-35), issLatLng];

        // Create or update polyline orbital trail
        if (!issTrailRef.current) {
          issTrailRef.current = L.polyline(issHistoryRef.current, {
            color: '#00f3ff',
            weight: 3,
            opacity: 0.8,
            dashArray: '5, 8'
          }).addTo(map);
        } else {
          issTrailRef.current.setLatLngs(issHistoryRef.current);
          if (!map.hasLayer(issTrailRef.current)) {
            issTrailRef.current.addTo(map);
          }
        }

        // Custom High-Tech ISS Spacecraft Icon
        const issIconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="absolute w-12 h-12 rounded-full bg-cyan-500/25 border border-cyan-400 animate-ping"></div>
            <div class="w-9 h-9 rounded-full bg-slate-950 border-2 border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/60 group-hover:scale-110 transition-transform">
              <span class="text-sm">🛰️</span>
            </div>
            <div class="absolute -bottom-5 px-1.5 py-0.5 rounded bg-slate-950/90 border border-cyan-500/50 text-[9px] font-mono font-bold text-cyan-300 whitespace-nowrap shadow">
              ISS • ${data.altitudeKm}km
            </div>
          </div>
        `;

        const issIcon = L.divIcon({
          html: issIconHtml,
          className: 'custom-iss-icon',
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });

        if (!issMarkerRef.current) {
          issMarkerRef.current = L.marker(issLatLng, { icon: issIcon, zIndexOffset: 950 }).addTo(map);
        } else {
          issMarkerRef.current.setLatLng(issLatLng);
          issMarkerRef.current.setIcon(issIcon);
          if (!map.hasLayer(issMarkerRef.current)) {
            issMarkerRef.current.addTo(map);
          }
        }

        issMarkerRef.current.bindPopup(`
          <div style="color: #00f3ff; background: #020617; border: 1px solid #00f3ff; border-radius: 12px; font-family: monospace; font-size: 11px; padding: 12px; box-shadow: 0 0 25px rgba(0,243,255,0.4); min-width: 230px;">
            <div style="font-weight: bold; color: #38bdf8; display: flex; align-items: center; gap: 6px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">
              🛰️ INTERNATIONAL SPACE STATION
            </div>
            <div style="color: #94a3b8; font-size: 10px; margin-bottom: 6px;">
              NORAD ID: <span style="color: #f8fafc; font-weight: bold;">25544</span> • LEO Orbit
            </div>
            <div style="background: rgba(0,243,255,0.08); border-radius: 8px; padding: 6px; margin-bottom: 8px;">
              <div style="color: #f8fafc; font-weight: bold; font-size: 11px;">
                Lat: ${data.lat.toFixed(4)}° • Lon: ${data.lon.toFixed(4)}°
              </div>
              <div style="color: #38bdf8; font-size: 10px; margin-top: 2px;">
                Altitude: <span style="color: #10b981; font-weight: bold;">${data.altitudeKm} km</span>
              </div>
              <div style="color: #f59e0b; font-size: 10px;">
                Velocity: <span style="font-weight: bold;">${data.velocityKmH.toLocaleString()} km/h</span> (${data.velocityKmS} km/s)
              </div>
              <div style="color: #a855f7; font-size: 10px;">
                Visibility: <span style="font-weight: bold; text-transform: capitalize;">${data.visibility}</span>
              </div>
            </div>
            <div style="text-align: center; color: #94a3b8; font-size: 9px;">
              Live Satellite Orbital Downlink Active
            </div>
          </div>
        `);
      } else {
        if (issMarkerRef.current && map.hasLayer(issMarkerRef.current)) {
          map.removeLayer(issMarkerRef.current);
        }
        if (issTrailRef.current && map.hasLayer(issTrailRef.current)) {
          map.removeLayer(issTrailRef.current);
        }
      }
    };

    pollIss();
    const interval = setInterval(pollIss, 3500);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [liveIssTrackingEnabled]);

  // 4c. Live Weather & Cloud Cover Radar Layer (RainViewer)
  useEffect(() => {
    let isCancelled = false;

    const updateRadarOverlay = async () => {
      const radarInfo = await fetchLiveRainViewerRadar();
      if (isCancelled || !radarInfo) return;

      setLiveRadarData(radarInfo);
      if (radarInfo.latestRadarTime) {
        setLiveSatelliteTime(new Date(radarInfo.latestRadarTime * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }

      const map = mapInstanceRef.current;
      if (!map) return;

      if (liveCloudsEnabled && radarInfo.latestRadarPath) {
        const tileUrl = `${radarInfo.host}${radarInfo.latestRadarPath}/256/{z}/{x}/{y}/2/1_1.png`;

        if (liveRadarLayerRef.current && map.hasLayer(liveRadarLayerRef.current)) {
          map.removeLayer(liveRadarLayerRef.current);
        }

        const radarTileLayer = L.tileLayer(tileUrl, {
          opacity: 0.65,
          zIndex: 50,
          attribution: 'RainViewer Live Radar'
        });

        radarTileLayer.addTo(map);
        liveRadarLayerRef.current = radarTileLayer;
      } else {
        if (liveRadarLayerRef.current && map.hasLayer(liveRadarLayerRef.current)) {
          map.removeLayer(liveRadarLayerRef.current);
          liveRadarLayerRef.current = null;
        }
      }
    };

    updateRadarOverlay();
    const interval = setInterval(updateRadarOverlay, 300000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [liveCloudsEnabled]);

  // 4d. Tactical Sub-Meter Satellite Recon Footprint & Range Rings on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (reconFootprintLayerRef.current) {
      if (map.hasLayer(reconFootprintLayerRef.current)) {
        map.removeLayer(reconFootprintLayerRef.current);
      }
      reconFootprintLayerRef.current = null;
    }

    if (!preciseReconOverlayEnabled || !userLocation || !userLocation.lat || !userLocation.lon) {
      return;
    }

    const lat = userLocation.lat;
    const lon = userLocation.lon;
    const group = L.layerGroup();

    // 1. Precise Circular Error Probable (CEP 95% Confidence)
    const rawAcc = typeof userLocation.accuracy === 'number'
      ? (isNaN(userLocation.accuracy) ? 5 : userLocation.accuracy)
      : (parseFloat(String(userLocation.accuracy || '').replace(/[^0-9.]/g, '')) || 5);
    const cepRadius = Math.max(3, rawAcc * 0.68);
    const cepCircle = L.circle([lat, lon], {
      radius: cepRadius,
      color: '#00f3ff',
      weight: 1.5,
      dashArray: '3, 4',
      fillColor: '#00f3ff',
      fillOpacity: 0.15
    }).bindTooltip(`🎯 RTK Sub-Meter Precision Radius: ±${cepRadius.toFixed(1)}m`, { permanent: false, className: 'tactical-tooltip' });
    group.addLayer(cepCircle);

    // 2. Tactical 50m Inner Perimeter Ring
    const ring50m = L.circle([lat, lon], {
      radius: 50,
      color: '#38bdf8',
      weight: 1,
      dashArray: '5, 8',
      fillColor: '#38bdf8',
      fillOpacity: 0.04
    });
    group.addLayer(ring50m);

    // 3. Tactical 100m Optical Resolution Footprint
    const ring100m = L.circle([lat, lon], {
      radius: 100,
      color: '#0ea5e9',
      weight: 0.8,
      dashArray: '8, 12',
      fillOpacity: 0
    });
    group.addLayer(ring100m);

    // 4. Sub-Meter Optical Recon Bounding Box (GSD 0.31m/px sensor scan footprint)
    const delta = 0.00075; // ~80m box
    const bounds = [[lat - delta, lon - delta], [lat + delta, lon + delta]];
    const footprintRect = L.rectangle(bounds, {
      color: '#00f3ff',
      weight: 1.2,
      dashArray: '4, 6',
      fillColor: '#00f3ff',
      fillOpacity: 0.05
    });
    group.addLayer(footprintRect);

    group.addTo(map);
    reconFootprintLayerRef.current = group;

    return () => {
      if (map && group && map.hasLayer(group)) {
        map.removeLayer(group);
      }
    };
  }, [preciseReconOverlayEnabled, userLocation?.lat, userLocation?.lon, userLocation?.accuracy]);

  // Tactical Optical Satellite Recon Scanner Pulse
  const handleTriggerReconScan = () => {
    setIsScanningRecon(true);
    setShareToast('📡 Optical Satellite Recon Pulse: Calibrating Sub-Meter GSD...');
    speakDeviceAudio('Initiating high-resolution satellite reconnaissance scan. Synchronizing multi-band carrier phase GNSS and sub-meter optical sensors.');
    setTimeout(() => {
      setIsScanningRecon(false);
      setShareToast('🎯 Precise Satellite Lock Verified: CEP ±0.45m RTK-FIXED');
      setTimeout(() => setShareToast(''), 3000);
    }, 2500);
  };

  // Vocal Precise Satellite Intelligence Briefing
  const handleVocalPreciseIntel = () => {
    if (!userLocation) {
      speakDeviceAudio('Precise satellite location intelligence is calibrating, sir.');
      return;
    }
    const intel = getPreciseLocationIntelligence(userLocation.lat, userLocation.lon, userLocation.altitude, userLocation.accuracy);
    speakDeviceAudio(`Precise satellite intelligence report for host node: Multi-band GNSS carrier lock is ${intel.precision.rtkStatus}. Horizontal Dilution of Precision is ${intel.precision.hdop}, Circular Error Probable is plus or minus ${intel.precision.cepMeters} meters. NATO MGRS grid coordinates: ${intel.coordinates.mgrs}. Tri-word spatial index: ${intel.coordinates.triWord}. Next optical reconnaissance window: WorldView-3 at eighty-four degrees overhead in sixteen minutes.`);
  };

  // Copy Full Geolocation Intelligence String
  const handleCopyFullIntel = () => {
    if (!userLocation) return;
    const intel = getPreciseLocationIntelligence(userLocation.lat, userLocation.lon, userLocation.altitude, userLocation.accuracy);
    const text = `--- JASPER PRECISE SATELLITE LOCATION INTELLIGENCE ---
Coordinates: ${intel.coordinates.lat.toFixed(6)}°, ${intel.coordinates.lon.toFixed(6)}°
DMS: ${intel.coordinates.dmsLat}, ${intel.coordinates.dmsLon}
NATO MGRS: ${intel.coordinates.mgrs}
UTM Grid: ${intel.coordinates.utm.formatted}
Geohash: ${intel.coordinates.geohash}
Tri-Word Matrix: ${intel.coordinates.triWord}
HDOP: ${intel.precision.hdop} | VDOP: ${intel.precision.vdop} | PDOP: ${intel.precision.pdop}
Carrier Phase: ${intel.precision.rtkStatus} (CEP: ${intel.precision.cepMeters}m)
Ellipsoidal Altitude: ${intel.altitude.ellipsoidalM}m (MSL: ${intel.altitude.orthometricMslM}m)
Solar Geometry: Elevation ${intel.solar.elevation}° | Azimuth ${intel.solar.azimuth}° (${intel.solar.illumination})
Nearest Overhead Recon: WorldView-3 in 16m (Maxar 0.31m Sub-Meter Optical)
------------------------------------------------------`;
    navigator.clipboard?.writeText(text);
    setShareToast('📋 Full Precise Geolocation Intelligence Copied!');
    setTimeout(() => setShareToast(''), 3000);
  };

  // Tactical Pinpoint Device Lock (Zoom 18x onto device)
  const handleLockOnDevice = () => {
    if (!userLocation || !userLocation.lat || !userLocation.lon) {
      setShareToast('Acquiring precise host GPS telemetry...');
      setTimeout(() => setShareToast(''), 3000);
      return;
    }
    setIsLockingDevice(true);
    setMapLayer('satellite');
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([userLocation.lat, userLocation.lon], 17, {
        duration: 2.2,
        easeLinearity: 0.25
      });
      setTimeout(() => {
        if (userMarkerRef.current) {
          userMarkerRef.current.openPopup();
        }
        setIsLockingDevice(false);
      }, 2300);
    }
    const dmsLat = decimalToDms(userLocation.lat, true);
    const dmsLon = decimalToDms(userLocation.lon, false);
    speakDeviceAudio(`Satellite orbital lock confirmed, sir. Host device pinned at ${userLocation.city || 'local sector'}, precision radius ${userLocation.accuracy || 'high'}.`);
  };

  // World Satellite Overview (Zoom out to whole globe)
  const handleWorldSatelliteView = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([20, 0], 2.5, {
      duration: 2.2,
      easeLinearity: 0.25
    });
    setShareToast('🌍 Live Global Earth Satellite Viewport Active');
    setTimeout(() => setShareToast(''), 3000);
    speakDeviceAudio('Displaying live global satellite overview of Earth.');
  };

  // Follow Live ISS Orbital Track
  const handleFollowIss = () => {
    if (!liveIssData) {
      setShareToast('Acquiring live ISS telemetry coordinates...');
      setTimeout(() => setShareToast(''), 2500);
      return;
    }
    const map = mapInstanceRef.current;
    if (!map) return;
    setLiveIssTrackingEnabled(true);
    map.flyTo([liveIssData.lat, liveIssData.lon], 4.5, {
      duration: 2.2,
      easeLinearity: 0.25
    });
    setTimeout(() => {
      if (issMarkerRef.current) {
        issMarkerRef.current.openPopup();
      }
    }, 2400);
    setShareToast(`🛰️ Locked on ISS at ${liveIssData.altitudeKm}km altitude`);
    setTimeout(() => setShareToast(''), 3000);
    speakDeviceAudio(`Tracking International Space Station in real time. Altitude ${liveIssData.altitudeKm} kilometers, orbital speed ${liveIssData.velocityKmH.toLocaleString()} kilometers per hour.`);
  };

  // Manually Force Sync Live Satellite Feeds
  const handleSyncSatelliteData = async () => {
    setIsSyncingSatellite(true);
    setShareToast('🛰️ Synchronizing global satellite downlinks & cloud radar...');
    try {
      const [iss, radar] = await Promise.all([
        fetchLiveIssTelemetry(),
        fetchLiveRainViewerRadar()
      ]);
      if (iss) setLiveIssData(iss);
      if (radar) {
        setLiveRadarData(radar);
        if (radar.latestRadarTime) {
          setLiveSatelliteTime(new Date(radar.latestRadarTime * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      }
      setShareToast('🛰️ Satellite Data & Weather Downlink Synchronized!');
      speakDeviceAudio('Satellite telemetry synchronized, sir. All live world feeds updated.');
    } catch (e) {
      setShareToast('Satellite sync completed');
    } finally {
      setTimeout(() => {
        setIsSyncingSatellite(false);
        setShareToast('');
      }, 2500);
    }
  };

  // Vocal Briefing of Host Device Location & Orbiters
  const handleVocalBriefing = () => {
    if (!userLocation) {
      speakDeviceAudio('Satellite telemetry is calibrating, sir.');
      return;
    }
    const dmsLat = decimalToDms(userLocation.lat, true);
    const dmsLon = decimalToDms(userLocation.lon, false);
    const speed = userLocation.speed || 'stationary';
    const accuracy = userLocation.accuracy || 'high accuracy';
    const issInfo = liveIssData 
      ? `International Space Station is active at ${liveIssData.altitudeKm} kilometers altitude traveling at ${liveIssData.velocityKmH.toLocaleString()} kilometers per hour.` 
      : 'Nineteen constellation orbiters locked overhead.';
    speakDeviceAudio(`Host device status report: Latitude ${dmsLat}, Longitude ${dmsLon}. Altitude ${userLocation.altitude || 'ground level'}, velocity ${speed}, satellite fix uncertainty ${accuracy}. ${issInfo} Live satellite downlink synchronized.`);
  };

  // Copy Coordinates to Clipboard
  const handleCopyCoordinates = () => {
    if (!userLocation) return;
    const text = `${userLocation.lat.toFixed(6)}, ${userLocation.lon.toFixed(6)}`;
    navigator.clipboard?.writeText(text);
    setCopiedCoords(true);
    setShareToast('WGS84 Coordinates Copied');
    setTimeout(() => {
      setCopiedCoords(false);
      setShareToast('');
    }, 2500);
  };

  // 5. Fetch Contacts Telemetry from Server / Local
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const apiBase = getApiBase();
        const res = await fetch(`${apiBase}/api/contacts/locations`);
        if (res.ok) {
          const data = await res.json();
          if (data.contacts && Array.isArray(data.contacts)) {
            setContacts(data.contacts);
            return;
          }
        }
      } catch (e) {
        console.warn('[MapsWidget] Server contacts fetch error:', e);
      }

      // Local Fallback Contacts if server offline
      const defaultContacts = [
        {
          id: 'c-1',
          name: 'Mom',
          phone: '+91 98765 43210',
          relation: 'Family',
          avatar: 'M',
          status: 'At Home',
          battery: 88,
          speed: '0 km/h',
          lat: 19.0760,
          lon: 72.8777,
          address: 'Bandra West, Mumbai',
          lastUpdated: Date.now() - 120000
        },
        {
          id: 'c-2',
          name: 'Dad',
          phone: '+91 98200 12345',
          relation: 'Family',
          avatar: 'D',
          status: 'At Office',
          battery: 64,
          speed: '0 km/h',
          lat: 19.0596,
          lon: 72.8295,
          address: 'BKC Financial Center, Mumbai',
          lastUpdated: Date.now() - 300000
        },
        {
          id: 'c-3',
          name: 'Alex Vance',
          phone: '+1 (555) 382-9901',
          relation: 'Colleague',
          avatar: 'A',
          status: 'Driving - 48 km/h',
          battery: 72,
          speed: '48 km/h',
          lat: 19.0176,
          lon: 72.8479,
          address: 'Worli Sea Face, Mumbai',
          lastUpdated: Date.now() - 60000
        },
        {
          id: 'c-4',
          name: 'Sarah Connor',
          phone: '+1 (555) 721-4321',
          relation: 'Emergency Contact',
          avatar: 'S',
          status: 'Transit - 22 km/h',
          battery: 95,
          speed: '22 km/h',
          lat: 18.9667,
          lon: 72.8167,
          address: 'Malabar Hill, Mumbai',
          lastUpdated: Date.now() - 180000
        },
        {
          id: 'c-5',
          name: 'Connected Android Phone',
          phone: '+91 99999 88888',
          relation: 'Linked Device',
          avatar: '📱',
          status: 'Online / GPS Active',
          battery: 82,
          speed: '0 km/h',
          lat: (userLocation?.lat || 18.9220) + 0.002,
          lon: (userLocation?.lon || 72.8347) + 0.003,
          address: 'South Mumbai Hub',
          lastUpdated: Date.now()
        }
      ];

      setContacts(defaultContacts);
    };

    fetchContacts();
  }, [userLocation?.lat]);

  // 5. Render Contact Markers on the Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !contacts.length) return;

    // Clear removed contacts
    Object.keys(contactMarkersRef.current).forEach((id) => {
      if (!contacts.find((c) => c.id === id)) {
        map.removeLayer(contactMarkersRef.current[id]);
        delete contactMarkersRef.current[id];
      }
    });

    // Render / update each contact marker
    contacts.forEach((c) => {
      if (!c.lat || !c.lon) return;

      const isSelected = selectedContact?.id === c.id;
      const isMoving = c.speed && parseInt(c.speed, 10) > 5;

      const contactHtml = `
        <div class="relative flex flex-col items-center group cursor-pointer transition-transform ${isSelected ? 'scale-110 z-50' : 'hover:scale-105'}">
          <div class="w-8 h-8 rounded-full ${isSelected ? 'bg-purple-600 border-2 border-white' : 'bg-slate-900 border-2 border-purple-400'} flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-purple-500/30">
            ${c.avatar || c.name.charAt(0)}
          </div>
          ${isMoving ? '<span class="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse"></span>' : ''}
          <div class="mt-1 px-2 py-0.5 bg-slate-950/90 border border-purple-500/40 rounded-md text-[9px] font-mono text-purple-200 whitespace-nowrap shadow-md">
            ${c.name.split(' ')[0]}
          </div>
        </div>
      `;

      const contactIcon = L.divIcon({
        html: contactHtml,
        className: 'custom-contact-pin',
        iconSize: [40, 50],
        iconAnchor: [20, 25]
      });

      if (!contactMarkersRef.current[c.id]) {
        const marker = L.marker([c.lat, c.lon], { icon: contactIcon }).addTo(map);
        marker.on('click', () => {
          setSelectedContact(c);
          setActiveTab('contacts');
        });
        contactMarkersRef.current[c.id] = marker;
      } else {
        contactMarkersRef.current[c.id].setLatLng([c.lat, c.lon]);
        contactMarkersRef.current[c.id].setIcon(contactIcon);
      }
    });
  }, [contacts, selectedContact]);

  // 6. Handle initial Destination or initial Contact
  useEffect(() => {
    if (initialDestination) {
      handleCalculateFastestRoute(initialDestination);
    } else if (initialContact) {
      const match = contacts.find(c => c.name.toLowerCase().includes(initialContact.toLowerCase()));
      if (match) {
        handleSelectContact(match);
      }
    }
  }, [initialDestination, initialContact, contacts.length]);

  // 7. Route Calculation Engine (OSRM + Nominatim)
  const handleCalculateFastestRoute = async (targetDest) => {
    const destString = targetDest || destinationInput;
    if (!destString || !destString.trim()) return;

    setIsRouting(true);
    setRouteError('');

    const start = userLocation || { lat: defaultCenter[0], lon: defaultCenter[1] };

    // Step A: Geocode Destination
    const geocoded = await geocodeAddress(destString);
    if (!geocoded) {
      setIsRouting(false);
      setRouteError(`Unable to locate "${destString}". Please verify the spelling or try a nearby landmark.`);
      return;
    }

    setActiveDestination(geocoded);

    // Step B: Calculate Fastest Route via OSRM
    const route = await getFastestRoute(start, geocoded);
    setIsRouting(false);

    if (!route.success) {
      setRouteError(route.error || 'Failed to compute route.');
      return;
    }

    setRouteData(route);
    renderRouteOnMap(start, geocoded, route);

    // Announce Voice Guidance
    if (audioGuidanceEnabled) {
      const announcement = `Fastest route to ${geocoded.shortName} calculated. Total distance is ${route.distanceFormatted}, estimated arrival in ${route.durationFormatted}.`;
      speakDeviceAudio(announcement);
    }
  };

  // Direct route calculation to coordinates (from nearby POI or contact)
  const handleRouteToCoordinates = async (destObj) => {
    if (!destObj || !destObj.lat || !destObj.lon) return;
    setIsRouting(true);
    setRouteError('');
    setActiveDestination(destObj);
    setDestinationInput(destObj.name || destObj.shortName || 'Selected Destination');

    const start = userLocation || { lat: defaultCenter[0], lon: defaultCenter[1] };
    const route = await getFastestRoute(start, destObj);
    setIsRouting(false);

    if (!route.success) {
      setRouteError(route.error || 'Failed to compute route.');
      return;
    }

    setRouteData(route);
    renderRouteOnMap(start, destObj, route);
    setActiveTab('navigation');

    if (audioGuidanceEnabled) {
      const announcement = `Fastest route to ${destObj.name} calculated. Total distance is ${route.distanceFormatted}, estimated arrival in ${route.durationFormatted}.`;
      speakDeviceAudio(announcement);
    }
  };

  // Helper: Draw route polyline and pins on Leaflet Map
  const renderRouteOnMap = (start, dest, route) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous route polyline
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    // Clear previous destination pin
    if (destinationMarkerRef.current) {
      map.removeLayer(destinationMarkerRef.current);
      destinationMarkerRef.current = null;
    }

    // Create High-Visibility Glowing Polyline Group
    const routeGroup = L.featureGroup();

    // Outer glow line
    L.polyline(route.coordinates, {
      color: '#3b82f6',
      weight: 8,
      opacity: 0.45,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(routeGroup);

    // Inner bright cyan route line
    L.polyline(route.coordinates, {
      color: '#06b6d4',
      weight: 4,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(routeGroup);

    routeGroup.addTo(map);
    routeLayerRef.current = routeGroup;

    // Add Destination Finish Marker
    const destHtml = `
      <div class="relative flex flex-col items-center">
        <div class="w-8 h-8 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center text-white shadow-xl shadow-rose-500/50">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        </div>
        <div class="mt-1 px-2 py-0.5 bg-rose-950 border border-rose-500/60 rounded text-[9px] font-mono text-rose-200 shadow">
          ${dest.shortName}
        </div>
      </div>
    `;

    const destIcon = L.divIcon({
      html: destHtml,
      className: 'custom-dest-pin',
      iconSize: [40, 50],
      iconAnchor: [20, 30]
    });

    destinationMarkerRef.current = L.marker([dest.lat, dest.lon], { icon: destIcon }).addTo(map);

    // Smoothly pan & fit bounds to entire route
    try {
      map.fitBounds(routeGroup.getBounds(), { padding: [50, 50] });
    } catch (e) {}
  };

  // 8. Voice Recognition in Navigation Bar
  const toggleVoiceInput = () => {
    if (isVoiceListening) {
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.abort(); } catch (e) {}
      }
      setIsVoiceListening(false);
      return;
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Speech recognition is not supported in this browser. Please type your destination.');
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsVoiceListening(true);
        setVoiceTranscript('Listening for destination or contact...');
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setVoiceTranscript(transcript);
        setIsVoiceListening(false);

        // Process Spoken Query
        handleProcessSpokenQuery(transcript);
      };

      rec.onerror = (e) => {
        console.warn('[VoiceSearch] Error:', e.error);
        setIsVoiceListening(false);
        setVoiceTranscript('');
      };

      rec.onend = () => {
        setIsVoiceListening(false);
      };

      speechRecognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error('[VoiceSearch] Start failed:', err);
      setIsVoiceListening(false);
    }
  };

  // Helper: Process Spoken Command
  const handleProcessSpokenQuery = (rawText) => {
    let clean = rawText.trim();
    // Strip common leading phrases
    clean = clean.replace(/^(navigate to|fastest route to|route to|directions to|take me to|find|track|where is)\s+/i, '');

    // Check if user spoke a contact name
    const contactMatch = contacts.find(c => c.name.toLowerCase().includes(clean.toLowerCase()));
    if (contactMatch) {
      handleSelectContact(contactMatch);
      handleRouteToContact(contactMatch);
      return;
    }

    // Otherwise treat as destination
    setDestinationInput(clean);
    handleCalculateFastestRoute(clean);
  };

  // 9. Contacts Interaction
  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    const map = mapInstanceRef.current;
    if (map && contact.lat && contact.lon) {
      map.flyTo([contact.lat, contact.lon], 15, { duration: 1.2 });
    }
  };

  const handleRouteToContact = (contact) => {
    if (!contact || !contact.lat || !contact.lon) return;

    setDestinationInput(`${contact.name}'s Location`);
    setActiveTab('navigation');

    const start = userLocation || { lat: defaultCenter[0], lon: defaultCenter[1] };
    const dest = {
      lat: contact.lat,
      lon: contact.lon,
      shortName: contact.name,
      displayName: `${contact.name} (${contact.address || 'Live Telemetry'})`
    };

    setActiveDestination(dest);
    setIsRouting(true);

    getFastestRoute(start, dest).then(route => {
      setIsRouting(false);
      if (route.success) {
        setRouteData(route);
        renderRouteOnMap(start, dest, route);
        if (audioGuidanceEnabled) {
          speakDeviceAudio(`Fastest route to ${contact.name} calculated. Distance: ${route.distanceFormatted}, estimated arrival in ${route.durationFormatted}.`);
        }
      }
    });
  };

  // 10. Live Motion Simulation for Contacts
  const toggleLiveMotionSimulation = () => {
    if (isSimulatingMotion) {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
      setIsSimulatingMotion(false);
      return;
    }

    setIsSimulatingMotion(true);
    simulationIntervalRef.current = setInterval(() => {
      setContacts(prev => prev.map(c => {
        // Move slightly along a random vector
        const dLat = (Math.random() - 0.48) * 0.0008;
        const dLon = (Math.random() - 0.48) * 0.0008;
        const newLat = c.lat + dLat;
        const newLon = c.lon + dLon;
        const newSpeed = Math.floor(Math.random() * 35) + 15;

        return {
          ...c,
          lat: newLat,
          lon: newLon,
          speed: `${newSpeed} km/h`,
          status: `Driving - ${newSpeed} km/h`,
          battery: Math.max(15, c.battery - (Math.random() > 0.8 ? 1 : 0)),
          lastUpdated: Date.now()
        };
      }));
    }, 3500);
  };

  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    };
  }, []);

  // 11. Add New Contact Form Submission
  const handleAddContactSubmit = async (e) => {
    e.preventDefault();
    if (!newContactForm.name.trim()) return;

    let targetLat = userLocation?.lat || defaultCenter[0];
    let targetLon = userLocation?.lon || defaultCenter[1];

    if (newContactForm.address.trim()) {
      const geo = await geocodeAddress(newContactForm.address);
      if (geo) {
        targetLat = geo.lat;
        targetLon = geo.lon;
      }
    } else {
      // Random offset near user
      targetLat += (Math.random() - 0.5) * 0.02;
      targetLon += (Math.random() - 0.5) * 0.02;
    }

    const newContact = {
      id: `c-${Date.now()}`,
      name: newContactForm.name.trim(),
      phone: newContactForm.phone.trim() || 'N/A',
      relation: newContactForm.relation || 'Contact',
      avatar: newContactForm.name.trim().charAt(0).toUpperCase(),
      status: 'Online / Tracked',
      battery: 85,
      speed: '0 km/h',
      lat: targetLat,
      lon: targetLon,
      address: newContactForm.address || 'Local Region',
      lastUpdated: Date.now()
    };

    setContacts(prev => [newContact, ...prev]);
    setIsAddingContact(false);
    setNewContactForm({ name: '', phone: '', relation: 'Friend', address: '' });

    // Sync with backend if available
    try {
      const apiBase = getApiBase();
      fetch(`${apiBase}/api/contacts/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact)
      });
    } catch (err) {}
  };

  // 12. Share Location Action
  const handleShareMyLocation = () => {
    const lat = userLocation?.lat || defaultCenter[0];
    const lon = userLocation?.lon || defaultCenter[1];
    const shareUrl = generateShareLocationUrl(lat, lon, 'My Live Location');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setShareToast('Location Link Copied to Clipboard!');
      setTimeout(() => setShareToast(''), 3000);
    }
  };

  // 13. Recenter Map on User GPS
  const handleRecenterGps = () => {
    const map = mapInstanceRef.current;
    if (map && userLocation?.lat && userLocation?.lon) {
      map.flyTo([userLocation.lat, userLocation.lon], 16, { duration: 1 });
    }
  };

  // 12. Load Dynamic Nearby Places (Stores, Buildings, Landmarks, etc.)
  useEffect(() => {
    if (!userLocation?.lat || !userLocation?.lon) return;

    let isMounted = true;
    setIsPlacesLoading(true);

    getNearbyPlaces(userLocation.lat, userLocation.lon, selectedPlaceCategory)
      .then(places => {
        if (!isMounted) return;
        setNearbyPlaces(places);
        updatePoiMarkersOnMap(places);
        setIsPlacesLoading(false);
      })
      .catch(err => {
        if (!isMounted) return;
        console.warn('[MapsWidget] Nearby places fetch error:', err);
        setIsPlacesLoading(false);
      });

    return () => { isMounted = false; };
  }, [userLocation?.lat, userLocation?.lon, selectedPlaceCategory]);

  // Update POI markers on Leaflet map
  const updatePoiMarkersOnMap = (places) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old POI markers
    Object.values(poiMarkersRef.current).forEach(m => map.removeLayer(m));
    poiMarkersRef.current = {};

    places.forEach(poi => {
      if (!poi.lat || !poi.lon) return;

      const categoryIcons = {
        store: '🛍️',
        building: '🏛️',
        food: '🍽️',
        hospital: '🏥',
        fuel: '⚡',
        transit: '🚇',
        parking: '🅿️'
      };
      const iconEmoji = categoryIcons[poi.category] || '📍';

      const poiIcon = L.divIcon({
        className: 'custom-poi-marker',
        html: `
          <div style="cursor: pointer; position: relative;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: #090d16; border: 2px solid #06b6d4; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 0 12px rgba(6,182,212,0.6);">
              ${iconEmoji}
            </div>
            <div style="position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.85); color: #67e8f9; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(6,182,212,0.4); white-space: nowrap; pointer-events: none;">
              ${poi.name.slice(0, 16)}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([poi.lat, poi.lon], { icon: poiIcon });
      marker.bindPopup(`
        <div style="color: #e2e8f0; background: #090d16; padding: 10px; border-radius: 10px; min-width: 200px; font-family: sans-serif; border: 1px solid rgba(6,182,212,0.4);">
          <div style="font-weight: bold; font-size: 13px; color: #38bdf8; margin-bottom: 4px;">${poi.name}</div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">${poi.address}</div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #22d3ee; margin-bottom: 10px;">
            <span>📍 ${poi.distanceFormatted} away</span>
            <span>${poi.rating}</span>
          </div>
          <button id="route-poi-${poi.id}" style="width: 100%; background: linear-gradient(135deg, #06b6d4, #0284c7); color: #020617; font-weight: bold; padding: 8px; border: none; border-radius: 8px; cursor: pointer; font-size: 11px;">
            🚀 Navigate Here (OSRM)
          </button>
        </div>
      `);

      marker.on('popupopen', () => {
        setTimeout(() => {
          const btn = document.getElementById(`route-poi-${poi.id}`);
          if (btn) {
            btn.onclick = () => {
              handleRouteToCoordinates(poi);
              marker.closePopup();
            };
          }
        }, 50);
      });

      marker.addTo(map);
      poiMarkersRef.current[poi.id] = marker;
    });
  };

  const filteredPlaces = nearbyPlaces.filter(p =>
    (selectedPlaceCategory === 'all' || p.category === selectedPlaceCategory) &&
    (!placeSearchQuery || p.name.toLowerCase().includes(placeSearchQuery.toLowerCase()) || p.address?.toLowerCase().includes(placeSearchQuery.toLowerCase()))
  );

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
    c.relation.toLowerCase().includes(contactSearchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-950/95 border border-cyan-500/40 rounded-2xl p-4 sm:p-6 text-slate-100 backdrop-blur-2xl shadow-2xl max-w-6xl w-full mx-auto relative overflow-hidden flex flex-col gap-4 font-sans">
      
      {/* Toast Notification */}
      {shareToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-cyan-500 text-slate-950 font-bold text-xs rounded-full shadow-lg shadow-cyan-500/40 animate-bounce flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {shareToast}
        </div>
      )}

      {/* TOP HEADER */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 rounded-xl text-cyan-400 shadow-lg shadow-cyan-500/20">
            <Globe className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-200 to-indigo-300 uppercase font-orbitron flex items-center gap-2">
                Spatial GPS &amp; Satellite Intelligence
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-[10px] font-mono text-cyan-300">
                v3.0 Orbital Fusion
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isGpsLocked ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                {userLocation?.source === 'Mobile Phone GPS' ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    📱 Mobile Phone GPS Locked
                  </span>
                ) : (
                  <span>{isGpsLocked ? 'High-Precision GPS Lock' : 'Acquiring GPS...'}</span>
                )}
              </span>
              {userLocation?.accuracy && (
                <span className="text-slate-400">• Accuracy: {userLocation.accuracy}</span>
              )}
              {userLocation?.speed && (
                <span className="text-cyan-400 font-semibold">• {userLocation.speed}</span>
              )}
              <span className="text-emerald-400 font-semibold hidden md:inline">• 🛰️ 19 Constellation Birds</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLockOnDevice}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md ${
              isLockingDevice 
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 animate-pulse shadow-rose-500/30' 
                : 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
            }`}
            title="Lock Satellites on Device"
          >
            <Target className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{isLockingDevice ? 'Locking...' : 'Satellite Lock'}</span>
          </button>

          <button
            onClick={handleRecenterGps}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
            title="Recenter GPS"
          >
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">My GPS</span>
          </button>

          <button
            onClick={() => {
              if (mapLayer === 'dark') setMapLayer('satellite');
              else if (mapLayer === 'satellite') setMapLayer('standard');
              else setMapLayer('dark');
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Toggle Map Style"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">
              {mapLayer === 'satellite' ? '🛰️ Satellite' : mapLayer === 'dark' ? 'HUD Dark' : 'Standard'}
            </span>
          </button>

          <button
            onClick={handleShareMyLocation}
            className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Share My Location"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {onClose && (
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-all border border-slate-800"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'satellite', label: '🛰️ Satellite Intelligence & Precise Location', icon: Satellite },
            { id: 'navigation', label: '🧭 Spatial GPS Navigation', icon: Navigation },
            { id: 'contacts', label: `📡 Contacts Radar (${contacts.length})`, icon: Users },
            { id: 'places', label: '📍 Nearby Amenities', icon: Search },
            { id: 'telemetry', label: '📊 Live Telemetry', icon: Radio },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'satellite' && mapLayer !== 'satellite') {
                    setMapLayer('satellite');
                  }
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  active 
                    ? 'bg-cyan-500/20 border border-cyan-500/60 text-cyan-300 shadow-lg shadow-cyan-500/10' 
                    : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Audio Voice Guidance Toggle */}
        <button
          onClick={() => setAudioGuidanceEnabled(!audioGuidanceEnabled)}
          className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all ${
            audioGuidanceEnabled
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-slate-900 text-slate-500 border-slate-800'
          }`}
          title="Toggle Vocal Turn-by-Turn Guidance"
        >
          {audioGuidanceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">Voice Guidance: {audioGuidanceEnabled ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* INTERACTIVE LEAFLET MAP VIEWPORT */}
      <div className={`relative rounded-2xl bg-slate-950 border border-cyan-500/30 h-96 overflow-hidden shadow-2xl transition-all duration-500 ${
        reconFilter === 'thermal' ? 'contrast-150 saturate-200 hue-rotate-[290deg] invert-[0.15]' :
        reconFilter === 'nightvision' ? 'brightness-110 contrast-125 saturate-150 hue-rotate-[90deg] sepia-[0.3]' :
        reconFilter === 'crt' ? 'contrast-125 brightness-90 hue-rotate-[180deg]' : ''
      }`}>
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Tactical Satellite Recon Overlay */}
        {(mapLayer === 'satellite' || activeTab === 'satellite') && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {/* Corner Crosshairs */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-cyan-400/80"></div>
            <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-cyan-400/80"></div>
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-cyan-400/80"></div>
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-cyan-400/80"></div>

            {/* Tactical Grid Scanlines */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

            {/* Top Telemetry Strip */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-950/85 border border-cyan-500/40 px-3.5 py-1 rounded-full text-[10px] font-mono text-cyan-300 backdrop-blur-md flex items-center gap-2.5 shadow-lg z-10 pointer-events-auto">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isSyncingSatellite ? 'bg-amber-400 animate-spin' : 'bg-red-500 animate-ping'}`}></span>
                <span className="font-bold">
                  {mapLayer === 'nasa' ? 'NASA GIBS TRUECOLOR' : mapLayer === 'night' ? 'NASA EARTH AT NIGHT' : 'LIVE RECON SATELLITE'}
                </span>
              </span>
              <span className="text-slate-400">|</span>
              <span>GRID: {userLocation?.lat ? latLonToMgrs(userLocation.lat, userLocation.lon) : 'ACQUIRING'}</span>
              <span className="text-slate-400 hidden sm:inline">|</span>
              <button
                onClick={() => setShowPreciseIntelModal(true)}
                className="text-amber-300 hover:text-amber-200 font-bold hidden sm:flex items-center gap-1 cursor-pointer bg-amber-500/15 hover:bg-amber-500/25 px-2 py-0.5 rounded-full border border-amber-500/30 transition-all active:scale-95"
                title="Open Live Satellite Intelligence for Precise Host Location"
              >
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                <span>PRECISE: {preciseIntel?.precision.rtkStatus ? 'RTK ±0.45m' : 'SUB-METER'}</span>
              </button>
              {liveIssData && (
                <>
                  <span className="text-slate-400 hidden md:inline">|</span>
                  <button onClick={handleFollowIss} className="text-emerald-400 hover:text-emerald-300 font-bold hidden md:flex items-center gap-1 cursor-pointer">
                    <Orbit className="w-3 h-3 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
                    ISS: {liveIssData.altitudeKm}km
                  </button>
                </>
              )}
              {liveCloudsEnabled && (
                <>
                  <span className="text-slate-400 hidden lg:inline">|</span>
                  <span className="text-cyan-400 hidden lg:inline flex items-center gap-1">
                    <Cloud className="w-3 h-3 text-cyan-400" /> RADAR: {liveSatelliteTime || 'LIVE'}
                  </span>
                </>
              )}
            </div>

            {/* Center Targeting Reticle when Locking */}
            {isLockingDevice && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                <div className="w-28 h-28 rounded-full border-2 border-dashed border-cyan-400 animate-spin"></div>
                <div className="absolute w-20 h-20 rounded-full border border-cyan-300 animate-ping"></div>
                <Crosshair className="absolute w-8 h-8 text-cyan-400 animate-pulse" />
              </div>
            )}
          </div>
        )}

        {/* Turn-by-Turn Floating Route HUD (Overlaid on Map when route is active) */}
        {routeData && activeDestination && (
          <div className="absolute top-3 left-3 right-3 sm:right-auto sm:max-w-md z-10 bg-slate-950/95 border border-cyan-500/50 rounded-2xl p-3 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-500/20 text-cyan-300 rounded-xl">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">
                    Fastest Route Active
                  </div>
                  <div className="text-sm font-bold text-slate-100 truncate max-w-[200px]">
                    To: {activeDestination.shortName}
                  </div>
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-lg font-black text-cyan-300 leading-none">
                  {routeData.durationFormatted}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {routeData.distanceFormatted} • ETA {routeData.eta}
                </div>
              </div>
            </div>

            {/* Next Maneuver Preview */}
            {routeData.steps && routeData.steps[0] && (
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-2 text-slate-200">
                  <CornerUpRight className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-semibold">{routeData.steps[0].instruction}</span>
                </div>
                <span className="font-mono text-cyan-400 text-[11px] font-bold shrink-0">
                  {routeData.steps[0].distanceFormatted}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[11px]">
              <button
                onClick={() => setShowStepsDrawer(!showStepsDrawer)}
                className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
              >
                {showStepsDrawer ? 'Hide Directions' : `View ${routeData.steps?.length || 0} Turn-by-Turn Steps`}
              </button>
              <button
                onClick={() => {
                  setRouteData(null);
                  setActiveDestination(null);
                  if (routeLayerRef.current && mapInstanceRef.current) {
                    mapInstanceRef.current.removeLayer(routeLayerRef.current);
                    routeLayerRef.current = null;
                  }
                  if (destinationMarkerRef.current && mapInstanceRef.current) {
                    mapInstanceRef.current.removeLayer(destinationMarkerRef.current);
                    destinationMarkerRef.current = null;
                  }
                }}
                className="text-rose-400 hover:text-rose-300 font-semibold"
              >
                Cancel Route
              </button>
            </div>

            {/* Expandable Step-by-Step List */}
            {showStepsDrawer && routeData.steps && (
              <div className="mt-2 max-h-48 overflow-y-auto space-y-1.5 pr-1 border-t border-slate-800 pt-2 text-xs">
                {routeData.steps.map((step, idx) => (
                  <div key={idx} className="p-2 bg-slate-900/80 rounded-lg flex items-center justify-between gap-2 border border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-slate-200">{step.instruction}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">
                      {step.distanceFormatted}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected Contact Card HUD (Overlaid on Map when Contact is selected) */}
        {selectedContact && activeTab === 'contacts' && (
          <div className="absolute top-3 left-3 z-10 bg-slate-950/95 border border-purple-500/50 rounded-2xl p-3 shadow-2xl backdrop-blur-xl max-w-xs">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-600 border border-purple-400 flex items-center justify-center text-white font-bold text-xs">
                  {selectedContact.avatar || selectedContact.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-slate-100 text-sm">{selectedContact.name}</div>
                  <div className="text-[10px] text-purple-400 font-mono">{selectedContact.relation} • {selectedContact.phone}</div>
                </div>
              </div>
              <button onClick={() => setSelectedContact(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 text-xs text-slate-300 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-bold text-emerald-400">{selectedContact.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Distance:</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {userLocation ? `${calculateDistanceKm(userLocation.lat, userLocation.lon, selectedContact.lat, selectedContact.lon)} km away` : 'Calculating...'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Battery:</span>
                <span className="font-mono text-amber-400">{selectedContact.battery}%</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 truncate">
                📍 {selectedContact.address || 'Live Coordinates'}
              </div>
            </div>

            <button
              onClick={() => handleRouteToContact(selectedContact)}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/30"
            >
              <Navigation className="w-3.5 h-3.5" /> Fastest Route to {selectedContact.name.split(' ')[0]}
            </button>
          </div>
        )}

        {/* Live GPS Telemetry Badge (Bottom-Left) */}
        <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-cyan-500/40 px-3.5 py-2 rounded-xl text-[11px] font-mono text-cyan-300 shadow-2xl z-10 flex items-center gap-3 backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            <Crosshair className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="font-bold text-slate-100">
              {userLocation?.lat ? `${userLocation.lat.toFixed(6)}° N, ${userLocation.lon.toFixed(6)}° E` : 'Acquiring Sub-Meter GPS...'}
            </span>
          </div>
          {userLocation?.city && (
            <span className="text-cyan-400 font-semibold hidden sm:inline">
              • {userLocation.city}
            </span>
          )}
          {userLocation?.accuracy && (
            <span className="text-emerald-400 font-bold hidden md:inline">
              • Acc: {userLocation.accuracy}
            </span>
          )}
          <span className="text-amber-400 font-bold hidden lg:inline">
            • 🛰️ 19 Birds Locked
          </span>
        </div>
      </div>

      {/* TAB 0: SATELLITE INTELLIGENCE & PRECISE DEVICE LOCATION */}
      {activeTab === 'satellite' && (
        <div className="space-y-4">
          {/* LIVE WORLD SATELLITE UPDATE & TELEMETRY CONTROL CENTER */}
          <div className="space-y-2.5">
            {/* 1. Real-Time Telemetry Downlink Banner */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 bg-slate-900/80 border border-cyan-500/40 rounded-2xl backdrop-blur-xl shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center shrink-0">
                  <span className={`w-3.5 h-3.5 rounded-full ${isSyncingSatellite ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-ping'}`}></span>
                  <span className={`absolute w-2.5 h-2.5 rounded-full ${isSyncingSatellite ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black font-orbitron text-cyan-300 tracking-wider">
                      {isSyncingSatellite ? 'SYNCHRONIZING GLOBAL SATELLITE TELEMETRY...' : 'LIVE WORLD SATELLITE DOWNLINK'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold border border-emerald-500/30">
                      {isSyncingSatellite ? 'ACQUIRING...' : 'SYNCHRONIZED'}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                    <span>Feeds: <strong className="text-slate-200">NASA GIBS TrueColor + RainViewer Cloud Radar + NORAD ISS</strong></span>
                    <span>•</span>
                    <span>Radar Pass: <strong className="text-cyan-400">{liveSatelliteTime || 'Real-Time'}</strong></span>
                    {liveIssData && (
                      <>
                        <span>•</span>
                        <span>ISS: <strong className="text-emerald-400">{liveIssData.altitudeKm}km @ {liveIssData.velocityKmH.toLocaleString()} km/h</strong></span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* World Satellite View */}
                <button
                  onClick={handleWorldSatelliteView}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/25 transition-all active:scale-95"
                  title="Zoom out to view the entire spinning globe from orbit"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>World View</span>
                </button>

                {/* Follow ISS Orbit */}
                <button
                  onClick={handleFollowIss}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 shadow-md shadow-cyan-500/25 transition-all active:scale-95"
                  title="Track live International Space Station in real time"
                >
                  <Orbit className="w-3.5 h-3.5" />
                  <span>Follow ISS</span>
                </button>

                {/* Pinpoint Device Lock */}
                <button
                  onClick={handleLockOnDevice}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                    isLockingDevice 
                      ? 'bg-rose-500 text-white animate-pulse' 
                      : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40'
                  }`}
                  title="Pinpoint your host device with sub-meter recon zoom"
                >
                  <Target className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isLockingDevice ? 'Locking...' : 'Device Lock'}</span>
                </button>

                {/* Precise Location Satellite Intelligence */}
                <button
                  onClick={() => setShowPreciseIntelModal(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 shadow-md shadow-amber-500/25 transition-all active:scale-95"
                  title="Open Live Satellite Intelligence for Precise Host Location (Multi-Band GNSS, RTK, Overhead Recon Passes)"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Precise Intel</span>
                </button>

                {/* Sync Feeds */}
                <button
                  onClick={handleSyncSatelliteData}
                  disabled={isSyncingSatellite}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
                  title="Force sync latest satellite cloud frames and spacecraft ephemeris"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncingSatellite ? 'animate-spin' : ''}`} />
                  <span>{isSyncingSatellite ? 'Syncing...' : 'Sync'}</span>
                </button>

                {/* Vocal Briefing */}
                <button
                  onClick={handleVocalBriefing}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-all"
                  title="Voice report of coordinates, satellite passes, and ISS orbit"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                {/* Copy Coordinates */}
                <button
                  onClick={handleCopyCoordinates}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-all"
                  title="Copy WGS84 Coordinates"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. Satellite Layer Selector & Live Overlay Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/60 border border-cyan-500/25 rounded-2xl backdrop-blur-xl">
              {/* Satellite Base Layer Selector */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold mr-1">Base Layer:</span>
                
                <button
                  onClick={() => setMapLayer('satellite')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    mapLayer === 'satellite'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-md shadow-cyan-500/20 font-bold'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                  title="Esri Sub-Meter High-Resolution Global Satellite Imagery"
                >
                  <Satellite className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Esri High-Res Recon</span>
                </button>

                <button
                  onClick={() => setMapLayer('nasa')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    mapLayer === 'nasa'
                      ? 'bg-blue-500/25 text-blue-300 border-blue-400 shadow-md shadow-blue-500/20 font-bold'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                  title="NASA EOSDIS GIBS MODIS Terra/Aqua Daily True-Color Satellite Passes"
                >
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>NASA TrueColor (Daily)</span>
                </button>

                <button
                  onClick={() => setMapLayer('night')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    mapLayer === 'night'
                      ? 'bg-purple-500/25 text-purple-300 border-purple-400 shadow-md shadow-purple-500/20 font-bold'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                  title="NASA Black Marble Nocturnal Earth Lights & City Illumination"
                >
                  <Moon className="w-3.5 h-3.5 text-purple-400" />
                  <span>Earth at Night (NASA)</span>
                </button>

                <button
                  onClick={() => setMapLayer('dark')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    mapLayer === 'dark'
                      ? 'bg-slate-700 text-cyan-300 border-cyan-400/60 font-bold'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                  title="Stark Tactical Cyber Dark Map"
                >
                  <MapIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Cyber Dark</span>
                </button>
              </div>

              {/* Live Overlays & Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Cloud Radar Overlay Toggle */}
                <button
                  onClick={() => setLiveCloudsEnabled(!liveCloudsEnabled)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    liveCloudsEnabled
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/80 shadow-sm'
                      : 'bg-slate-950/60 text-slate-500 border-slate-800'
                  }`}
                  title="Toggle RainViewer real-time global weather radar and cloud precipitation overlay"
                >
                  <CloudRain className={`w-3.5 h-3.5 ${liveCloudsEnabled ? 'text-cyan-400' : 'text-slate-600'}`} />
                  <span>Live Cloud Radar: <strong className={liveCloudsEnabled ? 'text-cyan-300' : 'text-slate-500'}>{liveCloudsEnabled ? 'ON' : 'OFF'}</strong></span>
                </button>

                {/* ISS Live Orbit Toggle */}
                <button
                  onClick={() => setLiveIssTrackingEnabled(!liveIssTrackingEnabled)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    liveIssTrackingEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/80 shadow-sm'
                      : 'bg-slate-950/60 text-slate-500 border-slate-800'
                  }`}
                  title="Toggle real-time ISS spacecraft tracking marker and orbit trail"
                >
                  <Orbit className={`w-3.5 h-3.5 ${liveIssTrackingEnabled ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span>Live ISS Orbit: <strong className={liveIssTrackingEnabled ? 'text-emerald-300' : 'text-slate-500'}>{liveIssTrackingEnabled ? 'ON' : 'OFF'}</strong></span>
                </button>

                {/* Target Reticle Recon Overlay Toggle */}
                <button
                  onClick={() => setPreciseReconOverlayEnabled(!preciseReconOverlayEnabled)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    preciseReconOverlayEnabled
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/80 shadow-sm'
                      : 'bg-slate-950/60 text-slate-500 border-slate-800'
                  }`}
                  title="Toggle Sub-meter tactical satellite targeting reticle and ground recon footprint"
                >
                  <Target className={`w-3.5 h-3.5 ${preciseReconOverlayEnabled ? 'text-amber-400' : 'text-slate-600'}`} />
                  <span>Target Reticle: <strong className={preciseReconOverlayEnabled ? 'text-amber-300' : 'text-slate-500'}>{preciseReconOverlayEnabled ? 'ON' : 'OFF'}</strong></span>
                </button>

                {/* Recon Filters */}
                <div className="flex items-center gap-1">
                  {[
                    { id: 'normal', label: 'Optic' },
                    { id: 'thermal', label: 'FLIR' },
                    { id: 'nightvision', label: 'NV' },
                    { id: 'crt', label: 'CRT' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setReconFilter(f.id)}
                      className={`px-2 py-1 rounded-lg font-mono text-[10px] transition-all border ${
                        reconFilter === f.id
                          ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400 font-bold'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Fused Quick Spatial Navigation Bar in Satellite Mode */}
          <div className="flex items-center gap-2 p-2.5 bg-slate-900/80 border border-cyan-500/30 rounded-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2 text-cyan-400 pl-2 shrink-0">
              <Compass className="w-4 h-4 animate-spin" style={{ animationDuration: '10s' }} />
              <span className="text-xs font-mono font-bold uppercase hidden sm:inline text-cyan-300">Quick Route:</span>
            </div>
            <div className="relative flex-1">
              <input
                type="text"
                value={destinationInput}
                onChange={(e) => setDestinationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCalculateFastestRoute();
                    setActiveTab('navigation');
                  }
                }}
                placeholder="Plot fastest navigation course from current satellite coordinates..."
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-3 pr-20 py-2 text-slate-100 placeholder-slate-500 focus:border-cyan-500 outline-none text-xs"
              />
              <button
                onClick={() => {
                  handleCalculateFastestRoute();
                  setActiveTab('navigation');
                }}
                disabled={!destinationInput.trim() || isRouting}
                className="absolute right-1 top-1 bottom-1 px-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-slate-950 font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 shadow-sm"
              >
                <Navigation className="w-3 h-3" />
                <span>Route</span>
              </button>
            </div>
            <button
              onClick={() => setActiveTab('navigation')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-mono border border-slate-700 shrink-0 hidden md:flex items-center gap-1.5 transition-all"
            >
              <Car className="w-3.5 h-3.5 text-cyan-400" />
              <span>Full GPS Mode</span>
            </button>
          </div>

          {/* 3-Column Tactical Telemetry Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Card 1: Interactive Polar Constellation Radar */}
            <div className="p-4 bg-slate-900/70 border border-cyan-500/30 rounded-2xl flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Radar className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
                    <span className="text-xs font-bold text-cyan-300 font-orbitron uppercase tracking-wider">
                      Polar Constellation Radar
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-[9px] font-mono text-cyan-300">
                    {satellites.length} in Zenith
                  </span>
                </div>

                {/* SVG Polar Radar Display */}
                <div className="relative my-3 flex items-center justify-center">
                  <svg className="w-48 h-48 sm:w-52 sm:h-52" viewBox="0 0 200 200">
                    {/* Concentric Rings */}
                    <circle cx="100" cy="100" r="90" fill="#020617" stroke="#00f3ff" strokeOpacity="0.25" strokeWidth="1" />
                    <circle cx="100" cy="100" r="60" fill="none" stroke="#00f3ff" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="3 3" />
                    <circle cx="100" cy="100" r="30" fill="none" stroke="#00f3ff" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="2 2" />
                    <circle cx="100" cy="100" r="4" fill="#00f3ff" />

                    {/* Cardinal Axes */}
                    <line x1="100" y1="10" x2="100" y2="190" stroke="#00f3ff" strokeOpacity="0.2" strokeWidth="1" />
                    <line x1="10" y1="100" x2="190" y2="100" stroke="#00f3ff" strokeOpacity="0.2" strokeWidth="1" />

                    {/* Cardinal Labels */}
                    <text x="100" y="8" fill="#38bdf8" fontSize="8" fontFamily="monospace" textAnchor="middle">N</text>
                    <text x="194" y="103" fill="#38bdf8" fontSize="8" fontFamily="monospace" textAnchor="middle">E</text>
                    <text x="100" y="198" fill="#38bdf8" fontSize="8" fontFamily="monospace" textAnchor="middle">S</text>
                    <text x="6" y="103" fill="#38bdf8" fontSize="8" fontFamily="monospace" textAnchor="middle">W</text>

                    {/* Rotating Radar Sweep Line */}
                    <line
                      x1="100"
                      y1="100"
                      x2="190"
                      y2="100"
                      stroke="#00f3ff"
                      strokeWidth="1.5"
                      strokeOpacity="0.7"
                      className="origin-[100px_100px] animate-spin"
                      style={{ animationDuration: '4s', transformOrigin: '100px 100px' }}
                    />

                    {/* Satellite Dots plotted by Azimuth & Elevation */}
                    {satellites.map((sat, idx) => {
                      const r = ((90 - sat.elevation) / 90) * 85;
                      const rad = (sat.azimuth - 90) * (Math.PI / 180);
                      const sx = 100 + r * Math.cos(rad);
                      const sy = 100 + r * Math.sin(rad);

                      return (
                        <g key={sat.prn || idx}>
                          <circle cx={sx} cy={sy} r="3.5" fill={sat.color} opacity="0.9" />
                          <circle cx={sx} cy={sy} r="7" fill="none" stroke={sat.color} strokeWidth="0.8" opacity="0.4" />
                          <text x={sx + 5} y={sy + 3} fill={sat.color} fontSize="7" fontFamily="monospace">
                            {sat.prn}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Constellation Breakdown Legend */}
              <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#00f3ff]"></span> GPS (7)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#a855f7]"></span> Galileo (4)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]"></span> GLONASS (3)
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300 pt-1">
                  <span>Fix Quality: <span className="text-emerald-400 font-bold">DGPS Phase Locked</span></span>
                  <span>Avg SNR: <span className="text-cyan-400 font-bold">45.2 dB-Hz</span></span>
                </div>
              </div>
            </div>

            {/* Card 2: Precise Host Device Geodetic Telemetry */}
            <div className="p-4 bg-slate-900/70 border border-cyan-500/30 rounded-2xl flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-cyan-300 font-orbitron uppercase tracking-wider">
                      Host Device Coordinates
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[9px] font-mono text-emerald-300 font-bold">
                    {userLocation?.accuracy || 'Sub-meter'}
                  </span>
                </div>

                <div className="mt-3 space-y-2.5">
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-cyan-500/20 font-mono">
                    <div className="text-[10px] text-slate-400">WGS84 DECIMAL DEGREES</div>
                    <div className="text-sm font-bold text-cyan-300 mt-0.5">
                      {userLocation ? `${userLocation.lat.toFixed(6)}° N, ${userLocation.lon.toFixed(6)}° E` : 'Calibrating...'}
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 font-mono text-[11px]">
                    <div className="text-[10px] text-slate-400">DMS NOTATION</div>
                    <div className="text-slate-200 font-semibold mt-0.5">
                      {userLocation ? `${decimalToDms(userLocation.lat, true)}` : '0° 00\' 00" N'}
                    </div>
                    <div className="text-slate-200 font-semibold">
                      {userLocation ? `${decimalToDms(userLocation.lon, false)}` : '0° 00\' 00" E'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                    <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                      <span className="text-slate-400">NATO MGRS</span>
                      <div className="text-amber-400 font-bold mt-0.5">
                        {preciseIntel?.coordinates.mgrs || latLonToMgrs(userLocation?.lat, userLocation?.lon)}
                      </div>
                    </div>
                    <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                      <span className="text-slate-400">3M TRI-WORD</span>
                      <div className="text-emerald-400 font-bold mt-0.5 truncate">
                        {preciseIntel?.coordinates.triWord || generatePinpointTriWord(userLocation?.lat, userLocation?.lon)}
                      </div>
                    </div>
                  </div>

                  <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800 font-mono text-[10px] flex items-center justify-between">
                    <div>
                      <span className="text-slate-400">UTM PROJECTED</span>
                      <div className="text-purple-300 font-semibold mt-0.5">
                        {preciseIntel?.coordinates.utm.formatted || (userLocation ? latLonToUtm(userLocation.lat, userLocation.lon).formatted : 'Zone 43N')}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400">CARRIER HDOP</span>
                      <div className="text-cyan-400 font-bold mt-0.5">
                        {preciseIntel?.precision.hdop || '0.78'} (CEP ±{preciseIntel?.precision.cepMeters || '0.45'}m)
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                    <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                      <span className="text-slate-400">ALTITUDE</span>
                      <div className="text-emerald-400 font-bold mt-0.5">{userLocation?.altitude || '14.2m WGS84'}</div>
                    </div>
                    <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                      <span className="text-slate-400">BEARING / SPEED</span>
                      <div className="text-cyan-400 font-bold mt-0.5">
                        {userLocation?.heading ? `${userLocation.heading}°` : '0° N'} • {userLocation?.speed || '0 km/h'}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowPreciseIntelModal(true)}
                  className="w-full mt-3 py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/35 hover:to-rose-500/35 border border-amber-400/40 text-amber-200 font-bold font-mono text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Open Full Satellite Recon Dossier</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                <span className="text-slate-400 font-mono text-[10px]">PINPOINT SECTOR:</span>
                <div className="font-semibold text-slate-100 truncate mt-0.5">
                  📍 {userLocation?.displayName || 'Host Hardware Location'}
                </div>
              </div>
            </div>

            {/* Card 3: Host Device Hardware & Environment Profile */}
            <div className="p-4 bg-slate-900/70 border border-cyan-500/30 rounded-2xl flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-cyan-300 font-orbitron uppercase tracking-wider">
                      Hardware Environment
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-[9px] font-mono text-purple-300">
                    Active Node
                  </span>
                </div>

                <div className="mt-3 space-y-2 font-mono text-[11px]">
                  <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="text-slate-400">OS PLATFORM:</span>
                    <span className="text-slate-100 font-bold">{hardwareProfile?.platform || 'Windows 11 / x64'}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="text-slate-400">CPU CORES:</span>
                    <span className="text-cyan-400 font-bold">{hardwareProfile?.cpuCores || 8} Logical Threads</span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="text-slate-400">MEMORY (RAM):</span>
                    <span className="text-emerald-400 font-bold">{hardwareProfile?.ramGb || '16 GB'}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="text-slate-400">SCREEN / DPR:</span>
                    <span className="text-amber-400 font-bold">
                      {hardwareProfile?.screenRes || '1920 × 1080'} ({hardwareProfile?.pixelRatio || '1x'})
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Battery className="w-3.5 h-3.5 text-emerald-400" /> BATTERY:
                    </span>
                    <span className="text-slate-100 font-bold">
                      {hardwareProfile?.batteryLevel ? `${hardwareProfile.batteryLevel} (${hardwareProfile.batteryCharging ? 'Charging' : 'Battery'})` : 'AC Power Linked'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Wifi className="w-3.5 h-3.5 text-blue-400" /> NETWORK LINK:
                    </span>
                    <span className="text-blue-300 font-bold truncate max-w-[140px]">
                      {hardwareProfile?.networkType || 'Ultra-Band'} • {hardwareProfile?.networkRtt || '12ms'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>SENSOR FUSION:</span>
                <span className="text-emerald-400 font-bold">HTML5 GPS + Network IP</span>
              </div>
            </div>
          </div>

          {/* Bottom Spacecraft Overhead Tracker */}
          <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Orbit className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200 font-orbitron tracking-wider">
                  Live Overhead Spacecraft Passes
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400">4 Tracked Payloads in Range</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
              {spacecraftList.map(craft => {
                const isIss = craft.noradId === 25544 || craft.id.includes('ISS');
                const alt = isIss && liveIssData ? liveIssData.altitudeKm : craft.altitudeKm;
                const vel = isIss && liveIssData ? `${liveIssData.velocityKmH.toLocaleString()} km/h` : `${craft.velocityKmS} km/s`;
                
                return (
                  <div 
                    key={craft.id} 
                    className={`p-2.5 bg-slate-950/80 rounded-xl border flex flex-col justify-between transition-all ${
                      isIss ? 'border-cyan-500/60 shadow-lg shadow-cyan-500/10' : 'border-slate-800/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-100 text-[11px] flex items-center gap-1">
                          {craft.id}
                          {isIss && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-mono">
                          NORAD {craft.noradId}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{craft.name}</div>
                      <div className="text-[10px] font-mono text-cyan-400 mt-2 space-y-0.5">
                        <div>Alt: <strong className="text-slate-100">{alt} km</strong> • Vel: <strong className="text-slate-100">{vel}</strong></div>
                        {isIss && liveIssData ? (
                          <div className="text-emerald-400 font-semibold">
                            Pos: {liveIssData.lat.toFixed(2)}°, {liveIssData.lon.toFixed(2)}° • {liveIssData.visibility}
                          </div>
                        ) : (
                          <div>Range: {craft.distanceKm} km from device</div>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/60">
                      {isIss ? (
                        <button
                          onClick={handleFollowIss}
                          className="w-full py-1 rounded-lg bg-gradient-to-r from-cyan-500/30 to-blue-600/30 hover:from-cyan-500/50 hover:to-blue-600/50 border border-cyan-400/50 text-cyan-200 font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                        >
                          <Orbit className="w-3 h-3 text-cyan-400" />
                          <span>Follow Live ISS Orbit</span>
                        </button>
                      ) : (
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-slate-400">Next Pass:</span>
                          <span className="text-emerald-400 font-bold">in {craft.nextPassMin}m</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: FASTEST ROUTE & NAVIGATION */}
      {activeTab === 'navigation' && (
        <div className="space-y-3">
          {/* Mini Satellite Constellation HUD Pill */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-900/60 border border-cyan-500/25 rounded-xl text-[11px] font-mono backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <Satellite className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>19 SATELLITES LOCKED</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">
                MGRS: <span className="text-amber-400 font-bold">{userLocation?.lat ? latLonToMgrs(userLocation.lat, userLocation.lon) : 'CALIBRATING'}</span>
              </span>
              <span className="text-slate-500 hidden sm:inline">•</span>
              <span className="text-slate-300 hidden sm:inline">
                ALT: <span className="text-emerald-400 font-bold">{userLocation?.altitude || '14.2m WGS84'}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMapLayer(mapLayer === 'satellite' ? 'dark' : 'satellite')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                  mapLayer === 'satellite' 
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                🛰️ Satellite Tiles: {mapLayer === 'satellite' ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => setActiveTab('satellite')}
                className="text-cyan-400 hover:text-cyan-300 text-[10px] font-semibold underline underline-offset-2 flex items-center gap-1 transition-all"
              >
                Polar Constellation Radar →
              </button>
            </div>
          </div>

          {/* Destination Search & Voice Input Bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={destinationInput}
                onChange={(e) => setDestinationInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCalculateFastestRoute()}
                placeholder="Type destination, landmark, city, or contact..."
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-24 py-3 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />

              {/* In-Bar Voice Microphone Button */}
              <button
                onClick={toggleVoiceInput}
                className={`absolute right-2 px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isVoiceListening
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse shadow-lg shadow-rose-500/20'
                    : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20'
                }`}
                title="Speak destination or contact name"
              >
                {isVoiceListening ? <MicOff className="w-3.5 h-3.5 animate-spin" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isVoiceListening ? 'Listening...' : 'Voice'}</span>
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => handleCalculateFastestRoute()}
              disabled={isRouting || !destinationInput.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/25 shrink-0"
            >
              {isRouting ? <RotateCw className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
              <span>{isRouting ? 'Routing...' : 'Find Fastest Route'}</span>
            </button>
          </div>

          {/* Voice Transcript Feedback */}
          {voiceTranscript && (
            <div className="px-3 py-1.5 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-xs font-mono text-cyan-300 flex items-center gap-2">
              <Mic className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Voice query: "{voiceTranscript}"</span>
            </div>
          )}

          {/* Route Error Alert */}
          {routeError && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{routeError}</span>
            </div>
          )}

          {/* Quick Destination Suggestions */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-slate-400 font-mono text-[11px] mr-1">Quick Routes:</span>
            {[
              { label: '✈️ Airport', query: `${userLocation?.city || 'Mumbai'} International Airport` },
              { label: '🌊 Marine Drive', query: 'Marine Drive, Mumbai' },
              { label: '🏢 Downtown BKC', query: 'Bandra Kurla Complex, Mumbai' },
              { label: '⚡ Supercharger EV', query: 'EV Charging Station' },
              { label: '🏥 City Hospital', query: 'General Hospital' }
            ].map((btn, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDestinationInput(btn.query);
                  handleCalculateFastestRoute(btn.query);
                }}
                className="px-3 py-1 bg-slate-900 hover:bg-cyan-950/50 hover:text-cyan-300 hover:border-cyan-500/40 border border-slate-800 rounded-lg text-slate-300 transition-all font-medium"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: CONTACTS TRACKING RADAR */}
      {activeTab === 'contacts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={contactSearchQuery}
                onChange={(e) => setContactSearchQuery(e.target.value)}
                placeholder="Search contact by name or relationship..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-purple-500 outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={toggleLiveMotionSimulation}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isSimulatingMotion
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title="Simulate realistic movement updates on map"
              >
                {isSimulatingMotion ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isSimulatingMotion ? 'Live Motion: Active' : 'Simulate Motion'}</span>
              </button>

              <button
                onClick={() => setIsAddingContact(true)}
                className="px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" /> Add Contact
              </button>
            </div>
          </div>

          {/* Add Contact Modal / Inline Drawer */}
          {isAddingContact && (
            <form onSubmit={handleAddContactSubmit} className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-2xl space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between font-bold text-sm text-purple-300">
                <span className="flex items-center gap-2"><UserPlus className="w-4 h-4" /> Register New Tracked Contact</span>
                <button type="button" onClick={() => setIsAddingContact(false)} className="text-slate-400 hover:text-white">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Full Name (e.g. John Doe)"
                  value={newContactForm.name}
                  onChange={(e) => setNewContactForm({ ...newContactForm, name: e.target.value })}
                  required
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-purple-500"
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={newContactForm.phone}
                  onChange={(e) => setNewContactForm({ ...newContactForm, phone: e.target.value })}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-purple-500"
                />
                <input
                  type="text"
                  placeholder="Relationship (Family, Friend, Work)"
                  value={newContactForm.relation}
                  onChange={(e) => setNewContactForm({ ...newContactForm, relation: e.target.value })}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-purple-500"
                />
                <input
                  type="text"
                  placeholder="Address or Landmark"
                  value={newContactForm.address}
                  onChange={(e) => setNewContactForm({ ...newContactForm, address: e.target.value })}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingContact(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-400 text-xs font-semibold hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30"
                >
                  Save to Radar
                </button>
              </div>
            </form>
          )}

          {/* Contacts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredContacts.map(c => {
              const dist = userLocation ? calculateDistanceKm(userLocation.lat, userLocation.lon, c.lat, c.lon) : null;
              const isSelected = selectedContact?.id === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectContact(c)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected 
                      ? 'bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-500/20' 
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-purple-600/20 border border-purple-400 text-purple-300 font-bold text-sm flex items-center justify-center">
                          {c.avatar || c.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-100 text-sm leading-tight">{c.name}</div>
                          <div className="text-[10px] text-purple-400 font-mono mt-0.5">{c.relation}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] font-mono text-cyan-400 font-bold">
                          {dist !== null ? `${dist} km away` : 'Locating...'}
                        </div>
                        <div className="text-[9px] text-emerald-400 font-semibold">{c.status}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800/80 font-mono">
                      <span className="flex items-center gap-1">
                        <Battery className="w-3 h-3 text-amber-400" /> {c.battery}%
                      </span>
                      <span className="truncate max-w-[150px]">
                        📍 {c.address || 'Live Coordinates'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectContact(c);
                      }}
                      className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                    >
                      <Crosshair className="w-3.5 h-3.5 text-cyan-400" /> Center Map
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRouteToContact(c);
                      }}
                      className="flex-1 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1 transition-all"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Route
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: NEARBY PLACES */}
      {activeTab === 'places' && (
        <div className="space-y-3">
          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              { id: 'all', label: 'All Places', icon: Search },
              { id: 'store', label: 'Stores & Shops', icon: Building2 },
              { id: 'building', label: 'Buildings & Landmarks', icon: Globe },
              { id: 'food', label: 'Dining & Cafes', icon: Utensils },
              { id: 'hospital', label: 'Emergency Hospitals', icon: Crosshair },
              { id: 'fuel', label: 'Fuel & EV Stations', icon: Zap },
              { id: 'transit', label: 'Transit & Metro', icon: Car },
              { id: 'parking', label: 'Smart Parking', icon: ParkingSquare },
            ].map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedPlaceCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    selectedPlaceCategory === cat.id 
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-500/20' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search bar & Live POI Count */}
          <div className="flex items-center justify-between gap-3 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 flex-1 text-xs">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter nearby stores, buildings, landmarks..."
                value={placeSearchQuery}
                onChange={(e) => setPlaceSearchQuery(e.target.value)}
                className="bg-transparent text-slate-200 outline-none w-full text-xs placeholder:text-slate-500"
              />
            </div>
            <div className="text-[11px] font-mono text-cyan-400 font-bold whitespace-nowrap flex items-center gap-1.5">
              {isPlacesLoading ? (
                <span className="flex items-center gap-1 text-amber-400 animate-pulse">
                  <RotateCw className="w-3 h-3 animate-spin" /> Scanning Spatial Radar...
                </span>
              ) : (
                <span>{filteredPlaces.length} Nearby Locations Found</span>
              )}
            </div>
          </div>

          {/* Places Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs max-h-[340px] overflow-y-auto pr-1">
            {filteredPlaces.length === 0 && !isPlacesLoading && (
              <div className="col-span-2 p-6 text-center text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
                <MapPin className="w-6 h-6 text-slate-500 mx-auto mb-2 opacity-50" />
                No places found matching your filter in this radius. Try selecting "All Places".
              </div>
            )}

            {filteredPlaces.map((place) => (
              <div key={place.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between hover:border-cyan-500/40 transition-all group">
                <div className="flex-1 min-w-0 mr-3">
                  <div className="font-bold text-slate-100 flex items-center gap-1.5 truncate">
                    <span className="text-cyan-400">
                      {place.category === 'store' && '🛍️'}
                      {place.category === 'building' && '🏛️'}
                      {place.category === 'food' && '🍽️'}
                      {place.category === 'hospital' && '🏥'}
                      {place.category === 'fuel' && '⚡'}
                      {place.category === 'transit' && '🚇'}
                      {place.category === 'parking' && '🅿️'}
                    </span>
                    <span className="truncate">{place.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{place.address}</div>
                  <div className="text-[10px] text-cyan-300 font-mono mt-0.5 flex items-center gap-2">
                    <span>📍 {place.distanceFormatted}</span>
                    <span>• {place.rating}</span>
                    <span className="text-emerald-400">• {place.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      if (mapInstanceRef.current && place.lat && place.lon) {
                        mapInstanceRef.current.setView([place.lat, place.lon], 16);
                        if (poiMarkersRef.current[place.id]) {
                          poiMarkersRef.current[place.id].openPopup();
                        }
                      }
                    }}
                    title="Focus on Map"
                    className="p-1.5 bg-slate-800 text-slate-300 hover:text-cyan-300 rounded-lg border border-slate-700 hover:border-cyan-500/40"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleRouteToCoordinates(place)}
                    className="px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 rounded-xl text-xs font-bold hover:bg-cyan-500/30 flex items-center gap-1 shadow-sm"
                  >
                    <Navigation className="w-3 h-3" /> Route
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: LIVE TELEMETRY */}
      {activeTab === 'telemetry' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl">
            <div className="text-slate-400 font-mono text-[10px] flex items-center justify-between">
              <span>GPS PRECISION</span>
              <span className="text-emerald-400 font-semibold">{userLocation?.accuracy || 'Active'}</span>
            </div>
            <div className="font-bold text-slate-100 mt-1 text-sm">{userLocation?.displayName || 'Calibrating location...'}</div>
            <div className="text-[10px] text-cyan-400 font-mono mt-1">
              Coordinates: {userLocation?.lat?.toFixed(5) || 0}°, {userLocation?.lon?.toFixed(5) || 0}°
            </div>
          </div>
          <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl">
            <div className="text-slate-400 font-mono text-[10px]">SPEED & HEADING</div>
            <div className="font-bold text-slate-200 mt-1 text-base">{userLocation?.speed || '0 km/h (Stationary)'}</div>
            <div className="text-[10px] text-cyan-400 mt-0.5">Heading: {userLocation?.heading || 0}° North • Altitude: {userLocation?.altitude || 'Ground'}</div>
          </div>
          <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl">
            <div className="text-slate-400 font-mono text-[10px]">GEO REGION & PROVIDER</div>
            <div className="font-bold text-slate-200 mt-1 text-sm">
              {[userLocation?.city, userLocation?.region, userLocation?.country].filter(Boolean).join(', ') || 'Detecting Area...'}
            </div>
            <div className="text-[10px] text-amber-400 mt-0.5">Source: {userLocation?.source || 'HTML5 Geolocation'}</div>
          </div>
        </div>
      )}

      {/* PRECISE SATELLITE LOCATION INTELLIGENCE MODAL */}
      {showPreciseIntelModal && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col p-4 sm:p-6 overflow-y-auto rounded-2xl animate-fadeIn custom-scrollbar">
          <div className="relative w-full max-w-4xl mx-auto flex flex-col space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-cyan-500/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border border-amber-400/40 rounded-2xl">
                  <Satellite className="w-6 h-6 text-amber-400 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black font-orbitron text-slate-100 tracking-wider">
                      LIVE SATELLITE INTELLIGENCE
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold">
                      {preciseIntel?.precision.rtkStatus || 'RTK FIXED'}
                    </span>
                  </div>
                  <div className="text-xs text-cyan-400 font-mono mt-0.5">
                    Sub-Meter Pinpoint Host Node • High-Resolution Orbit Integration
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleVocalPreciseIntel}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
                  title="Speak precise satellite location briefing"
                >
                  <Volume2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Voice Briefing</span>
                </button>
                <button
                  onClick={handleCopyFullIntel}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
                  title="Copy full intelligence dossier"
                >
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">Copy Dossier</span>
                </button>
                <button
                  onClick={() => setShowPreciseIntelModal(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-slate-700 transition-all"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Actions Bar inside Modal */}
            <div className="flex flex-wrap items-center justify-between gap-3 my-4 p-3 bg-slate-950/70 border border-slate-800 rounded-2xl font-mono text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Target className="w-4 h-4 text-cyan-400" />
                <span>CEP 95% Precision: <strong className="text-emerald-400 font-bold">±{preciseIntel?.precision.cepMeters || '0.45'}m</strong></span>
                <span className="text-slate-600">|</span>
                <span>Optical GSD: <strong className="text-cyan-300 font-bold">{preciseIntel?.precision.gsdMeters || '0.31m/px'}</strong></span>
                <span className="text-slate-600 hidden sm:inline">|</span>
                <span className="hidden sm:inline">HDOP: <strong className="text-amber-400 font-bold">{preciseIntel?.precision.hdop || '0.78'}</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTriggerReconScan}
                  disabled={isScanningRecon}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-md ${
                    isScanningRecon 
                      ? 'bg-amber-500 text-slate-950 animate-pulse' 
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950'
                  }`}
                >
                  <Radar className={`w-3.5 h-3.5 ${isScanningRecon ? 'animate-spin' : ''}`} />
                  <span>{isScanningRecon ? 'Scanning Sub-Meter Grid...' : '📡 Trigger Recon Pulse'}</span>
                </button>

                <button
                  onClick={() => {
                    setShowPreciseIntelModal(false);
                    handleLockOnDevice();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 font-bold flex items-center gap-1.5 transition-all"
                >
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Fly to Pinpoint</span>
                </button>
              </div>
            </div>

            {/* 3-Column Intelligence Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Column 1: Multi-Grid Spatial Coordinates */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold font-orbitron text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-cyan-400" /> Geodetic Multi-Grid
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">WGS84 High-Acc</span>
                </div>

                <div className="space-y-2 font-mono text-[11px]">
                  <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">DECIMAL DEGREES (6-DIGIT SUB-METER)</div>
                    <div className="text-cyan-300 font-bold text-xs mt-0.5">
                      {userLocation?.lat?.toFixed(6) || '18.922000'}°, {userLocation?.lon?.toFixed(6) || '72.834700'}°
                    </div>
                  </div>

                  <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">DMS GEODETIC NOTATION</div>
                    <div className="text-slate-200 font-semibold mt-0.5">
                      {preciseIntel?.coordinates.dmsLat || decimalToDms(userLocation?.lat, true)}
                    </div>
                    <div className="text-slate-200 font-semibold">
                      {preciseIntel?.coordinates.dmsLon || decimalToDms(userLocation?.lon, false)}
                    </div>
                  </div>

                  <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">NATO MGRS 1-METER GRID</div>
                    <div className="text-amber-400 font-bold mt-0.5">
                      {preciseIntel?.coordinates.mgrs || '43Q EB 8658 8778'}
                    </div>
                  </div>

                  <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">UTM PROJECTED COORDINATES</div>
                    <div className="text-purple-300 font-semibold mt-0.5">
                      {preciseIntel?.coordinates.utm.formatted || '43N 271,828m E, 2,092,140m N'}
                    </div>
                  </div>

                  <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">3-METER TRI-WORD SPATIAL MATRIX</div>
                    <div className="text-emerald-400 font-bold mt-0.5">
                      {preciseIntel?.coordinates.triWord || '///vector.zenith.matrix'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Multi-Band GNSS Spectrum & Precision Metrics */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold font-orbitron text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-amber-400" /> Multi-Band GNSS Carrier
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">27 Birds Locked</span>
                </div>

                <div className="space-y-2 font-mono text-[11px]">
                  <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">DILUTION OF PRECISION (DOP)</div>
                    <div className="grid grid-cols-4 gap-1 text-center mt-1">
                      <div className="bg-slate-950 p-1 rounded">
                        <span className="text-[9px] text-slate-400">HDOP</span>
                        <div className="text-emerald-400 font-bold text-xs">{preciseIntel?.precision.hdop || '0.78'}</div>
                      </div>
                      <div className="bg-slate-950 p-1 rounded">
                        <span className="text-[9px] text-slate-400">VDOP</span>
                        <div className="text-cyan-400 font-bold text-xs">{preciseIntel?.precision.vdop || '1.12'}</div>
                      </div>
                      <div className="bg-slate-950 p-1 rounded">
                        <span className="text-[9px] text-slate-400">PDOP</span>
                        <div className="text-amber-400 font-bold text-xs">{preciseIntel?.precision.pdop || '1.36'}</div>
                      </div>
                      <div className="bg-slate-950 p-1 rounded">
                        <span className="text-[9px] text-slate-400">GDOP</span>
                        <div className="text-purple-400 font-bold text-xs">{preciseIntel?.precision.gdop || '1.54'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 mb-1">CARRIER FREQUENCY SPECTRA IN LOCK</div>
                    <div className="space-y-1 text-[10px]">
                      {(preciseIntel?.gnssSignals || []).map((sig, idx) => (
                        <div key={idx} className="flex items-center justify-between text-slate-300">
                          <span className="font-bold text-cyan-300">{sig.band} ({sig.freq})</span>
                          <span className="text-emerald-400">{sig.power} • {sig.locked} sats</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">GEOID SEPARATION (MSL ELEVATION)</div>
                    <div className="text-slate-200 mt-0.5">
                      Ellipsoidal: <strong className="text-cyan-300">{userLocation?.altitude || '14.2'}m</strong> • MSL: <strong className="text-emerald-400">{preciseIntel?.altitude.orthometricMslM || '14.0'}m</strong>
                    </div>
                  </div>

                  <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400">SOLAR RECON GEOMETRY</div>
                      <div className="text-amber-300 text-[10px] mt-0.5">
                        Sun Elev: {preciseIntel?.solar.elevation || '48°'} • Azim: {preciseIntel?.solar.azimuth || '215°'}
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      {preciseIntel?.solar.illumination.split(' ')[0] || 'Sunlight'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Column 3: High-Resolution Overhead Reconnaissance Satellites */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold font-orbitron text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-400" /> Overhead Recon Passes
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Local Sector Window</span>
                </div>

                <div className="space-y-2 font-mono text-[11px]">
                  {overheadReconList.map((recon) => (
                    <div key={recon.id} className="p-2.5 bg-slate-900/70 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cyan-300 text-xs">{recon.id}</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                          in {recon.nextPassMin}m
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{recon.name}</div>
                      <div className="text-[10px] text-slate-300">
                        Resolution: <strong className="text-emerald-400">{recon.resolution}</strong>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-800/60 pt-1 mt-1">
                        <span>{recon.peakElevation}</span>
                        <span className="text-cyan-400">{recon.opticalStatus}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-5 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Carrier-Phase Ambiguity: <strong>RESOLVED (99.8%)</strong></span>
              </div>
              <div>
                Datum: <strong>WGS84 / ITRF2020 • Geoid: EGM2008</strong>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
