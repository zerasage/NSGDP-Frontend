"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { ChevronDown, ChevronUp, Filter, Loader2, RotateCcw, Users, X, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getLgaGisSummary,
  getWardGisSummary,
  getDiseaseBurdenSimplified,
  type LgaGisFeatureCollection,
  type WardGisFeatureCollection,
  type LgaGisProperties,
  type WardGisProperties,
  type DiseaseBurdenGisProperties,
  type DiseaseBurdenFeatureCollection,
} from "@/lib/api/gis";
import { useDiseaseIndicators } from "@/lib/hooks/useDiseaseIndicators";
import { getBurdenTrends, getLgaTrend, type LgaTrendPoint } from "@/lib/api/analytics";
import { NIGER_STATE_LGAS } from "@/lib/constants/core";
import {
  MapLegend,
  POPULATION_DENSITY_LEGEND,
  FACILITY_DENSITY_LEGEND,
  diseaseBurdenLegendItems,
  getDiseaseBurdenColor,
} from "@/components/map/map-legend";
import { MapErrorBanner } from "@/components/map/map-error-banner";
import { HelpTooltip } from "@/components/feedback/help-tooltip";
import { useStateBoundary } from "@/lib/hooks/useStateBoundary";
import { cn } from "@/lib/utils";
import type { Feature, Geometry } from "geojson";
import type { Path } from "leaflet";

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
}

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
const ZoomControl = dynamic(
  () => import("react-leaflet").then((mod) => mod.ZoomControl),
  { ssr: false }
);
const FlyToBounds = dynamic(
  () => import("@/components/map/fly-to-bounds").then((mod) => mod.FlyToBounds),
  { ssr: false }
);

const NIGER_STATE_CENTER: [number, number] = [9.9319, 6.547];
const NIGER_STATE_BOUNDS: [[number, number], [number, number]] = [
  [8.5, 3.5],
  [11.5, 8.5],
];

type ActiveLayer = "population" | "facilities" | "disease-burden";

function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getPopulationDensityColor(density: number | null): string {
  if (density == null) return "#9ca3af";
  if (density > 1000) return "#7f1d1d";
  if (density > 300) return "#dc2626";
  if (density > 100) return "#f59e0b";
  return "#16a34a";
}

function getFacilityCountColor(count: number): string {
  if (count > 150) return "#1e3a8a";
  if (count > 100) return "#2563eb";
  if (count > 50) return "#60a5fa";
  return "#bfdbfe";
}

// Wards are ~1/11th the size of an LGA on average, so the LGA-scale
// facility-count thresholds above would bucket almost every ward as "Low" —
// use a smaller scale so the ward layer's shading is actually informative.
function getWardFacilityColor(count: number): string {
  if (count > 20) return "#1e3a8a";
  if (count > 10) return "#2563eb";
  if (count > 5) return "#60a5fa";
  return "#bfdbfe";
}

