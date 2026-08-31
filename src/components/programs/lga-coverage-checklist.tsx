"use client";

import { Badge } from "@/components/ui/badge";

interface LgaCoverageChecklistProps {
  targetLgas: string[];
  coveredLgas: string[];
  onChange: (coveredLgas: string[]) => void;
  disabled?: boolean;
}

export function LgaCoverageChecklist({
  targetLgas,
  coveredLgas,
  onChange,
  disabled,
}: LgaCoverageChecklistProps) {
  if (targetLgas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Set target LGAs on the programme first, then mark which ones are covered here.
      </p>
    );
  }

  const toggle = (name: string) => {
    if (disabled) return;
    onChange(
      coveredLgas.includes(name)
        ? coveredLgas.filter((item) => item !== name)
        : [...coveredLgas, name].sort((a, b) => a.localeCompare(b)),
    );
  };

  const coveragePct = Math.round((coveredLgas.length / targetLgas.length) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">LGA coverage</span>
        <span className="font-medium tabular-nums">
          {coveredLgas.length} / {targetLgas.length} ({coveragePct}%)
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${coveragePct}%` }}
        />
      </div>

      <ul className="divide-y rounded-lg border max-h-56 overflow-y-auto">
        {targetLgas.map((name) => {
          const checked = coveredLgas.includes(name);
          return (
            <li key={name}>
              <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50">
                <input
                  type="checkbox"
                  className="size-4 rounded border-input"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggle(name)}
                />
                <span className="flex-1">{name}</span>
                {checked ? <Badge variant="secondary">Covered</Badge> : null}
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
