/**
 * J.A.S.P.E.R. INTELLIGENCE REPORT SERVICE
 * Generates structured intelligence reports in JSON and downloadable formats.
 * Uses only openly collected data. Clearly marks all source origins.
 */

'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');

// In-memory report store (persisted to disk if available)
const REPORTS_DIR = path.join(__dirname, 'data', 'intelligence_reports');
const MAX_REPORTS = 50;

function ensureReportsDir() {
  try {
    if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Generate a structured intelligence report
 */
function generateReport(params) {
  const {
    title,
    investigationType = 'geographic',
    coordinates = null,
    locationName = null,
    findings = {},
    analystNotes = '',
    requestedBy = 'JASPER AI',
    classification = 'UNCLASSIFIED // OPEN SOURCE'
  } = params;

  const reportId = `REP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const timestamp = new Date().toISOString();

  const report = {
    reportId,
    metadata: {
      title: title || `Geographic Intelligence Report — ${timestamp}`,
      classification,
      investigationType,
      createdAt: timestamp,
      collectionPeriod: 'Single session',
      requestedBy,
      generatedBy: 'J.A.S.P.E.R. Intelligence Module v1.0',
      disclaimer: [
        'This report contains exclusively open-source, publicly available information.',
        'All data sources are clearly identified and cited.',
        'No private personal information was collected.',
        'No authentication systems were bypassed.',
        'No restricted datasets were accessed.',
        'Confidence levels indicate data quality, not certainty of conclusions.',
        'Analytical interpretations are marked separately from verified facts.'
      ]
    },
    subject: {
      coordinates,
      locationName,
      investigationType
    },
    findings: {
      geocoding: findingWithMetadata(findings.geocoding, 'Reverse Geocoding (OSM Nominatim)', 'VERIFIED_FACT'),
      environmental: findingWithMetadata(findings.environmental, 'Open-Meteo Weather Data', 'VERIFIED_FACT'),
      elevation: findingWithMetadata(findings.elevation, 'Open-Elevation / Open-Meteo DEM', 'VERIFIED_FACT'),
      infrastructure: findingWithMetadata(findings.infrastructure, 'OpenStreetMap Overpass API', 'VERIFIED_FACT'),
      timezone: findingWithMetadata(findings.timezone, 'Open-Meteo Timezone (IANA DB)', 'VERIFIED_FACT'),
      countryIntelligence: findingWithMetadata(findings.countryIntelligence, 'REST Countries API', 'VERIFIED_FACT'),
      historicalContext: findingWithMetadata(findings.historicalContext, 'Wikipedia Geosearch', 'ENCYCLOPEDIC'),
      satellite: findingWithMetadata(findings.satellite, 'NASA GIBS / ESA Copernicus', 'ANALYTICAL'),
      osint: findingWithMetadata(findings.osint, 'Open-source aggregation', 'ANALYTICAL')
    },
    analystNotes: analystNotes ? {
      content: analystNotes,
      type: 'ANALYST_INTERPRETATION',
      disclaimer: 'Analyst interpretations may contain uncertainty. Treat accordingly.'
    } : null,
    sources: [
      { name: 'OpenStreetMap Nominatim', url: 'https://nominatim.openstreetmap.org', license: 'ODbL' },
      { name: 'Open-Meteo', url: 'https://open-meteo.com', license: 'CC BY 4.0' },
      { name: 'OpenStreetMap Overpass', url: 'https://overpass-api.de', license: 'ODbL' },
      { name: 'REST Countries', url: 'https://restcountries.com', license: 'MPL 2.0' },
      { name: 'Wikipedia', url: 'https://wikipedia.org', license: 'CC BY-SA 4.0' },
      { name: 'NASA GIBS', url: 'https://earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs', license: 'Public Domain' },
      { name: 'ESA Copernicus', url: 'https://copernicus.eu', license: 'Copernicus Open Access' }
    ],
    confidence: {
      overall: calculateOverallConfidence(findings),
      breakdown: {
        geocoding: findings.geocoding && !findings.geocoding.error ? 'HIGH' : 'UNAVAILABLE',
        environmental: findings.environmental && !findings.environmental.error ? 'HIGH' : 'UNAVAILABLE',
        infrastructure: findings.infrastructure && !findings.infrastructure.error ? 'HIGH' : 'UNAVAILABLE',
        historicalContext: findings.historicalContext && !findings.historicalContext.error ? 'MEDIUM' : 'UNAVAILABLE'
      }
    },
    limitations: [
      'Open-source data may have collection lag (satellite imagery typically 1-3 days)',
      'Infrastructure data reflects OSM contributor coverage — rural areas may be incomplete',
      'Environmental data is forecast-based and subject to meteorological uncertainty',
      'Historical Wikipedia context reflects editorial coverage, not comprehensive history'
    ]
  };

  // Save to disk
  try {
    ensureReportsDir();
    const reportPath = path.join(REPORTS_DIR, `${reportId}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

    // Prune old reports if over MAX_REPORTS
    const files = fs.readdirSync(REPORTS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => ({ name: f, time: fs.statSync(path.join(REPORTS_DIR, f)).mtimeMs }))
      .sort((a, b) => a.time - b.time);
    
    if (files.length > MAX_REPORTS) {
      files.slice(0, files.length - MAX_REPORTS).forEach(f => {
        try { fs.unlinkSync(path.join(REPORTS_DIR, f.name)); } catch (_) {}
      });
    }
  } catch (e) {
    // Disk save failed — in-memory only (non-critical)
  }

  return report;
}

function findingWithMetadata(data, source, type) {
  if (!data) return null;
  return {
    data,
    sourceSystem: source,
    findingType: type,
    typeLegend: {
      VERIFIED_FACT: 'Directly retrieved from authoritative public data source',
      ENCYCLOPEDIC: 'Sourced from collaborative encyclopedia — verify independently',
      ANALYTICAL: 'Derived or interpreted from raw data — treat as analysis'
    }[type]
  };
}

function calculateOverallConfidence(findings) {
  const sources = Object.values(findings).filter(Boolean);
  const total = sources.length;
  if (total === 0) return 'INSUFFICIENT_DATA';
  const available = sources.filter(s => !s.error).length;
  const ratio = available / total;
  if (ratio >= 0.8) return 'HIGH';
  if (ratio >= 0.5) return 'MEDIUM';
  return 'LOW';
}

/**
 * List saved reports
 */
function listReports() {
  try {
    ensureReportsDir();
    const files = fs.readdirSync(REPORTS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          const content = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, f), 'utf8'));
          return {
            reportId: content.reportId,
            title: content.metadata?.title,
            createdAt: content.metadata?.createdAt,
            investigationType: content.metadata?.investigationType,
            confidence: content.confidence?.overall,
            locationName: content.subject?.locationName,
            coordinates: content.subject?.coordinates
          };
        } catch (_) { return null; }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return { success: true, reports: files, total: files.length };
  } catch (e) {
    return { success: false, reports: [], error: e.message };
  }
}

