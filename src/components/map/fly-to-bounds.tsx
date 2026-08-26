"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { Geometry, GeoJsonObject } from "geojson";

interface FlyToBoundsProps {
  /** Fly to the bounds of this geometry (e.g. a selected LGA's polygon). */
  geometry?: Geometry | null;
  /** Fly to the bounds containing these points (e.g. filtered markers). Ignored if `geometry` is set. */
  positions?: Array<[number, number]> | null;
  /** When set, only re-fly when this key changes — avoids re-running on every data refresh. */
  flyKey?: string;
  fallbackCenter: [number, number];
  fallbackZoom: number;
}

const MAX_FLY_POSITIONS = 800;

function mapIsUsable(map: L.Map | null): map is L.Map {
  if (!map) return false;
  try {
    return Boolean(map.getContainer()?.isConnected);
  } catch {
    return false;
  }
}

/** Renders nothing — imperatively moves the map when its target changes. */
export function FlyToBounds({
  geometry,
  positions,
  flyKey,
  fallbackCenter,
  fallbackZoom,
}: FlyToBoundsProps) {
  const map = useMap();
  const lastFlyKey = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!mapIsUsable(map)) return;

    if (flyKey !== undefined) {
      if (flyKey === lastFlyKey.current) return;
      lastFlyKey.current = flyKey;
    }

    let bounds: L.LatLngBounds | null = null;
    if (geometry) {
      const computed = L.geoJSON(geometry as GeoJsonObject).getBounds();
      if (computed.isValid()) bounds = computed;
    } else if (positions && positions.length > 0 && positions.length <= MAX_FLY_POSITIONS) {
      const computed = L.latLngBounds(positions);
      if (computed.isValid()) bounds = computed;
    }

    try {
      if (bounds) {
        map.flyToBounds(bounds, { padding: [40, 40], duration: 0.75, maxZoom: 13 });
      } else if (!positions?.length || positions.length > MAX_FLY_POSITIONS) {
        map.flyTo(fallbackCenter, fallbackZoom, { duration: 0.75 });
      }
    } catch {
      // Map may be mid-unmount during filter-driven re-renders.
    }

    return () => {
      if (mapIsUsable(map)) {
        try {
          map.stop();
        } catch {
          // ignore
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometry, positions, flyKey, map]);

  return null;
}
