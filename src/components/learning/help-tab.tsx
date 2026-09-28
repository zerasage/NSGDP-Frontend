"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Check, Clock, FileText, LifeBuoy, MapPin, Send, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { METRIC_TONE } from "@/components/data/metric-card";
import { cn } from "@/lib/utils";
import { AUDIENCE_LABEL, learningHref } from "@/lib/learning/helpers";
import { PLATFORM_UPDATES, TRAINING_SESSIONS } from "@/lib/learning/support";
import type { AudienceFilter, PlatformUpdate } from "@/lib/learning/types";

const TAG_TONE: Record<PlatformUpdate["tag"], "success" | "info" | "warning"> = {
  New: "success",
  Improved: "info",
  "Heads up": "warning",
};

function formatDate(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", opts);
}

const SUPPORT_LINKS = [
  {
    title: "Contact the data team",
    body: "Ask about a dataset, a stuck review, or your account.",
    href: "/contact",
    icon: Send,
  },
  {
    title: "Partner programme",
    body: "See how development partners contribute data to the portal.",
    href: "/partner-data",
    icon: Users,
  },
  {
    title: "Terms and data policy",
    body: "What you agree to when you share data, and how it may be used.",
    href: "/terms",
    icon: FileText,
  },
];

export function HelpTab({ audience, basePath }: { audience: AudienceFilter; basePath: string }) {
  // Registration is a demo interaction until a real sign-up endpoint exists.
  const [requested, setRequested] = useState<string[]>([]);

  const sessions = TRAINING_SESSIONS.filter(
    (s) => audience === "all" || s.audience.includes(audience),
  );

  return (
    <div className="space-y-8">
      <section className="space-y-3" aria-labelledby="help-support">
        <h2 id="help-support" className="text-[13px] font-medium">
          Get help
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {SUPPORT_LINKS.map((s) => {
            const Icon = s.icon;
            const tone = METRIC_TONE.primary;
            return (
              <Link
                key={s.href}
                href={s.href}
                className="group flex items-start gap-3 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg border",
                    tone.well,
                  )}
                >
                  <Icon className={cn("size-4", tone.icon)} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{s.title}</span>
                  <span className="mt-0.5 block text-[13px] text-muted-foreground">{s.body}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="help-training">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="help-training" className="text-[13px] font-medium">
            Upcoming training
          </h2>
          <p className="text-xs text-muted-foreground">Sample schedule for preview</p>
        </div>
        {sessions.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-8 text-center text-[13px] text-muted-foreground">
            No sessions scheduled for this audience yet.
          </p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {sessions.map((s) => {
              const asked = requested.includes(s.id);
              return (
                <article key={s.id} className="flex gap-4 rounded-2xl border bg-card p-4 sm:p-5">
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border bg-muted/40">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {formatDate(s.date, { month: "short" })}
                    </span>
                    <span className="text-lg font-bold leading-none tabular-nums">
                      {formatDate(s.date, { day: "numeric" })}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold">{s.title}</h3>
                      <Badge variant="secondary" className="h-5 text-[11px]">
                        {s.format}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[13px] text-muted-foreground">{s.description}</p>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1.5">
                        <Clock className="size-3.5" aria-hidden />
                        {s.time}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <MapPin className="size-3.5" aria-hidden />
                        {s.location}
                      </p>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                      <p className="text-xs text-muted-foreground">
                        {s.audience.map((a) => AUDIENCE_LABEL[a]).join(" · ")}
                        {s.seatsLeft != null ? ` · ${s.seatsLeft} seats left` : ""}
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant={asked ? "secondary" : "outline"}
                        className="h-8 gap-1.5"
                        onClick={() =>
                          setRequested((r) => (r.includes(s.id) ? r.filter((x) => x !== s.id) : [...r, s.id]))
                        }
                      >
                        {asked ? (
                          <>
                            <Check className="size-3.5" aria-hidden />
                            Seat requested
                          </>
                        ) : (
                          <>
                            <CalendarDays className="size-3.5" aria-hidden />
                            Request a seat
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="help-updates">
        <h2 id="help-updates" className="text-[13px] font-medium">
          What&apos;s new on the portal
        </h2>
        <ol className="divide-y rounded-2xl border bg-card">
          {PLATFORM_UPDATES.map((u) => {
            const tone = METRIC_TONE[TAG_TONE[u.tag]];
            return (
              <li key={u.id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:gap-4 sm:px-5">
                <div className="flex shrink-0 items-center gap-2 sm:w-40 sm:flex-col sm:items-start">
                  <span className={cn("rounded-md border px-1.5 py-0.5 text-[11px] font-medium", tone.well, tone.icon)}>
                    {u.tag}
                  </span>
                  <time className="text-xs text-muted-foreground" dateTime={u.date}>
                    {formatDate(u.date, { day: "numeric", month: "short", year: "numeric" })}
                  </time>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold">{u.title}</h3>
                  <p className="mt-1 text-[13px] text-muted-foreground">{u.description}</p>
                  {u.guide ? (
                    <Link
                      href={learningHref(basePath, u.guide)}
                      className={cn(buttonVariants({ variant: "link" }), "mt-1 h-auto p-0 text-[13px]")}
                    >
                      Read the guide
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="flex items-start gap-3 rounded-2xl border border-dashed bg-muted/20 p-4 text-[13px] text-muted-foreground">
        <LifeBuoy className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          Can&apos;t find your answer? Ask the <span className="font-medium text-foreground">Health Data
          Assistant</span> from the chat button in the corner of the portal, or use the contact form
          above.
        </p>
      </div>
    </div>
  );
}
