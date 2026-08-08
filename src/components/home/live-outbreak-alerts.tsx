"use client";

import { useQuery } from "@tanstack/react-query";
import { OutbreakAlertBanner } from "./outbreak-alert-banner";
import { getActiveAlerts } from "@/lib/api/alerts";

export function LiveOutbreakAlerts() {
  const { data } = useQuery({
    queryKey: ["active-alerts"],
    queryFn: getActiveAlerts,
    staleTime: 5 * 60 * 1000,
  });

  if (!data?.length) return null;
  return <OutbreakAlertBanner alerts={data} />;
}
