# NSGDP Portal UI Design Guide

## Purpose

This guide defines the visual system for the **public GeoHealth portal** (`nsgdp-frontend`). It is distilled from the Health Analytics page redesign (`/analytics`) and should be the default for new and updated portal pages.

It is related to, but **not the same as**, the admin guide (`nsgdp-admin/docs/ADMIN_UI_DESIGN_GUIDE.md`):

| | Portal (this guide) | Admin |
| --- | --- | --- |
| Audience | Public analysts, programme staff, visitors | Super-admins / reviewers |
| Density | Comfortable overview + dense tables | Compact operational |
| Color | Soft semantic tints on primary metrics | Mostly neutral; color for status only |
| Brand | NSPHCDA green as primary action / tabs | Same tokens, quieter application |

**Reference implementation:** `src/app/(business)/analytics/page.tsx`

Do not invent page-specific hex colors. Use tokens from `src/app/globals.css`.

---

## 1. Core rules

1. Prefer shared primitives in `components/ui` and `components/layout` before one-off markup.
2. Use a **4px spacing grid**: 4, 8, 12, 16, 20, 24, 32.
3. Surfaces are **border-led**, not shadow-led. One 1px border defines a card/panel.
4. Reserve shadows for overlays (menus, dialogs, popovers).
5. Page title is **24px / bold** (`text-2xl font-bold leading-8`) on **tool pages**. Hierarchy comes from spacing, weight, and color tone — not oversized headlines. The home landing hero is the exception (see §11).
6. Body copy is **14px**. Dense tables and supporting metadata use **13px**.
7. Every view must support **loading, empty, error, and populated** states with the same outer geometry.
8. Desktop controls may be compact (`h-8` / `h-9`); touch targets should remain usable on mobile.
9. Sentence case for titles, tabs, buttons, and field labels. Uppercase only for eyebrows, metric labels, and table column headers.
10. When primary KPIs need scanability, use **toned metric cards** (colored icon well + soft tint). Secondary / contextual stats stay **muted** (dashed border).

---

## 2. Foundations

### 2.1 Spacing and page rhythm

| Use | Value | Tailwind |
| --- | ---: | --- |
| Micro (icon–label) | 4–8px | `gap-1` / `gap-2` |
| Control groups | 12px | `gap-3` |
| Card padding | 16–20px | `p-4` / `sm:p-5` |
| Section gap | 24px | `space-y-6` |
| Page padding | via `Container` + `py-6` | — |

Prefer one vertical rhythm per page (`space-y-6` for overview / analytics pages).

### 2.2 Typography

| Role | Spec | Tailwind cue |
| --- | --- | --- |
| Eyebrow chip | 11px semibold uppercase | `text-[11px] font-semibold uppercase tracking-wide` |
| Page title (`h1`) | 24px / 32px, bold | `text-2xl font-bold leading-8 tracking-tight` |
| Section title (`h2`) | 16px / 24px, semibold | `text-base font-semibold leading-6` |
| Metric label | 11px semibold uppercase | same as eyebrow |
| Metric value | 20–24px bold tabular | `text-xl sm:text-2xl font-bold tabular-nums` |
| Body | 14px | `text-sm` |
| Dense / helper | 12–13px muted | `text-xs` / `text-[13px] text-muted-foreground` |
| Field label | 13px medium | `text-[13px] font-medium` |
| Table header | 11px semibold uppercase muted | `text-[11px] font-semibold uppercase tracking-wide text-muted-foreground` |
| Table cell | 13px | `text-[13px]` |

Use `tabular-nums` for any aligned numeric column or KPI value.

### 2.3 Color tokens (semantic only)

Brand and status live in CSS variables — consume them via Tailwind color classes (`bg-primary/10`, `text-success`, etc.).

| Token | Role on portal pages |
| --- | --- |
| `primary` | Brand green — filled tabs, primary CTAs, trend lines, brand eyebrow |
| `success` | Positive / coverage metrics (e.g. LGAs reporting) |
| `info` | Neutral analytic accent (completeness, map coverage, bar charts) |
| `warning` | Caution (outliers, missing rows, elevated incidence) |
| `destructive` | Burden / risk emphasis (case totals, high direction) — not only “delete” |
| `muted` | Secondary platform context, dashed secondary metrics |
| `card` / `border` / `foreground` | Default surfaces and text |

**Do not** introduce new named colors for a single page. Prefer opacity modifiers (`/10`, `/15`, `/20`) for soft tints.

Charts may use `var(--primary)`, `var(--info)`, or `--chart-1` … `--chart-5`. Prefer `var(--token)` over `hsl(var(--token))` when the token is a hex or oklch value.

### 2.4 Borders, radius, elevation

