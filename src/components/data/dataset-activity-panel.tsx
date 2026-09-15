import { BarChart3, Download, Eye } from "lucide-react";
import { DashboardPanel, EmptyPanelState } from "@/components/dashboard/portal-dashboard-ui";

interface DatasetActivityPanelProps {
  views?: number;
  downloads?: number;
}

export function DatasetActivityPanel({ views, downloads }: DatasetActivityPanelProps) {
  const hasDatasetActivity = views !== undefined && downloads !== undefined;

  return (
    <DashboardPanel
      title="Views & downloads"
      description={
        hasDatasetActivity
          ? "Lifetime activity for this dataset."
          : "Activity for your development partner's datasets."
      }
      icon={BarChart3}
      tone="info"
    >
      {hasDatasetActivity ? (
        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-muted/30 p-3">
            <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Eye className="size-4" aria-hidden="true" />
              Views
            </dt>
            <dd className="mt-2 text-2xl font-bold tabular-nums">{views.toLocaleString()}</dd>
          </div>
          <div className="rounded-xl border bg-muted/30 p-3">
            <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Download className="size-4" aria-hidden="true" />
              Downloads
            </dt>
            <dd className="mt-2 text-2xl font-bold tabular-nums">{downloads.toLocaleString()}</dd>
          </div>
        </dl>
      ) : (
        <EmptyPanelState icon={BarChart3} message="Activity tracking coming soon." />
      )}
    </DashboardPanel>
  );
}