function buildTrendSparklineSvg(
  points: LgaTrendPoint[],
  width = 200,
  height = 44
): string {
  if (points.length < 2) {
    return `<p class="text-xs text-muted-foreground mt-2">Insufficient trend history</p>`;
  }
  const max = Math.max(...points.map((p) => p.total), 1);
  const pad = 4;
  const coords = points
    .map((p, i) => {
      const x = pad + (i / (points.length - 1)) * (width - pad * 2);
      const y = height - pad - (p.total / max) * (height - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");
  const last = points[points.length - 1];
  const first = points[0];
  const delta = last.total - first.total;
  const deltaLabel =
    delta > 0 ? `+${delta.toLocaleString()}` : delta.toLocaleString();
  return `
    <div class="mt-2">
      <p class="text-xs text-muted-foreground mb-1">Trend (${first.year}–${last.year}): ${deltaLabel}</p>
      <svg width="${width}" height="${height}" aria-hidden="true">
        <polyline fill="none" stroke="#16a34a" stroke-width="2" points="${coords}" />
      </svg>
    </div>
  `;
}

function buildDiseaseBurdenPopupHtml(
  props: DiseaseBurdenGisProperties,
  trend?: LgaTrendPoint[]
): string {
  return `
    <div class="p-2 text-sm max-w-xs">
      <h3 class="font-bold mb-1">${escapeHtml(props.lgaName)}</h3>
      <table class="text-xs">
        <tbody>
          <tr><td class="pr-3 text-muted-foreground align-top">Total cases</td><td>${props.totalCases.toLocaleString()}</td></tr>
          <tr><td class="pr-3 text-muted-foreground align-top">Incidence</td><td>${props.incidencePer1000.toFixed(1)} / 1,000</td></tr>
        </tbody>
      </table>
      ${trend ? buildTrendSparklineSvg(trend) : `<p class="text-xs text-muted-foreground mt-2">Loading trend…</p>`}
    </div>
  `;
}

function buildLgaPopupHtml(props: LgaGisProperties): string {
  return `
    <div class="p-2 text-sm max-w-xs">
      <h3 class="font-bold mb-1">${escapeHtml(props.lga)}</h3>
      <table class="text-xs">
        <tbody>
          <tr><td class="pr-3 text-muted-foreground align-top">Population</td><td>${props.population != null ? props.population.toLocaleString() : "—"}</td></tr>
          <tr><td class="pr-3 text-muted-foreground align-top">Density</td><td>${props.populationDensity != null ? `${props.populationDensity.toLocaleString()}/km²` : "—"}</td></tr>
          <tr><td class="pr-3 text-muted-foreground align-top">Facilities</td><td>${props.facilityCount}</td></tr>
        </tbody>
      </table>
    </div>
  `;
}

function buildWardPopupHtml(props: WardGisProperties): string {
  return `
    <div class="p-2 text-sm max-w-xs">
      <h3 class="font-bold mb-1">${escapeHtml(props.ward)}</h3>
      <p class="text-xs text-muted-foreground mb-1">${escapeHtml(props.lga)}</p>
      <table class="text-xs">
        <tbody>
          <tr><td class="pr-3 text-muted-foreground align-top">Area</td><td>${props.areaSqkm != null ? `${props.areaSqkm.toLocaleString()} km²` : "—"}</td></tr>
          <tr><td class="pr-3 text-muted-foreground align-top">Facilities</td><td>${props.facilityCount}</td></tr>
        </tbody>
      </table>
    </div>
  `;
}

function CardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}

export default function GisMappingPage() {
  const [mapReady, setMapReady] = useState(false);
  const [filterOpen, setFilterOpen] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [rankingOpen, setRankingOpen] = useState(true);
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>("population");
  const [lga, setLga] = useState("all");
  const [ward, setWard] = useState("all");
  const [showWardBoundaries, setShowWardBoundaries] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState("");
  const [burdenYear, setBurdenYear] = useState(new Date().getFullYear());
  const [burdenYearOptions, setBurdenYearOptions] = useState<number[]>([]);
  const [burdenYearsReady, setBurdenYearsReady] = useState(false);

  const [lgaSummary, setLgaSummary] = useState<LgaGisFeatureCollection | null>(null);
  const [wardSummary, setWardSummary] = useState<WardGisFeatureCollection | null>(null);
  const [diseaseBurden, setDiseaseBurden] = useState<DiseaseBurdenFeatureCollection | null>(null);
  const [isLoadingLga, setIsLoadingLga] = useState(true);
  const [isLoadingWard, setIsLoadingWard] = useState(false);
  const [isLoadingBurden, setIsLoadingBurden] = useState(false);
  const [lgaError, setLgaError] = useState<string | null>(null);
  const [wardError, setWardError] = useState<string | null>(null);
  const [burdenError, setBurdenError] = useState<string | null>(null);
  const { data: stateBoundary } = useStateBoundary();
  const { data: indicators, isFetched: indicatorsFetched } = useDiseaseIndicators();

  useEffect(() => {
    configureLeafletIcons();
    setMapReady(true);
  }, []);

  useEffect(() => {
    if (indicators?.length && !selectedIndicator) {
      setSelectedIndicator(indicators[0].slug);
    }
  }, [indicators, selectedIndicator]);

  useEffect(() => {
    if (activeLayer !== "disease-burden" || !selectedIndicator) {
      setBurdenYearOptions([]);
      setBurdenYearsReady(false);
      return;
    }
    let cancelled = false;
    setBurdenYearsReady(false);
    getBurdenTrends(selectedIndicator, { granularity: "annual" })
      .then((rows) => {
        if (cancelled) return;
        const years = (rows as { year: number }[])
          .map((r) => r.year)
          .filter((year) => Number.isFinite(year))
          .sort((a, b) => a - b);
        setBurdenYearOptions(years);
        if (years.length) {
          setBurdenYear((current) =>
            years.includes(current) ? current : years[years.length - 1],
          );
        }
        setBurdenYearsReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setBurdenYearOptions([]);
        setBurdenYearsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [activeLayer, selectedIndicator]);

  const loadLgaSummary = useCallback(() => {
    setIsLoadingLga(true);
    setLgaError(null);
    getLgaGisSummary()
      .then(setLgaSummary)
      .catch(() => setLgaError("Couldn't load LGA data."))
      .finally(() => setIsLoadingLga(false));
  }, []);

  useEffect(() => {
    loadLgaSummary();
  }, [loadLgaSummary]);

  const loadWardSummary = useCallback((forLga: string) => {
    setIsLoadingWard(true);
    setWardError(null);
    getWardGisSummary(forLga)
      .then((data) => {
        setWardSummary(data);
        setWard("all");
      })
      .catch(() => setWardError("Couldn't load ward data."))
      .finally(() => setIsLoadingWard(false));
  }, []);

  useEffect(() => {
    if (lga === "all") {
      setWardSummary(null);
      setWardError(null);
      setWard("all");
      return;
    }
    loadWardSummary(lga);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lga]);

  const loadDiseaseBurden = useCallback((indicator: string, year: number) => {
    setIsLoadingBurden(true);
    setBurdenError(null);
    getDiseaseBurdenSimplified(indicator, year)
      .then(setDiseaseBurden)
      .catch(() => setBurdenError("Couldn't load disease-burden data."))
      .finally(() => setIsLoadingBurden(false));
  }, []);

  useEffect(() => {
    if (activeLayer !== "disease-burden" || !selectedIndicator) {
      setDiseaseBurden(null);
      setBurdenError(null);
      return;
    }
    if (!burdenYearsReady) return;
    loadDiseaseBurden(selectedIndicator, burdenYear);
  }, [
    activeLayer,
    selectedIndicator,
    burdenYear,
    burdenYearsReady,
    loadDiseaseBurden,
  ]);

  const lgaFeatures = useMemo(() => lgaSummary?.features ?? [], [lgaSummary]);
  const burdenMaxCases = useMemo(() => {
    if (!diseaseBurden?.features.length) return 0;
    return Math.max(
      0,
      ...diseaseBurden.features.map((feature) => feature.properties.totalCases),
    );
  }, [diseaseBurden]);
  const diseaseLayerLoading =
    activeLayer === "disease-burden" &&
    (isLoadingBurden || (!!selectedIndicator && !burdenYearsReady));
  const wardOptions = useMemo(
    () => (wardSummary?.features ?? []).map((f) => f.properties.ward).sort(),
    [wardSummary]
  );

  const rankedByFacility = useMemo(
    () => [...lgaFeatures].sort((a, b) => b.properties.facilityCount - a.properties.facilityCount),
    [lgaFeatures]
  );
  const top5 = rankedByFacility.slice(0, 5);
  const bottom5 = [...rankedByFacility].reverse().slice(0, 5);

  const totalPopulation = lgaSummary?.totalPopulation ?? 0;
  const totalFacilities = lgaSummary?.totalFacilities ?? 0;

  const selectedLga = lgaFeatures.find((f) => f.properties.lga === lga);

  const ownershipBreakdown = selectedLga
    ? selectedLga.properties.facilitiesByOwnership
    : lgaFeatures.reduce<Record<string, number>>((acc, f) => {
        for (const [key, value] of Object.entries(f.properties.facilitiesByOwnership)) {
          acc[key] = (acc[key] ?? 0) + value;
        }
        return acc;
      }, {});

  const resetFilters = () => {
    setLga("all");
    setWard("all");
    setShowWardBoundaries(false);
    setActiveLayer("population");
    if (indicators?.length) {
      setSelectedIndicator(indicators[0].slug);
    }
    setBurdenYear(new Date().getFullYear());
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
          geometry={(selectedLga?.geometry as Geometry | null | undefined) ?? null}
          fallbackCenter={NIGER_STATE_CENTER}
          fallbackZoom={8}
        />

        {activeLayer === "disease-burden" ? (
          diseaseBurden ? (
          <GeoJSON
            key={`burden-${selectedIndicator}-${burdenYear}-${burdenMaxCases}`}
            data={diseaseBurden as unknown as GeoJSON.FeatureCollection}
            style={(feature?: Feature) => {
              const props = feature?.properties as DiseaseBurdenGisProperties | undefined;
              if (!props) return {};
              const color = getDiseaseBurdenColor(props.totalCases, burdenMaxCases);
              const isSelected = props.lgaName === lga;
              return {
                color: isSelected ? "#111827" : "#ffffff",
                weight: isSelected ? 2.5 : 1,
                fillColor: color,
                fillOpacity: 0.75,
              };
            }}
            onEachFeature={(feature, layer) => {
              const props = feature.properties as DiseaseBurdenGisProperties;
              layer.bindPopup(buildDiseaseBurdenPopupHtml(props));
              layer.on("popupopen", () => {
                if (!selectedIndicator) return;
                getLgaTrend(selectedIndicator, props.lgaName)
                  .then((trend) => {
                    layer.setPopupContent(buildDiseaseBurdenPopupHtml(props, trend));
                  })
                  .catch(() => {
                    layer.setPopupContent(buildDiseaseBurdenPopupHtml(props, []));
                  });
              });
              layer.on("click", () => setLga(props.lgaName));
              layer.on("mouseover", () => {
                (layer as Path).setStyle({ weight: 3, color: "#0f172a" });
                (layer as Path).bringToFront();
              });
              layer.on("mouseout", () => {
                const isSelected = props.lgaName === lga;
                (layer as Path).setStyle({
                  weight: isSelected ? 2.5 : 1,
                  color: isSelected ? "#111827" : "#ffffff",
                });
              });
            }}
          />
          ) : null
        ) : lgaSummary ? (
          <GeoJSON
            key={`lga-${activeLayer}-${lgaSummary.generatedAt}`}
            data={lgaSummary as unknown as GeoJSON.FeatureCollection}
            style={(feature?: Feature) => {
              const props = feature?.properties as LgaGisProperties | undefined;
              if (!props) return {};
              const color =
                activeLayer === "population"
                  ? getPopulationDensityColor(props.populationDensity)
                  : getFacilityCountColor(props.facilityCount);
              const isSelected = props.lga === lga;
              return {
                color: isSelected ? "#111827" : "#ffffff",
                weight: isSelected ? 2.5 : 1,
                fillColor: color,
                fillOpacity: 0.65,
              };
            }}
            onEachFeature={(feature, layer) => {
              const props = feature.properties as LgaGisProperties;
              layer.bindPopup(buildLgaPopupHtml(props));
              layer.on("click", () => setLga(props.lga));
              layer.on("mouseover", () => {
                (layer as Path).setStyle({ weight: 3, color: "#0f172a" });
                (layer as Path).bringToFront();
              });
              layer.on("mouseout", () => {
                const isSelected = props.lga === lga;
                (layer as Path).setStyle({
                  weight: isSelected ? 2.5 : 1,
                  color: isSelected ? "#111827" : "#ffffff",
                });
              });
            }}
          />
        ) : null}

        {showWardBoundaries && wardSummary && activeLayer !== "disease-burden" && (
          <GeoJSON
            key={`ward-${activeLayer}-${lga}-${wardSummary.generatedAt}`}
            data={wardSummary as unknown as GeoJSON.FeatureCollection}
            style={(feature?: Feature) => {
              const props = feature?.properties as WardGisProperties | undefined;
              const isFacilityLayer = activeLayer === "facilities";
              return {
                color: "#111827",
                weight: 1,
                fillOpacity: isFacilityLayer ? 0.5 : 0,
                fillColor:
                  isFacilityLayer && props
                    ? getWardFacilityColor(props.facilityCount)
                    : undefined,
                dashArray: "4,3",
              };
            }}
            onEachFeature={(feature, layer) => {
              const props = feature.properties as WardGisProperties;
              layer.bindPopup(buildWardPopupHtml(props));
              layer.on("mouseover", () => (layer as Path).setStyle({ weight: 2.5 }));
              layer.on("mouseout", () => (layer as Path).setStyle({ weight: 1 }));
            }}
          />
        )}

        {stateBoundary?.geometry && (
          <GeoJSON
            key={`state-boundary-${stateBoundary.generatedAt}`}
            data={stateBoundary as unknown as GeoJSON.Feature}
            style={{ color: "#111827", weight: 1.5, fillOpacity: 0 }}
            interactive={false}
          />
        )}
      </MapContainer>

      {/* Filter toggle */}
      {!filterOpen && (
        <Button
          size="sm"
          className="absolute left-4 top-4 z-[1000] shadow-lg"
          onClick={() => setFilterOpen(true)}
        >
          <Filter className="size-4 mr-2" />
          Filters
        </Button>
      )}

      {/* Sliding filter panel */}
      <div
        className={cn(
          "absolute left-0 top-0 z-[1000] h-full w-80 transform border-r bg-background shadow-2xl transition-transform duration-300 flex flex-col",
          filterOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-semibold">Population & Facility Map</h2>
          <Button size="icon" variant="ghost" onClick={() => setFilterOpen(false)}>
            <X className="size-4" />
          </Button>
        </div>
        <div className="space-y-4 overflow-y-auto thin-scrollbar p-4 flex-1">
          {lgaError && <MapErrorBanner message={lgaError} onRetry={loadLgaSummary} />}

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              Map layer
              <HelpTooltip content="Population density colors each LGA by people per km². Facility density colors each LGA by health facility count. Disease burden colors each LGA by ingested case counts for the selected indicator." />
            </label>
            <div className="flex rounded-lg border">
              <Button
                type="button"
                size="sm"
                variant={activeLayer === "population" ? "default" : "ghost"}
                className={cn(
                  "flex-1 rounded-r-none transition-colors",
                  activeLayer === "population" && "rounded-l-lg"
                )}
                onClick={() => setActiveLayer("population")}
              >
                Population
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activeLayer === "facilities" ? "default" : "ghost"}
                className="flex-1 rounded-none border-l transition-colors"
                onClick={() => setActiveLayer("facilities")}
              >
                Facilities
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activeLayer === "disease-burden" ? "default" : "ghost"}
                className="flex-1 rounded-l-none border-l transition-colors"
                onClick={() => setActiveLayer("disease-burden")}
              >
                <Activity className="size-3.5 mr-1" />
                Disease
              </Button>
            </div>
          </div>

          {activeLayer === "disease-burden" && (
            <div className="space-y-3 border-t pt-3">
              {indicatorsFetched && !indicators?.length ? (
                <p className="text-xs text-muted-foreground">
                  No published warehouse indicators to map. Load analytics for a
                  dataset in Ingestion Ops, then return here.
                </p>
              ) : (
                <>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Indicator</label>
                <Select
                  value={selectedIndicator}
                  onValueChange={(v) => v && setSelectedIndicator(v)}
                  disabled={!indicators?.length}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select indicator" /></SelectTrigger>
                  <SelectContent>
                    {(indicators ?? []).map((ind) => (
                      <SelectItem key={ind.slug} value={ind.slug}>{ind.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Year
                  {burdenYearOptions.length > 0 && (
                    <span className="ml-1 font-normal">({burdenYear})</span>
                  )}
                </label>
                {burdenYearOptions.length > 1 ? (
                  <>
                    <input
                      type="range"
                      min={0}
                      max={burdenYearOptions.length - 1}
                      step={1}
                      value={Math.max(0, burdenYearOptions.indexOf(burdenYear))}
                      onChange={(e) => {
                        const idx = Number(e.target.value);
                        setBurdenYear(burdenYearOptions[idx] ?? burdenYear);
                      }}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>{burdenYearOptions[0]}</span>
                      <span>{burdenYearOptions[burdenYearOptions.length - 1]}</span>
                    </div>
                  </>
                ) : (
                  <Select
                    value={String(burdenYear)}
                    onValueChange={(v) => v && setBurdenYear(Number(v))}
                  >
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(burdenYearOptions.length ? burdenYearOptions : [burdenYear]).map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              {diseaseLayerLoading && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="size-3 animate-spin" /> Loading disease-burden…
                </p>
              )}
              {burdenError && (
                <MapErrorBanner
                  message={burdenError}
                  onRetry={() => loadDiseaseBurden(selectedIndicator, burdenYear)}
                />
              )}
              {!diseaseLayerLoading &&
              !burdenError &&
              diseaseBurden &&
              burdenMaxCases === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No published cases for this indicator in {burdenYear}. The map
                  uses grey for empty LGAs — pick another year or load analytics
                  first.
                </p>
              ) : null}
                </>
              )}
            </div>
          )}

          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Map Layers</p>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showWardBoundaries}
                onChange={(e) => setShowWardBoundaries(e.target.checked)}
                className="rounded"
                disabled={lga === "all"}
              />
              Ward boundaries
              <HelpTooltip content="Overlay ward boundaries for the selected LGA. Colored by facility count when the Facilities layer is active." />
            </label>
            {lga === "all" && (
              <p className="text-xs text-muted-foreground pl-6">Select an LGA to show its wards</p>
            )}
            {isLoadingWard && (
              <p className="text-xs text-muted-foreground pl-6 flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" /> Loading wards…
              </p>
            )}
            {wardError && (
              <MapErrorBanner
                message={wardError}
                onRetry={() => loadWardSummary(lga)}
                className="ml-6"
              />
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">LGA</label>
            <Select
              value={lga}
              onValueChange={(v) => v && setLga(v)}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder="All LGAs" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All LGAs</SelectItem>
                {NIGER_STATE_LGAS.map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Ward</label>
            <Select value={ward} onValueChange={(v) => v && setWard(v)} disabled={lga === "all" || wardOptions.length === 0}>
              <SelectTrigger className="w-full"><SelectValue placeholder="All wards" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All wards</SelectItem>
                {wardOptions.map((w) => (
                  <SelectItem key={w} value={w}>{w}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" className="w-full" onClick={resetFilters}>
            <RotateCcw className="size-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Population badge */}
      <div className="absolute right-4 top-4 z-[1000]">
        <Badge variant="secondary" className="gap-2 px-3 py-2 text-sm shadow-lg">
          <Users className="size-4" />
          Niger State Population: {(totalPopulation / 1_000_000).toFixed(1)}M
        </Badge>
      </div>

      {/* Summary panel */}
      {summaryOpen ? (
        <Card className="absolute right-4 top-16 z-[1000] w-72 shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">{selectedLga ? selectedLga.properties.lga : "Niger State"} Summary</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setSummaryOpen(false)}>
              Hide
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {lgaError ? (
              <MapErrorBanner message={lgaError} onRetry={loadLgaSummary} />
            ) : isLoadingLga ? (
              <CardSkeleton />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Population</p>
                    <p className="font-semibold">
                      {(selectedLga ? selectedLga.properties.population ?? 0 : totalPopulation).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Facilities</p>
                    <p className="font-semibold">
                      {(selectedLga ? selectedLga.properties.facilityCount : totalFacilities).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">LGAs</p>
                    <p className="font-semibold">{selectedLga ? 1 : 25}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Wards</p>
                    <p className="font-semibold">{ward === "all" ? (wardOptions.length || "—") : 1}</p>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Facilities by ownership</p>
                  <ul className="space-y-1">
                    {Object.entries(ownershipBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([key, value]) => (
                        <li key={key} className="flex justify-between">
                          <span>{key}</span>
                          <span className="font-medium">{value.toLocaleString()}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Button
          size="sm"
          variant="secondary"
          className="absolute right-4 top-16 z-[1000] shadow-lg"
          onClick={() => setSummaryOpen(true)}
        >
          Show Summary
        </Button>
      )}

      {/* Top/bottom LGAs by facility density */}
      {rankingOpen ? (
        <Card className={cn("absolute bottom-4 z-[1000] w-80 shadow-xl transition-[left]", filterOpen ? "left-[21rem]" : "left-4")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs">LGAs by Facility Count</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setRankingOpen(false)}>
              <ChevronDown className="size-4" />
              Hide
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {lgaError ? (
              <MapErrorBanner message={lgaError} onRetry={loadLgaSummary} />
            ) : isLoadingLga ? (
              <CardSkeleton />
            ) : (
              <>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-green-700 dark:text-green-400">Top 5</p>
                  <ul className="space-y-1 text-sm">
                    {top5.map((f) => (
                      <li key={f.properties.lga} className="flex justify-between">
                        <button
                          type="button"
                          className="hover:underline text-left"
                          onClick={() => setLga(f.properties.lga)}
                        >
                          {f.properties.lga}
                        </button>
                        <span className="font-medium">{f.properties.facilityCount.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Bottom 5</p>
                  <ul className="space-y-1 text-sm">
                    {bottom5.map((f) => (
                      <li key={f.properties.lga} className="flex justify-between">
                        <button
                          type="button"
                          className="hover:underline text-left"
                          onClick={() => setLga(f.properties.lga)}
                        >
                          {f.properties.lga}
                        </button>
                        <span className="font-medium">{f.properties.facilityCount.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Button
          size="sm"
          variant="secondary"
          className={cn("absolute bottom-4 z-[1000] shadow-lg transition-[left]", filterOpen ? "left-[21rem]" : "left-4")}
          onClick={() => setRankingOpen(true)}
        >
          <ChevronUp className="size-4 mr-1" />
          Show Rankings
        </Button>
      )}

      {/* Permanent legend */}
      <MapLegend
        title={
          activeLayer === "population"
            ? "Population Density"
            : activeLayer === "facilities"
              ? "Facility Count"
              : "Disease Burden (cases)"
        }
        items={
          activeLayer === "population"
            ? POPULATION_DENSITY_LEGEND
            : activeLayer === "facilities"
              ? FACILITY_DENSITY_LEGEND
              : diseaseBurdenLegendItems(burdenMaxCases)
        }
        className="absolute bottom-4 right-4 z-[1000]"
      />
    </div>
  );
}
