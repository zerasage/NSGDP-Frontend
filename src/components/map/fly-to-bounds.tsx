"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { Geometry, GeoJsonObject } from "geojson";

interface FlyToBoundsProps {
  /** Fly to the bounds of this geometry (e.g. a selected LGA's polygon). */
  geometry?: Geometry | null;
  /** Fly to the bounds containing these points (e.g. filtered markers). Ignored if `geometry` is set. */
  positions?: Array<[number, number]> | null;
  fallbackCenter: [number, number];
  fallbackZoom: number;
}

/** Renders nothing — imperatively moves the map when its target changes. */
export function FlyToBounds({
  geometry,
  positions,
  fallbackCenter,
  fallbackZoom,
}: FlyToBoundsProps) {
  const map = useMap();

  useEffect(() => {
    let bounds: L.LatLngBounds | null = null;
    if (geometry) {
      const computed = L.geoJSON(geometry as GeoJsonObject).getBounds();
      if (computed.isValid()) bounds = computed;
    } else if (positions && positions.length > 0) {
      const computed = L.latLngBounds(positions);
      if (computed.isValid()) bounds = computed;
    }

    if (bounds) {
      map.flyToBounds(bounds, { padding: [40, 40], duration: 0.75, maxZoom: 13 });
    } else {
      map.flyTo(fallbackCenter, fallbackZoom, { duration: 0.75 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometry, positions, map]);

  return null;
}
