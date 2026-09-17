/**
 * Unified Location Service for JASPER Assistant
 * Provides high-precision HTML5 Geolocation with automatic IP-based fallback
 * and OpenStreetMap reverse-geocoding for exact city/country names.
 */

import { getApiBase } from './apiConfig.js';

let cachedLocation = null;
let listeners = new Set();
let isFetching = false;

export const getLocation = async (forceRefresh = false) => {
  if (cachedLocation && !forceRefresh) {
    return cachedLocation;
  }

  if (isFetching && !forceRefresh) {
    // Wait for in-flight request
    await new Promise(resolve => setTimeout(resolve, 500));
    if (cachedLocation) return cachedLocation;
  }

  isFetching = true;

  try {
    // Attempt 0: Check connected mobile device location first (Phone GPS priority)
    const mobileLoc = await tryMobilePhoneLocation();
    if (mobileLoc) {
      const details = await reverseGeocode(mobileLoc.lat, mobileLoc.lon);
      cachedLocation = {
        ...mobileLoc,
        ...details,
        source: 'Mobile Phone GPS',
        timestamp: Date.now()
      };
      notifyListeners(cachedLocation);
      isFetching = false;
      return cachedLocation;
    }
  } catch (err) {
    console.warn('[LocationService] Mobile phone location fetch error:', err);
  }

  try {
    // Attempt 1: HTML5 High-Precision Geolocation
    const gpsLocation = await tryGpsLocation();
    if (gpsLocation) {
      const details = await reverseGeocode(gpsLocation.lat, gpsLocation.lon);
      cachedLocation = {
        ...gpsLocation,
        ...details,
        source: 'GPS',
        timestamp: Date.now()
      };
      notifyListeners(cachedLocation);
      isFetching = false;
      return cachedLocation;
    }
  } catch (err) {
    console.warn('[LocationService] GPS Geolocation failed or denied:', err);
  }

  try {
    // Attempt 2: IP-Based Geolocation Fallback
    const ipLocation = await tryIpLocation();
    if (ipLocation) {
      cachedLocation = {
        ...ipLocation,
        source: 'IP Geolocation',
        timestamp: Date.now()
      };
      notifyListeners(cachedLocation);
      isFetching = false;
      return cachedLocation;
    }
  } catch (err) {
    console.error('[LocationService] IP Geolocation failed:', err);
  }

  // Fallback default (if completely offline or blocked)
  cachedLocation = {
    lat: 18.9220,
    lon: 72.8347,
    city: 'Mumbai',
    region: 'Maharashtra',
    country: 'India',
    displayName: 'Mumbai, Maharashtra, India',
    accuracy: 'Estimated',
    source: 'Default Fallback',
    timestamp: Date.now()
  };

  notifyListeners(cachedLocation);
  isFetching = false;
  return cachedLocation;
};

// Query connected mobile phone GPS location via JASPER server
export const tryMobilePhoneLocation = async () => {
  try {
    const res = await fetch(`${getApiBase()}/api/phone/location`, { 
      signal: AbortSignal.timeout(3000) 
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.location && data.location.lat && data.location.lon) {
        return {
          lat: parseFloat(data.location.lat),
          lon: parseFloat(data.location.lon),
          accuracy: data.location.accuracy || 'Mobile GPS Lock',
          speed: data.location.speed || '0 km/h',
          heading: data.location.heading || 0,
          source: data.location.source || 'Mobile Phone GPS'
        };
      }
    }
  } catch (e) {}
  return null;
};

