"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Lock, FileText, BarChart3, ArrowRight, BarChart2 } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BRAND } from "@/lib/constants/brand";
import { useStatistics } from "@/lib/hooks/useStatistics";

const trustFeatures = [
  {
    icon: Lock,
    title: "Verified & Trustworthy",
    description:
      "All datasets are sourced from NSPHCDA, the Ministry of Health, and verified partner agencies.",
  },
  {
    icon: FileText,
    title: "Open Licenses",
    description:
      "Health datasets are published under open licenses (CC BY, OGL) for free reuse in research and planning.",
  },
  {
    icon: BarChart3,
    title: "Regularly Updated",
    description:
      "Surveillance, facility, and indicator datasets are maintained and refreshed to reflect the latest information.",
  },
];

export function HomeHeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { data: stats, isLoading } = useStatistics();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const statItems = [
    { value: stats?.datasets, label: "Active Datasets" },
    { value: stats?.organisations, label: "Organizations" },
    {
      value: stats?.downloads != null ? stats.downloads.toLocaleString() : undefined,
      label: "Downloads",
    },
    { value: stats?.lgasCovered, label: "LGAs Covered" },
  ];

  return (
    <>
      <section className="hero-section relative min-h-[min(92vh,820px)] overflow-hidden border-b">
        <Image
          src={BRAND.heroImagePath}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          aria-hidden
        />

        {/* Soft vignette — illustration stays sharp, no blur */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/20"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_50%_45%,rgba(13,59,20,0.72)_0%,rgba(13,59,20,0.48)_42%,rgba(13,59,20,0.12)_62%,transparent_78%)]"
          aria-hidden
        />

        <Container className="relative flex min-h-[inherit] flex-col">
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:py-24">
            <div className="mx-auto max-w-2xl space-y-5 text-white">
              <p className="text-sm font-semibold uppercase tracking-widest text-teal">
                {BRAND.heroSuperLabel}
              </p>
              <h1 className="text-2xl font-bold leading-snug sm:text-3xl lg:text-4xl">
                <span className="text-white/75 font-medium">Welcome to </span>
                <span className="text-white">Niger State</span>
                <span className="text-white/75 font-medium"> Primary Health Care</span>
                {" "}
                <span className="text-teal">Development Agency&apos;s</span>
                <br className="hidden sm:block" />
                {" "}
                <span className="text-white font-extrabold tracking-tight text-3xl sm:text-4xl lg:text-5xl">
                  Health &amp; Geospatial Data Portal
                </span>
              </h1>
              <p className="text-base leading-relaxed text-white/88 sm:text-lg">
                Centralised geospatial health data for evidence-based planning, disease
                surveillance, and equitable service delivery across all 25 Local Government
                Areas.
              </p>

              <form
                onSubmit={handleSearch}
                className="mx-auto mt-6 flex max-w-xl flex-col gap-2 sm:flex-row"
              >
                <div className="relative flex-1">
                  <Search
                    className="hero-input-icon pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2"
                    aria-hidden
                  />
                  <Input
                    type="search"
                    surface="hero"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search datasets by keyword, region, or topic..."
                    className="h-11 pl-11 text-sm"
                    aria-label="Search datasets"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  variant="secondary"
                  className="hero-btn-solid h-11 border-0 px-6"
                >
                  Search
                </Button>
              </form>

              {/* Primary CTA row — always visible above the fold */}
              <div className="pt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link href="/dataportal">
                  <Button
                    size="lg"
                    variant="onDarkSolid"
                    className="w-full sm:w-auto px-7 py-3 text-base"
                  >
                    Browse Repository
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <Link href="/analytics">
                  <Button
                    size="lg"
                    variant="onDark"
                    className="w-full sm:w-auto px-7 py-3 text-base"
                  >
                    <BarChart2 className="size-4" />
                    Analytics Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="mx-auto mb-8 grid w-full max-w-4xl grid-cols-2 gap-3 px-4 lg:grid-cols-4">
            {statItems.map((stat) => (
              <div
                key={stat.label}
                className="hero-stat-chip"
              >
                <p className="hero-stat-value">
                  {isLoading || stat.value == null ? "—" : stat.value}
                </p>
                <p className="hero-stat-label">{stat.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="credibility-section border-b bg-muted/60 py-12 sm:py-16">
        <Container>
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {trustFeatures.map((feature) => (
              <div key={feature.title} className="trust-feature space-y-3 text-center md:text-left">
                <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-primary/10 md:mx-0">
                  <feature.icon className="size-5 text-primary" aria-hidden />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
