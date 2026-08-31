"use client";

import { useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLgaOptions } from "@/lib/hooks/useLgaOptions";

interface LgaMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  id?: string;
}

export function LgaMultiSelect({
  value,
  onChange,
  disabled,
  id,
}: LgaMultiSelectProps) {
  const { options, isLoading } = useLgaOptions();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.name.toLowerCase().includes(q));
  }, [options, query]);

  const toggle = (name: string) => {
    if (disabled) return;
    onChange(
      value.includes(name)
        ? value.filter((item) => item !== name)
        : [...value, name].sort((a, b) => a.localeCompare(b)),
    );
  };

  const selectAllFiltered = () => {
    if (disabled || filtered.length === 0) return;
    const names = filtered.map((option) => option.name);
    onChange([...new Set([...value, ...names])].sort((a, b) => a.localeCompare(b)));
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((option) => value.includes(option.name));

  return (
    <div className="space-y-2" id={id}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search LGAs..."
          className="pl-9"
          disabled={disabled}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-0 text-xs"
          disabled={disabled || isLoading || filtered.length === 0 || allFilteredSelected}
          onClick={selectAllFiltered}
        >
          {query.trim() ? "Select all matching" : "Select all"}
        </Button>
        <span className="text-muted-foreground text-xs">·</span>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-0 text-xs text-muted-foreground"
          disabled={disabled || value.length === 0}
          onClick={clearAll}
        >
          Clear all
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5 min-h-[1.5rem]">
        {value.length === 0 ? (
          <span className="text-xs text-muted-foreground">No LGAs selected</span>
        ) : (
          value.map((name) => (
            <Badge key={name} variant="secondary">
              {name}
            </Badge>
          ))
        )}
      </div>

      <div className="rounded-lg border max-h-52 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading LGAs…
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No LGAs match your search.</p>
        ) : (
          <ul className="divide-y">
            {filtered.map((option) => {
              const checked = value.includes(option.name);
              return (
                <li key={option.name}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-input"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggle(option.name)}
                    />
                    <span className="flex-1">{option.name}</span>
                    {option.code ? (
                      <span className="text-xs text-muted-foreground">{option.code}</span>
                    ) : null}
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {value.length} of {options.length} LGAs selected
      </p>
    </div>
  );
}