| Pattern | Spec |
| --- | --- |
| Card / panel | `rounded-2xl` (16px) + `border` + `bg-card` |
| Metric card | same radius; optional soft tone background |
| Nested table wrap | `rounded-xl border` inside panel body |
| Icon well | `size-8` or `size-9`, `rounded-lg`, bordered tint |
| Segmented control shell | `rounded-xl` or `rounded-lg` + `border` + `bg-muted/30` + `p-1` / `p-0.5` |
| Static surfaces | no box-shadow |
| Active tab (filled) | `bg-primary text-primary-foreground` |

Avoid stacking border + ring + shadow on the same static card.

### 2.5 Icons

- Lucide only; keep stroke weight consistent.
- **16px** (`size-4`) in buttons, wells, table sort affordances.
- Icon wells: 32–36px (`size-8` / `size-9`).
- Decorative icons: `aria-hidden`. Interactive icon-only controls need an accessible name.
- Pair section titles with a small tinted icon well when the section is a primary focal point (charts, outliers, GIS).

---

## 3. Page anatomy

### 3.1 Shell

```
<main className="flex-1 py-6">
  <Container size="wide" className="space-y-6">
    {/* header → tabs → filters → content */}
  </Container>
</main>
```

Use `Container` from `@/components/layout/container`. Prefer `size="wide"` for data-heavy pages.

### 3.2 Page header

Order:

1. Optional **eyebrow chip** (brand-tinted): icon + short uppercase label (e.g. “Surveillance”).
2. **Title** (`h1`).
3. One short supporting sentence (`text-sm text-muted-foreground`, `max-w-2xl`).
4. Optional primary action on the right (outline or default button, `h-9`).

Keep the first block lean: brand cue, title, one sentence, one action group.

### 3.3 Segmented tabs

For in-page mode switching (not route nav):

- Shell: `flex gap-1 overflow-x-auto rounded-xl border bg-muted/30 p-1`
- Tab button: `h-9 rounded-lg px-3 sm:px-4 text-sm font-medium`
- Active: `bg-primary text-primary-foreground`
- Inactive: `text-muted-foreground hover:bg-background/80 hover:text-foreground`

Do not use underline-only tabs for these dense tool pages.

### 3.4 Filter / toolbar strip

A bordered card that holds selectors (indicator, year, organisation):

```
rounded-2xl border bg-card p-4 sm:p-5
flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between
```

Left: short title (`text-[13px] font-medium`) + helper (`text-xs text-muted-foreground`).  
Right: selects at `h-9`.

Field labels above controls use the FieldLabel pattern (`text-[13px] font-medium`, `mb-2`).

---

## 4. Components

### 4.1 Metric card (primary KPIs)

**Order is fixed:** label → value → optional hint. Icon sits top-right in a tinted well.

| Property | Spec |
| --- | --- |
| Grid | 1 / 2 / 4 columns (`gap-3`) |
| Padding | 16px (`p-4`) |
| Radius | 16px (`rounded-2xl`) |
| Label | 11px uppercase muted |
| Value | 20–24px bold tabular |
| Hint | 12px muted |
| Icon well | 36px, `rounded-lg`, bordered tone fill |

#### Metric tones

Use tones to encode meaning, not decoration. Assign one tone per metric role and keep it stable across pages.

| Tone | Typical use | Card treatment |
| --- | --- | --- |
| `destructive` | Case / burden totals | Soft red tint + red icon well |
| `success` | Coverage / reporting counts | Soft green tint |
| `info` | Completeness, geography, “how much data” | Soft blue tint |
| `warning` | Outliers, missingness, caution | Soft amber tint |
| `primary` | Brand-aligned highlight KPI | Soft green brand tint |
| `muted` | Secondary platform context | **Dashed** border, neutral well |

Canonical tone classes (match analytics):

```ts
// card / well / icon — use existing tokens + opacity
primary:      border-primary/20 bg-primary/[0.04]     | well: bg-primary/10
success:      border-success/25 bg-success/[0.06]     | well: bg-success/15
info:         border-info/25 bg-info/[0.06]           | well: bg-info/15
warning:      border-warning/30 bg-warning/[0.08]     | well: bg-warning/20
destructive:  border-destructive/20 bg-destructive/[0.05] | well: bg-destructive/10
muted:        border-dashed bg-muted/20               | well: bg-muted/50
```

**Hierarchy rule:** Put the most important KPI row first with strong tones. Put platform / registry context in a second row using `muted` only.

### 4.2 Panel (section card)

For charts, tables, and drill-downs:

```
section.rounded-2xl.border.bg-card
  header: border-b px-4 py-4 sm:px-5  (title + description + optional actions)
  body:   p-4 sm:p-5
```

- Title may include a tinted icon well + `HelpTooltip`.
- Description is `text-[13px] text-muted-foreground`.
- Header actions (export, period toggle) stay in the header — do not float them into the chart area.

