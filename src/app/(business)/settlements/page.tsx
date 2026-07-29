"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getGisSettlements, type GisSettlement } from "@/lib/api/gis";
import { NIGER_STATE_LGAS } from "@/lib/constants/core";
import { MapLegend, SETTLEMENT_ACCESS_LEGEND } from "@/components/map/map-legend";
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

// Built lazily (client-only, after configureLeafletIcons has already loaded
// Leaflet) and cached by color so we don't allocate a new L.divIcon per
// marker on every render — this map can have thousands of markers.
let settlementIconCache: Record<string, L.DivIcon> | null = null;
function getSettlementIcon(color: string): L.DivIcon {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Leaflet = require("leaflet") as typeof import("leaflet");
  if (!settlementIconCache) settlementIconCache = {};
  if (!settlementIconCache[color]) {
    settlementIconCache[color] = Leaflet.divIcon({
      className: "",
      html: `<span style="display:block;width:10px;height:10px;border-radius:50%;background:${color};border:1px solid white;box-shadow:0 0 1px rgba(0,0,0,0.6);"></span>`,
      iconSize: [10, 10],
      iconAnchor: [5, 5],
    });
  }
  return settlementIconCache[color];
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

const ACCESSIBILITY_OPTIONS = [
  "all",
  "Fully Accessible",
  "Partially Accessible",
  "Inaccessible",
] as const;

function getAccessibilityColor(status: string | null): string {
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

type FlagKey =
  | "hardToReach"
  | "securityCompromised"
  | "highRisk"
  | "slum"
  | "riverine"
  | "nomadic"
  | "border";

const FLAG_OPTIONS: Array<{ key: FlagKey; label: string }> = [
  { key: "hardToReach", label: "Hard to reach" },
  { key: "securityCompromised", label: "Security compromised" },
  { key: "highRisk", label: "High risk" },
  { key: "slum", label: "Slum" },
  { key: "riverine", label: "Riverine" },
  { key: "nomadic", label: "Nomadic" },
  { key: "border", label: "Border settlement" },
];

export default function SettlementsPage() {
  const [mapReady, setMapReady] = useState(false);
  const [filterOpen, setFilterOpen] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [lga, setLga] = useState("all");
  const [ward, setWard] = useState("all");
  const [accessibility, setAccessibility] = useState<(typeof ACCESSIBILITY_OPTIONS)[number]>("all");
  const [activeFlags, setActiveFlags] = useState<Record<FlagKey, boolean>>({
    hardToReach: false,
    securityCompromised: false,
    highRisk: false,
    slum: false,
    riverine: false,
    nomadic: false,
    border: false,
  });

  const [allSettlements, setAllSettlements] = useState<GisSettlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: stateBoundary } = useStateBoundary();

  useEffect(() => {
    configureLeafletIcons();
    setMapReady(true);
  }, []);

  const loadSettlements = useCallback(() => {
    setIsLoading(true);
    setError(null);
    getGisSettlements({})
      .then(setAllSettlements)
      .catch(() => setError("Couldn't load settlements."))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    loadSettlements();
  }, [loadSettlements]);

  useEffect(() => {
    setWard("all");
  }, [lga]);

  const lgaScoped = useMemo(
    () => (lga === "all" ? allSettlements : allSettlements.filter((s) => s.lga === lga)),
    [allSettlements, lga]
  );

  const wardOptions = useMemo(
    () => Array.from(new Set(lgaScoped.map((s) => s.ward).filter((w): w is string => Boolean(w)))).sort(),
    [lgaScoped]
  );

  const filteredSettlements = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lgaScoped.filter((s) => {
      if (ward !== "all" && s.ward !== ward) return false;
      if (accessibility !== "all" && s.accessibility !== accessibility) return false;
      if (activeFlags.hardToReach && !s.hardToReach) return false;
      if (activeFlags.securityCompromised && !s.securityCompromised) return false;
      if (activeFlags.highRisk && !s.highRisk) return false;
      if (activeFlags.slum && !s.slum) return false;
      if (activeFlags.riverine && !s.riverine) return false;
      if (activeFlags.nomadic && !s.nomadic) return false;
      if (activeFlags.border && !s.border) return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [lgaScoped, ward, accessibility, activeFlags, query]);

  const flyToPositions = useMemo(() => {
    const source = ward !== "all" ? lgaScoped.filter((s) => s.ward === ward) : lgaScoped;
    return source.map((s) => [s.lat, s.lng] as [number, number]);
  }, [lgaScoped, ward]);

  const summary = useMemo(() => {
    return filteredSettlements.reduce(
      (acc, s) => {
        acc.population += s.population ?? 0;
        if (s.hardToReach) acc.hardToReach += 1;
        if (s.securityCompromised) acc.securityCompromised += 1;
        if (s.accessibility === "Inaccessible") acc.inaccessible += 1;
        return acc;
      },
      { population: 0, hardToReach: 0, securityCompromised: 0, inaccessible: 0 }
    );
  }, [filteredSettlements]);

  const resetFilters = () => {
    setQuery("");
    setLga("all");
    setWard("all");
    setAccessibility("all");
    setActiveFlags({
      hardToReach: false,
      securityCompromised: false,
      highRisk: false,
      slum: false,
      riverine: false,
      nomadic: false,
      border: false,
    });
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

        <MarkerClusterGroup chunkedLoading maxClusterRadius={50}>
          {filteredSettlements.map((s, i) => (
            <Marker
              key={`${s.name}-${s.lga}-${s.ward}-${i}`}
              position={[s.lat, s.lng]}
              icon={getSettlementIcon(getAccessibilityColor(s.accessibility))}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                <span className="text-xs font-medium">{s.name}</span>
              </Tooltip>
              <Popup>
                <MapTooltip
                  title={s.name}
                  rows={[
                    { label: "LGA", value: s.lga },
                    { label: "Ward", value: s.ward ?? "—" },
                    { label: "Accessibility", value: s.accessibility ?? "Unknown" },
                    { label: "Population", value: s.population != null ? s.population.toLocaleString() : "—" },
                    { label: "Hard to reach", value: s.hardToReach ? "Yes" : "No" },
                    { label: "Security compromised", value: s.securityCompromised ? "Yes" : "No" },
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
          "absolute left-0 top-0 z-[1000] h-full w-80 transform border-r bg-background shadow-2xl transition-transform duration-300 overflow-y-auto thin-scrollbar",
          filterOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="font-semibold">Settlement Access Map</h2>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Loading…" : `${filteredSettlements.length} Settlements`}
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={() => setFilterOpen(false)}>
            <X className="size-4" />
          </Button>
        </div>

        <Card className="m-4 border-0 shadow-none">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-sm flex items-center gap-1.5">
              Settlements
              <HelpTooltip content="Individual settlements from the NSPHCDA Master List of Settlements (MLoS), tagged for accessibility, security and outreach planning." />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-0">
            {error && <MapErrorBanner message={error} onRetry={loadSettlements} />}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">LGA</label>
              <Select value={lga} onValueChange={(v) => v && setLga(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All LGAs ({allSettlements.length.toLocaleString()})</SelectItem>
                  {NIGER_STATE_LGAS.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoading && (
              <div className="space-y-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search settlements…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
                disabled={allSettlements.length === 0}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Ward</label>
              <Select value={ward} onValueChange={(v) => v && setWard(v)} disabled={wardOptions.length === 0}>
                <SelectTrigger><SelectValue placeholder="All wards" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All wards</SelectItem>
                  {wardOptions.map((w) => (
                    <SelectItem key={w} value={w}>{w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Accessibility</label>
              <Select
                value={accessibility}
                onValueChange={(v) => v && setAccessibility(v as (typeof ACCESSIBILITY_OPTIONS)[number])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACCESSIBILITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt === "all" ? "All" : opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                Vulnerability flags
                <HelpTooltip content="Filter to settlements matching any of the checked attributes." />
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {FLAG_OPTIONS.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeFlags[key]}
                      onChange={(e) =>
                        setActiveFlags((prev) => ({ ...prev, [key]: e.target.checked }))
                      }
                      className="rounded"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={resetFilters}>
              <RotateCcw className="size-4 mr-2" />
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      </div>

      {summaryOpen ? (
        <Card className="absolute right-4 top-4 z-[1000] w-72 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Summary</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setSummaryOpen(false)}>
              Hide
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Settlements</p>
                  <p className="font-semibold">{filteredSettlements.length.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Population</p>
                  <p className="font-semibold">{summary.population.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hard to reach</p>
                  <p className="font-semibold">{summary.hardToReach.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Inaccessible</p>
                  <p className="font-semibold">{summary.inaccessible.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Security compromised</p>
                  <p className="font-semibold">{summary.securityCompromised.toLocaleString()}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Button
          size="sm"
          variant="secondary"
          className="absolute right-4 top-4 z-[1000] shadow-lg"
          onClick={() => setSummaryOpen(true)}
        >
          Show Summary
        </Button>
      )}

      <MapLegend
        title="Accessibility"
        items={SETTLEMENT_ACCESS_LEGEND}
        className="absolute bottom-4 right-4 z-[1000]"
      />
    </div>
  );
}
