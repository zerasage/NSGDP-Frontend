"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchAll } from "@/lib/mock";
import type { SearchResult } from "@/lib/mock";

export function NavbarSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const data = await searchAll(q);
    setResults(data.slice(0, 5));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const getHref = (result: SearchResult) => {
    if (result.type === "dataset") return `/dataportal/${(result.item as { slug: string }).slug}`;
    if (result.type === "development-partner") return `/development-partners/${(result.item as { slug: string }).slug}`;
    return `/groups/${(result.item as { slug: string }).slug}`;
  };

  const getLabel = (result: SearchResult) => {
    const item = result.item as { title?: string; name: string };
    return item.title ?? item.name;
  };

  return (
    <div ref={containerRef} className="relative hidden flex-1 max-w-md md:flex">
      <form onSubmit={handleSubmit} className="w-full">
        <Search
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          placeholder="Search datasets..."
          className="w-full pl-10 pr-3 h-9 text-sm bg-accent/50 border-primary/20 focus:border-primary/50 focus:bg-background"
          aria-label="Search datasets"
          aria-expanded={open && results.length > 0}
          aria-controls="search-typeahead"
          autoComplete="off"
        />
      </form>

      {open && query.trim() && (
        <ul
          id="search-typeahead"
          role="listbox"
          className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-lg py-1"
        >
          {loading ? (
            <li className="px-4 py-3 text-sm text-muted-foreground">Searching…</li>
          ) : results.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted-foreground">No results</li>
          ) : (
            results.map((result, i) => (
              <li key={`${result.type}-${i}`} role="option" aria-selected={false}>
                <Link
                  href={getHref(result)}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                >
                  <span className="text-xs uppercase text-muted-foreground w-16 shrink-0">
                    {result.type}
                  </span>
                  <span className="truncate">{getLabel(result)}</span>
                </Link>
              </li>
            ))
          )}
          <li className="border-t">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push(`/search?q=${encodeURIComponent(query.trim())}`);
              }}
              className="w-full px-4 py-2 text-sm text-primary hover:bg-muted text-left"
            >
              View all results for &ldquo;{query}&rdquo;
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
