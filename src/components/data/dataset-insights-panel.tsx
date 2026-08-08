"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { DatasetInsights, DatasetMetricInsight } from "@/lib/api/datasets";

interface DatasetInsightsPanelProps {
  insights: DatasetInsights | null | undefined;
  isLoading?: boolean;
  /** Cap how many metric charts render — keeps the panel lightweight on
   * wide datasets with many numeric columns. */
  maxMetrics?: number;
}

const TREND_STYLES: Record<
  DatasetMetricInsight["trend"],
  { icon: typeof TrendingUp; className: string; label: string }
> = {
  increasing: {
    icon: TrendingUp,
    className: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    label: "Increasing",
  },
  decreasing: {
    icon: TrendingDown,
    className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    label: "Decreasing",
  },
  stable: {
    icon: Minus,
    className: "bg-muted text-muted-foreground",
    label: "Stable",
  },
};

function MetricChart({ metric }: { metric: DatasetMetricInsight }) {
  const trend = TREND_STYLES[metric.trend];
  const TrendIcon = trend.icon;

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-medium">{metric.column}</h4>
        <Badge variant="outline" className={trend.className}>
          <TrendIcon className="size-3" />
          {trend.label}
          {metric.percentChange !== null && (
            <span className="ml-1">
              {metric.percentChange > 0 ? "+" : ""}
              {metric.percentChange}%
            </span>
          )}
        </Badge>
      </div>
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={metric.series} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="period" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} width={40} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-4">
        <div>
          <dt className="inline">Min: </dt>
          <dd className="inline font-medium text-foreground">{metric.min.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="inline">Max: </dt>
          <dd className="inline font-medium text-foreground">{metric.max.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="inline">First: </dt>
          <dd className="inline font-medium text-foreground">{metric.first.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="inline">Latest: </dt>
          <dd className="inline font-medium text-foreground">{metric.latest.toLocaleString()}</dd>
        </div>
      </dl>
    </div>
  );
}

export function DatasetInsightsPanel({
  insights,
  isLoading,
  maxMetrics = 3,
}: DatasetInsightsPanelProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-muted-foreground" />
            Automated Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  // No insights is a normal outcome (no detectable date/metric columns),
  // not an error — render nothing rather than an empty-looking card.
  if (!insights || insights.metrics.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-muted-foreground" />
          Automated Insights
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Computed automatically from the {insights.dateColumn} column across{" "}
          {insights.rowCount.toLocaleString()} rows.
        </p>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {insights.metrics.slice(0, maxMetrics).map((metric) => (
          <MetricChart key={metric.column} metric={metric} />
        ))}
      </CardContent>
    </Card>
  );
}
