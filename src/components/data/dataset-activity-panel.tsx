"use client";

import { BarChart3 } from "lucide-react";
import { DashboardPanel, EmptyPanelState } from "@/components/dashboard/portal-dashboard-ui";

export function DatasetActivityPanel() {
  return (
    <DashboardPanel
      title="Views & downloads"
      description="Activity for your organisation's datasets."
      icon={BarChart3}
      tone="info"
    >
      <EmptyPanelState icon={BarChart3} message="Activity tracking coming soon." />
    </DashboardPanel>
  );
}
