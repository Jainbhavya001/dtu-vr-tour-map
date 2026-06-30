/* ── config.js ─────────────────────────────────────────────────────
   Global constants for the DTU Virtual Tour application.
   All numeric values use metric units (metres, seconds).
────────────────────────────────────────────────────────────────────── */
const CONFIG = Object.freeze({

  // ── Map ──────────────────────────────────────────────────────────
  MAP_CENTER: [28.7499, 77.1182],   // DTU Main Gate (lat, lng)
  MAP_ZOOM_DEFAULT:  18,
  MAP_ZOOM_MIN:      15,
  MAP_ZOOM_MAX:      21,

  // ── Node generation ───────────────────────────────────────────────
  NODE_SPACING_M:    4,       // metres between consecutive navigation nodes
  NODE_MERGE_RADIUS: 3,       // nodes closer than this (m) are deduplicated

  // ── Tile layers ───────────────────────────────────────────────────
  // Default: Esri World Imagery satellite (free, no API key required)
  TILE_SATELLITE: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics',
    maxZoom: 21,
    maxNativeZoom: 19,
  },
  // Satellite + road labels overlay
  TILE_SATELLITE_LABELS: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    attribution: '',
    maxZoom: 21,
    maxNativeZoom: 19,
    opacity: 0.7,
  },
  // Street map fallback
  TILE_OSM: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 21,
    maxNativeZoom: 19,
  },

  // ── Map rendering ─────────────────────────────────────────────────
  NODE_RADIUS_PX:         4,    // px — rendered circle radius for nav nodes
  NODE_RADIUS_ACTIVE_PX:  8,    // px — active (current) node radius
  NODE_COLOR:            '#4FC3F7',
  NODE_COLOR_ACTIVE:     '#FF6B35',
  NODE_OPACITY:           0.7,
  PATH_COLOR:            '#FFD700',
  PATH_WEIGHT:            3,

  // ── Tour / animation ──────────────────────────────────────────────
  WALK_STEP_INTERVAL_MS:  400,  // ms between node steps during "Walk Path"
  AUTO_TOUR_DWELL_MS:    3000,  // ms to dwell at each POI during auto-tour

  // ── Search ────────────────────────────────────────────────────────
  SEARCH_MAX_RESULTS: 8,

  // ── LocalStorage keys ─────────────────────────────────────────────
  LS_BING_KEY: 'dtu_tour_bing_key',
});
