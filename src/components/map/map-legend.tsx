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

/** Pre-built legend for disease burden bubble maps */
export const DISEASE_BUBBLE_LEGEND: LegendItem[] = [
  { label: "Very High (>500 cases)", color: "#dc2626", description: "Critical burden — immediate response" },
  { label: "High (200–500)",         color: "#ea580c", description: "Elevated — enhanced surveillance" },
  { label: "Moderate (50–200)",      color: "#d97706", description: "Monitor closely" },
  { label: "Low (<50 cases)",        color: "#16a34a", description: "Within expected range" },
];

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
