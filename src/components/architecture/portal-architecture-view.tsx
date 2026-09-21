"use client";

/**
 * Public architecture reference — kept in sync with the three-app codebase
 * (nsgdp-frontend · nsgdp-backend · nsgdp-admin) and UserRole / PERMISSION_ACTION_MAP.
 */

import { cn } from "@/lib/utils";
import {
  LIFECYCLE_PIPELINE,
  LIFECYCLE_RATIONALE,
  INGESTION_PIPELINE,
} from "@/lib/constants/dataset-lifecycle";

const roles = [
  {
    id: "public",
    label: "Public Visitor",
    gate: "Open access",
    sub: "No account required",
    tier: "muted" as const,
    features: [
      { page: "Homepage", desc: "Hero · repository stats · Browse Datasets CTA · outbreak alerts" },
      { page: "Data Portal", desc: "/dataportal — catalogue, filters, dataset detail & preview" },
      { page: "Document Library", desc: "SOPs · policies · guidelines · research reports" },
      { page: "Analytics Dashboard", desc: "KPIs · disease burden · LGA / ward trends · CSV export" },
      { page: "GIS Mapping (4 maps)", desc: "Coverage · population/facility · facilities · settlements" },
      { page: "Programs", desc: "Public programme tracker · reports when published" },
      { page: "Development Partners", desc: "Partner directory · partner dataset visibility" },
      { page: "Groups & Search", desc: "Topic groups · global search · API docs" },
      { page: "About / Contact", desc: "Ownership · partners · contact form" },
    ],
  },
  {
    id: "registered",
    label: "Registered",
    gate: "+ Login · email verify",
    sub: "Browse · download · request",
    tier: "default" as const,
    features: [
      { page: "Dashboard", desc: "Activity summary · shortcuts · notifications" },
      { page: "My Downloads", desc: "Download history · re-download" },
      { page: "Restricted access", desc: "Request access to restricted datasets" },
      { page: "Notifications", desc: "In-app bell · email for publications & reviews" },
      { page: "Profile", desc: "Account settings · password" },
    ],
  },
  {
    id: "contributor",
    label: "Contributor",
    gate: "+ Development partner member",
    sub: "Upload · submit · track",
    tier: "default" as const,
    features: [
      { page: "Upload wizard", desc: "Multi-step · drag-drop · draft autosave · metadata" },
      { page: "My Datasets", desc: "Lifecycle status · edit · version history" },
      { page: "Contribute Data", desc: "Public /partner-data entry into the upload flow" },
      { page: "My Programs", desc: "Create/edit when granted · upload programme reports" },
      { page: "Partner documents", desc: "Draft/submit own-partner documents (create:documents)" },
      { page: "Development Partner page", desc: "Partner membership · partner profile" },
    ],
  },
  {
    id: "admin",
    label: "Development Partner Admin",
    gate: "+ admin (partner-scoped)",
    sub: "Partner governance",
    tier: "default" as const,
    features: [
      { page: "Partner members", desc: "Invite / manage members of own development partner" },
      { page: "Partner datasets", desc: "Oversee partner submissions · metadata corrections" },
      { page: "Programmes", desc: "Partner-scoped programme create/edit when permitted" },
      { page: "Agreements", desc: "Data-sharing agreement visibility for the partner" },
    ],
  },
  {
    id: "staff",
    label: "Staff",
    gate: "+ staff · permission group",
    sub: "Capability from grants",
    tier: "card" as const,
    features: [
      { page: "nsgdp-admin portal", desc: "Separate Next.js admin app — no hardcoded power beyond group grants" },
      { page: "Dataset review", desc: "Two-stage: validate:datasets (QA → validated) then approve:datasets → publish:datasets" },
      { page: "Review queue scopes", desc: "Development Partners queue · Agency (platform-owner) queue — separate pending counts" },
      { page: "Ingestion Ops", desc: "Warehouse load · indicators · aliases · conflicts · AI spend (super only)" },
      { page: "Documents / Programs", desc: "manage:documents · programme CRUD grants" },
      { page: "Intake desks", desc: "Access requests · archive requests · partner interest · contact inbox" },
      { page: "Agency / Departments", desc: "invite:staff · department membership (scoped)" },
    ],
  },
  {
    id: "superadmin",
    label: "Super Admin",
    gate: "+ super_admin",
    sub: "Full system · delegation",
    tier: "accent" as const,
    features: [
      { page: "Permission Groups", desc: "Grant / revoke atomic actions to staff groups" },
      { page: "System Health", desc: "Queues · Redis · Postgres · MinIO · /ready" },
      { page: "Governance", desc: "Data governance panel · SOP / indicator oversight" },
      { page: "Hardcoded-only ops", desc: "Deactivate users · role changes · staff revoke (never delegatable)" },
      { page: "All admin screens", desc: "Full access to every admin capability" },
    ],
  },
];

