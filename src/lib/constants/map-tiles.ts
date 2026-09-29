/**
 * Single source of truth for the Leaflet tile layer, used by all 5 map
 * pages/components.
 *
 * Architecture decision: stays on OSM's free "Tile Usage Policy" server —
 * no paid tile CDN. The tradeoff (no SLA, can rate-limit or block
 * non-compliant consumers without notice) is accepted; TILE_LAYER_OPTIONS
 * below is the mitigation — it exists to keep this app a well-behaved OSM
 * consumer and minimise how many tile requests it actually generates,
 * which is the main lever available without switching providers:
 *
 * - `keepBuffer: 4` (Leaflet default: 2) keeps more offscreen tiles cached
 *   client-side, so panning back over recently-viewed ground re-uses them
 *   instead of re-requesting from OSM.
 * - `updateWhenZooming: false` skips fetching intermediate-zoom tiles
 *   during a fast zoom gesture — only the final zoom level's tiles are
 *   requested once the gesture settles, rather than every level passed
 *   through along the way.
 * - `detectRetina` is deliberately left at its default (false): OSM's
 *   standard tile endpoint has no @2x/retina tile set, so turning this on
 *   would not improve resolution and would increase request volume for
 *   no benefit.
 *
 * All 5 call sites also already constrain `minZoom`/`maxZoom`/`maxBounds`
 * to Niger State, which is the biggest existing reduction in request
 * volume/geographic footprint against OSM's shared server.
 */

export const TILE_LAYER_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export const TILE_LAYER_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export const TILE_LAYER_OPTIONS = {
  keepBuffer: 4,
  updateWhenZooming: false,
} as const;
