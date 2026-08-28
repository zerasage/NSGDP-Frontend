"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Database, Loader2, RotateCcw, Search, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getDatasetMapCoverage,
  type DatasetFormat,
  type DatasetMapCoverage,
} from "@/lib/api/datasets";
import { getGroups, getGroupBySlug, type PortalGroup } from "@/lib/api/groups";
import {
  getLgaGisSummary,
  type LgaGisFeatureCollection,
  type LgaGisProperties,
} from "@/lib/api/gis";
import { NIGER_STATE_LGAS } from "@/lib/constants/core";
import {
  MapLegend,
  DATASET_COVERAGE_LEGEND,
  DATASET_MARKER_LEGEND,
} from "@/components/map/map-legend";
import { MapErrorBanner } from "@/components/map/map-error-banner";
import { MapTooltip } from "@/components/map/map-tooltip";
import { HelpTooltip } from "@/components/feedback/help-tooltip";
import { useStateBoundary } from "@/lib/hooks/useStateBoundary";
import { cn } from "@/lib/utils";
import type { Feature } from "geojson";
import type { Path } from "leaflet";
import type L from "leaflet";

function configureLeafletIcons() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Leaflet = require("leaflet") as typeof import("leaflet");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (Leaflet.Icon.Default.prototype as any)._getIconUrl;
  Leaflet.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