const permissionGroups = [
  {
    title: "Dataset governance",
    perms: [
      "view:datasets",
      "validate:datasets",
      "approve:datasets",
      "publish:datasets",
      "archive:datasets",
      "create:datasets",
      "view:restricted",
      "download:restricted",
    ],
  },
  {
    title: "People & partners",
    perms: [
      "invite:users",
      "invite:staff",
      "manage:department-members",
      "promote:org-admin",
      "demote:org-admin",
      "remove:org-members",
      "create:development-partners",
      "edit:development-partners",
      "manage:development-partner-agreements",
      "manage:partner-api-keys",
    ],
  },
  {
    title: "Content & ops",
    perms: [
      "create:programs",
      "edit:programs",
      "delete:programs",
      "upload:programs",
      "manage:documents",
      "create:documents",
      "manage:groups",
      "manage:analytics",
      "manage:gis-reference-data",
      "manage:indicators",
      "approve:access-requests",
      "review:partner-interest",
      "review:contact-messages",
    ],
  },
];

const exampleGroups = [
  {
    name: "Validators",
    description: "QA checklist & mark validated — upstream of final approve",
    permissions: ["view:datasets", "validate:datasets"],
  },
  {
    name: "Approvers",
    description: "Final approve / send-back on already-validated datasets",
    permissions: ["view:datasets", "approve:datasets", "publish:datasets"],
  },
  {
    name: "Programme Leads",
    description: "Programme managers without platform admin role",
    permissions: ["create:programs", "edit:programs", "upload:programs"],
  },
  {
    name: "Partner desk",
    description: "Intake for partnership leads and restricted-access requests",
    permissions: ["view:partner-interest", "review:partner-interest", "view:access-requests", "approve:access-requests"],
  },
];

const apps = [
  {
    name: "nsgdp-frontend",
    port: "3004",
    role: "Public portal + contributor dashboard",
    stack: "Next.js 15 · React 19 · TypeScript · Tailwind v4 · Leaflet · Recharts · TanStack Query",
    items: [
      "(business) public pages",
      "(dashboard) signed-in workspace",
      "(auth) register · login · verify · reset",
      "4 GIS map experiences",
      "Analytics dashboard",
      "Upload / My Datasets / My Programs",
    ],
  },
  {
    name: "nsgdp-admin",
    port: "3003",
    role: "Staff / super-admin console",
    stack: "Next.js · permission-gated sidebar · staff invite accept",
    items: [
      "Dataset review & approve",
      "Ingestion Ops · warehouse",
      "Development partners",
      "Permission groups",
      "Documents · programmes · collections",
      "System health · audit log",
    ],
  },
  {
    name: "nsgdp-backend",
    port: "3001",
    role: "API + BullMQ worker process",
    stack: "NestJS 11 · TypeORM · PostgreSQL/PostGIS · Redis · MinIO · Swagger",
    items: [
      "Auth · datasets · GIS · analytics",
      "Ingestion / warehouse pipeline",
      "Programmes · documents · groups",
      "Development partners · departments",
      "Notifications · AI inference",
      "Admin permissions · audit",
    ],
  },
];

