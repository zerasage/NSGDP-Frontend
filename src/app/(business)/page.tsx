import Link from "next/link";
import {
  Database,
  Map,
  BarChart3,
  Shield,
  Lock,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HomeHeroSection } from "@/components/map/home-hero-section";
import { LiveOutbreakAlerts } from "@/components/home/live-outbreak-alerts";
import { RepositoryDashboard } from "@/components/home/repository-dashboard";
import { FeaturedGroupsSection } from "@/components/home/featured-groups-section";

const features = [
  {
    icon: Database,
    title: "Comprehensive Data Repository",
    description:
      "Access verified health datasets from NSPHCDA and partner organisations across all 25 LGAs. Browse disease surveillance, facility registry, and population data in one central portal.",
  },
  {
    icon: Map,
    title: "Interactive Geospatial Maps",
    description:
      "Visualise disease burden, health facility locations, and LGA-level indicators on interactive maps. Filter by metric, period, and geography for targeted analysis.",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description:
      "Track health trends with dashboards showing KPIs, time-series charts, and LGA burden summaries. Monitor outbreaks and immunisation coverage at a glance.",
  },
  {
    icon: Shield,
    title: "Multi-level Access",
    description:
      "Public, partner, and administrator access tiers ensure the right data reaches the right users. Role-based permissions protect sensitive health information.",
  },
  {
    icon: Lock,
    title: "Secure & Compliant",
    description:
      "Built to national health data governance standards with audit logging, access controls, and secure file handling. Your submissions are reviewed before publication.",
  },
  {
    icon: Layers,
    title: "QGIS Integration",
    description:
      "Download datasets in standard geospatial formats for use in QGIS, PostGIS, and other GIS tools. Seamlessly extend portal data into your own workflows.",
  },
];

const healthFacilities = [
  {
    title: "Primary Health Care Centers",
    description:
      "Over 800 PHC facilities serve communities across Niger State, providing essential maternal, child, and preventive health services at the grassroots level.",
    gradient: "from-emerald-600/80 to-primary/90",
  },
  {
    title: "Healthcare Professionals",
    description:
      "A dedicated workforce of doctors, nurses, midwives, and community health workers delivers care and collects routine health data for the portal.",
    gradient: "from-teal-600/80 to-emerald-700/90",
  },
  {
    title: "Rural Health Facilities",
    description:
      "Outreach posts and rural clinics extend health services to hard-to-reach areas, ensuring equitable coverage for underserved populations.",
    gradient: "from-primary/80 to-emerald-800/90",
  },
];

const applications = [
  {
    emoji: "🦠",
    title: "Disease Surveillance",
    description:
      "Monitor malaria, meningitis, cholera, and other notifiable diseases in real time. Identify hotspots and trigger timely public health responses.",
  },
  {
    emoji: "🏥",
    title: "Health Facility Planning",
    description:
      "Map facility distribution against population need to guide infrastructure investments. Optimise PHC placement and referral network design.",
  },
  {
    emoji: "📊",
    title: "Population Health Analytics",
    description:
      "Combine demographic and health outcome data to understand burden by LGA. Support evidence-based policy and resource allocation decisions.",
  },
];

export default function HomePage() {
  return (
    <main className="flex-1">
      <HomeHeroSection />

      {/* Outbreak / disease alerts */}
      <Container>
        <LiveOutbreakAlerts />
      </Container>

      {/* Feature cards */}
      <section className="py-16 sm:py-20">
        <Container size="wide">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Platform Capabilities</h2>
            <p className="mt-2 text-muted-foreground">
              Everything you need to explore, analyse, and contribute Niger State health data
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="h-full">
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="size-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Health facilities */}
      <section className="bg-secondary/30 py-16 sm:py-20">
        <Container size="wide">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Health Facilities</h2>
            <p className="mt-2 text-muted-foreground">
              Strengthening primary care and rural health infrastructure statewide
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {healthFacilities.map((item) => (
              <Card key={item.title} className="overflow-hidden pt-0">
                <div className={`h-48 bg-gradient-to-br ${item.gradient}`} />
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {item.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Featured curated collections */}
      <FeaturedGroupsSection />

      {/* Real-world applications */}
      <section className="py-16 sm:py-20">
        <Container size="wide">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Real-World Applications</h2>
            <p className="mt-2 text-muted-foreground">
              How Niger State uses geospatial health data in practice
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {applications.map((app) => (
              <Card key={app.title} className="text-center">
                <CardHeader className="items-center">
                  <span className="text-4xl" role="img" aria-hidden="true">
                    {app.emoji}
                  </span>
                  <CardTitle className="text-lg">{app.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="leading-relaxed">
                    {app.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="pb-16 sm:pb-20">
        <Container>
          <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10 p-8 text-center sm:p-12">
            <h2 className="text-2xl font-bold sm:text-3xl">Ready to Explore Health Data?</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Browse datasets, view interactive maps, and download health indicators for
              research, planning, and programme monitoring.
            </p>
            <Link href="/dataportal" className="mt-6 inline-block">
              <Button size="lg">
                Browse Repository
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* Public repository dashboard */}
      <RepositoryDashboard />
    </main>
  );
}
