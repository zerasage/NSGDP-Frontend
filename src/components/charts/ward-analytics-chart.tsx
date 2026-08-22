"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { WardBurdenRow } from "@/lib/api/analytics";
import { Skeleton } from "@/components/ui/skeleton";

interface WardAnalyticsChartProps {
  data?: WardBurdenRow[];
  isLoading?: boolean;
  metric?: "cases" | "incidencePer1000";
  /** When set, incidence bars above this value render red. Omit for count/rate indicators. */
  incidenceHighlightThreshold?: number | null;
  emptyMessage?: string;
}

export function WardAnalyticsChart({
  data = [],
  isLoading = false,
  metric = "cases",
  incidenceHighlightThreshold = null,
  emptyMessage = "No ward-level data for this indicator, year, and LGA.",
}: WardAnalyticsChartProps) {
  if (isLoading) {
    return <Skeleton className="h-[280px] w-full" />;
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground text-center px-4">
        {emptyMessage}
      </div>
    );
  }

  const chartData = data.map((row) => ({
    ward: row.wardName,
    lga: row.lgaName,
    cases: row.totalCases,
    incidencePer1000: Math.round(row.incidencePer1000 * 10) / 10,
  }));

  const sorted = [...chartData].sort((a, b) => b[metric] - a[metric]);
  const label = metric === "cases" ? "Reported Cases" : "Incidence per 1,000";

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={sorted} layout="vertical" margin={{ left: 8, right: 12 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis
          dataKey="ward"
          type="category"
          width={110}
          tick={{ fontSize: 11 }}
        />
        <Tooltip
          formatter={(val: number) => [val.toLocaleString(), label]}
          labelFormatter={(name) => {
            const d = sorted.find((x) => x.ward === name);
            return `${name} (${d?.lga ?? ""})`;
          }}
        />
        <Bar dataKey={metric} radius={[0, 4, 4, 0]}>
          {sorted.map((entry) => {
            const highlight =
              metric === "incidencePer1000" &&
              incidenceHighlightThreshold != null &&
              entry.incidencePer1000 > incidenceHighlightThreshold;
            return (
              <Cell
                key={entry.ward}
                fill={highlight ? "#dc2626" : "#2563eb"}
                fillOpacity={0.8}
              />
            );
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