const sysLayers = [
  {
    label: "Clients",
    tech: "Three separate Next.js apps (no monorepo root git)",
    items: apps.flatMap((a) => [`${a.name} :${a.port}`]),
  },
  {
    label: "API",
    tech: "NestJS 11  ·  Node.js  ·  JWT  ·  Swagger / OpenAPI",
    items: [
      "/auth/* — register · login · verify · reset · session",
      "/datasets/* — CRUD · lifecycle · versions · map coverage",
      "/gis/* — LGA · wards · facilities · settlements · disease burden · state boundary",
      "/analytics/* — burden · trends · ward · export CSV",
      "/ingestion/* — staging · resolution · warehouse load",
      "/programs/* · /documents/* · /groups/* · /development-partners/*",
      "/admin/* — users · staff · permissions · audit · queues · health",
      "/notifications/* · /uploads/* · /search/* · /contact/*",
    ],
  },
  {
    label: "Workers",
    tech: "BullMQ on Redis — dedicated worker process",
    items: [
      "validation — MIME / safety checks",
      "upload-processing — post-upload pipeline",
      "geo-extraction — spatial file → PostGIS",
      "resolution — staging entity resolution",
      "dataset-publish — publish-side effects",
      "analytics — cache warm / aggregates",
      "notification — in-app + email",
      "ai-inference — LLM assist (ops-gated)",
      "sms — optional SMS channel",
      "dead-letter — failed job quarantine",
    ],
  },
  {
    label: "Data",
    tech: "Spatial-first polyglot persistence",
    items: [
      "PostgreSQL + PostGIS — facilities · LGAs · wards · settlements · disease_burden · datasets · programmes · permissions · audit",
      "Redis — BullMQ · cache · rate limits",
      "MinIO (S3) — dataset files · documents · programme reports · agreements · presigned downloads",
    ],
  },
];

const gisSurfaces = [
  {
    href: "/map",
    title: "Dataset Coverage Map",
    desc: "LGA choropleth of published datasets · markers · topic / format filters",
  },
  {
    href: "/population-map",
    title: "Population & Facility Map",
    desc: "Population density · facility count · disease-burden layer · ward overlay",
  },
  {
    href: "/facilities",
    title: "Facility Finder",
    desc: "2,191+ NHFR facilities · cluster markers · LGA / ward / level filters",
  },
  {
    href: "/settlements",
    title: "Settlement Access Map",
    desc: "MLoS settlements · accessibility · vulnerability flags · LGA-scoped load",
  },
];

const dataFormats = [
  { fmt: "GeoPackage / GeoJSON", how: "Primary spatial ingest → PostGIS via geo-extraction worker" },
  { fmt: "Shapefile (.zip) / KML", how: "Converted in worker pipeline for spatial load" },
  { fmt: "CSV / Excel", how: "Tabular upload · type inference · optional lat/lng columns" },
  { fmt: "JSON", how: "Structured tabular / partner exports" },
  { fmt: "Warehouse staging", how: "Ingestion Ops resolves entities then loads analytics facts" },
];

const dataAssets = [
  {
    title: "Health facilities",
    stats: [
      { k: "Features", v: "~2,191 facilities" },
      { k: "Source", v: "NHFR / GRID3-verified" },
      { k: "CRS", v: "EPSG:4326" },
      { k: "Map", v: "/facilities · population-map" },
    ],
  },
  {
    title: "Admin boundaries",
    stats: [
      { k: "LGAs", v: "25 polygons" },
      { k: "Wards", v: "~274 boundaries" },
      { k: "Source", v: "INEC / state GIS" },
      { k: "Map", v: "All GIS pages · analytics" },
    ],
  },
  {
    title: "Settlements & population",
    stats: [
      { k: "Settlements", v: "MLoS master list (~19k statewide)" },
      { k: "Population", v: "LGA estimates CSV" },
      { k: "Surveillance", v: "Disease burden via warehouse indicators" },
      { k: "Map", v: "/settlements · /population-map Disease layer" },
    ],
  },
];

const sideWorkflows = [
  {
    title: "Restricted access requests",
    desc: "Registered users request download of restricted datasets; staff with approve:access-requests adjudicate.",
  },
  {
    title: "Archive requests",
    desc: "Contributors request archive of their published datasets; staff approve/deny before catalogue removal.",
  },
  {
    title: "Partner interest",
    desc: "Public/partner leads submit partnership interest; staff review without auto-creating development partners.",
  },
  {
    title: "Contact inbox",
    desc: "Public contact form → admin contact desk (view / review:contact-messages).",
  },
  {
    title: "Collections & topic groups",
    desc: "Curated collections in admin; public topic groups organise catalogue browsing.",
  },
  {
    title: "Uploader notification",
    desc: "On submit, owner gets dataset-received email; validators with validate:datasets are notified of new queue items.",
  },
];

