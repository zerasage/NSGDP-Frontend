"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { getGisSettlements, type GisSettlement, type SettlementFilters } from "@/lib/api/gis";
import { NIGER_STATE_LGAS } from "@/lib/constants/core";
import { MapLegend, SETTLEMENT_ACCESS_LEGEND } from "@/components/map/map-legend";
import { MapErrorBanner } from "@/components/map/map-error-banner";
import { HelpTooltip } from "@/components/feedback/help-tooltip";
import { useStateBoundary } from "@/lib/hooks/useStateBoundary";
import { cn } from "@/lib/utils";

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
const ZoomControl = dynamic(
  () => import("react-leaflet").then((mod) => mod.ZoomControl),
  { ssr: false }
);
const GeoJSON = dynamic(
  () => import("react-leaflet").then((mod) => mod.GeoJSON),
  { ssr: false }
);
const FlyToBounds = dynamic(
  () => import("@/components/map/fly-to-bounds").then((mod) => mod.FlyToBounds),
  { ssr: false }
);
const SettlementMarkersLayer = dynamic(
  () =>
    import("@/components/map/settlement-markers-layer").then(
      (mod) => mod.SettlementMarkersLayer
    ),
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

const EMPTY_FLAGS: Record<FlagKey, boolean> = {
  hardToReach: false,
  securityCompromised: false,
  highRisk: false,
  slum: false,
  riverine: false,
  nomadic: false,
  border: false,
};

function buildFetchScope(lga: string | null, ward: string): SettlementFilters | null {
  if (!lga) return null;
  const filters: SettlementFilters = {};
  if (lga !== "all") filters.lga = lga;
  if (ward !== "all") filters.ward = ward;
  return filters;
}

function applyClientFilters(
  settlements: GisSettlement[],
  query: string,
  accessibility: (typeof ACCESSIBILITY_OPTIONS)[number],
  activeFlags: Record<FlagKey, boolean>
): GisSettlement[] {
  let result = settlements;
  if (accessibility !== "all") {
    result = result.filter((s) => s.accessibility === accessibility);
  }
  for (const { key } of FLAG_OPTIONS) {
    if (activeFlags[key]) {
      result = result.filter((s) => s[key]);
    }
  }
  const q = query.trim().toLowerCase();
  if (q) {
    result = result.filter((s) => s.name.toLowerCase().includes(q));
  }
  return result;
}

export default function SettlementsPage() {
  const [mapReady, setMapReady] = useState(false);
  const [filterOpen, setFilterOpen] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [lga, setLga] = useState<string | null>(null);
  const [ward, setWard] = useState("all");
  const [accessibility, setAccessibility] = useState<(typeof ACCESSIBILITY_OPTIONS)[number]>("all");
  const [activeFlags, setActiveFlags] = useState<Record<FlagKey, boolean>>(EMPTY_FLAGS);

  const [settlements, setSettlements] = useState<GisSettlement[]>([]);
  const [isLoadingScope, setIsLoadingScope] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapSettlements, setMapSettlements] = useState<GisSettlement[]>([]);
  const fetchGeneration = useRef(0);
  const { data: stateBoundary } = useStateBoundary();

  const fetchScope = useMemo(() => buildFetchScope(lga, ward), [lga, ward]);

  useEffect(() => {
    configureLeafletIcons();
    setMapReady(true);
  }, []);

  const loadSettlements = useCallback((filters: SettlementFilters) => {
    const generation = ++fetchGeneration.current;
    setIsLoadingScope(true);
    setError(null);
    getGisSettlements(filters)
      .then((data) => {
        if (generation !== fetchGeneration.current) return;
        setSettlements(data);
      })
      .catch(() => {
        if (generation !== fetchGeneration.current) return;
        setError("Couldn't load settlements.");
        setSettlements([]);
      })
      .finally(() => {
        if (generation !== fetchGeneration.current) return;
        setIsLoadingScope(false);
      });
  }, []);

  useEffect(() => {
    if (!fetchScope) {
      setSettlements([]);
      setIsLoadingScope(false);
      return;
    }
    loadSettlements(fetchScope);
  }, [fetchScope, loadSettlements]);

  const lgaCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of settlements) counts.set(s.lga, (counts.get(s.lga) ?? 0) + 1);
    return counts;
  }, [settlements]);

  const wardOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of settlements) {
      if (!s.ward) continue;
      counts.set(s.ward, (counts.get(s.ward) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [settlements]);

  const filteredSettlements = useMemo(
    () => applyClientFilters(settlements, query, accessibility, activeFlags),
    [settlements, query, accessibility, activeFlags]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setMapSettlements(filteredSettlements), 120);
    return () => window.clearTimeout(timer);
  }, [filteredSettlements]);

  const flyToPositions = useMemo(() => {
    const source =
      ward !== "all" ? mapSettlements.filter((s) => s.ward === ward) : mapSettlements;
    return source.map((s) => [s.lat, s.lng] as [number, number]);
  }, [mapSettlements, ward]);

  const mapFlyKey = `${lga ?? "none"}|${ward}`;

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
    setLga(null);
    setWard("all");
    setAccessibility("all");
    setActiveFlags(EMPTY_FLAGS);
  };

  const showAllLgaCounts = lga === "all" && settlements.length > 0;
  const scopeLabel = lga
    ? lga === "all"
      ? `All LGAs (${settlements.length.toLocaleString()})`
      : `${lga} (${(lgaCounts.get(lga) ?? 0).toLocaleString()})`
    : null;

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

        {lga && (
          <FlyToBounds
            flyKey={mapFlyKey}
            positions={flyToPositions}
            fallbackCenter={NIGER_STATE_CENTER}
            fallbackZoom={8}
          />
        )}

        {mapSettlements.length > 0 && (
          <SettlementMarkersLayer settlements={mapSettlements} />
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

      {isLoadingScope && (
        <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center bg-background/30">
          <div className="flex items-center gap-2 rounded-lg bg-background px-4 py-2 shadow-lg">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading settlements…</span>
          </div>
        </div>
      )}

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
            <h2 className="flex items-center gap-1.5 font-semibold">
              Settlement Access Map
              <HelpTooltip content="Settlements from the NSPHCDA Master List (MLoS), tagged for accessibility, security and outreach planning. Select an LGA to load the map — All LGAs loads ~19k points and is slower. Accessibility and vulnerability flags filter instantly without reloading. Ward filter requires a single LGA." />
            </h2>
            <p className="text-xs text-muted-foreground">
              {!lga
                ? "Select an LGA to begin"
                : isLoadingScope
                  ? "Loading…"
                  : `${filteredSettlements.length.toLocaleString()} settlements`}
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={() => setFilterOpen(false)}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 thin-scrollbar">
          {error && fetchScope && (
            <MapErrorBanner message={error} onRetry={() => loadSettlements(fetchScope)} />
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search settlements…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              disabled={!lga}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">LGA</label>
            <Select
              value={lga ?? undefined}
              onValueChange={(v) => {
                if (!v) return;
                setLga(v);
                setWard("all");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select LGA">
                  {scopeLabel ?? "Select LGA"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  All LGAs{showAllLgaCounts ? ` (${settlements.length.toLocaleString()})` : " (~19k)"}
                </SelectItem>
                {NIGER_STATE_LGAS.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                    {showAllLgaCounts ? ` (${(lgaCounts.get(name) ?? 0).toLocaleString()})` : ""}
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
              disabled={!lga || lga === "all" || wardOptions.length === 0}
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
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Accessibility
            </label>
            <Select
              value={accessibility}
              onValueChange={(v) =>
                v && setAccessibility(v as (typeof ACCESSIBILITY_OPTIONS)[number])
              }
              disabled={!lga}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All accessibility levels">
                  {accessibility === "all" ? "All accessibility levels" : accessibility}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ACCESSIBILITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt === "all" ? "All accessibility levels" : opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              Vulnerability flags
              <HelpTooltip content="Show only settlements that match each checked attribute." />
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {FLAG_OPTIONS.map(({ key, label }) => (
                <label key={key} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={activeFlags[key]}
                    disabled={!lga}
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
            Reset filters
          </Button>
        </div>
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
            {!lga ? (
              <p className="text-xs text-muted-foreground">Select an LGA to see summary stats.</p>
            ) : isLoadingScope ? (
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
