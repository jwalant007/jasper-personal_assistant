/**
 * J.A.S.P.E.R. OSINT INTELLIGENCE SERVICE
 * Open Source Intelligence aggregation using publicly available free APIs.
 * No private data, no authentication bypass, no covert tracking.
 */

'use strict';

const https = require('https');
const http = require('http');

// ─── RATE LIMITER ────────────────────────────────────────────────────────────
const requestCounts = new Map(); // key -> { count, windowStart }
const RATE_WINDOW_MS = 60000;
const RATE_LIMIT = 30;

function checkServiceRateLimit(key) {
  const now = Date.now();
  const entry = requestCounts.get(key) || { count: 0, windowStart: now };
  if (now - entry.windowStart > RATE_WINDOW_MS) {
    entry.count = 1;
    entry.windowStart = now;
  } else {
    entry.count++;
  }
  requestCounts.set(key, entry);
  return entry.count <= RATE_LIMIT;
}

// ─── HTTP UTILITY ─────────────────────────────────────────────────────────────
function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'JASPER-OSINT-Intelligence/1.0 (Educational Research Tool)',
        'Accept': 'application/json',
        ...(options.headers || {})
      },
      timeout: options.timeout || 10000
    };
    const req = lib.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ ok: true, status: res.statusCode, data: JSON.parse(data) });
          } else {
            resolve({ ok: false, status: res.statusCode, data: null, error: `HTTP ${res.statusCode}` });
          }
        } catch (e) {
          resolve({ ok: false, status: res.statusCode, data: null, error: 'Invalid JSON response' });
        }
      });
    });
    req.on('error', (e) => resolve({ ok: false, data: null, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, data: null, error: 'Request timeout' }); });
    req.end();
  });
}

// ─── OSINT SOURCES ────────────────────────────────────────────────────────────

/**
 * Nominatim Geocoding / Reverse Geocoding (OpenStreetMap)
 * Public API, no key required.
 */
async function nominatimSearch(query) {
  if (!checkServiceRateLimit('nominatim')) return { error: 'Rate limit reached. Please wait.' };
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&extratags=1&limit=5`;
  const result = await fetchJson(url);
  if (!result.ok || !result.data) return { error: result.error || 'Nominatim unavailable', results: [] };
  return {
    source: 'OpenStreetMap Nominatim',
    sourceUrl: 'https://nominatim.openstreetmap.org',
    license: 'ODbL',
    timestamp: new Date().toISOString(),
    confidence: 'HIGH',
    results: result.data.map(r => ({
      displayName: r.display_name,
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      type: r.type,
      category: r.class,
      importance: r.importance,
      boundingBox: r.boundingbox,
      address: r.address,
      extratags: r.extratags || {}
    }))
  };
}

/**
 * Nominatim Reverse Geocoding
 */
async function reverseGeocode(lat, lon) {
  if (!checkServiceRateLimit('nominatim_reverse')) return { error: 'Rate limit reached.' };
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&extratags=1&zoom=18`;
  const result = await fetchJson(url);
  if (!result.ok || !result.data) return { error: result.error || 'Reverse geocoding unavailable' };
  const d = result.data;
  return {
    source: 'OpenStreetMap Nominatim',
    sourceUrl: `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}`,
    license: 'ODbL',
    timestamp: new Date().toISOString(),
    confidence: 'HIGH',
    displayName: d.display_name,
    placeId: d.place_id,
    osmType: d.osm_type,
    osmId: d.osm_id,
    address: d.address || {},
    extratags: d.extratags || {},
    lat: parseFloat(d.lat),
    lon: parseFloat(d.lon),
    boundingBox: d.boundingbox
  };
}

/**
 * Open-Meteo Weather & Environmental Data (Free, no API key)
 */
