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
  ExternalLink
} from 'lucide-react';
import { getLocation, watchLiveGps } from '../utils/locationService';
import { geocodeAddress, getFastestRoute, calculateDistanceKm, generateShareLocationUrl, getNearbyPlaces } from '../utils/navigationService';
import { speakDeviceAudio } from '../utils/speakDeviceAudio';
import { getApiBase } from '../utils/apiConfig';

export default function MapsWidget({ onClose, initialDestination = '', initialContact = '' }) {
  // Tabs: 'navigation' | 'contacts' | 'telemetry' | 'places'
  const [activeTab, setActiveTab] = useState(initialContact ? 'contacts' : 'navigation');
  
  // Live GPS Telemetry
  const [userLocation, setUserLocation] = useState(null);
  const [isGpsLocked, setIsGpsLocked] = useState(false);
  const [mapLayer, setMapLayer] = useState('dark'); // 'dark' (CartoDB) or 'standard' (OSM)
  
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

    // Dark Stark-Tech OpenStreetMap Tiles (100% Free, Zero Watermark, Zero API Key Required)
    const darkTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: 'dark-map-tiles'
    });

    // Standard OpenStreetMap Tiles
    const osmTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    });

    if (mapLayer === 'dark') {
      darkTileLayer.addTo(map);
    } else {
      osmTileLayer.addTo(map);
    }

    // Add zoom controls to bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;
    mapInstanceRef.current._darkLayer = darkTileLayer;
    mapInstanceRef.current._osmLayer = osmTileLayer;

    // Force map resize check
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      poiMarkersRef.current = {};
    };
  }, []);

  // 2. Switch Map Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map._darkLayer || !map._osmLayer) return;

    if (mapLayer === 'dark') {
      if (map.hasLayer(map._osmLayer)) map.removeLayer(map._osmLayer);
      if (!map.hasLayer(map._darkLayer)) map._darkLayer.addTo(map);
    } else {
      if (map.hasLayer(map._darkLayer)) map.removeLayer(map._darkLayer);
      if (!map.hasLayer(map._osmLayer)) map._osmLayer.addTo(map);
    }
  }, [mapLayer]);

  // 3. Live GPS Continuous Tracking
  useEffect(() => {
    let unwatch = () => {};

    const startTracking = async () => {
      // First get one-shot position
      const initial = await getLocation();
      if (initial) {
        setUserLocation(initial);
        setIsGpsLocked(true);
        updateUserMarkerOnMap(initial);
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
        <div style="color: #0f172a; font-family: monospace; font-size: 11px; padding: 4px;">
          <b>You are here (Live GPS)</b><br/>
          <span>${loc.displayName || 'Current Position'}</span><br/>
          <span>Speed: ${loc.speed || '0 km/h'}</span>
        </div>
      `);
    } else {
      userMarkerRef.current.setLatLng(latLng);
    }
  };

  // 4. Fetch Contacts Telemetry from Server / Local
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
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/40 rounded-xl text-cyan-400 shadow-lg shadow-cyan-500/20">
            <Globe className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-wider text-cyan-300 uppercase font-orbitron">
                Spatial Maps & GPS Radar
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-[10px] font-mono text-cyan-300">
                v2.5 Live
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
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRecenterGps}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
            title="Recenter GPS"
          >
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">My GPS</span>
          </button>

          <button
            onClick={() => setMapLayer(mapLayer === 'dark' ? 'standard' : 'dark')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Toggle Map Style"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{mapLayer === 'dark' ? 'HUD Dark' : 'Standard'}</span>
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
            { id: 'navigation', label: 'Fastest Route & Navigation', icon: Navigation },
            { id: 'contacts', label: `Contacts Radar (${contacts.length})`, icon: Users },
            { id: 'places', label: 'Nearby Amenities', icon: Search },
            { id: 'telemetry', label: 'Live Telemetry', icon: Radio },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
      <div className="relative rounded-2xl bg-slate-950 border border-cyan-500/30 h-96 overflow-hidden shadow-2xl">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

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
        <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-cyan-500/40 px-3 py-1.5 rounded-xl text-[11px] font-mono text-cyan-300 shadow-lg z-10 flex items-center gap-2 backdrop-blur-md">
          <Crosshair className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>
            {userLocation ? `${userLocation.lat.toFixed(4)}° N, ${userLocation.lon.toFixed(4)}° E` : 'Calibrating GPS...'}
          </span>
          {userLocation?.city && <span className="text-slate-300 font-sans font-semibold">({userLocation.city})</span>}
        </div>
      </div>

      {/* TAB 1: FASTEST ROUTE & NAVIGATION */}
      {activeTab === 'navigation' && (
        <div className="space-y-3">
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

    </div>
  );
}