// Sync mobile GPS coordinates to JASPER Server
export const syncLocationToPhoneServer = async (loc) => {
  if (!loc || !loc.lat || !loc.lon) return;
  try {
    await fetch(`${getApiBase()}/api/phone/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lat: loc.lat,
        lon: loc.lon,
        accuracy: loc.accuracy,
        speed: loc.speed,
        heading: loc.heading
      })
    });
  } catch (e) {}
};

// Try HTML5 GPS Geolocation
const tryGpsLocation = () => {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return resolve(null);
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 7000,
      maximumAge: 30000
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy ? `±${pos.coords.accuracy.toFixed(1)}m` : 'High precision',
          rawAccuracy: pos.coords.accuracy || 10,
          altitude: pos.coords.altitude ? `${pos.coords.altitude.toFixed(1)}m` : 'N/A',
          altitudeAccuracy: pos.coords.altitudeAccuracy ? `±${pos.coords.altitudeAccuracy.toFixed(1)}m` : 'N/A',
          heading: pos.coords.heading !== null && !isNaN(pos.coords.heading) ? pos.coords.heading : 0,
          speed: pos.coords.speed ? `${(pos.coords.speed * 3.6).toFixed(1)} km/h` : '0.0 km/h',
          speedRaw: pos.coords.speed || 0,
          timestamp: pos.timestamp || Date.now()
        });
      },
      (err) => {
        console.warn('[LocationService] GPS error:', err.message);
        resolve(null);
      },
      options
    );
  });
};

// Try IP-based location services
const tryIpLocation = async () => {
  // Service 1: BigDataCloud Reverse-Geocode Client API (high compatibility)
  try {
    const res = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client', { priority: 'high' });
    if (res.ok) {
      const data = await res.json();
      if (data.latitude && data.longitude) {
        const city = data.city || data.locality || data.principalSubdivision || 'Unknown City';
        const region = data.principalSubdivision || '';
        const country = data.countryName || '';
        return {
          lat: data.latitude,
          lon: data.longitude,
          city,
          region,
          country,
          displayName: [city, region, country].filter(Boolean).join(', '),
          accuracy: 'IP Level (~5-10km)'
        };
      }
    }
  } catch (e) {
    console.warn('[LocationService] BigDataCloud IP lookup failed:', e);
  }

  // Service 2: ipapi.co
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const data = await res.json();
      if (data.latitude && data.longitude) {
        return {
          lat: data.latitude,
          lon: data.longitude,
          city: data.city || 'Unknown City',
          region: data.region || '',
          country: data.country_name || '',
          displayName: [data.city, data.region, data.country_name].filter(Boolean).join(', '),
          accuracy: 'IP Level'
        };
      }
    }
  } catch (e) {
    console.warn('[LocationService] ipapi.co lookup failed:', e);
  }

  return null;
};

// Reverse Geocode coordinates to address details via OpenStreetMap Nominatim / BigDataCloud
const reverseGeocode = async (lat, lon) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en'
      }
    });
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || 'Local Area';
      const region = addr.state || addr.region || '';
      const country = addr.country || '';
      const displayName = data.display_name || [city, region, country].filter(Boolean).join(', ');

      return {
        city,
        region,
        country,
        displayName,
        road: addr.road || addr.suburb || ''
      };
    }
  } catch (e) {
    console.warn('[LocationService] Nominatim reverse geocode failed:', e);
  }

  // Fallback reverse geocode via BigDataCloud
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.locality || data.principalSubdivision || 'Local Area';
      const region = data.principalSubdivision || '';
      const country = data.countryName || '';
      return {
        city,
        region,
        country,
        displayName: [city, region, country].filter(Boolean).join(', ')
      };
    }
  } catch (e) {
    console.warn('[LocationService] BigDataCloud fallback reverse geocode failed:', e);
  }

  return {
    city: 'Current Location',
    region: '',
    country: '',
    displayName: `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`
  };
};

export const subscribeLocation = (callback) => {
  listeners.add(callback);
  if (cachedLocation) {
    callback(cachedLocation);
  } else {
    getLocation().then(loc => callback(loc));
  }

  return () => {
    listeners.delete(callback);
  };
};

export const watchLiveGps = (onUpdate, onError) => {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    if (onError) onError(new Error('Geolocation not supported'));
    return () => {};
  }

  const options = {
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 10000
  };

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const loc = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        accuracy: pos.coords.accuracy ? `±${pos.coords.accuracy.toFixed(1)}m` : 'High precision',
        rawAccuracy: pos.coords.accuracy || 10,
        altitude: pos.coords.altitude ? `${pos.coords.altitude.toFixed(1)}m` : 'N/A',
        altitudeAccuracy: pos.coords.altitudeAccuracy ? `±${pos.coords.altitudeAccuracy.toFixed(1)}m` : 'N/A',
        heading: pos.coords.heading !== null && !isNaN(pos.coords.heading) ? pos.coords.heading : 0,
        speed: pos.coords.speed ? `${(pos.coords.speed * 3.6).toFixed(1)} km/h` : '0.0 km/h',
        speedRaw: pos.coords.speed || 0,
        timestamp: pos.timestamp || Date.now(),
        source: 'Live GPS Tracker'
      };
      cachedLocation = {
        ...(cachedLocation || {}),
        ...loc
      };
      notifyListeners(cachedLocation);
      if (onUpdate) onUpdate(cachedLocation);
      // Auto-sync mobile location to server so other connected nodes receive it
      syncLocationToPhoneServer(loc);
    },
    (err) => {
      console.warn('[LocationService] watchPosition error:', err.message);
      if (onError) onError(err);
    },
    options
  );

  return () => {
    try {
      navigator.geolocation.clearWatch(watchId);
    } catch (e) {}
  };
};

const notifyListeners = (loc) => {
  listeners.forEach(cb => cb(loc));
};

