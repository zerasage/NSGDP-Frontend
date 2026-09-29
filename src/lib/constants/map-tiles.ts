/**
 * Single source of truth for the Leaflet tile layer, used by all 5 map
 * pages/components. Falls back to OSM's free "Tile Usage Policy" server
 * (not meant for production traffic — no SLA, aggressive per-IP/UA rate
 * limiting, can block non-compliant consumers without notice) until
 * NEXT_PUBLIC_MAPTILER_KEY is set, at which point it switches to MapTiler's
 * CDN-backed tiles automatically — no code change needed once a key exists.
 * Get a free-tier key at https://www.maptiler.com/.
 */

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;

export const TILE_LAYER_URL = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
  : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export const TILE_LAYER_ATTRIBUTION = MAPTILER_KEY
  ? '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
