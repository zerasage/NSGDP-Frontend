"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Loader2, RotateCcw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getGisFacilities, type GisFacility } from "@/lib/api/gis";
import { NIGER_STATE_LGAS } from "@/lib/constants/core";
import { MapLegend, FACILITY_LEGEND } from "@/components/map/map-legend";
import { MapErrorBanner } from "@/components/map/map-error-banner";
import { MapTooltip } from "@/components/map/map-tooltip";
import { HelpTooltip } from "@/components/feedback/help-tooltip";
import { useStateBoundary } from "@/lib/hooks/useStateBoundary";
import { cn } from "@/lib/utils";
import type L from "leaflet";

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

// Built lazily (client-only) and cached by color so we don't allocate a new
// L.divIcon per marker on every render — this map can have thousands.
let facilityIconCache: Record<string, L.DivIcon> | null = null;
function getFacilityIcon(color: string): L.DivIcon {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Leaflet = require("leaflet") as typeof import("leaflet");
  if (!facilityIconCache) facilityIconCache = {};
  if (!facilityIconCache[color]) {
    facilityIconCache[color] = Leaflet.divIcon({
      className: "",
      html: `<span style="display:block;width:11px;height:11px;border-radius:50%;background:${color};border:1px solid white;box-shadow:0 0 1px rgba(0,0,0,0.6);"></span>`,
      iconSize: [11, 11],
      iconAnchor: [5, 5],
    });
  }
  return facilityIconCache[color];
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

const FACILITY_LEVELS = ["all", "Primary", "Secondary", "Tertiary"] as const;

function getFacilityLevelColor(level: string | null): string {
  switch (level) {
    case "Primary":
      return "#2563eb";
    case "Secondary":
      return "#7c3aed";
    case "Tertiary":
      return "#dc2626";
    default:
      return "#6b7280";
  }
}

function FacilitiesContent() {
  const searchParams = useSearchParams();
  const lgaFromUrl = searchParams.get("lga");
  const [mapReady, setMapReady] = useState(false);
  const [filterOpen, setFilterOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [lga, setLga] = useState("all");
  const [ward, setWard] = useState("all");
  const [level, setLevel] = useState<(typeof FACILITY_LEVELS)[number]>("all");

  const [allFacilities, setAllFacilities] = useState<GisFacility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: stateBoundary } = useStateBoundary();

  useEffect(() => {
    configureLeafletIcons();
    setMapReady(true);
  }, []);

  const loadFacilities = useCallback(() => {
    setIsLoading(true);
    setError(null);
    getGisFacilities()
      .then(setAllFacilities)
      .catch(() => setError("Couldn't load facilities."))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    loadFacilities();
  }, [loadFacilities]);

  useEffect(() => {
    if (!lgaFromUrl) return;
    const match = NIGER_STATE_LGAS.find(
      (name) => name.toLowerCase() === lgaFromUrl.toLowerCase(),
    );
    if (match) setLga(match);
  }, [lgaFromUrl]);

  useEffect(() => {
    setWard("all");
  }, [lga]);

  const lgaCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of allFacilities) counts.set(f.lga, (counts.get(f.lga) ?? 0) + 1);
    return counts;
  }, [allFacilities]);

  const lgaScoped = useMemo(
    () => (lga === "all" ? allFacilities : allFacilities.filter((f) => f.lga === lga)),
    [allFacilities, lga]
  );

  const wardOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of lgaScoped) {
      if (!f.ward) continue;
      counts.set(f.ward, (counts.get(f.ward) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [lgaScoped]);

  const filteredFacilities = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lgaScoped.filter((f) => {
      if (ward !== "all" && f.ward !== ward) return false;
      if (level !== "all" && f.level !== level) return false;
      if (q && !f.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [lgaScoped, ward, level, query]);

  const flyToPositions = useMemo(() => {
    const source = ward !== "all" ? lgaScoped.filter((f) => f.ward === ward) : lgaScoped;
    return source
      .filter((f): f is GisFacility & { lat: number; lng: number } => f.lat != null && f.lng != null)
      .map((f) => [f.lat, f.lng] as [number, number]);
  }, [lgaScoped, ward]);

  const resetFilters = () => {
    setQuery("");
    setLga("all");
    setWard("all");
    setLevel("all");
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
          positions={flyToPositions}
          fallbackCenter={NIGER_STATE_CENTER}
          fallbackZoom={8}
        />

        <MarkerClusterGroup chunkedLoading maxClusterRadius={45}>
          {filteredFacilities
            .filter((f) => f.lat != null && f.lng != null)
            .map((facility, i) => (
              <Marker
                key={`${facility.name}-${facility.lga}-${i}`}
                position={[facility.lat as number, facility.lng as number]}
                icon={getFacilityIcon(getFacilityLevelColor(facility.level))}
              >
                <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                  <span className="text-xs font-medium">{facility.name}</span>
                </Tooltip>
                <Popup>
                  <MapTooltip
                    title={facility.name}
                    rows={[
                      { label: "LGA", value: facility.lga },
                      { label: "Ward", value: facility.ward ?? "—" },
                      { label: "Level", value: facility.level ?? "Unknown" },
                      { label: "Ownership", value: facility.ownership ?? "Unknown" },
                    ]}
                    className="border-0 shadow-none p-0 min-w-0 bg-transparent backdrop-blur-none"
                  />
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
          "absolute left-0 top-0 z-[1000] flex h-full w-80 transform flex-col border-r bg-background shadow-2xl transition-transform duration-300",
          filterOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="font-semibold">Health Facility Finder</h2>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Loading…" : `${filteredFacilities.length.toLocaleString()} facilities`}
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={() => setFilterOpen(false)}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 thin-scrollbar">
          {error && <MapErrorBanner message={error} onRetry={loadFacilities} />}

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
                  placeholder="Search facilities…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">LGA</label>
                <Select
                  value={lga}
                  onValueChange={(v) => v && setLga(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All LGAs">
                      {lga === "all"
                        ? `All LGAs (${allFacilities.length.toLocaleString()})`
                        : `${lga} (${(lgaCounts.get(lga) ?? 0).toLocaleString()})`}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All LGAs ({allFacilities.length.toLocaleString()})</SelectItem>
                    {NIGER_STATE_LGAS.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name} ({(lgaCounts.get(name) ?? 0).toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Ward</label>
                <Select
                  value={ward}
                  onValueChange={(v) => v && setWard(v)}
                  disabled={lga === "all" || wardOptions.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All wards">
                      {ward === "all"
                        ? "All wards"
                        : `${ward} (${(wardOptions.find(([w]) => w === ward)?.[1] ?? 0).toLocaleString()})`}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All wards</SelectItem>
                    {wardOptions.map(([w, count]) => (
                      <SelectItem key={w} value={w}>
                        {w} ({count.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {lga === "all" && (
                  <p className="mt-1.5 text-xs text-muted-foreground">Select an LGA to filter by ward</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  Facility level
                  <HelpTooltip content="Filter facilities by level. Blue = Primary, Purple = Secondary, Red = Tertiary." />
                </label>
                <Select
                  value={level}
                  onValueChange={(v) => v && setLevel(v as (typeof FACILITY_LEVELS)[number])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All levels">
                      {level === "all" ? "All levels" : level}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {FACILITY_LEVELS.map((lvl) => (
                      <SelectItem key={lvl} value={lvl}>
                        {lvl === "all" ? "All levels" : lvl}
                      </SelectItem>
                    ))}
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
      </div>

      <MapLegend
        title="Facility Levels"
        items={FACILITY_LEGEND}
        className="absolute bottom-4 right-4 z-[1000]"
      />
    </div>
  );
}

export default function FacilitiesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <FacilitiesContent />
    </Suspense>
  );
}
