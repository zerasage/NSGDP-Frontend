"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProgressBar({
  percent,
  className,
  label,
}: {
  percent: number;
  className?: string;
  label?: string;
}) {
  const value = Math.max(0, Math.min(100, percent));
  return (
    <div
      className={cn("h-1.5 overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Progress"}
    >
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${value}%` }} />
    </div>
  );
}

/** Segmented tab control matching the portal design guide (§3.3). */
export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: Array<{ id: T; label: string; count?: number }>;
  value: T;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl border bg-muted/30 p-1" role="tablist" aria-label={label}>
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              "h-9 shrink-0 rounded-lg px-3 text-sm font-medium transition-colors sm:px-4",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/80 hover:text-foreground",
            )}
          >
            {tab.label}
            {tab.count != null ? (
              <span className={cn("ml-1.5 tabular-nums", active ? "opacity-90" : "opacity-60")}>
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Native <details> disclosure — accessible, no JS state, styled to match panels. */
export function Disclosure({
  title,
  meta,
  children,
  defaultOpen,
}: {
  title: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      className="group rounded-xl border bg-card open:bg-muted/20"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">{title}</span>
        <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
          {meta}
          <ChevronDown
            className="size-4 transition-transform group-open:rotate-180"
            aria-hidden
          />
        </span>
      </summary>
      <div className="border-t px-4 py-3 text-sm text-muted-foreground">{children}</div>
    </details>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed px-4 py-8 text-center text-[13px] text-muted-foreground">
      {children}
    </div>
  );
}
