"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Table, Map, AlertTriangle } from "lucide-react";
import type { FeatureCollection, Feature } from "geojson";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Leaflet requires window — must not load during SSR
const DatasetMap = dynamic(
  () => import("@/components/map/dataset-map").then((mod) => mod.DatasetMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[400px] items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
  }
);

// The backend preview generator returns one of two shapes for spatial
// formats: plain GeoJSON files come back as a bare `features` array
// (from generateJsonPreview), while GeoPackage/Shapefile/KML come back
// with a ready-made `geojson` FeatureCollection plus a flattened
// attribute `columns`/`rows` table (from the dedicated generators in
// datasets.service.ts). Both are normalised into one shape below.
interface SpatialPreview {
  type?: string;
  geojson?: FeatureCollection | null;
  features?: Feature[];
  columns?: string[];
  rows?: Array<Record<string, unknown>>;
  totalFeatures?: number;
  totalRows?: number;
  isPartialGeometry?: boolean;
  message?: string;
}

const SPATIAL_PREVIEW_TYPES = ["geojson", "geopackage", "shapefile", "kml"];

interface DatasetMapSectionProps {
  preview?: unknown;
  lgaCoverage: string[];
}

export function DatasetMapSection({ preview, lgaCoverage }: DatasetMapSectionProps) {
  const [view, setView] = useState<"map" | "table">("map");

  const p = preview as SpatialPreview | undefined;
  if (!p || !p.type || !SPATIAL_PREVIEW_TYPES.includes(p.type)) return null;

  const featureCollection: FeatureCollection | null =
    p.geojson ?? (p.features ? { type: "FeatureCollection", features: p.features } : null);

  const columns = p.columns ?? (p.features?.length ? Object.keys(p.features[0].properties ?? {}) : []);
  const rows = p.rows ?? p.features?.map((f) => f.properties ?? {}) ?? [];
  const total = p.totalFeatures ?? p.totalRows;

  if (!featureCollection && rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spatial Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="size-4" />
            {p.message || "Spatial preview not available for this file."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Spatial Preview</CardTitle>
        <div className="flex rounded-lg border">
          <Button
            type="button"
            size="sm"
            variant={view === "map" ? "default" : "ghost"}
            className={cn("rounded-r-none", view === "map" && "rounded-l-lg")}
            onClick={() => setView("map")}
            disabled={!featureCollection}
          >
            <Map className="size-4 mr-1" />
            Map
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === "table" ? "default" : "ghost"}
            className="rounded-l-none border-l"
            onClick={() => setView("table")}
            disabled={rows.length === 0}
          >
            <Table className="size-4 mr-1" />
            Attribute Table
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {view === "map" && featureCollection ? (
          <DatasetMap geoJsonData={featureCollection} lgaCoverage={lgaCoverage} height="400px" />
        ) : view === "table" && rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  {columns.map((col) => (
                    <th key={col} className="pb-2 pr-4 font-medium whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 20).map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    {columns.map((col) => (
                      <td key={col} className="py-2 pr-4 whitespace-nowrap">
                        {row[col] !== null && row[col] !== undefined ? String(row[col]) : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {total !== undefined && (
          <p className="mt-3 text-xs text-muted-foreground">
            {view === "table"
              ? `Showing ${Math.min(rows.length, 20)} of ${total} attribute rows`
              : `Showing ${featureCollection?.features.length ?? 0} of ${total} features`}
            {p.isPartialGeometry && " (partial preview — file too large to load in full)"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
