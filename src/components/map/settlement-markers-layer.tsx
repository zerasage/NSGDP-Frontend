"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import type { GisSettlement } from "@/lib/api/gis";

function accessibilityColor(status: string | null): string {
  switch (status) {
    case "Fully Accessible":
      return "#16a34a";
    case "Partially Accessible":
      return "#f59e0b";
    case "Inaccessible":
      return "#dc2626";
    default:
      return "#6b7280";
  }
}

const iconCache: Record<string, L.DivIcon> = {};

function iconForColor(color: string): L.DivIcon {
  if (!iconCache[color]) {
    iconCache[color] = L.divIcon({
      className: "",
      html: `<span style="display:block;width:10px;height:10px;border-radius:50%;background:${color};border:1px solid white;box-shadow:0 0 1px rgba(0,0,0,0.6);"></span>`,
      iconSize: [10, 10],
      iconAnchor: [5, 5],
    });
  }
  return iconCache[color];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function popupHtml(s: GisSettlement): string {
  return `
    <div class="p-2 text-sm max-w-xs">
      <h3 class="font-bold mb-1">${escapeHtml(s.name)}</h3>
      <table class="text-xs">
        <tbody>
          <tr><td class="pr-3 text-muted-foreground">LGA</td><td>${escapeHtml(s.lga)}</td></tr>
          <tr><td class="pr-3 text-muted-foreground">Ward</td><td>${escapeHtml(s.ward ?? "—")}</td></tr>
          <tr><td class="pr-3 text-muted-foreground">Accessibility</td><td>${escapeHtml(s.accessibility ?? "Unknown")}</td></tr>
          <tr><td class="pr-3 text-muted-foreground">Population</td><td>${s.population != null ? s.population.toLocaleString() : "—"}</td></tr>
        </tbody>
      </table>
    </div>
  `;
}

interface SettlementMarkersLayerProps {
  settlements: GisSettlement[];
}

type MarkerClusterGroupLayer = L.Layer & { clearLayers(): void };

/** Imperative marker cluster — avoids mounting thousands of React-Leaflet Marker nodes. */
export function SettlementMarkersLayer({ settlements }: SettlementMarkersLayerProps) {
  const map = useMap();
  const clusterRef = useRef<MarkerClusterGroupLayer | null>(null);

  useEffect(() => {
    if (!map.getContainer()?.isConnected) return;

    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
      clusterRef.current.clearLayers();
      clusterRef.current = null;
    }

    if (settlements.length === 0) return;

    const clusterFactory = (
      L as typeof L & {
        markerClusterGroup: (options?: object) => MarkerClusterGroupLayer & {
          addLayer(layer: L.Layer): void;
        };
      }
    ).markerClusterGroup;

    const cluster = clusterFactory({ chunkedLoading: true, maxClusterRadius: 50 });

    for (const s of settlements) {
      const marker = L.marker([s.lat, s.lng], {
        icon: iconForColor(accessibilityColor(s.accessibility)),
      });
      marker.bindTooltip(s.name, { direction: "top", offset: L.point(0, -6), opacity: 0.95 });
      marker.bindPopup(popupHtml(s));
      cluster.addLayer(marker);
    }

    map.addLayer(cluster);
    clusterRef.current = cluster;

    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
        clusterRef.current.clearLayers();
        clusterRef.current = null;
      }
    };
  }, [map, settlements]);

  return null;
}
