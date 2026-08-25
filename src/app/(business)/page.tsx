import Link from "next/link";
import {
  Database,
  Map,
  BarChart3,
  ArrowRight,
  Hospital,
  Users,
  MapPin,
  Activity,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { HomeHeroSection } from "@/components/map/home-hero-section";
import { LiveOutbreakAlerts } from "@/components/home/live-outbreak-alerts";
import { RepositoryDashboard } from "@/components/home/repository-dashboard";
import { FeaturedGroupsSection } from "@/components/home/featured-groups-section";
import { EntityCard, Panel } from "@/components/layout/content-panel";

const doors = [
  {
    icon: Database,
    title: "Browse data",
    description:
      "Verified health datasets from NSPHCDA and partners across all 25 LGAs — surveillance, facilities, and population.",
    href: "/dataportal",
    tone: "primary" as const,
  },
  {
    icon: Map,
    title: "Maps",
    description:
      "Visualise disease burden, facility locations, and LGA indicators. Filter by metric, period, and geography.",
    href: "/map",
    tone: "info" as const,
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description:
      "Track trends with KPIs, time-series charts, and LGA summaries for outbreaks and immunisation coverage.",
    href: "/analytics",
    tone: "success" as const,
  },
];

const mapShortcuts = [
  {
    icon: Hospital,
    title: "Facility finder",
    description: "Search primary health facilities statewide and open them on the map.",
    href: "/facilities",
    tone: "primary" as const,
  },
  {
    icon: Users,
    title: "Population and facility map",
    description: "Compare population need with facility distribution at LGA level.",
    href: "/population-map",
    tone: "info" as const,
  },
  {
    icon: MapPin,
    title: "Settlement access map",
    description: "See settlements relative to nearby health facilities.",
    href: "/settlements",
    tone: "success" as const,
  },
];

const applications = [
  {
    icon: Activity,
    title: "Disease surveillance",
    description:
      "Monitor malaria, meningitis, cholera, and other notifiable diseases. Identify hotspots and support timely response.",
    tone: "destructive" as const,
  },
  {
    icon: Hospital,
    title: "Facility planning",
    description:
      "Map facility distribution against population need to guide infrastructure and referral network design.",
    tone: "primary" as const,
  },
  {
    icon: Users,
    title: "Population health",
    description:
      "Combine demographic and outcome data to understand burden by LGA and support resource allocation.",
    tone: "info" as const,
  },
];

export default function HomePage() {
  return (
    <main className="flex-1">
      <HomeHeroSection />

      <div className="py-6">
        <Container size="wide" className="space-y-6">
          <LiveOutbreakAlerts />

          <Panel
            title="Explore the portal"
            description="Three ways in: catalogue, maps, and analytics"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {doors.map((item) => (
                <EntityCard key={item.title} {...item} />
              ))}
            </div>
          </Panel>

          <Panel
            title="Maps and facilities"
            description="Open GIS tools for facilities, population, and settlement access"
          >
            <div className="grid gap-3 md:grid-cols-3">
              {mapShortcuts.map((item) => (
                <EntityCard key={item.title} {...item} />
              ))}
            </div>
          </Panel>

          <FeaturedGroupsSection />

          <Panel
            title="How the data is used"
            description="How Niger State uses geospatial health data in practice"
          >
            <div className="grid gap-3 md:grid-cols-3">
              {applications.map((item) => (
                <EntityCard key={item.title} {...item} />
              ))}
            </div>
          </Panel>

          <RepositoryDashboard />

          <section className="rounded-2xl border bg-card p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 max-w-xl space-y-1">
                <h2 className="text-base font-semibold leading-6">
                  Ready to explore health data?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Browse datasets, open interactive maps, or contribute partner data
                  for review and publication.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <Link href="/dataportal">
                  <Button className="h-9 w-full sm:w-auto">
                    Browse repository
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <Link href="/partner-data">
                  <Button variant="outline" className="h-9 w-full sm:w-auto">
                    Contribute data
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </Container>
      </div>
    </main>
  );
}
