import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Database,
  Map,
  BarChart3,
  Shield,
  Lock,
  Layers,
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
import { PageEyebrow, Panel } from "@/components/layout/content-panel";
import { METRIC_TONE, type MetricTone } from "@/components/data/metric-card";
import { cn } from "@/lib/utils";

const capabilities: {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
  tone: MetricTone;
}[] = [
  {
    icon: Database,
    title: "Data repository",
    description:
      "Verified health datasets from NSPHCDA and partners across all 25 LGAs — surveillance, facilities, and population.",
    href: "/dataportal",
    tone: "primary",
  },
  {
    icon: Map,
    title: "Geospatial maps",
    description:
      "Visualise disease burden, facility locations, and LGA indicators. Filter by metric, period, and geography.",
    href: "/map",
    tone: "info",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description:
      "Track trends with KPIs, time-series charts, and LGA summaries for outbreaks and immunisation coverage.",
    href: "/analytics",
    tone: "success",
  },
  {
    icon: Shield,
    title: "Access tiers",
    description:
      "Public, partner, and administrator access so the right data reaches the right users.",
    href: "/partner-data",
    tone: "muted",
  },
  {
    icon: Lock,
    title: "Secure and reviewed",
    description:
      "Audit logging, access controls, and review before publication, aligned with national health data governance.",
    tone: "muted",
  },
  {
    icon: Layers,
    title: "GIS-ready downloads",
    description:
      "Standard geospatial formats for QGIS, PostGIS, and other GIS tools in your own workflows.",
    href: "/dataportal",
    tone: "info",
  },
];

const mapShortcuts: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  tone: MetricTone;
}[] = [
  {
    icon: Hospital,
    title: "Facility finder",
    description: "Search primary health facilities statewide and open them on the map.",
    href: "/facilities",
    tone: "primary",
  },
  {
    icon: Users,
    title: "Population and facility map",
    description: "Compare population need with facility distribution at LGA level.",
    href: "/population-map",
    tone: "info",
  },
  {
    icon: MapPin,
    title: "Settlement access map",
    description: "See settlements relative to nearby health facilities.",
    href: "/settlements",
    tone: "success",
  },
];

const applications: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  tone: MetricTone;
}[] = [
  {
    icon: Activity,
    title: "Disease surveillance",
    description:
      "Monitor malaria, meningitis, cholera, and other notifiable diseases. Identify hotspots and support timely response.",
    href: "/analytics",
    tone: "destructive",
  },
  {
    icon: Hospital,
    title: "Facility planning",
    description:
      "Map facility distribution against population need to guide infrastructure and referral network design.",
    href: "/facilities",
    tone: "primary",
  },
  {
    icon: Users,
    title: "Population health",
    description:
      "Combine demographic and outcome data to understand burden by LGA and support resource allocation.",
    href: "/population-map",
    tone: "info",
  },
];

function EntityCard({
  icon: Icon,
  title,
  description,
  href,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
  tone: MetricTone;
}) {
  const t = METRIC_TONE[tone];
  const body = (
    <>
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg border",
          t.well
        )}
      >
        <Icon className={cn("size-4", t.icon)} aria-hidden />
      </div>
      <h3 className="mt-3 text-base font-semibold leading-6">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </>
  );

  const className = cn(
    "rounded-2xl border bg-card p-4 sm:p-5",
    href && "transition-colors hover:border-primary/40"
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}

export default function HomePage() {
  return (
    <main className="flex-1">
      <HomeHeroSection />

      <div className="py-6">
        <Container size="wide" className="space-y-6">
          <LiveOutbreakAlerts />

          <div>
            <PageEyebrow label="Portal" icon={Database} />
            <h2 className="text-2xl font-bold leading-8 tracking-tight">
              Repository at a glance
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Live counts from published datasets. Browse, map, and analyse without leaving the portal.
            </p>
          </div>

          <RepositoryDashboard />

          <Panel
            title="Platform capabilities"
            description="Explore, analyse, and contribute Niger State health data"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {capabilities.map((item) => (
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

          <section className="rounded-2xl border bg-card p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 max-w-xl space-y-1">
                <h2 className="text-base font-semibold leading-6">Ready to explore health data?</h2>
                <p className="text-sm text-muted-foreground">
                  Browse datasets, open interactive maps, or contribute partner data for review
                  and publication.
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