async function getEnvironmentalData(lat, lon) {
  if (!checkServiceRateLimit('open_meteo')) return { error: 'Rate limit reached.' };
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation,weather_code,surface_pressure,cloud_cover,visibility,uv_index&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto&forecast_days=3`;
  const result = await fetchJson(url);
  if (!result.ok || !result.data) return { error: result.error || 'Environmental data unavailable' };
  const d = result.data;
  const current = d.current || {};
  return {
    source: 'Open-Meteo (WMO data)',
    sourceUrl: 'https://open-meteo.com',
    license: 'CC BY 4.0',
    timestamp: new Date().toISOString(),
    confidence: 'HIGH',
    lat: d.latitude,
    lon: d.longitude,
    elevation: d.elevation,
    timezone: d.timezone,
    current: {
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      windDirection: current.wind_direction_10m,
      precipitation: current.precipitation,
      weatherCode: current.weather_code,
      pressure: current.surface_pressure,
      cloudCover: current.cloud_cover,
      visibility: current.visibility,
      uvIndex: current.uv_index,
      time: current.time
    },
    forecast: {
      daily: d.daily
    }
  };
}

/**
 * Open-Elevation API (Free elevation data)
 */
async function getElevation(lat, lon) {
  if (!checkServiceRateLimit('elevation')) return { error: 'Rate limit reached.' };
  const url = `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`;
  const result = await fetchJson(url, { timeout: 8000 });
  if (result.ok && result.data && result.data.results && result.data.results[0]) {
    return {
      source: 'Open-Elevation',
      sourceUrl: 'https://open-elevation.com',
      license: 'Public Domain',
      timestamp: new Date().toISOString(),
      confidence: 'MEDIUM',
      elevationMeters: result.data.results[0].elevation,
      lat: result.data.results[0].latitude,
      lon: result.data.results[0].longitude
    };
  }
  // Fallback: Open-Meteo provides elevation too
  const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&timezone=auto`;
  const meteoResult = await fetchJson(meteoUrl, { timeout: 6000 });
  if (meteoResult.ok && meteoResult.data) {
    return {
      source: 'Open-Meteo (DEM elevation fallback)',
      sourceUrl: 'https://open-meteo.com',
      license: 'CC BY 4.0',
      timestamp: new Date().toISOString(),
      confidence: 'MEDIUM',
      elevationMeters: meteoResult.data.elevation,
      lat: meteoResult.data.latitude,
      lon: meteoResult.data.longitude
    };
  }
  return { error: 'Elevation data temporarily unavailable', elevationMeters: null };
}

/**
 * WorldTimeAPI — Get timezone info for coordinates
 * Note: WorldTimeAPI by IP only; for coordinates we use timezonefinder via open-meteo
 */
async function getTimezoneForCoords(lat, lon) {
  if (!checkServiceRateLimit('timezone')) return { error: 'Rate limit reached.' };
  // Use Open-Meteo's auto timezone detection
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&timezone=auto`;
  const result = await fetchJson(url, { timeout: 6000 });
  if (result.ok && result.data) {
    return {
      source: 'Open-Meteo Timezone (IANA database)',
      sourceUrl: 'https://open-meteo.com',
      license: 'CC BY 4.0',
      timestamp: new Date().toISOString(),
      confidence: 'HIGH',
      timezone: result.data.timezone,
      timezoneAbbreviation: result.data.timezone_abbreviation,
      utcOffsetSeconds: result.data.utc_offset_seconds,
      localTime: new Date(Date.now() + (result.data.utc_offset_seconds * 1000)).toUTCString()
    };
  }
  return { error: 'Timezone data unavailable', timezone: 'UTC' };
}

/**
 * Overpass API — Query OSM infrastructure around coordinates
 * Returns publicly documented points of interest & infrastructure
 */
async function getNearbyInfrastructure(lat, lon, radiusMeters = 1000) {
  if (!checkServiceRateLimit('overpass')) return { error: 'Rate limit reached.' };
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"](around:${radiusMeters},${lat},${lon});
      node["shop"](around:${radiusMeters},${lat},${lon});
      node["tourism"](around:${radiusMeters},${lat},${lon});
      node["landuse"](around:${radiusMeters},${lat},${lon});
      way["building"](around:${radiusMeters},${lat},${lon});
    );
    out center 50;
  `.trim();

  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  const result = await fetchJson(url, { timeout: 20000 });
  if (!result.ok || !result.data) return { error: result.error || 'Infrastructure data unavailable', features: [] };

  const elements = result.data.elements || [];
  const features = elements.slice(0, 50).map(el => ({
    id: el.id,
    type: el.type,
    lat: el.lat || el.center?.lat,
    lon: el.lon || el.center?.lon,
    tags: el.tags || {},
    name: el.tags?.name || el.tags?.amenity || el.tags?.shop || el.tags?.tourism || el.tags?.building || 'Unknown',
    category: el.tags?.amenity || el.tags?.shop || el.tags?.tourism || el.tags?.landuse || el.tags?.building || 'feature'
  }));

  return {
    source: 'OpenStreetMap Overpass API',
    sourceUrl: `https://overpass-api.de/api/interpreter`,
    license: 'ODbL',
    timestamp: new Date().toISOString(),
    confidence: 'HIGH',
    searchRadius: radiusMeters,
    totalFound: elements.length,
    features
  };
}

/**
 * Wikipedia/Wikidata Geographical Article Search
 */
