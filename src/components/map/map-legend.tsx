import { cn } from "@/lib/utils";

interface LegendItem {
  label: string;
  color: string;
  description?: string;
}

interface MapLegendProps {
  title: string;
  items: LegendItem[];
  unit?: string;
  type?: "circle" | "gradient";
  className?: string;
}

export function MapLegend({ title, items, unit, type = "circle", className }: MapLegendProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-background/95 backdrop-blur p-3 shadow-md min-w-40",
        className
      )}
      aria-label={`Map legend: ${title}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {title}
        {unit && <span className="normal-case font-normal ml-1">({unit})</span>}
      </p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.label} className="flex items-start gap-2">
            <span
              className={cn(
                "shrink-0 mt-0.5",
                type === "circle" ? "rounded-full" : "rounded"
              )}
              style={{
                width: 12,
                height: 12,
                backgroundColor: item.color,
                minWidth: 12,
                minHeight: 12,
              }}
              aria-hidden
            />
            <div>
              <span className="text-xs font-medium">{item.label}</span>
              {item.description && (
                <p className="text-xs text-muted-foreground leading-tight">{item.description}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const DISEASE_NO_DATA_COLOR = "#d1d5db";
const DISEASE_SCALE = ["#fde68a", "#f59e0b", "#ea580c", "#b91c1c"] as const;

/** Choropleth fill for LGA case counts. Zero uses grey so Disease never looks like Population. */
export function getDiseaseBurdenColor(cases: number, maxCases: number): string {
  if (cases <= 0 || maxCases <= 0) return DISEASE_NO_DATA_COLOR;
  const t = cases / maxCases;
  if (t > 0.75) return DISEASE_SCALE[3];
  if (t > 0.5) return DISEASE_SCALE[2];
  if (t > 0.25) return DISEASE_SCALE[1];
  return DISEASE_SCALE[0];
}

export function diseaseBurdenLegendItems(maxCases: number): LegendItem[] {
  if (maxCases <= 0) {
    return [
      {
        label: "No published cases",
        color: DISEASE_NO_DATA_COLOR,
        description: "Warehouse has no values for this indicator and year",
      },
    ];
  }
  const cut = (fraction: number) => Math.max(1, Math.round(maxCases * fraction));
  return [
    { label: `Highest (>${cut(0.75)} cases)`, color: DISEASE_SCALE[3] },
    { label: `High (${cut(0.5)}–${cut(0.75)})`, color: DISEASE_SCALE[2] },
    { label: `Moderate (${cut(0.25)}–${cut(0.5)})`, color: DISEASE_SCALE[1] },
    { label: `Lower (1–${cut(0.25)})`, color: DISEASE_SCALE[0] },
    { label: "No published cases", color: DISEASE_NO_DATA_COLOR },
  ];
}

/** Pre-built legend for facility maps */
export const FACILITY_LEGEND: LegendItem[] = [
  { label: "Primary",   color: "#2563eb" },
  { label: "Secondary", color: "#7c3aed" },
  { label: "Tertiary",  color: "#dc2626" },
];

/** Pre-built legend for the LGA population-density choropleth */
export const POPULATION_DENSITY_LEGEND: LegendItem[] = [
  { label: "Very High (>1,000/km²)", color: "#7f1d1d" },
  { label: "High (300–1,000/km²)",   color: "#dc2626" },
  { label: "Moderate (100–300/km²)", color: "#f59e0b" },
  { label: "Low (<100/km²)",         color: "#16a34a" },
];

/** Pre-built legend for the LGA/ward facility-count choropleth */
export const FACILITY_DENSITY_LEGEND: LegendItem[] = [
  { label: "Very High (>150 facilities)", color: "#1e3a8a" },
  { label: "High (100–150)",              color: "#2563eb" },
  { label: "Moderate (50–100)",           color: "#60a5fa" },
  { label: "Low (<50 facilities)",        color: "#bfdbfe" },
];

/** Pre-built legend for the public dataset explorer choropleth */
export const DATASET_COVERAGE_LEGEND: LegendItem[] = [
  { label: "7+ datasets", color: "#1e3a8a" },
  { label: "4–6 datasets", color: "#2563eb" },
  { label: "2–3 datasets", color: "#60a5fa" },
  { label: "1 dataset", color: "#bfdbfe" },
  { label: "None in filter", color: "#e5e7eb" },
];

export const DATASET_MARKER_LEGEND: LegendItem[] = [
  { label: "Spatial file", color: "#2563eb", description: "GeoJSON, shapefile, GeoPackage, or KML" },
  { label: "Tabular file", color: "#0f766e", description: "CSV, Excel, or JSON" },
  { label: "Other format", color: "#6b7280" },
];

/** Pre-built legend for the settlement accessibility map */
export const SETTLEMENT_ACCESS_LEGEND: LegendItem[] = [
  { label: "Fully Accessible",     color: "#16a34a" },
  { label: "Partially Accessible", color: "#f59e0b" },
  { label: "Inaccessible",         color: "#dc2626" },
];
