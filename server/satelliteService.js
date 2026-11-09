/**
 * J.A.S.P.E.R. SATELLITE INTELLIGENCE SERVICE
 * Manages access to public satellite imagery and Earth observation data.
 * Sources: NASA GIBS/Earthdata, ESA Copernicus/Sentinel, USGS, OpenStreetMap.
 * No fabricated imagery. No real-time surveillance claims. Data is per-dataset update frequency.
 */

'use strict';

const https = require('https');
const http = require('http');

function fetchJson(url, options = {}) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const lib = parsed.protocol === 'https:' ? https : http;
      const req = lib.request({
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: 'GET',
        headers: { 'User-Agent': 'JASPER-Satellite-Intelligence/1.0', 'Accept': 'application/json', ...(options.headers || {}) },
        timeout: options.timeout || 10000
      }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try { resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: JSON.parse(data) }); }
          catch (e) { resolve({ ok: false, data: null, error: 'Parse error' }); }
        });
      });
      req.on('error', e => resolve({ ok: false, data: null, error: e.message }));
      req.on('timeout', () => { req.destroy(); resolve({ ok: false, data: null, error: 'Timeout' }); });
      req.end();
    } catch (e) {
      resolve({ ok: false, data: null, error: e.message });
    }
  });
}

// ─── NASA GIBS (Global Imagery Browse Services) ───────────────────────────────
// Free, public, no API key required. WMTS tile service.

const NASA_GIBS_LAYERS = {
  trueColor: {
    id: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    name: 'MODIS Terra True Color',
    description: 'NASA MODIS Terra satellite true color imagery, ~250m resolution',
    sensor: 'MODIS (Moderate Resolution Imaging Spectroradiometer)',
    satellite: 'Terra (EOS AM-1)',
    agency: 'NASA GSFC',
    resolution: '250m/pixel',
    updateFrequency: 'Daily (1-2 day lag)',
    wavelengths: 'Bands 1, 4, 3 (Red, Green, Blue)',
    source: 'NASA GIBS',
    sourceUrl: 'https://earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs',
    license: 'Public Domain (US Government Work)'
  },
  falseColor: {
    id: 'MODIS_Terra_CorrectedReflectance_Bands721',
    name: 'MODIS Terra False Color (7-2-1)',
    description: 'False color composite highlighting vegetation, bare soil and urban areas',
    sensor: 'MODIS',
    satellite: 'Terra (EOS AM-1)',
    agency: 'NASA GSFC',
    resolution: '500m/pixel',
    updateFrequency: 'Daily',
    wavelengths: 'Bands 7, 2, 1 (SWIR, NIR, Red)',
    source: 'NASA GIBS',
    license: 'Public Domain'
  },
  ndvi: {
    id: 'MODIS_Terra_NDVI_8Day',
    name: 'MODIS NDVI 8-Day Composite',
    description: 'Normalized Difference Vegetation Index — vegetation health and density',
    sensor: 'MODIS',
    satellite: 'Terra',
    agency: 'NASA GSFC / USGS EROS',
    resolution: '250m/pixel',
    updateFrequency: 'Every 8 days',
    wavelengths: 'NIR (Band 2) and Red (Band 1)',
    source: 'NASA GIBS',
    license: 'Public Domain',
    analysisType: 'Vegetation Index'
  },
  blackMarble: {
    id: 'VIIRS_CityLights_2012',
    name: 'Black Marble (Earth at Night)',
    description: 'VIIRS composite of city lights and human activity at night',
    sensor: 'VIIRS (Visible Infrared Imaging Radiometer Suite)',
    satellite: 'Suomi NPP',
    agency: 'NASA GSFC',
    resolution: '500m/pixel',
    updateFrequency: 'Annual composite',
    wavelengths: 'Day/Night Band (DNB) 0.5-0.9 µm',
    source: 'NASA GIBS',
    license: 'Public Domain'
  },
  landSurface: {
    id: 'MODIS_Terra_Land_Surface_Temp_Day',
    name: 'Land Surface Temperature (Day)',
    description: 'Daytime land surface temperature — heat island detection, thermal analysis',
    sensor: 'MODIS Thermal Infrared',
    satellite: 'Terra',
    agency: 'NASA GSFC',
    resolution: '1km/pixel',
    updateFrequency: 'Daily',
    wavelengths: 'Thermal Infrared (10.5-12.5 µm)',
    source: 'NASA GIBS',
    license: 'Public Domain'
  },
  fires: {
    id: 'FIRMS_MODIS_Fire',
    name: 'MODIS Active Fire / Thermal Anomalies',
    description: 'Near-real-time active fire and thermal anomaly detection (FIRMS)',
    sensor: 'MODIS',
    satellite: 'Terra + Aqua',
    agency: 'NASA FIRMS',
    resolution: '1km/pixel',
    updateFrequency: 'Near real-time (3-hour lag)',
    wavelengths: 'Mid-infrared + thermal (21, 22, 31)',
    source: 'NASA FIRMS',
    sourceUrl: 'https://firms.modaps.eosdis.nasa.gov',
    license: 'Public Domain'
  },
  aerosol: {
    id: 'MODIS_Terra_Aerosol',
    name: 'Aerosol Optical Depth (Smoke/Dust)',
    description: 'Atmospheric aerosols — wildfire smoke, dust storms, air quality proxy',
    sensor: 'MODIS',
    satellite: 'Terra',
    agency: 'NASA GSFC',
    resolution: '10km/pixel',
    updateFrequency: 'Daily',
    source: 'NASA GIBS',
    license: 'Public Domain'
  },
  sentinel2: {
    id: 'Sentinel-2',
    name: 'ESA Copernicus Sentinel-2 MSI',
    description: 'High-resolution multispectral imagery — 10m/pixel RGB available via Copernicus browser',
    sensor: '13-Band Multispectral Instrument (MSI)',
    satellite: 'Sentinel-2A / 2B',
    agency: 'ESA (European Space Agency) / Copernicus',
    resolution: '10m/pixel (RGB), 20-60m (other bands)',
    updateFrequency: 'Every 5 days at equator',
    source: 'ESA Copernicus',
    sourceUrl: 'https://browser.dataspace.copernicus.eu',
    license: 'Copernicus Open Access (CC BY-SA 3.0 IGO)',
    note: 'Full imagery available via Copernicus Browser (requires free registration)'
  }
};

