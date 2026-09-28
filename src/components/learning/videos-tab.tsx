"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Clock, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FilterChip } from "@/components/dashboard/portal-dashboard-ui";
import { METRIC_TONE } from "@/components/data/metric-card";
import { cn } from "@/lib/utils";
import { GUIDE_CATEGORIES, getGuide } from "@/lib/learning/guides";
import { learningHref } from "@/lib/learning/helpers";
import { VIDEOS } from "@/lib/learning/videos";
import type { GuideCategory, VideoTutorial } from "@/lib/learning/types";
import { CATEGORY_TONE } from "./learning-icons";

function Thumbnail({ video, large = false }: { video: VideoTutorial; large?: boolean }) {
  const tone = METRIC_TONE[CATEGORY_TONE[video.category]];
  const soon = video.status === "coming-soon";
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-xl border",
        tone.card,
        large ? "aspect-video" : "aspect-video",
      )}
    >
      <div
        className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] [background-size:16px_16px] text-muted-foreground/20"
        aria-hidden
      />
      <span
        className={cn(
          "relative flex items-center justify-center rounded-full border bg-background/90 shadow-sm",
          large ? "size-16" : "size-11",
          soon && "opacity-60",
        )}
      >
        <Play className={cn("fill-current", large ? "size-6" : "size-4", tone.icon)} aria-hidden />
      </span>
      <span className="absolute bottom-2 right-2 rounded-md bg-foreground/80 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-background">
        {video.duration}
      </span>
      {soon ? (
        <Badge variant="secondary" className="absolute left-2 top-2 h-5 text-[11px]">
          Coming soon
        </Badge>
      ) : null}
    </div>
  );
}

export function VideosTab({ basePath }: { basePath: string }) {
  const [category, setCategory] = useState<GuideCategory | "all">("all");
  const [active, setActive] = useState<VideoTutorial | null>(null);

  const list = VIDEOS.filter((v) => category === "all" || v.category === category);
  const featured = category === "all" ? VIDEOS.filter((v) => v.featured) : [];
  const rest = category === "all" ? list.filter((v) => !v.featured) : list;
  const activeGuide = active?.guide ? getGuide(active.guide) : undefined;

  const VideoCard = ({ video }: { video: VideoTutorial }) => (
    <button
      type="button"
      onClick={() => setActive(video)}
      className="group flex flex-col rounded-2xl border bg-card p-3 text-left transition-colors hover:border-primary/40 sm:p-4"
    >
      <Thumbnail video={video} />
      <div className="mt-3 min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {GUIDE_CATEGORIES.find((c) => c.id === video.category)?.label}
        </p>
        <h3 className="mt-1 text-sm font-semibold leading-5">{video.title}</h3>
        <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">{video.description}</p>
      </div>
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-dashed bg-muted/20 p-4 text-[13px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          Short screen recordings that walk through the portal. Each one has a written guide with the
          same steps if you prefer to read.
        </p>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FilterChip
          active={category === "all"}
          label="All videos"
          count={VIDEOS.length}
          onClick={() => setCategory("all")}
        />
        {GUIDE_CATEGORIES.map((c) => {
          const count = VIDEOS.filter((v) => v.category === c.id).length;
          if (count === 0) return null;
          return (
            <FilterChip
              key={c.id}
              active={category === c.id}
              label={c.label}
              count={count}
              onClick={() => setCategory(c.id)}
            />
          );
        })}
      </div>

      {featured.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {featured.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rest.map((v) => (
          <VideoCard key={v.id} video={v} />
        ))}
      </div>

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="sm:max-w-2xl">
          {active ? (
            <>
              <DialogHeader>
                <DialogTitle className="pr-8 text-base leading-snug">{active.title}</DialogTitle>
                <DialogDescription>{active.description}</DialogDescription>
              </DialogHeader>

              <div className="relative flex aspect-video items-center justify-center rounded-xl border bg-muted/40">
                <div className="text-center">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-full border bg-background shadow-sm">
                    <Play className="size-6 fill-current text-primary" aria-hidden />
                  </div>
                  <p className="mt-3 text-sm font-medium">
                    {active.status === "coming-soon" ? "Recording coming soon" : "Video player placeholder"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    The recording will play here once published.
                  </p>
                </div>
                <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-foreground/80 px-1.5 py-0.5 text-[11px] tabular-nums text-background">
                  <Clock className="size-3" aria-hidden />
                  {active.duration}
                </span>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Chapters
                </p>
                <ul className="divide-y rounded-xl border">
                  {active.chapters.map((c) => (
                    <li key={c.time} className="flex items-center gap-3 px-3 py-2 text-[13px]">
                      <span className="w-10 shrink-0 tabular-nums text-muted-foreground">{c.time}</span>
                      <span>{c.label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {activeGuide ? (
                <Link
                  href={learningHref(basePath, activeGuide.slug)}
                  onClick={() => setActive(null)}
                  className={cn(buttonVariants({ variant: "outline" }), "h-9 w-full justify-center gap-2")}
                >
                  <BookOpen className="size-4" aria-hidden />
                  Read the written guide
                </Link>
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
