"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FAQ_GROUPS, FAQS, GLOSSARY } from "@/lib/learning/reference";
import { Disclosure, EmptyNote, SegmentedTabs } from "./learning-primitives";
import { LifecycleExplainer } from "./lifecycle-explainer";

type Section = "lifecycle" | "faq" | "glossary";

const SECTIONS: Array<{ id: Section; label: string }> = [
  { id: "lifecycle", label: "How review works" },
  { id: "faq", label: "FAQ" },
  { id: "glossary", label: "Glossary" },
];

function GlossaryList() {
  const [query, setQuery] = useState("");

  const terms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...GLOSSARY]
      .sort((a, b) => a.term.localeCompare(b.term))
      .filter((t) => !q || `${t.term} ${t.definition}`.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search terms"
          aria-label="Search glossary"
          className="h-10 pl-9"
        />
      </div>

      {terms.length === 0 ? (
        <EmptyNote>No terms match &ldquo;{query}&rdquo;.</EmptyNote>
      ) : (
        <dl className="divide-y rounded-2xl border bg-card">
          {terms.map((t) => (
            <div key={t.term} className="grid gap-1 px-4 py-3 sm:grid-cols-[14rem_1fr] sm:gap-4 sm:px-5">
              <dt className="flex items-center gap-2 text-sm font-medium">
                {t.term}
                <Badge variant="outline" className="h-5 text-[10px] font-normal">
                  {t.category}
                </Badge>
              </dt>
              <dd className="text-[13px] leading-5 text-muted-foreground">{t.definition}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function FaqList() {
  return (
    <div className="space-y-6">
      {FAQ_GROUPS.map((group) => {
        const items = FAQS.filter((f) => f.group === group);
        if (items.length === 0) return null;
        return (
          <section key={group} className="space-y-2">
            <h3 className="text-[13px] font-medium">{group}</h3>
            <div className="space-y-2">
              {items.map((f) => (
                <Disclosure key={f.id} title={f.question}>
                  {f.answer}
                </Disclosure>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function ReferenceTab({ initialSection = "lifecycle" }: { initialSection?: Section }) {
  const [section, setSection] = useState<Section>(initialSection);

  return (
    <div className="space-y-5">
      <div className="max-w-md">
        <SegmentedTabs tabs={SECTIONS} value={section} onChange={setSection} label="Reference sections" />
      </div>
      {section === "lifecycle" ? <LifecycleExplainer /> : null}
      {section === "faq" ? <FaqList /> : null}
      {section === "glossary" ? <GlossaryList /> : null}
    </div>
  );
}