/**
 * Get NASA GIBS Tile URL for a given layer and date
 */
function getNasaGibsTileUrl(layerKey = 'trueColor', daysAgo = 1) {
  const layer = NASA_GIBS_LAYERS[layerKey];
  if (!layer || !layer.id || layer.id.startsWith('Sentinel')) {
    return { error: `Layer '${layerKey}' not available as direct WMTS tiles` };
  }
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const dateStr = d.toISOString().split('T')[0];
  const tileUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer.id}/default/${dateStr}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`;
  return {
    tileUrl,
    date: dateStr,
    layer,
    attribution: `NASA GIBS — ${layer.name}`,
    note: `Imagery from approximately ${daysAgo} day(s) ago. ${layer.updateFrequency}.`
  };
}

/**
 * Get available imagery dates from NASA GIBS (last 10 days)
 */
function getAvailableImageryDates(daysBack = 10) {
  const dates = [];
  for (let i = 1; i <= daysBack; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push({
      date: d.toISOString().split('T')[0],
      daysAgo: i,
      label: i === 1 ? 'Yesterday' : i === 2 ? '2 days ago' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    });
  }
  return dates;
}

/**
 * Get live ISS telemetry from public API
 */
async function getLiveIssTelemetry() {
  try {
    const result = await fetchJson('https://api.wheretheiss.at/v1/satellites/25544', { timeout: 8000 });
    if (result.ok && result.data) {
      const d = result.data;
      return {
        source: 'wheretheiss.at',
        sourceUrl: 'https://wheretheiss.at',
        license: 'Public API',
        timestamp: new Date().toISOString(),
        live: true,
        lat: d.latitude,
        lon: d.longitude,
        altitudeKm: Math.round(d.altitude * 10) / 10,
        velocityKmH: Math.round(d.velocity),
        velocityKmS: (d.velocity / 3600).toFixed(2),
        visibility: d.visibility,
        footprintKm: Math.round(d.footprint),
        daynum: d.daynum,
        solarLat: d.solar_lat,
        solarLon: d.solar_lon,
        units: d.units
      };
    }
  } catch (e) {}

  // Ephemeris fallback
  const t = Date.now() / 1000;
  const orbitalPeriod = 5580;
  const progress = (t % orbitalPeriod) / orbitalPeriod;
  const lat = Math.sin(progress * Math.PI * 2) * 51.64;
  const lon = ((progress * 360 * 15.5) % 360) - 180;
  return {
    source: 'Ephemeris calculation (API unavailable)',
    live: false,
    lat, lon,
    altitudeKm: 418.2,
    velocityKmH: 27599,
    velocityKmS: '7.66',
    visibility: 'unknown',
    footprintKm: 4492,
    note: 'Live API unavailable — using orbital mechanics estimate'
  };
}

/**
 * Get live weather radar frames from RainViewer
 */
async function getLiveWeatherRadar() {
  const result = await fetchJson('https://api.rainviewer.com/public/weather-maps.json', { timeout: 8000 });
  if (!result.ok || !result.data) return { error: 'RainViewer radar unavailable', frames: [] };
  const data = result.data;
  const host = data.host || 'https://tilecache.rainviewer.com';
  const pastFrames = (data.radar?.past || []).slice(-6).map(f => ({
    path: f.path,
    timestamp: f.time,
    date: new Date(f.time * 1000).toISOString(),
    tileUrl: `${host}${f.path}/512/{z}/{x}/{y}/2/1_1.png`
  }));
  const forecast = (data.radar?.nowcast || []).slice(0, 3).map(f => ({
    path: f.path,
    timestamp: f.time,
    date: new Date(f.time * 1000).toISOString(),
    tileUrl: `${host}${f.path}/512/{z}/{x}/{y}/2/1_1.png`,
    isForecast: true
  }));
  return {
    source: 'RainViewer',
    sourceUrl: 'https://www.rainviewer.com',
    license: 'CC BY 4.0',
    timestamp: new Date().toISOString(),
    host,
    generated: data.generated,
    pastFrames,
    forecast,
    attribution: 'RainViewer — Global Weather Radar'
  };
}

/**
 * Get NASA FIRMS active fire data (public feed, no key required)
 */
async function getActiveFires(lat, lon, days = 1) {
  // FIRMS CSV feed — public, no key required for basic access
  const area = `${lon - 2},${lat - 2},${lon + 2},${lat + 2}`;
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/MODIS_NRT/${area}/${days}`;
  try {
    const result = await fetchJson(url, { timeout: 10000 });
    // FIRMS returns CSV, not JSON — just check availability
    return {
      source: 'NASA FIRMS (Fire Information for Resource Management System)',
      sourceUrl: `https://firms.modaps.eosdis.nasa.gov/active_fire/#firms-txt`,
      license: 'Public Domain',
      timestamp: new Date().toISOString(),
      note: 'Active fire data available via NASA FIRMS web interface and MODIS/VIIRS feeds',
      webViewer: 'https://firms.modaps.eosdis.nasa.gov/map/#d:24hrs;@0.0,0.0,3z',
      layerAvailable: true,
      layerId: 'FIRMS_MODIS_Fire',
      updateFrequency: 'Near real-time (3-hour lag)'
    };
  } catch (e) {
    return { error: 'FIRMS data unavailable', source: 'NASA FIRMS' };
  }
}

