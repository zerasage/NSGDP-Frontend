"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { FeatureCollection, Feature } from "geojson";
import { Loader2, Maximize2, Minimize2, Layers, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapTooltip } from "@/components/map/map-tooltip";

function configureLeafletIcons() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require("leaflet") as typeof import("leaflet");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
  return L;
}

// Dynamically import Leaflet to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const GeoJSON = dynamic(
  () => import("react-leaflet").then((mod) => mod.GeoJSON),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);
const ZoomControl = dynamic(
  () => import("react-leaflet").then((mod) => mod.ZoomControl),
  { ssr: false }
);

function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Uploaded files can name their fields anything — build a popup from
// whatever properties the feature actually has, falling back to
// name/description when present. All values are untrusted (they come
// from the uploaded file) and must be escaped before going into innerHTML.
function buildFeaturePopupHtml(properties: Record<string, unknown>): string {
  const title = properties.name ?? properties.title ?? "Location";
  const entries = Object.entries(properties).filter(
    ([key]) => key !== "name" && key !== "title"
  );

  const rowsHtml = entries
    .slice(0, 8)
    .map(
      ([key, value]) =>
        `<tr><td class="pr-2 text-muted-foreground align-top">${escapeHtml(key)}</td><td>${escapeHtml(value)}</td></tr>`
    )
    .join("");

  return `
    <div class="p-2 max-w-xs">
      <h3 class="font-bold mb-1">${escapeHtml(title)}</h3>
      ${rowsHtml ? `<table class="text-xs"><tbody>${rowsHtml}</tbody></table>` : ""}
    </div>
  `;
}

// Niger State coordinates (approximate center)
const NIGER_STATE_CENTER: [number, number] = [9.9319, 6.5470];
const DEFAULT_ZOOM = 8;
const MIN_ZOOM = 7; // Prevent zooming out too far
const MAX_ZOOM = 18; // Allow detailed view

// Niger State approximate boundary (simplified polygon)
const NIGER_STATE_BOUNDS: [[number, number], [number, number]] = [
  [8.5, 3.5],  // Southwest corner
  [11.5, 8.5], // Northeast corner
];

interface DatasetMapProps {
  geoJsonData?: FeatureCollection | Feature;
  markers?: Array<{
    id: string;
    position: [number, number];
    title: string;
    description?: string;
    rows?: Array<{ label: string; value: string | number }>;
  }>;
  lgaCoverage?: string[];
  height?: string;
  showControls?: boolean;
}

export function DatasetMap({
  geoJsonData,
  markers,
  lgaCoverage,
  height = "500px",
  showControls = true,
}: DatasetMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [baseLayer, setBaseLayer] = useState<"osm" | "satellite">("osm");
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    configureLeafletIcons();
    setMapReady(true);
    setLoading(false);
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const baseLayers = {
    osm: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution:
        "&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    },
  };

  if (loading || !mapReady) {
    return (
      <Card className="flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <Loader2 className="size-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </Card>
    );
  }

  return (
    <div
      className={`relative ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-background"
          : ""
      }`}
    >
      <Card
        className="overflow-hidden"
        style={{ height: isFullscreen ? "100vh" : height }}
      >
        {/* Map Controls */}
        {showControls && (
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            {/* Layer Switcher */}
            <Button
              size="sm"
              variant="secondary"
              className="shadow-lg"
              onClick={() => setBaseLayer(baseLayer === "osm" ? "satellite" : "osm")}
            >
              <Layers className="size-4 mr-2" />
              {baseLayer === "osm" ? "Satellite" : "Map"}
            </Button>

            {/* Fullscreen Toggle */}
            <Button
              size="sm"
              variant="secondary"
              className="shadow-lg"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="size-4" />
              ) : (
                <Maximize2 className="size-4" />
              )}
            </Button>
          </div>
        )}

        {/* LGA Coverage Badge */}
        {lgaCoverage && lgaCoverage.length > 0 && (
          <div className="absolute bottom-4 left-4 z-[1000]">
            <div className="bg-background/95 backdrop-blur rounded-lg px-3 py-2 shadow-lg border">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="size-4 text-primary" />
                <span className="font-medium">
                  {lgaCoverage.includes("All")
                    ? "All 25 LGAs"
                    : `${lgaCoverage.length} LGAs covered`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Map */}
        <MapContainer
          center={NIGER_STATE_CENTER}
          zoom={DEFAULT_ZOOM}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          maxBounds={NIGER_STATE_BOUNDS}
          maxBoundsViscosity={1.0}
          zoomControl={false}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <ZoomControl position="bottomright" />

          {/* Base Layer */}
          <TileLayer
            url={baseLayers[baseLayer].url}
            attribution={baseLayers[baseLayer].attribution}
          />

          {/* GeoJSON Layer - with prominent state boundary */}
          {geoJsonData && (
            <GeoJSON
              data={geoJsonData}
              style={{
                color: "#16a34a", // Green for state boundary
                weight: 3,
                fillOpacity: 0.05,
                fillColor: "#16a34a",
                dashArray: "5, 5",
              }}
              onEachFeature={(feature, layer) => {
                if (feature.properties) {
                  layer.bindPopup(buildFeaturePopupHtml(feature.properties));
                }
              }}
            />
          )}

          {/* Point Markers */}
          {markers &&
            markers.map((marker) => (
              <Marker key={marker.id} position={marker.position}>
                <Popup>
                  <MapTooltip
                    title={marker.title}
                    rows={
                      marker.rows ??
                      (marker.description
                        ? [{ label: "Details", value: marker.description }]
                        : [])
                    }
                    className="border-0 shadow-none p-0 min-w-0 bg-transparent backdrop-blur-none"
                  />
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </Card>

      {/* Fullscreen Overlay for ESC instruction */}
      {isFullscreen && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="bg-background/95 backdrop-blur rounded-lg px-4 py-2 shadow-lg border text-sm">
            Press <kbd className="px-2 py-1 bg-muted rounded">ESC</kbd> or click{" "}
            <Minimize2 className="inline size-3" /> to exit fullscreen
          </div>
        </div>
      )}
    </div>
  );
}