const lifecycleColours = [
  "border-muted-foreground/50 text-muted-foreground",
  "border-amber-500 text-amber-600 dark:text-amber-400",
  "border-blue-500 text-blue-600 dark:text-blue-400",
  "border-violet-500 text-violet-600 dark:text-violet-400",
  "border-orange-500 text-orange-600 dark:text-orange-400",
  "border-emerald-500 text-emerald-600 dark:text-emerald-400",
];

const tierHeaderClass: Record<(typeof roles)[number]["tier"], string> = {
  muted: "bg-muted/50 border-border text-muted-foreground",
  default: "bg-muted border-border text-foreground",
  card: "bg-card border-border text-foreground",
  accent: "bg-primary border-primary text-primary-foreground",
};

const tierGateClass: Record<(typeof roles)[number]["tier"], string> = {
  muted: "text-muted-foreground",
  default: "text-primary",
  card: "text-primary",
  accent: "text-primary-foreground/90",
};

const tierColumnClass: Record<(typeof roles)[number]["tier"], string> = {
  muted: "border-border",
  default: "border-border",
  card: "border-border",
  accent: "border-primary",
};

function SectionDivider() {
  return <hr className="my-8 border-border" />;
}

export default function PortalArchitectureView() {
  return (
    <div className="mx-auto min-h-full max-w-[1320px] bg-background px-6 py-10 text-foreground sm:px-8">
      <h1 className="text-2xl font-bold tracking-tight">
        NSPHCDA Data Portal — System Architecture
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Live codebase reference · three apps · NestJS API · 6-role model · permission groups ·
        FACT Foundation / Zerasage Technologies · updated Sep 2026
      </p>

      {/* Role journey */}
      <div className="mt-8 hidden items-stretch gap-0 xl:flex">
        {roles.map((role, i) => (
          <div key={role.id} className="flex min-w-0 flex-1 items-center">
            <div
              className={cn(
                "min-w-0 flex-1 rounded-lg border px-2.5 py-2.5 text-center",
                tierHeaderClass[role.tier]
              )}
            >
              <div className="truncate text-xs font-semibold">{role.label}</div>
              <div className={cn("mt-0.5 truncate text-[10px]", tierGateClass[role.tier])}>
                {role.gate}
              </div>
            </div>
            {i < roles.length - 1 && (
              <div className="shrink-0 px-1 text-muted-foreground/60" aria-hidden>
                →
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {roles.map((role) => (
          <div
            key={role.id}
            className={cn("flex flex-col overflow-hidden rounded-lg border", tierColumnClass[role.tier])}
          >
            <div className={cn("border-b px-3 py-2 text-[10px] font-medium", tierHeaderClass[role.tier])}>
              <div className="font-semibold xl:hidden">{role.label}</div>
              <span className={tierGateClass[role.tier]}>{role.sub}</span>
            </div>
            <div className="flex-1 bg-background px-3 py-2.5">
              {role.features.map(({ page, desc }, fi) => (
                <div
                  key={page}
                  className={cn(fi < role.features.length - 1 && "mb-2 border-b border-border pb-2")}
                >
                  <div className="text-xs font-medium leading-snug">{page}</div>
                  <div className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <SectionDivider />

      <h2 className="text-lg font-bold">Three-app deployment</h2>
      <p className="mt-1 mb-4 text-sm text-muted-foreground">
        Separate git repos under the NSGDP workspace — no shared root history. Each app has its own
        port in local development.
      </p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {apps.map((app) => (
          <div key={app.name} className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="border-b border-border bg-muted/60 px-4 py-2.5">
              <div className="text-sm font-semibold">
                {app.name}{" "}
                <span className="font-mono text-xs font-normal text-muted-foreground">:{app.port}</span>
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{app.role}</div>
              <div className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{app.stack}</div>
            </div>
            <div className="flex flex-wrap gap-1.5 p-3">
              {app.items.map((item) => (
                <span
                  key={item}
                  className="rounded border border-border bg-muted/40 px-2 py-1 text-xs leading-snug text-muted-foreground"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <SectionDivider />

      <h2 className="text-lg font-bold">GIS surfaces (public)</h2>
      <p className="mt-1 mb-4 text-sm text-muted-foreground">
        Disease burden is a <strong className="font-medium text-foreground">layer</strong> on the
        Population &amp; Facility Map — not a separate route.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {gisSurfaces.map((g) => (
          <div key={g.href} className="rounded-lg border border-border bg-card px-4 py-3">
            <div className="text-sm font-semibold">{g.title}</div>
            <code className="mt-0.5 block text-[10px] text-primary">{g.href}</code>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{g.desc}</p>
          </div>
        ))}
      </div>

      <SectionDivider />

      <h2 className="text-lg font-bold">Permission delegation (Super Admin)</h2>
      <p className="mt-1 mb-4 text-sm text-muted-foreground">
        Staff capability comes from permission groups — not from a fixed &quot;repo admin&quot;
        role. Keys below match{" "}
        <code className="text-[11px]">PERMISSION_ACTION_MAP</code> in the backend. Deactivate users,
        platform role changes, and staff revoke stay hardcoded <code className="text-[11px]">super_admin</code>{" "}
        only.
      </p>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {permissionGroups.map((group) => (
          <div key={group.title} className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="border-b border-border bg-muted/60 px-3 py-2 text-xs font-semibold">
              {group.title}
            </div>
            <div className="flex flex-wrap gap-1.5 p-3">
              {group.perms.map((perm) => (
                <code
                  key={perm}
                  className="rounded border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-primary"
                >
                  {perm}
                </code>
              ))}
            </div>
          </div>
        ))}
      </div>

      <h3 className="mt-6 text-sm font-semibold">Example permission groups</h3>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {exampleGroups.map((group) => (
          <div key={group.name} className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="border-b border-border bg-muted/60 px-4 py-2.5">
              <div className="text-sm font-semibold">{group.name}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{group.description}</div>
            </div>
            <div className="flex flex-wrap gap-1.5 px-4 py-3">
              {group.permissions.map((perm) => (
                <code
                  key={perm}
                  className="rounded border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-primary"
                >
                  {perm}
                </code>
              ))}
            </div>
          </div>
        ))}
      </div>

      <SectionDivider />

      <h2 className="text-lg font-bold">Approval pipeline — validate → approve → publish</h2>
      <p className="mt-1 mb-2 text-sm text-muted-foreground">{LIFECYCLE_RATIONALE.summary}</p>
      <p className="mb-4 text-xs text-muted-foreground">
        Review Queue in nsgdp-admin is split by scope:{" "}
        <strong className="text-foreground">Development Partners</strong> vs{" "}
        <strong className="text-foreground">Agency</strong> (platform-owner). Editorial{" "}
        <code className="text-[11px]">DatasetStatus</code> is separate from catalogue{" "}
        <code className="text-[11px]">published_at</code> and from warehouse{" "}
        <code className="text-[11px]">ingestion_status</code>.
      </p>

      <div className="relative">
        <div
          className="absolute top-5 right-4 left-4 hidden h-px bg-border lg:block"
          aria-hidden
        />
        <div className="relative grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {LIFECYCLE_PIPELINE.map(({ label, role, permission, description }, i) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-full border-2 bg-background text-sm font-bold",
                  lifecycleColours[i]
                )}
              >
                {i + 1}
              </div>
              <div>
                <div className="text-[11px] leading-snug font-semibold">{label}</div>
                <div className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{role}</div>
                {permission ? (
                  <code className="mt-1 block text-[9px] text-primary">{permission}</code>
                ) : null}
                <div className="mt-1 hidden text-[10px] leading-snug text-muted-foreground/80 xl:block">
                  {description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
          <p className="mb-2 text-xs font-semibold">QA checklist (8 dimensions)</p>
          <ul className="space-y-1 text-[11px] text-muted-foreground">
            {LIFECYCLE_RATIONALE.checklistReplaces.map((item) => (
              <li key={item}>· {item}</li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Completeness · Accuracy · Consistency · Timeliness · Validity · Uniqueness ·
            Geo-References · Documentation — all must pass before{" "}
            <code className="text-[10px]">validateDataset</code>.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
          <p className="mb-2 text-xs font-semibold">Side paths (not pipeline steps)</p>
          <ul className="space-y-1 text-[11px] text-muted-foreground">
            {LIFECYCLE_RATIONALE.sidePaths.map((item) => (
              <li key={item}>· {item}</li>
            ))}
          </ul>
        </div>
      </div>

      <h3 className="mt-6 text-sm font-semibold">Parallel track — analytics ingestion</h3>
      <p className="mt-1 mb-3 text-xs text-muted-foreground">
        Warehouse load does not replace catalogue publish. A dataset can be catalogue-published
        while aliases are still pending; analytics waits until staging is clear. Optional LLM
        alias suggestions stay <code className="text-[10px]">pending</code> until a human confirms
        them in Ingestion Ops.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {INGESTION_PIPELINE.map((step) => (
          <div key={step.status} className="rounded-lg border border-border bg-card px-3 py-2.5">
            <div className="text-xs font-semibold">{step.label}</div>
            <code className="mt-0.5 block text-[9px] text-muted-foreground">{step.status}</code>
            <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>

      <SectionDivider />

      <h2 className="text-lg font-bold">Other operational workflows</h2>
      <p className="mt-1 mb-4 text-sm text-muted-foreground">
        Beyond dataset approval — desks and curated surfaces that ship in admin + portal today.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {sideWorkflows.map((w) => (
          <div key={w.title} className="rounded-lg border border-border bg-card px-4 py-3">
            <div className="text-sm font-semibold">{w.title}</div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{w.desc}</p>
          </div>
        ))}
      </div>

      <SectionDivider />

      <h2 className="text-lg font-bold">System stack</h2>
      <p className="mt-1 mb-4 text-sm text-muted-foreground">
        Clients · NestJS API · BullMQ workers · PostgreSQL/PostGIS · Redis · MinIO
      </p>

      <div className="flex flex-col gap-2">
        {sysLayers.map((layer) => (
          <div
            key={layer.label}
            className="flex flex-col overflow-hidden rounded-lg border border-border bg-card sm:flex-row"
          >
            <div className="shrink-0 border-b border-border bg-muted/60 px-4 py-3 sm:w-52 sm:border-r sm:border-b-0">
              <div className="text-sm font-semibold">{layer.label}</div>
              <div className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{layer.tech}</div>
            </div>
            <div className="flex flex-1 flex-wrap gap-1.5 p-3">
              {layer.items.map((item) => (
                <span
                  key={item}
                  className="rounded border border-border bg-muted/40 px-2 py-1 text-xs leading-snug text-muted-foreground"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 pl-0 text-[10px] text-muted-foreground sm:pl-52">
        {[
          "Upload → validation / upload-processing",
          "Spatial → geo-extraction → PostGIS",
          "Staging → resolution → warehouse",
          "Publish → dataset-publish + notifications",
          "API → TanStack Query on frontends",
        ].map((lbl) => (
          <span key={lbl}>{lbl} →</span>
        ))}
      </div>

      <SectionDivider />

      <h2 className="text-lg font-bold">Formats &amp; confirmed data assets</h2>
      <div className="mt-4 grid grid-cols-1 gap-2 lg:grid-cols-2">
        {dataFormats.map(({ fmt, how }) => (
          <div key={fmt} className="flex overflow-hidden rounded-md border border-border bg-card">
            <div className="flex w-44 shrink-0 items-center border-r border-border bg-muted/60 px-3 py-2.5">
              <span className="text-xs font-semibold">{fmt}</span>
            </div>
            <div className="flex items-center px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
              {how}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {dataAssets.map(({ title, stats }) => (
          <div key={title} className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="border-b border-border bg-muted/60 px-4 py-2.5">
              <div className="text-xs font-semibold">{title}</div>
            </div>
            <div className="px-4 py-3">
              {stats.map(({ k, v }) => (
                <div key={k} className="mb-1.5 flex gap-2 text-xs leading-relaxed">
                  <span className="min-w-[90px] shrink-0 text-muted-foreground">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <SectionDivider />

      <p className="mt-8 text-[11px] text-muted-foreground/70">
        Source of truth: live routes in nsgdp-frontend / nsgdp-admin · NestJS modules ·{" "}
        <code>UserRole</code> · <code>PERMISSION_ACTION_MAP</code> · <code>KNOWN_GAPS.md</code> ·
        dataset-lifecycle constants
      </p>
    </div>
  );
}
