"use client";

import { useEffect, useMemo, useState } from "react";
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
import { getGisFacilities, type GisFacility } from "@/lib/api/gis";
import { NIGER_STATE_LGAS } from "@/lib/constants/core";
import { MapLegend, FACILITY_LEGEND } from "@/components/map/map-legend";
import { MapTooltip } from "@/components/map/map-tooltip";
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
const CircleMarker = dynamic(
  () => import("react-leaflet").then((mod) => mod.CircleMarker),
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

export default function FacilitiesPage() {
  const [mapReady, setMapReady] = useState(false);
  const [filterOpen, setFilterOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [lga, setLga] = useState("all");
  const [ward, setWard] = useState("all");
  const [level, setLevel] = useState<(typeof FACILITY_LEVELS)[number]>("all");

  const [facilities, setFacilities] = useState<GisFacility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: stateBoundary } = useStateBoundary();

  useEffect(() => {
    configureLeafletIcons();
    setMapReady(true);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    getGisFacilities(lga === "all" ? undefined : { lga })
      .then((data) => {
        setFacilities(data);
        setWard("all");
      })
      .finally(() => setIsLoading(false));
  }, [lga]);

  const wardOptions = useMemo(
    () => Array.from(new Set(facilities.map((f) => f.ward).filter((w): w is string => Boolean(w)))).sort(),
    [facilities]
  );

  const filteredFacilities = useMemo(() => {
    const q = query.trim().toLowerCase();
    return facilities.filter((f) => {
      if (ward !== "all" && f.ward !== ward) return false;
      if (level !== "all" && f.level !== level) return false;
      if (q && !f.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [facilities, ward, level, query]);

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
        {filteredFacilities
          .filter((f) => f.lat != null && f.lng != null)
          .map((facility, i) => (
            <CircleMarker
              key={`${facility.name}-${facility.lga}-${i}`}
              center={[facility.lat as number, facility.lng as number]}
              radius={6}
              pathOptions={{
                color: getFacilityLevelColor(facility.level),
                fillColor: getFacilityLevelColor(facility.level),
                fillOpacity: 0.85,
                weight: 1,
              }}
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
            </CircleMarker>
          ))}

        {stateBoundary?.geometry && (
          <GeoJSON
            key={`state-boundary-${stateBoundary.generatedAt}`}
            data={stateBoundary as unknown as GeoJSON.Feature}
            style={{ color: "#111827", weight: 3, fillOpacity: 0 }}
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
          "absolute left-0 top-0 z-[1000] h-full w-80 transform bg-background/95 shadow-xl backdrop-blur transition-transform duration-300",
          filterOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="font-semibold">Health Facility Finder</h2>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Loading…" : `${filteredFacilities.length} Facilities`}
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={() => setFilterOpen(false)}>
            <X className="size-4" />
          </Button>
        </div>

        <Card className="m-4 border-0 shadow-none">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-sm">
              {isLoading ? "Loading…" : `${filteredFacilities.length} Facilities`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-0">
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
                onValueChange={(v) => {
                  if (v) setLga(v);
                }}
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
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                Facility level
                <HelpTooltip content="Filter facilities by level. Blue = Primary, Purple = Secondary, Red = Tertiary." />
              </label>
              <Select
                value={level}
                onValueChange={(v) => v && setLevel(v as (typeof FACILITY_LEVELS)[number])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FACILITY_LEVELS.map((lvl) => (
                    <SelectItem key={lvl} value={lvl}>
                      {lvl === "all" ? "All Levels" : lvl}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" className="w-full" onClick={resetFilters}>
              <RotateCcw className="size-4 mr-2" />
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      </div>

      <MapLegend
        title="Facility Levels"
        items={FACILITY_LEGEND}
        className="absolute bottom-4 right-4 z-[1000]"
      />
    </div>
  );
}