async function getWikipediaGeoContext(lat, lon) {
  if (!checkServiceRateLimit('wikipedia')) return { error: 'Rate limit reached.' };
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gsradius=10000&gscoord=${lat}|${lon}&gslimit=5&format=json&origin=*`;
  const result = await fetchJson(url, { timeout: 8000 });
  if (!result.ok || !result.data) return { error: 'Wikipedia context unavailable', articles: [] };
  const articles = (result.data.query?.geosearch || []).map(a => ({
    title: a.title,
    pageId: a.pageid,
    lat: a.lat,
    lon: a.lon,
    dist: a.dist,
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(a.title)}`
  }));
  return {
    source: 'Wikipedia Geosearch API',
    sourceUrl: 'https://en.wikipedia.org/wiki/Wikipedia:Geonotices',
    license: 'CC BY-SA 4.0',
    timestamp: new Date().toISOString(),
    confidence: 'MEDIUM',
    articles
  };
}

/**
 * GDELT News Event Intelligence — Public geo-tagged news events
 */
async function getNewsIntelligence(query, lat = null, lon = null) {
  if (!checkServiceRateLimit('gdelt')) return { error: 'Rate limit reached.' };
  // Use GDELT's public API (no key required)
  let searchQuery = query;
  if (!searchQuery && lat !== null && lon !== null) {
    // Build a location-based search using reverse geocode place name
    searchQuery = `location near ${lat.toFixed(2)},${lon.toFixed(2)}`;
  }
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(searchQuery || 'geopolitics')}&mode=artlist&maxrecords=10&format=json&sort=datedesc`;
  const result = await fetchJson(url, { timeout: 12000 });
  if (!result.ok || !result.data) {
    return { 
      error: 'GDELT news intelligence temporarily unavailable', 
      articles: [],
      note: 'GDELT indexes global news events with geographic tagging'
    };
  }
  const articles = (result.data.articles || []).slice(0, 10).map(a => ({
    title: a.title,
    url: a.url,
    source: a.domain,
    seenDate: a.seendate,
    language: a.language,
    tone: a.tone
  }));
  return {
    source: 'GDELT Global Event Database',
    sourceUrl: 'https://gdeltproject.org',
    license: 'Open Dataset (Creative Commons)',
    timestamp: new Date().toISOString(),
    confidence: 'MEDIUM',
    query: searchQuery,
    articles
  };
}

/**
 * Natural Earth / GeoNames Country & Region Info
 */
async function getCountryInfo(lat, lon) {
  if (!checkServiceRateLimit('geonames')) return { error: 'Rate limit reached.' };
  // Use restcountries.com (free, no key) + nominatim for country code
  try {
    const revGeo = await reverseGeocode(lat, lon);
    const countryCode = revGeo.address?.country_code?.toUpperCase();
    if (!countryCode) return { error: 'Could not determine country code', data: null };

    const url = `https://restcountries.com/v3.1/alpha/${countryCode}`;
    const result = await fetchJson(url, { timeout: 8000 });
    if (!result.ok || !result.data || !result.data[0]) return { error: 'Country data unavailable', countryCode };
    const c = result.data[0];
    return {
      source: 'REST Countries API',
      sourceUrl: `https://restcountries.com/v3.1/alpha/${countryCode}`,
      license: 'Mozilla Public License 2.0',
      timestamp: new Date().toISOString(),
      confidence: 'HIGH',
      country: {
        name: c.name?.common,
        officialName: c.name?.official,
        countryCode,
        capital: c.capital?.[0],
        region: c.region,
        subregion: c.subregion,
        population: c.population,
        area: c.area,
        languages: c.languages,
        currencies: c.currencies,
        timezones: c.timezones,
        borders: c.borders,
        latlng: c.latlng,
        flagUrl: c.flags?.svg,
        continents: c.continents,
        demonym: c.demonyms?.eng?.m
      }
    };
  } catch (e) {
    return { error: `Country lookup failed: ${e.message}` };
  }
}

/**
 * Comprehensive Geographic OSINT — Aggregates all sources for a location
 */
