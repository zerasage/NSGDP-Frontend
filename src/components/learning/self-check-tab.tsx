"use client";

import { useState } from "react";
import { Check, ClipboardCopy, Printer, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { QA_DIMENSIONS } from "@/lib/constants/qa-checklist";
import { ProgressBar } from "./learning-primitives";

interface SelfCheckTabProps {
  checklist: Record<string, boolean>;
  onToggle: (id: string, value: boolean) => void;
  onReset: () => void;
}

const itemId = (dimension: string, index: number) => `${dimension}:${index}`;

export function SelfCheckTab({ checklist, onToggle, onReset }: SelfCheckTabProps) {
  const [copied, setCopied] = useState(false);

  const total = QA_DIMENSIONS.reduce((n, d) => n + d.guidanceItems.length, 0);
  const done = QA_DIMENSIONS.reduce(
    (n, d) => n + d.guidanceItems.filter((_, i) => checklist[itemId(d.id, i)]).length,
    0,
  );
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  const copyOpenItems = async () => {
    const lines = QA_DIMENSIONS.flatMap((d) => {
      const open = d.guidanceItems.filter((_, i) => !checklist[itemId(d.id, i)]);
      return open.length ? [d.label, ...open.map((o) => `  [ ] ${o}`)] : [];
    });
    try {
      await navigator.clipboard.writeText(
        lines.length ? lines.join("\n") : "All pre-submission checks complete.",
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — nothing to recover; the checklist stays on screen.
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="text-base font-semibold">Pre-submission self-check</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Reviewers score every dataset on eight quality dimensions. Run through the same checks
              before you submit and you&apos;ll avoid most revision requests. Your ticks stay in this
              browser.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button type="button" variant="outline" size="sm" className="h-9 gap-2" onClick={copyOpenItems}>
              {copied ? (
                <Check className="size-4" aria-hidden />
              ) : (
                <ClipboardCopy className="size-4" aria-hidden />
              )}
              {copied ? "Copied" : "Copy open items"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-2"
              onClick={() => window.print()}
            >
              <Printer className="size-4" aria-hidden />
              Print
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 gap-2"
              onClick={onReset}
              disabled={done === 0}
            >
              <RotateCcw className="size-4" aria-hidden />
              Reset
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {done} of {total} checks done
            </span>
            <span className="font-medium tabular-nums text-foreground">{percent}%</span>
          </div>
          <ProgressBar percent={percent} label="Self-check progress" />
          {done === total ? (
            <p className="pt-1 text-[13px] font-medium text-success">
              Everything checked. You&apos;re ready to submit.
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {QA_DIMENSIONS.map((dimension) => {
          const dimDone = dimension.guidanceItems.filter((_, i) => checklist[itemId(dimension.id, i)]).length;
          const complete = dimDone === dimension.guidanceItems.length;
          return (
            <section
              key={dimension.id}
              className={cn("rounded-2xl border bg-card", complete && "border-success/30")}
            >
              <header className="flex items-start justify-between gap-3 border-b px-4 py-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">{dimension.label}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{dimension.description}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-xs tabular-nums",
                    complete ? "font-medium text-success" : "text-muted-foreground",
                  )}
                >
                  {dimDone}/{dimension.guidanceItems.length}
                </span>
              </header>
              <ul className="divide-y">
                {dimension.guidanceItems.map((text, i) => {
                  const id = itemId(dimension.id, i);
                  const checked = !!checklist[id];
                  return (
                    <li key={id}>
                      <label className="flex cursor-pointer items-start gap-3 px-4 py-3 text-[13px] transition-colors hover:bg-muted/30">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => onToggle(id, e.target.checked)}
                          className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary"
                        />
                        <span className={cn(checked && "text-muted-foreground line-through")}>
                          {text}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