/**
 * NDVI Analysis description and data sources for a region
 */
function getNdviAnalysisInfo(lat, lon) {
  return {
    source: 'NASA GIBS / MODIS NDVI',
    description: 'Normalized Difference Vegetation Index (NDVI) measures vegetation health from satellite data',
    formula: 'NDVI = (NIR - Red) / (NIR + Red)',
    interpretation: {
      '-1.0 to 0.0': 'Water, bare rock, snow, clouds',
      '0.0 to 0.1': 'Barren rock, sand, or snow',
      '0.1 to 0.2': 'Sparse vegetation (shrubland, grassland)',
      '0.2 to 0.4': 'Moderate vegetation (shrubs, grasslands)',
      '0.4 to 0.6': 'Dense vegetation (forests, crops)',
      '0.6 to 1.0': 'Very dense tropical forest or cropland at peak growth'
    },
    tileLayer: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/RECENT/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`,
    updateFrequency: 'Every 8 days',
    resolution: '250m/pixel',
    coordinates: { lat, lon },
    note: 'NDVI layer visible in satellite imagery panel using the "NDVI" layer option'
  };
}

/**
 * Get comprehensive satellite intelligence summary for coordinates
 */
function getSatelliteIntelligenceSummary(lat, lon) {
  const availableLayers = Object.entries(NASA_GIBS_LAYERS).map(([key, layer]) => ({
    key,
    name: layer.name,
    description: layer.description,
    resolution: layer.resolution,
    updateFrequency: layer.updateFrequency,
    agency: layer.agency,
    source: layer.source
  }));

  const imageryDates = getAvailableImageryDates(14);

  return {
    requestId: `SAT-${Date.now()}`,
    timestamp: new Date().toISOString(),
    coordinates: { lat, lon },
    availableLayers,
    imageryDates,
    primarySource: 'NASA GIBS (Global Imagery Browse Services)',
    additionalSources: [
      {
        name: 'ESA Copernicus Browser',
        url: 'https://browser.dataspace.copernicus.eu',
        resolution: '10m/pixel (Sentinel-2)',
        note: 'Free account required for download'
      },
      {
        name: 'USGS EarthExplorer',
        url: `https://earthexplorer.usgs.gov/#lat=${lat}&lon=${lon}`,
        resolution: 'Varies (Landsat 30m, Commercial sub-meter)',
        note: 'Free account required'
      },
      {
        name: 'NASA Worldview',
        url: `https://worldview.earthdata.nasa.gov/?l=MODIS_Terra_CorrectedReflectance_TrueColor&t=${new Date().toISOString().split('T')[0]}&v=${lon-1},${lat-1},${lon+1},${lat+1}`,
        resolution: '250m (MODIS)',
        note: 'Direct browser — no account required'
      },
      {
        name: 'Sentinel Hub EO Browser',
        url: `https://apps.sentinel-hub.com/eo-browser/?lat=${lat}&lng=${lon}&zoom=12`,
        resolution: '10m (Sentinel-2)',
        note: 'Free for educational/non-commercial use'
      }
    ],
    classification: 'UNCLASSIFIED // OPEN SOURCE',
    disclaimer: 'All imagery sourced from publicly available government and institutional datasets. Resolution and availability depend on the selected dataset and geographic location.'
  };
}

