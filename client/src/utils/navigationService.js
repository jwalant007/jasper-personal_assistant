/**
 * Navigation & Spatial Routing Service for JASPER Assistant
 * Provides Geocoding via Nominatim and Fastest Route Calculation via OSRM
 */

/**
 * Calculates straight-line Haversine distance in kilometers between two coordinates
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

/**
 * Formats minutes into human-readable duration (e.g. "1 hr 12 mins" or "25 mins")
 */
export const formatDuration = (totalMinutes) => {
  const mins = Math.round(totalMinutes);
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'}`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours} hr${hours === 1 ? '' : 's'}${remMins > 0 ? ` ${remMins} min${remMins === 1 ? '' : 's'}` : ''}`;
};

/**
 * Calculates arrival time string (e.g. "8:42 PM") given travel minutes
 */
export const calculateEta = (durationMinutes) => {
  const arrival = new Date(Date.now() + durationMinutes * 60 * 1000);
  return arrival.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

/**
 * Geocodes an address, place name, or landmark using OpenStreetMap Nominatim
 */
export const geocodeAddress = async (query) => {
  if (!query || !query.trim()) return null;

  const cleanQuery = encodeURIComponent(query.trim());

  // Attempt 1: OpenStreetMap Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${cleanQuery}&limit=1&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'JASPER-Spatial-Assistant/2.5 (contact: support@jasper.internal)'
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const addr = item.address || {};
        const shortName =
          addr.amenity ||
          addr.building ||
          addr.road ||
          addr.suburb ||
          addr.city ||
          addr.town ||
          addr.county ||
          item.display_name.split(',')[0];

        return {
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          displayName: item.display_name,
          shortName: shortName || query.trim()
        };
      }
    }
  } catch (err) {
    console.warn('[NavigationService] Nominatim geocode error:', err);
  }

  // Attempt 2: Photon (OpenStreetMap mirror for fast natural language queries)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${cleanQuery}&limit=1`;
    const pRes = await fetch(photonUrl);
    if (pRes.ok) {
      const pData = await pRes.json();
      if (pData && Array.isArray(pData.features) && pData.features.length > 0) {
        const feat = pData.features[0];
        const [lon, lat] = feat.geometry.coordinates;
        const props = feat.properties || {};
        const shortName = props.name || props.street || query.trim();
        const display = [props.name, props.street, props.city, props.state, props.country].filter(Boolean).join(', ');

        return {
          lat: parseFloat(lat),
          lon: parseFloat(lon),
          displayName: display || shortName,
          shortName
        };
      }
    }
  } catch (err) {
    console.warn('[NavigationService] Photon geocode fallback error:', err);
  }

  return null;
};

/**
 * Calculates fastest driving route from start to end coordinates using OSRM
 * Returns polyline coordinates [ [lat, lon], ... ], distance, duration, and maneuver steps
 */
export const getFastestRoute = async (startCoords, endCoords) => {
  if (!startCoords || !endCoords) {
    return { success: false, error: 'Start and destination coordinates are required.' };
  }

  const { lat: sLat, lon: sLon } = startCoords;
  const { lat: eLat, lon: eLon } = endCoords;

  try {
    // OSRM coordinates format: {lon},{lat};{lon},{lat}
    const url = `https://router.project-osrm.org/route/v1/driving/${sLon},${sLat};${eLon},${eLat}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && Array.isArray(data.routes) && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
        const durationMin = Math.round(route.duration / 60);

        // Convert GeoJSON [lon, lat] coordinates to Leaflet [lat, lon]
        const coordinates = (route.geometry?.coordinates || []).map(([lon, lat]) => [lat, lon]);

        // Parse turn-by-turn steps
        const steps = [];
        if (route.legs && route.legs[0] && Array.isArray(route.legs[0].steps)) {
          route.legs[0].steps.forEach((step, idx) => {
            const stepDist = Math.round(step.distance);
            const maneuver = step.maneuver || {};
            let instruction = step.name ? `Proceed onto ${step.name}` : 'Continue on current route';

            if (maneuver.type === 'depart') {
              instruction = step.name ? `Head toward ${step.name}` : 'Head out toward destination';
            } else if (maneuver.type === 'arrive') {
              instruction = 'You will arrive at your destination';
            } else if (maneuver.modifier) {
              const mod = maneuver.modifier.replace(/_/g, ' ');
              instruction = step.name ? `Turn ${mod} onto ${step.name}` : `Turn ${mod}`;
            }

            steps.push({
              index: idx + 1,
              instruction,
              distanceMeters: stepDist,
              distanceFormatted: stepDist > 1000 ? `${(stepDist / 1000).toFixed(1)} km` : `${stepDist} m`,
              durationSec: Math.round(step.duration),
              type: maneuver.type,
              modifier: maneuver.modifier
            });
          });
        }

        return {
          success: true,
          distanceKm,
          distanceFormatted: `${distanceKm} km`,
          durationMin,
          durationFormatted: formatDuration(durationMin),
          eta: calculateEta(durationMin),
          summary: route.legs?.[0]?.summary || 'Fastest Arterial Route',
          coordinates,
          steps
        };
      }
    }
  } catch (err) {
    console.warn('[NavigationService] OSRM route fetch error:', err);
  }

  // Fallback: Straight line interpolation if OSRM is unreachable
  const directDistKm = calculateDistanceKm(sLat, sLon, eLat, eLon);
  const estimatedMin = Math.round((directDistKm / 40) * 60); // estimate at 40 km/h city avg

  return {
    success: true,
    isFallback: true,
    distanceKm: directDistKm,
    distanceFormatted: `${directDistKm} km (Direct)`,
    durationMin: estimatedMin,
    durationFormatted: formatDuration(estimatedMin),
    eta: calculateEta(estimatedMin),
    summary: 'Direct Vector Route',
    coordinates: [
      [sLat, sLon],
      [eLat, eLon]
    ],
    steps: [
      {
        index: 1,
        instruction: 'Proceed along direct trajectory towards target',
        distanceFormatted: `${directDistKm} km`,
        durationSec: estimatedMin * 60
      },
      {
        index: 2,
        instruction: 'Arrive at destination',
        distanceFormatted: '0 m',
        durationSec: 0
      }
    ]
  };
};

/**
 * Generates external map sharing link
 */
export const generateShareLocationUrl = (lat, lon, label = 'Location') => {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
};