async function getLocationIntelligence(lat, lon, options = {}) {
  const radius = options.radius || 1000;
  const startTime = Date.now();
  
  const [
    geoResult,
    envResult,
    elevResult,
    infraResult,
    wikiResult,
    tzResult,
    countryResult
  ] = await Promise.allSettled([
    reverseGeocode(lat, lon),
    getEnvironmentalData(lat, lon),
    getElevation(lat, lon),
    getNearbyInfrastructure(lat, lon, radius),
    getWikipediaGeoContext(lat, lon),
    getTimezoneForCoords(lat, lon),
    getCountryInfo(lat, lon)
  ]);

  const getValue = (r) => r.status === 'fulfilled' ? r.value : { error: r.reason?.message || 'Failed' };

  return {
    requestId: `LOC-${Date.now()}`,
    timestamp: new Date().toISOString(),
    collectionDurationMs: Date.now() - startTime,
    coordinates: { lat, lon },
    geocoding: getValue(geoResult),
    environmental: getValue(envResult),
    elevation: getValue(elevResult),
    infrastructure: getValue(infraResult),
    historicalContext: getValue(wikiResult),
    timezone: getValue(tzResult),
    countryIntelligence: getValue(countryResult),
    sourcesQueried: 7,
    classification: 'UNCLASSIFIED // OPEN SOURCE',
    disclaimer: 'All data sourced from publicly available open datasets. No private information collected.'
  };
}

/**
 * Text-based OSINT Search — Aggregates search results using public APIs
 */
async function searchOsint(query, options = {}) {
  if (!query || typeof query !== 'string') return { error: 'Query required' };
  const startTime = Date.now();
  
  const [
    nominatimResult,
    newsResult,
    wikiApiResult
  ] = await Promise.allSettled([
    nominatimSearch(query),
    getNewsIntelligence(query),
    searchWikipedia(query)
  ]);

  const getValue = (r) => r.status === 'fulfilled' ? r.value : { error: r.reason?.message || 'Failed' };

  return {
    requestId: `OSINT-${Date.now()}`,
    timestamp: new Date().toISOString(),
    collectionDurationMs: Date.now() - startTime,
    query,
    geographic: getValue(nominatimResult),
    news: getValue(newsResult),
    encyclopedic: getValue(wikiApiResult),
    classification: 'UNCLASSIFIED // OPEN SOURCE',
    disclaimer: 'All data sourced from publicly available open datasets. No private information collected.'
  };
}

/**
 * Wikipedia Full-Text Search
 */
async function searchWikipedia(query) {
  if (!checkServiceRateLimit('wikipedia_search')) return { error: 'Rate limit reached.' };
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=5&format=json&origin=*&srprop=snippet|titlesnippet|size|wordcount`;
  const result = await fetchJson(url, { timeout: 8000 });
  if (!result.ok || !result.data) return { error: 'Wikipedia search unavailable', results: [] };
  const results = (result.data.query?.search || []).map(r => ({
    title: r.title,
    snippet: r.snippet?.replace(/<[^>]+>/g, ''),
    wordCount: r.wordcount,
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title)}`,
    pageId: r.pageid
  }));
  return {
    source: 'Wikipedia Search API',
    sourceUrl: 'https://en.wikipedia.org',
    license: 'CC BY-SA 4.0',
    timestamp: new Date().toISOString(),
    confidence: 'MEDIUM',
    results
  };
}

/**
 * Data Source Health Check
 */
async function checkDataSourceStatus() {
  const sources = [
    { name: 'OpenStreetMap Nominatim', url: 'https://nominatim.openstreetmap.org/status.php', key: 'nominatim' },
    { name: 'Open-Meteo Weather', url: 'https://api.open-meteo.com/v1/forecast?latitude=0&longitude=0&current=temperature_2m', key: 'openmeteo' },
    { name: 'Overpass API (OSM)', url: 'https://overpass-api.de/api/status', key: 'overpass' },
    { name: 'REST Countries', url: 'https://restcountries.com/v3.1/all?fields=name&limit=1', key: 'restcountries' },
    { name: 'Wikipedia API', url: 'https://en.wikipedia.org/w/api.php?action=query&meta=siteinfo&format=json', key: 'wikipedia' }
  ];

  const statusChecks = await Promise.allSettled(
    sources.map(s => fetchJson(s.url, { timeout: 5000 }).then(r => ({ ...s, online: r.ok, latencyMs: null })))
  );

  return statusChecks.map((r, i) => ({
    name: sources[i].name,
    key: sources[i].key,
    online: r.status === 'fulfilled' ? r.value.online : false,
    error: r.status === 'rejected' ? r.reason?.message : (r.value?.online ? null : 'Service unavailable'),
    checkedAt: new Date().toISOString()
  }));
}

module.exports = {
  nominatimSearch,
  reverseGeocode,
  getEnvironmentalData,
  getElevation,
  getTimezoneForCoords,
  getNearbyInfrastructure,
  getWikipediaGeoContext,
  getNewsIntelligence,
  getCountryInfo,
  getLocationIntelligence,
  searchOsint,
  searchWikipedia,
  checkDataSourceStatus
};