### 4.3 Nested data table

Inside a panel body:

1. Wrap: `overflow-x-auto rounded-xl border`
2. Table: `w-full text-[13px]`
3. Header row: `border-b bg-muted/30`, cells `h-11 px-4`
4. Body rows: `border-b last:border-0`, cells `px-4 py-3.5`
5. Numbers: `text-right tabular-nums`
6. Highlight rows only with semantic tint (e.g. `bg-destructive/5` for elevated incidence) — never solid saturated fills.

### 4.4 Chart panels

| Spec | Value |
| --- | --- |
| Height | `h-56 sm:h-72` (224–288px) |
| Grid | muted stroke (`stroke-muted`) |
| Axis ticks | 10–11px |
| Line series | `stroke="var(--primary)"`, strokeWidth ~2.5 |
| Bar series | fill semantic accent (`var(--info)` or `var(--chart-*)`), light bar radius |
| Period toggle | compact segmented control in panel header |

Empty chart: centered `text-[13px] text-muted-foreground` inside the chart height box (no layout jump).

### 4.5 Programme / entity cards

Interactive or navigable records (not KPIs):

- `rounded-2xl border bg-card p-4 sm:p-5`
- Status via shared `Badge` (not custom pill colors)
- Progress bar: `h-1.5 rounded-full bg-muted` + `bg-primary` fill
- Metadata footer: `border-t pt-3 text-xs text-muted-foreground`

No drop shadows. No nested “card inside card” for static content.

### 4.6 Empty, loading, error

| State | Pattern |
| --- | --- |
| Loading | `PageHeaderSkeleton` + metric-sized `Skeleton` (`h-[96px] rounded-2xl`) |
| Empty | Centered copy in `rounded-2xl border bg-card px-6 py-12 text-sm text-muted-foreground` |
| Soft empty (filter miss) | Dashed inset: `rounded-xl border border-dashed … text-[13px]` |
| Error | Shared `Alert variant="destructive"` |

Keep empty and loaded layouts the same width/padding so the page does not jump.

---

## 5. Visual hierarchy checklist

Use this when reviewing a portal page:

1. **One clear title** and at most one brand eyebrow.
2. **Primary metrics** first, toned, with icons.
3. **Secondary context** second, muted / dashed.
4. **Tools** (filters, tabs) visually quieter than metrics.
5. **Analysis** (charts / tables) in panels with section icon wells.
6. **Color encodes meaning** (burden / coverage / caution / brand) — not rainbow decoration.
7. Status and selection remain understandable without color alone (labels, icons, filled vs ghost).

---

## 6. Responsiveness

| Breakpoint | Expectation |
| --- | --- |
| `< 640px` | Single-column metrics; stacked header action; horizontally scrollable tabs and tables |
| `sm` | 2-column metrics where space allows |
| `lg` | 4-column metrics; 2-column chart grid; filter strips become row layouts |

Do not hide essential filters on mobile — wrap or stack them.

---

## 7. Accessibility

- One `h1` per page; section titles as `h2`.
- Do not rely on color alone for outliers, direction, or active tabs (pair with text / fill / icon).
- Decorative icons: `aria-hidden`.
- Selects and buttons keep visible labels; tooltips supplement, they do not replace.
- Maintain contrast on tinted surfaces (soft fills only — values stay `text-foreground`).

---

## 8. Implementation notes

### Current state

Shared `MetricCard`, `Panel`, `FieldLabel`, `PageEyebrow`, and `EntityCard` live at:

- `src/components/data/metric-card.tsx`
- `src/components/layout/content-panel.tsx`

`/analytics` still has page-local copies. Prefer the shared modules on new work; migrate analytics when that page is next touched.

Keep tone maps in one module so KPI colors stay coordinated.

### Migration approach for existing pages

1. Adopt page header + `Container` + `space-y-6`.
2. Replace ad-hoc cards with Panel / MetricCard patterns.
3. Convert KPI rows to toned metrics; demote platform/context stats to `muted`.
4. Normalize tables to the nested bordered table spec.
5. Swap hard-coded chart colors for `var(--primary)` / semantic chart tokens.
6. Run `npx tsc --noEmit` in `nsgdp-frontend` after major UI edits.

### Out of scope

- Admin console pages (use `ADMIN_UI_DESIGN_GUIDE.md`).
- Map chrome beyond token usage for markers/popups (map-specific guide can extend this later).

The public **home page is in scope**. It is a marketing landing surface plus portal wayfinding — follow **§11**, not the analytics tool-page shell.

---

## 9. Acceptance checklist