let datasetIconCache: Record<string, L.DivIcon> | null = null;
function getDatasetIcon(color: string, selected: boolean): L.DivIcon {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Leaflet = require("leaflet") as typeof import("leaflet");
  if (!datasetIconCache) datasetIconCache = {};
  const key = `${color}-${selected ? "s" : "n"}`;
  if (!datasetIconCache[key]) {
    const size = selected ? 16 : 11;
    datasetIconCache[key] = Leaflet.divIcon({
      className: "",
      html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid ${selected ? "#ea580c" : "white"};box-shadow:0 0 1px rgba(0,0,0,0.6);"></span>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }
  return datasetIconCache[key];
}

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("react-leaflet").then((mod) => mod.Tooltip),
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
const GeoJSON = dynamic(
  () => import("react-leaflet").then((mod) => mod.GeoJSON),
  { ssr: false }
);
const MarkerClusterGroup = dynamic(() => import("react-leaflet-cluster"), {
  ssr: false,
});
const FlyToBounds = dynamic(
  () => import("@/components/map/fly-to-bounds").then((mod) => mod.FlyToBounds),
  { ssr: false }
);

const NIGER_STATE_CENTER: [number, number] = [9.9319, 6.547];
const NIGER_STATE_BOUNDS: [[number, number], [number, number]] = [
  [8.5, 3.5],
  [11.5, 8.5],
];

const SPATIAL_FORMATS = new Set<DatasetFormat>([
  "geojson",
  "shapefile",
  "geopackage",
  "kml",
]);
const TABULAR_FORMATS = new Set<DatasetFormat>(["csv", "excel", "json"]);

const LGA_ALIASES: Record<string, string> = {
  minna: "Chanchaga",
};

const LGA_BY_KEY = new Map(
  NIGER_STATE_LGAS.map((name) => [normalizeLgaKey(name), name])
);

type SpatialFilter = "all" | "spatial" | "tabular";

function normalizeLgaKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+lga$/i, "")
    .replace(/\s+/g, " ");
}

function resolveLgaName(raw: string): string | null {
  const key = normalizeLgaKey(raw);
  if (!key) return null;
  const aliased = LGA_ALIASES[key];
  if (aliased) return aliased;
  return LGA_BY_KEY.get(key) ?? null;
}

function isStatewideCoverage(coverage: string[]): boolean {
  if (coverage.length === 0) return true;
  const resolved = new Set<string>();
  for (const entry of coverage) {
    const key = normalizeLgaKey(entry);
    if (key === "all" || key === "all lgas" || key === "niger state") return true;
    const lga = resolveLgaName(entry);
    if (lga) resolved.add(lga);
  }
  return resolved.size >= NIGER_STATE_LGAS.length;
}

function datasetLgas(coverage: string[]): string[] {
  if (isStatewideCoverage(coverage)) return [...NIGER_STATE_LGAS];
  const unique = new Set<string>();
  for (const entry of coverage) {
    const lga = resolveLgaName(entry);
    if (lga) unique.add(lga);
  }
  return [...unique];
}

function coverageLabel(coverage: string[]): string {
  if (isStatewideCoverage(coverage)) return "All 25 LGAs";
  const lgas = datasetLgas(coverage);
  if (lgas.length === 0) return "Coverage not specified";
  if (lgas.length === 1) return lgas[0];
  return `${lgas.length} LGAs`;
}

function isSpatialDataset(dataset: DatasetMapCoverage): boolean {
  return dataset.hasSpatialData || SPATIAL_FORMATS.has(dataset.format);
}

function markerColor(dataset: DatasetMapCoverage): string {
  if (isSpatialDataset(dataset)) return "#2563eb";
  if (TABULAR_FORMATS.has(dataset.format)) return "#0f766e";
  return "#6b7280";
}

function coverageFill(count: number): string {
  if (count <= 0) return "#e5e7eb";
  if (count === 1) return "#bfdbfe";
  if (count <= 3) return "#60a5fa";
  if (count <= 6) return "#2563eb";
  return "#1e3a8a";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** GIS centroids are GeoJSON [lng, lat]; Leaflet markers use [lat, lng]. */
function centroidToLatLng(centroid: [number, number] | null): [number, number] | null {
  if (!centroid) return null;
  const [lng, lat] = centroid;
  return [lat, lng];
}

function hashOffset(id: string): [number, number] {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
  const radius = 0.035 + (Math.abs(hash >> 8) % 30) / 1000;
  return [Math.cos(angle) * radius, Math.sin(angle) * radius];
}

export default function MapExplorePage() {
  const [mapReady, setMapReady] = useState(false);
  const [filterOpen, setFilterOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [lga, setLga] = useState("all");
  const [topic, setTopic] = useState("all");
  const [spatial, setSpatial] = useState<SpatialFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [datasets, setDatasets] = useState<DatasetMapCoverage[]>([]);
  const [lgaSummary, setLgaSummary] = useState<LgaGisFeatureCollection | null>(null);
  const [groups, setGroups] = useState<PortalGroup[]>([]);
  const [topicDatasetIds, setTopicDatasetIds] = useState<Set<string> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTopic, setIsLoadingTopic] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: stateBoundary } = useStateBoundary();

  useEffect(() => {
    configureLeafletIcons();
    setMapReady(true);
  }, []);

  const loadData = useCallback(() => {
    setIsLoading(true);
    setError(null);
    Promise.all([
      getDatasetMapCoverage(),
      getLgaGisSummary(),
      getGroups({ page: 1, limit: 100 }),
    ])
      .then(([coverage, summary, groupPage]) => {
        setDatasets(coverage);
        setLgaSummary(summary);
        setGroups(groupPage.data);
      })
      .catch(() => setError("Couldn't load the dataset map."))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (topic === "all") {
      setTopicDatasetIds(null);
      setIsLoadingTopic(false);
      return;
    }
    let cancelled = false;
    setIsLoadingTopic(true);
    setTopicDatasetIds(null);
    getGroupBySlug(topic)
      .then((detail) => {
        if (!cancelled) {
          setTopicDatasetIds(new Set(detail.datasets.map((item) => item.id)));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTopicDatasetIds(new Set());
          setError("Couldn't load that topic's datasets.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingTopic(false);
      });
    return () => {
      cancelled = true;
    };
  }, [topic]);

  const centroidsByLga = useMemo(() => {
    const map = new Map<string, [number, number]>();
    for (const feature of lgaSummary?.features ?? []) {
      const latLng = centroidToLatLng(feature.properties.centroid);
      if (latLng) map.set(feature.properties.lga, latLng);
    }
    return map;
  }, [lgaSummary]);

  const geometryByLga = useMemo(() => {
    const map = new Map<string, Feature["geometry"]>();
    for (const feature of lgaSummary?.features ?? []) {
      if (feature.geometry) map.set(feature.properties.lga, feature.geometry as Feature["geometry"]);
    }
    return map;
  }, [lgaSummary]);

  const scopedDatasets = useMemo(() => {
    const q = query.trim().toLowerCase();
    return datasets.filter((dataset) => {
      if (topicDatasetIds && !topicDatasetIds.has(dataset.id)) return false;
      if (spatial === "spatial" && !isSpatialDataset(dataset)) return false;
      if (spatial === "tabular" && isSpatialDataset(dataset)) return false;
      if (
        q &&
        !dataset.title.toLowerCase().includes(q) &&
        !(dataset.organisationName ?? "").toLowerCase().includes(q) &&
        !(dataset.description ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [datasets, topicDatasetIds, spatial, query]);

  const filteredDatasets = useMemo(() => {
    if (lga === "all") return scopedDatasets;
    return scopedDatasets.filter((dataset) =>
      datasetLgas(dataset.geographicCoverage).includes(lga)
    );
  }, [scopedDatasets, lga]);

  const lgaCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const name of NIGER_STATE_LGAS) counts.set(name, 0);
    for (const dataset of scopedDatasets) {
      for (const name of datasetLgas(dataset.geographicCoverage)) {
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
    }
    return counts;
  }, [scopedDatasets]);

  const selectedDataset = useMemo(
    () => filteredDatasets.find((dataset) => dataset.id === selectedId) ?? null,
    [filteredDatasets, selectedId]
  );

  const selectedLgas = useMemo(
    () => (selectedDataset ? new Set(datasetLgas(selectedDataset.geographicCoverage)) : new Set<string>()),
    [selectedDataset]
  );

  const markerPositions = useMemo(() => {
    return filteredDatasets.map((dataset) => {
      const offset = hashOffset(dataset.id);
      const covered = datasetLgas(dataset.geographicCoverage);
      const anchorLga =
        lga !== "all" && covered.includes(lga)
          ? lga
          : covered.length === 1
            ? covered[0]
            : covered[0];
      const base =
        (anchorLga ? centroidsByLga.get(anchorLga) : undefined) ?? NIGER_STATE_CENTER;
      return {
        dataset,
        position: [base[0] + offset[0], base[1] + offset[1]] as [number, number],
      };
    });
  }, [filteredDatasets, centroidsByLga, lga]);

  const flyToPositions = useMemo(() => {
    if (selectedDataset) {
      const covered = datasetLgas(selectedDataset.geographicCoverage);
      const points = covered
        .map((name) => centroidsByLga.get(name))
        .filter((point): point is [number, number] => Boolean(point));
      return points.length ? points : [NIGER_STATE_CENTER];
    }
    if (lga !== "all") {
      const point = centroidsByLga.get(lga);
      return point ? [point] : [];
    }
    return markerPositions.map((item) => item.position);
  }, [selectedDataset, lga, centroidsByLga, markerPositions]);

  const flyGeometry = lga !== "all" && !selectedDataset ? geometryByLga.get(lga) ?? null : null;

  const resetFilters = () => {
    setQuery("");
    setLga("all");
    setTopic("all");
    setSpatial("all");
    setSelectedId(null);
  };

  if (!mapReady) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden">
      <MapContainer
        center={NIGER_STATE_CENTER}
        zoom={8}
        minZoom={7}
        maxZoom={18}
        maxBounds={NIGER_STATE_BOUNDS}
        maxBoundsViscosity={1}
        zoomControl={false}
        className="absolute inset-0 z-0 h-full w-full"
      >
        <ZoomControl position="topleft" />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        <FlyToBounds
          geometry={flyGeometry}
          positions={flyGeometry ? null : flyToPositions}
          flyKey={`${lga}-${selectedId ?? "none"}-${spatial}-${topic}`}
          fallbackCenter={NIGER_STATE_CENTER}
          fallbackZoom={8}
        />

        {lgaSummary && (
          <GeoJSON
            key={`coverage-${lga}-${selectedId ?? "none"}-${spatial}-${topic}-${query}-${lgaSummary.generatedAt}`}
            data={lgaSummary as unknown as GeoJSON.FeatureCollection}
            style={(feature?: Feature) => {
              const props = feature?.properties as LgaGisProperties | undefined;
              if (!props) return {};
              const count = lgaCounts.get(props.lga) ?? 0;
              const isSelectedLga = props.lga === lga;
              const inSelectedDataset = selectedLgas.has(props.lga);
              return {
                color: inSelectedDataset ? "#ea580c" : isSelectedLga ? "#111827" : "#ffffff",
                weight: inSelectedDataset || isSelectedLga ? 2.5 : 1,
                fillColor: coverageFill(count),
                fillOpacity: 0.65,
              };
            }}
            onEachFeature={(feature, layer) => {
              const props = feature.properties as LgaGisProperties;
              const count = lgaCounts.get(props.lga) ?? 0;
              layer.bindPopup(
                `<div class="p-2 text-sm"><h3 class="font-bold mb-1">${escapeHtml(props.lga)}</h3><p class="text-xs">${count.toLocaleString()} dataset${count === 1 ? "" : "s"} in current filters</p></div>`
              );
              layer.on("click", () => {
                setLga(props.lga);
                setSelectedId(null);
              });
              layer.on("mouseover", () => {
                (layer as Path).setStyle({ weight: 3, color: "#0f172a" });
                (layer as Path).bringToFront();
              });
              layer.on("mouseout", () => {
                const isSelectedLga = props.lga === lga;
                const inSelectedDataset = selectedLgas.has(props.lga);
                (layer as Path).setStyle({
                  weight: inSelectedDataset || isSelectedLga ? 2.5 : 1,
                  color: inSelectedDataset ? "#ea580c" : isSelectedLga ? "#111827" : "#ffffff",
                });
              });
            }}
          />
        )}

        <MarkerClusterGroup chunkedLoading maxClusterRadius={40}>
          {markerPositions.map(({ dataset, position }) => (
            <Marker
              key={dataset.id}
              position={position}
              icon={getDatasetIcon(markerColor(dataset), dataset.id === selectedId)}
              eventHandlers={{
                click: () => setSelectedId(dataset.id),
              }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                <span className="text-xs font-medium">{dataset.title}</span>
              </Tooltip>
              <Popup>
                <MapTooltip
                  title={dataset.title}
                  rows={[
                    { label: "Organisation", value: dataset.organisationName ?? "—" },
                    { label: "Format", value: dataset.format },
                    { label: "Coverage", value: coverageLabel(dataset.geographicCoverage) },
                    { label: "Downloads", value: dataset.downloadCount.toLocaleString() },
                  ]}
                  className="border-0 shadow-none p-0 min-w-0 bg-transparent backdrop-blur-none"
                />
                <Link
                  href={`/dataportal/${dataset.slug}`}
                  className="mt-2 inline-flex text-xs font-medium text-primary underline"
                >
                  View dataset
                </Link>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>

        {stateBoundary?.geometry && (
          <GeoJSON
            key={`state-boundary-${stateBoundary.generatedAt}`}
            data={stateBoundary as unknown as GeoJSON.Feature}
            style={{ color: "#111827", weight: 1.5, fillOpacity: 0 }}
            interactive={false}
          />
        )}
      </MapContainer>

      {!filterOpen && (
        <Button
          size="sm"
          className="absolute left-4 top-4 z-[1000] shadow-lg"
          onClick={() => setFilterOpen(true)}
        >
          Show Filters
        </Button>
      )}

      <div
        className={cn(
          "absolute left-0 top-0 z-[1000] flex h-full w-96 max-w-[90vw] transform flex-col border-r bg-background shadow-2xl transition-transform duration-300",
          filterOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="font-semibold">Dataset Coverage Map</h2>
            <p className="text-xs text-muted-foreground">
              {isLoading || isLoadingTopic
                ? "Loading…"
                : `${filteredDatasets.length.toLocaleString()} datasets`}
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={() => setFilterOpen(false)}>
            <X className="size-4" />
          </Button>
      </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-4 overflow-y-auto p-4 thin-scrollbar">
            {error && <MapErrorBanner message={error} onRetry={loadData} />}

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search datasets…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">LGA</label>
                  <Select value={lga} onValueChange={(v) => v && setLga(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All LGAs">
                        {lga === "all"
                          ? `All LGAs (${scopedDatasets.length.toLocaleString()})`
                          : `${lga} (${(lgaCounts.get(lga) ?? 0).toLocaleString()})`}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All LGAs ({scopedDatasets.length.toLocaleString()})</SelectItem>
                      {NIGER_STATE_LGAS.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name} ({(lgaCounts.get(name) ?? 0).toLocaleString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    Topic
                    <HelpTooltip content="Topics are portal groups. Selecting one shows only datasets linked to that group." />
                  </label>
                  <Select value={topic} onValueChange={(v) => v && setTopic(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All topics" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All topics</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.slug}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    Data type
                    <HelpTooltip content="Spatial files are GeoJSON, shapefile, GeoPackage, or KML. Tabular covers CSV, Excel, and JSON." />
                  </label>
                  <Select
                    value={spatial}
                    onValueChange={(v) => v && setSpatial(v as SpatialFilter)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="spatial">Spatial files</SelectItem>
                      <SelectItem value="tabular">Tabular files</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" className="w-full" onClick={resetFilters}>
                  <RotateCcw className="size-4 mr-2" />
                  Reset filters
                </Button>
              </>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col border-t">
            <div className="flex items-center gap-2 border-b px-4 py-2">
              <Database className="size-4 text-muted-foreground" />
              <p className="text-xs font-medium">
                  Datasets ({filteredDatasets.length})
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 thin-scrollbar">
              {isLoading ? (
                <div className="space-y-2 p-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                    </div>
                  ) : filteredDatasets.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No datasets match these filters.
                </p>
                  ) : (
                    filteredDatasets.map((dataset) => (
                      <button
                        key={dataset.id}
                    type="button"
                    onClick={() => setSelectedId(dataset.id)}
                    className={cn(
                      "mb-1 w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50",
                      selectedId === dataset.id && "border-primary bg-primary/5"
                    )}
                  >
                    <p className="line-clamp-2 text-sm font-medium">{dataset.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {dataset.organisationName ?? "Unknown organisation"} ·{" "}
                      {coverageLabel(dataset.geographicCoverage)}
                    </p>
                      </button>
                    ))
                  )}
                </div>
            {selectedDataset && (
              <div className="border-t p-4">
                <p className="text-sm font-medium line-clamp-2">{selectedDataset.title}</p>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-3">
                  {selectedDataset.description || "No description available."}
                </p>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/dataportal/${selectedDataset.slug}`}
                    className={cn(buttonVariants({ size: "sm" }), "flex-1")}
                  >
                    View details
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => setSelectedId(null)}>
                      Clear
                    </Button>
                    </div>
                  </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-[1000] hidden space-y-2 sm:block">
        <MapLegend title="Datasets per LGA" items={DATASET_COVERAGE_LEGEND} type="gradient" />
        <MapLegend title="Dataset markers" items={DATASET_MARKER_LEGEND} />
      </div>
    </div>
  );
}