/**
 * Get a specific report by ID
 */
function getReport(reportId) {
  try {
    ensureReportsDir();
    const safeId = String(reportId).replace(/[^A-Za-z0-9\-]/g, '');
    const reportPath = path.join(REPORTS_DIR, `${safeId}.json`);
    if (!reportPath.startsWith(REPORTS_DIR)) return { error: 'Invalid report ID' };
    if (!fs.existsSync(reportPath)) return { error: 'Report not found' };
    const content = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    return { success: true, report: content };
  } catch (e) {
    return { error: `Could not retrieve report: ${e.message}` };
  }
}

/**
 * Delete a report
 */
function deleteReport(reportId) {
  try {
    ensureReportsDir();
    const safeId = String(reportId).replace(/[^A-Za-z0-9\-]/g, '');
    const reportPath = path.join(REPORTS_DIR, `${safeId}.json`);
    if (!reportPath.startsWith(REPORTS_DIR)) return { error: 'Invalid report ID' };
    if (fs.existsSync(reportPath)) fs.unlinkSync(reportPath);
    return { success: true };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Generate a human-readable text summary of a report
 */
function formatReportSummary(report) {
  if (!report) return 'No report data available.';
  const lines = [];
  lines.push(`═══════════════════════════════════════════════════════════`);
  lines.push(`  J.A.S.P.E.R. INTELLIGENCE REPORT`);
  lines.push(`  ${report.metadata?.classification}`);
  lines.push(`═══════════════════════════════════════════════════════════`);
  lines.push(`  Report ID:  ${report.reportId}`);
  lines.push(`  Title:      ${report.metadata?.title}`);
  lines.push(`  Generated:  ${report.metadata?.createdAt}`);
  lines.push(`  Confidence: ${report.confidence?.overall}`);
  lines.push(``);

  if (report.subject?.coordinates) {
    const c = report.subject.coordinates;
    lines.push(`  COORDINATES: ${c.lat?.toFixed(6)}°, ${c.lon?.toFixed(6)}°`);
  }
  if (report.subject?.locationName) {
    lines.push(`  LOCATION: ${report.subject.locationName}`);
  }

  lines.push(`\n  DISCLAIMER:`);
  (report.metadata?.disclaimer || []).forEach(d => lines.push(`  • ${d}`));

  lines.push(`\n  DATA SOURCES:`);
  (report.sources || []).forEach(s => lines.push(`  • ${s.name} (${s.license})`));

  lines.push(`\n  LIMITATIONS:`);
  (report.limitations || []).forEach(l => lines.push(`  • ${l}`));

  lines.push(`═══════════════════════════════════════════════════════════`);
  return lines.join('\n');
}

module.exports = {
  generateReport,
  listReports,
  getReport,
  deleteReport,
  formatReportSummary
};

