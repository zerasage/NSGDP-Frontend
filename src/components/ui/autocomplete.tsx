"use client";

import { Autocomplete as BaseAutocomplete } from "@base-ui/react/autocomplete";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AutocompleteProps {
  items: string[];
  value: string;
  onValueChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

/**
 * Free-text input with a suggestion dropdown — unlike Combobox, the bound
 * value is whatever the user typed, not restricted to one of `items`. Use
 * for fields where a preset list covers the common cases but arbitrary
 * values must still be allowed (e.g. license strings).
 */
export function Autocomplete({
  items,
  value,
  onValueChange,
  id,
  placeholder = "Type or select…",
  emptyMessage = "No matching suggestions — your typed value will be used",
  className,
}: AutocompleteProps) {
  return (
    <BaseAutocomplete.Root items={items} value={value} onValueChange={onValueChange}>
      <BaseAutocomplete.InputGroup
        className={cn(
          "flex h-10 w-full items-center gap-1.5 rounded-lg border border-input bg-transparent pl-3 pr-2 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
          className
        )}
      >
        <BaseAutocomplete.Input
          id={id}
          placeholder={placeholder}
          className="h-full w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <BaseAutocomplete.Trigger className="shrink-0 text-muted-foreground" aria-label="Toggle suggestions">
          <ChevronDown className="size-4" />
        </BaseAutocomplete.Trigger>
      </BaseAutocomplete.InputGroup>

      <BaseAutocomplete.Portal>
        <BaseAutocomplete.Positioner className="isolate z-50" sideOffset={4} align="start">
          <BaseAutocomplete.Popup className="max-h-72 w-(--anchor-width) min-w-[280px] overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10">
            <BaseAutocomplete.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </BaseAutocomplete.Empty>
            <BaseAutocomplete.List>
              {(item: string) => (
                <BaseAutocomplete.Item
                  key={item}
                  value={item}
                  className="relative flex cursor-default items-center gap-2 rounded-md py-2 pl-2.5 pr-2 text-sm outline-none select-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                >
                  <span className="truncate">{item}</span>
                </BaseAutocomplete.Item>
              )}
            </BaseAutocomplete.List>
          </BaseAutocomplete.Popup>
        </BaseAutocomplete.Positioner>
      </BaseAutocomplete.Portal>
    </BaseAutocomplete.Root>
  );
}