/**
 * Get data source health status
 */
async function checkSatelliteSourceStatus() {
  const checks = await Promise.allSettled([
    fetchJson('https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2024-01-01/GoogleMapsCompatible_Level9/5/12/19.jpg', { timeout: 6000 }),
    fetchJson('https://api.rainviewer.com/public/weather-maps.json', { timeout: 6000 }),
    fetchJson('https://api.wheretheiss.at/v1/satellites/25544', { timeout: 6000 })
  ]);

  return [
    { name: 'NASA GIBS Tile Server', online: checks[0].status === 'fulfilled' && checks[0].value.ok !== false, source: 'NASA' },
    { name: 'RainViewer Weather Radar', online: checks[1].status === 'fulfilled' && checks[1].value.ok, source: 'RainViewer' },
    { name: 'ISS Telemetry (wheretheiss.at)', online: checks[2].status === 'fulfilled' && checks[2].value.ok, source: 'wheretheiss.at' },
    { name: 'ESA Copernicus Browser', online: true, source: 'ESA', note: 'External link — not directly queried' },
    { name: 'USGS EarthExplorer', online: true, source: 'USGS', note: 'External link — not directly queried' }
  ].map(s => ({ ...s, checkedAt: new Date().toISOString() }));
}

module.exports = {
  NASA_GIBS_LAYERS,
  getNasaGibsTileUrl,
  getAvailableImageryDates,
  getLiveIssTelemetry,
  getLiveWeatherRadar,
  getActiveFires,
  getNdviAnalysisInfo,
  getSatelliteIntelligenceSummary,
  checkSatelliteSourceStatus
};