- [ ] Uses semantic tokens only (no new page hex).
- [ ] Border-led cards/panels at 16px radius; no static shadows.
- [ ] Page title ≤ 24px; sentence case. **Exception:** the home hero `h1` may exceed 24px (see §11).
- [ ] Primary KPIs: label → value → hint + toned icon well. **Exception:** home shows live counts as hero chips, not a second MetricCard row.
- [ ] Secondary stats are visually quieter (muted / dashed).
- [ ] Tables: uppercase headers, tabular nums, nested `rounded-xl border` wrap.
- [ ] Loading / empty / error geometries match populated layout.
- [ ] Tabs / filters follow segmented + toolbar strip patterns when applicable.
- [ ] Charts use CSS variables for series color.
- [ ] Works at mobile width without losing primary actions.
- [ ] Home (`/`): one stats row, one destination grid for catalogue/maps/analytics, GIS shortcuts are not a duplicate of the three doors, closing CTA includes contribute.

---

## 10. Source of truth

| Asset | Path |
| --- | --- |
| This guide | `nsgdp-frontend/docs/PORTAL_UI_DESIGN_GUIDE.md` |
| Tokens | `nsgdp-frontend/src/app/globals.css` |
| Reference UI (tools) | `nsgdp-frontend/src/app/(business)/analytics/page.tsx` |
| Reference UI (landing) | `nsgdp-frontend/src/app/(business)/page.tsx` + `src/components/map/home-hero-section.tsx` |
| Shared primitives | `src/components/data/metric-card.tsx`, `src/components/layout/content-panel.tsx` |
| Admin counterpart | `nsgdp-admin/docs/ADMIN_UI_DESIGN_GUIDE.md` |

---

## 11. Portal landing (`/`)

Home is the **public landing page**, not an analytics tool. Visitors need identity, trust, search, live scale, and clear doors into the catalogue, maps, and analytics. Do not collapse it into the §3.1 tool shell (eyebrow + 24px `h1` + filters).

**Reference:** `src/app/(business)/page.tsx`, `src/components/map/home-hero-section.tsx`

### 11.1 What the page must do

Keep these jobs; do not stack the same job twice:

| Job | Where |
| --- | --- |
| Agency identity + portal name | Hero `h1` on the photo |
| Catalogue search | Hero search field |
| Primary actions | Hero: Browse repository, Analytics dashboard. Closing strip: Browse repository, Contribute data |
| Live scale | Hero stat chips only (datasets, organisations, downloads, LGAs) |
| Trust | Strip immediately under the hero (verified, licences, updates) |
| Time-sensitive notices | Outbreak alerts, when any are active |
| Wayfinding | One three-door panel (browse / maps / analytics) |
| GIS entry | One maps-and-facilities panel (facility finder, population map, settlements) |
| Collections | Featured topic groups when the API returns any |
| Why it matters | Use-case copy (surveillance, facility planning, population health) — **not** a third nav grid |
| Proof of catalogue | Most-downloaded list (no repeated KPI row) |

Do **not** repeat hero counts as MetricCards. Do **not** add a six-card “capabilities” grid that restates browse/maps/analytics plus access/QGIS. Access and review belong in trust copy.

### 11.2 Hero (marketing exception)

Allowed on `/` only:

- Full-bleed photography with a dark vignette so type stays readable. Overlay may use a brand-green radial wash; do not add unrelated hex palettes.
- One `h1`. Display size may exceed 24px (typically up to ~40–48px on large screens) because this is identity, not a tool title.
- Search and CTAs use on-dark variants (`hero-input`, `hero-btn-solid`, `onDark` / `onDarkSolid`). Overlay controls may use a light fill for contrast; below-fold surfaces stay border-led with no static shadow.
- Stat chips sit on the photo: `rounded-xl` light fill, **uppercase metric labels**, tabular values. Same four numbers must not appear again below the fold.

Hero copy and buttons use **sentence case** except the official product name in the `h1`.

Keep the hero tall enough that search, both CTAs, and the four chips are visible without scrolling on a typical desktop viewport.

### 11.3 Below the fold

From the trust strip downward, this guide’s normal rules apply:

- `Container size="wide"` + `py-6` + `space-y-6`
- `rounded-2xl border bg-card` panels and entity cards
- Section titles `text-base font-semibold` (16px), body `text-sm`
- Toned icon wells from `METRIC_TONE`
- Sentence case for section titles and buttons
- Semantic tokens only (outbreak alerts included — no raw `amber-50` / `blue-50` fills)

Trust cards are three equal columns, not a centred marketing trio with oversized heading.

Closing CTA is a single bordered card with Browse (primary) and Contribute (`/partner-data`, outline) — not a gradient marketing slab.

### 11.4 Accessibility

- Still one `h1` (the hero). Trust items and panels use `h2` / `h3`.
- Hero search has an accessible name. Decorative photo: empty `alt` + `aria-hidden`.
- Outbreak expand/dismiss controls have accessible names.

---