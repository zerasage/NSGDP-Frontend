"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ChevronDown, ChevronUp, Filter, Loader2, Users, X } from "lucide-react";
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
import {
  getLgaGisSummary,
  getWardGisSummary,
  type LgaGisFeatureCollection,
  type WardGisFeatureCollection,
  type LgaGisProperties,
  type WardGisProperties,
} from "@/lib/api/gis";
import { NIGER_STATE_LGAS } from "@/lib/constants/core";
import {
  MapLegend,
  POPULATION_DENSITY_LEGEND,
  FACILITY_DENSITY_LEGEND,
} from "@/components/map/map-legend";
import { HelpTooltip } from "@/components/feedback/help-tooltip";
import { cn } from "@/lib/utils";
import type { Feature } from "geojson";

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

const NIGER_STATE_CENTER: [number, number] = [9.9319, 6.547];
const NIGER_STATE_BOUNDS: [[number, number], [number, number]] = [
  [8.5, 3.5],
  [11.5, 8.5],
];

type ActiveLayer = "population" | "facilities";

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

export default function GisMappingPage() {
  const [mapReady, setMapReady] = useState(false);
  const [filterOpen, setFilterOpen] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [rankingOpen, setRankingOpen] = useState(true);
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>("population");
  const [lga, setLga] = useState("all");
  const [ward, setWard] = useState("all");
  const [showWardBoundaries, setShowWardBoundaries] = useState(false);

  const [lgaSummary, setLgaSummary] = useState<LgaGisFeatureCollection | null>(null);
  const [wardSummary, setWardSummary] = useState<WardGisFeatureCollection | null>(null);
  const [isLoadingLga, setIsLoadingLga] = useState(true);
  const [isLoadingWard, setIsLoadingWard] = useState(false);

  useEffect(() => {
    configureLeafletIcons();
    setMapReady(true);
  }, []);

  useEffect(() => {
    setIsLoadingLga(true);
    getLgaGisSummary()
      .then(setLgaSummary)
      .finally(() => setIsLoadingLga(false));
  }, []);

  useEffect(() => {
    if (lga === "all") {
      setWardSummary(null);
      setWard("all");
      return;
    }
    setIsLoadingWard(true);
    getWardGisSummary(lga)
      .then((data) => {
        setWardSummary(data);
        setWard("all");
      })
      .finally(() => setIsLoadingWard(false));
  }, [lga]);

  const lgaFeatures = useMemo(() => lgaSummary?.features ?? [], [lgaSummary]);
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

        {lgaSummary && (
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
            }}
          />
        )}

        {showWardBoundaries && wardSummary && (
          <GeoJSON
            key={`ward-${lga}-${wardSummary.generatedAt}`}
            data={wardSummary as unknown as GeoJSON.FeatureCollection}
            style={{
              color: "#111827",
              weight: 1,
              fillOpacity: 0,
              dashArray: "4,3",
            }}
            onEachFeature={(feature, layer) => {
              const props = feature.properties as WardGisProperties;
              layer.bindPopup(buildWardPopupHtml(props));
            }}
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
          "absolute left-0 top-0 z-[1000] h-full w-80 transform bg-background/95 shadow-xl backdrop-blur transition-transform duration-300",
          filterOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-semibold">Population & Facility Map</h2>
          <Button size="icon" variant="ghost" onClick={() => setFilterOpen(false)}>
            <X className="size-4" />
          </Button>
        </div>
        <div className="space-y-4 overflow-y-auto p-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              Map layer
              <HelpTooltip content="Population density colors each LGA by people per km². Facility density colors each LGA by number of health facilities." />
            </label>
            <div className="flex rounded-lg border">
              <Button
                type="button"
                size="sm"
                variant={activeLayer === "population" ? "default" : "ghost"}
                className={cn("flex-1 rounded-r-none", activeLayer === "population" && "rounded-l-lg")}
                onClick={() => setActiveLayer("population")}
              >
                Population
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activeLayer === "facilities" ? "default" : "ghost"}
                className="flex-1 rounded-l-none border-l"
                onClick={() => setActiveLayer("facilities")}
              >
                Facilities
              </Button>
            </div>
          </div>

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
              <HelpTooltip content="Overlay ward boundaries for the selected LGA." />
            </label>
            {lga === "all" && (
              <p className="text-xs text-muted-foreground pl-6">Select an LGA to show its wards</p>
            )}
            {isLoadingWard && (
              <p className="text-xs text-muted-foreground pl-6 flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" /> Loading wards…
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">LGA</label>
            <Select
              value={lga}
              onValueChange={(v) => v && setLga(v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
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
              <SelectTrigger><SelectValue placeholder="Select ward" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All wards</SelectItem>
                {wardOptions.map((w) => (
                  <SelectItem key={w} value={w}>{w}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
        <Card className="absolute right-4 top-16 z-[1000] w-72 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">{selectedLga ? selectedLga.properties.lga : "Niger State"} Summary</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setSummaryOpen(false)}>
              Hide
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {isLoadingLga ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
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
        <Card className="absolute bottom-4 left-4 z-[1000] w-80 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs">LGAs by Facility Count</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setRankingOpen(false)}>
              <ChevronDown className="size-4" />
              Hide
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoadingLga ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
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
          className="absolute bottom-4 left-4 z-[1000] shadow-lg"
          onClick={() => setRankingOpen(true)}
        >
          <ChevronUp className="size-4 mr-1" />
          Show Rankings
        </Button>
      )}

      {/* Permanent legend */}
      <MapLegend
        title={activeLayer === "population" ? "Population Density" : "Facility Count"}
        items={activeLayer === "population" ? POPULATION_DENSITY_LEGEND : FACILITY_DENSITY_LEGEND}
        className="absolute bottom-4 right-4 z-[1000]"
      />
    </div>
  );
}
