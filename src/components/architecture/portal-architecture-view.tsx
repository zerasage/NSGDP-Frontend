"use client";

// Post-debrief architecture reference — theme-aware via Tailwind semantic tokens

import { cn } from "@/lib/utils";
import { LIFECYCLE_PIPELINE, LIFECYCLE_RATIONALE } from "@/lib/constants/dataset-lifecycle";

const roles = [
  {
    id: "public",
    label: "Public Visitor",
    gate: "Open Access",
    sub: "No account required",
    tier: "muted" as const,
    features: [
      { page: "Homepage", desc: "Hero · stats · Browse Repository CTA · outbreak alerts" },
      { page: "Data Portal", desc: "Dataset catalogue · 14 metadata fields · advanced filters" },
      { page: "Document Library", desc: "SOPs · policies · research reports · historical archives" },
      { page: "Analytics Dashboard", desc: "KPIs · trends · LGA burden · ward-level analytics" },
      { page: "Disease Burden Map", desc: "Proportional bubbles · legend · hover tooltips" },
      { page: "GIS Mapping", desc: "Facilities · ward boundaries · catchment areas · layer compare" },
      { page: "Programs", desc: "Programme tracker · progress · completed report downloads" },
      { page: "Learning & Tools", desc: "QGIS · videos · e-books" },
      { page: "About", desc: "Partners · NSPHCDA ownership statement · LGA map" },
    ],
  },
  {
    id: "registered",
    label: "Registered / Contributor",
    gate: "+ Login · Email verify",
    sub: "Download · Upload · Track",
    tier: "default" as const,
    features: [
      { page: "Dashboard", desc: "Role-adaptive widgets · activity · notification centre" },
      { page: "My Downloads", desc: "History table · re-download · export log" },
      { page: "Submit Dataset", desc: "14-field form · helper text · lifecycle tracking" },
      { page: "Upload Wizard", desc: "3-step · drag-drop · format detect · draft autosave" },
      { page: "My Datasets", desc: "5-step lifecycle · version history · edit" },
      { page: "Programme Reports", desc: "Upload reports when granted upload:programs" },
      { page: "Request Restricted Access", desc: "Reason modal → pending → approved" },
      { page: "Notifications", desc: "Publications · approval alerts · QA flags" },
    ],
  },
  {
    id: "contributor",
    label: "Validator / Custodian",
    gate: "+ Elevated Role",
    sub: "Validate · Maintain",
    tier: "default" as const,
    features: [
      { page: "Validation Queue", desc: "Assigned submissions awaiting metadata & QA review" },
      { page: "QA Checklist", desc: "8-dimension quality assessment · reject with reason" },
      { page: "My Assigned Datasets", desc: "Update schedule · overdue alerts · version uploads" },
      { page: "Freshness Dashboard", desc: "Datasets overdue for scheduled update" },
      { page: "Programme Reports", desc: "Upload monitoring / evaluation docs (custodian baseline)" },
      { page: "Dataset Detail (edit)", desc: "Pre-filled wizard · correction history" },
    ],
  },
  {
    id: "admin",
    label: "Repo Admin · ICT Admin",
    gate: "+ Admin Role · MFA",
    sub: "Publish · Govern · Secure",
    tier: "card" as const,
    features: [
      { page: "Approval Pipeline", desc: "6-stage workflow · director sign-off · publish" },
      { page: "User Management", desc: "Org-scoped · role change · suspend · permission overrides" },
      { page: "User Groups", desc: "Create groups · assign users · delegate 10 atomic permissions" },
      { page: "Audit Log", desc: "Immutable · uploads / logins / approvals · CSV export" },
      { page: "Governance Panel", desc: "Lifecycle config · workflow rules · SOP management" },
      { page: "Governance Health", desc: "% on schedule · metadata completeness · turnaround" },
      { page: "System Analytics", desc: "Platform KPIs · download trends · contributor counts" },
      { page: "Programme CRUD", desc: "Create · edit · delete · upload reports · org-scoped edit" },
      { page: "Development Partners", desc: "Data-sharing agreements · partner dataset visibility" },
    ],
  },
  {
    id: "superadmin",
    label: "Super Admin (Owner)",
    gate: "+ Super Admin · MFA",
    sub: "Full system · Delegation",
    tier: "accent" as const,
    features: [
      { page: "Permission Delegation", desc: "Grant / revoke 10 atomic permissions per user group" },
      { page: "Permission Matrix", desc: "Visual role × action grid incl. programme CRUD columns" },
      { page: "Repository Dashboard", desc: "Platform-wide stats · dataset health · active users" },
      { page: "Outbreak Alerts", desc: "Publish disease alerts to homepage and notify users" },
      { page: "DHIS2 Integration", desc: "Sync config · approved dataset mappings" },
      { page: "All Admin screens", desc: "Full access to every admin capability" },
    ],
  },
];

const delegatablePerms = [
  { action: "approve:datasets", target: "Validators / senior M&E (e.g. DPRS Team)" },
  { action: "publish:datasets", target: "Trusted partner org admins" },
  { action: "manage:users", target: "Org focal points" },
  { action: "archive:datasets", target: "Repository Custodians group" },
  { action: "view:restricted", target: "Partners under data-sharing agreement" },
  { action: "download:restricted", target: "WHO / partner groups with agreement" },
  { action: "create:programs", target: "Programme Leads group · org focal points" },
  { action: "edit:programs", target: "Programme Leads group · org admins (org-scoped)" },
  { action: "delete:programs", target: "Not delegated by default — repo admin baseline only" },
  { action: "upload:programs", target: "Contributors · custodians · Programme Leads group" },
];

const userGroups = [
  {
    name: "DPRS Team",
    description: "Directorate of Planning, Research and Statistics — senior M&E officers",
    permissions: ["approve:datasets", "view:restricted"],
  },
  {
    name: "WHO Nigeria Partners",
    description: "Development partner staff with data-sharing agreement",
    permissions: ["view:restricted", "download:restricted"],
  },
  {
    name: "Programme Leads",
    description: "Programme managers — create, edit, and upload without admin role",
    permissions: ["create:programs", "edit:programs", "upload:programs"],
  },
  {
    name: "Repository Custodians",
    description: "Dataset custodians with archive authority for assigned families",
    permissions: ["archive:datasets"],
  },
];

const programRoleBaseline = [
  { role: "Contributor", create: false, edit: false, delete: false, upload: true },
  { role: "contributor", create: false, edit: false, delete: false, upload: true },
  { role: "Org Admin", create: true, edit: "org-scoped", delete: false, upload: true },
  { role: "Repo Admin", create: true, edit: true, delete: true, upload: true },
  { role: "Super Admin", create: true, edit: true, delete: true, upload: true },
];

const sysLayers = [
  {
    label: "Frontend",
    tech: "Next.js 15  ·  React 19  ·  TypeScript  ·  Tailwind CSS v4",
    items: [
      "Public pages (SSR/SSG)",
      "Auth flows (7 pages incl. MFA placeholder)",
      "Dashboard — CSR, role-adaptive",
      "Admin panel — 14+ screens",
      "Governance panel — lifecycle · SOP · health metrics",
      "Permission delegation + matrix UI",
      "Programme CRUD — /programs/new · edit · upload",
      "Document library",
      "Leaflet.js — GIS maps with layer compare",
      "Recharts — analytics charts incl. ward-level",
      "TanStack Query — server state",
      "react-hook-form + Zod — forms",
      "Notification bell — in-app alerts",
      "Dev Role Switcher (all 8 roles)",
    ],
  },
  {
    label: "API",
    tech: "Fastify  ·  Node.js 22  ·  JWT RS256  ·  OpenAPI 3.0",
    items: [
      "/auth/* — register · login · MFA · reset · session",
      "/datasets/* — CRUD · lifecycle transitions · versions · search",
      "/documents/* — upload · metadata · download",
      "/gis/* — LGA polygons · facilities · ward boundaries · disease GeoJSON",
      "/analytics/* — burden · Z-score · ward trends · export",
      "/programs/* — CRUD · report attach · milestone update",
      "/uploads — multipart → MinIO → queue job",
      "/admin/governance/* — workflow config · SOPs · health metrics",
      "/admin/permissions/* — delegation · group permissions · matrix",
      "/admin/users/* — roles · groups · org-scoped management",
      "/admin/audit/* — immutable log · search · CSV export",
      "/notifications/* — publish · mark-read · preferences",
      "/alerts/* — outbreak alerts · disease notifications",
    ],
  },
  {
    label: "Workers",
    tech: "BullMQ  ·  Redis-backed  ·  8 queues  ·  parallel",
    items: [
      "GeoWorker — GPKG · SHP · KML · GeoJSON → PostGIS",
      "ETLWorker — CSV · Excel · DHIS2 export · PDF extract",
      "AnalyticsWorker — Z-score · LGA/ward burden · Redis cache warm",
      "ValidationWorker — MIME · magic bytes · ClamAV scan",
      "GovernanceWorker — lifecycle transitions · overdue alerts · approval notifications",
      "NotifyWorker — in-app bell · Handlebars email",
      "ExportWorker — CSV · PDF (Puppeteer) · presigned URL",
      "AuditWorker — immutable event log write · version chain",
    ],
  },
  {
    label: "Data",
    tech: "Spatial-first  ·  Polyglot persistence",
    items: [
      "PostgreSQL 16 + PostGIS 3.4 — facilities · LGA polygons · 274 wards · disease_burden · datasets · programmes · governance · audit_events · permissions · user_groups",
      "Redis 7 — BullMQ queues · analytics cache (1h TTL) · session store · rate limits · notification feed",
      "MinIO (S3) — dataset files ≤50MB · documents · programme reports · export artifacts · presigned URLs (1h TTL) · state data sovereignty",
    ],
  },
];

const lifecycleColours = [
  "border-muted-foreground/50 text-muted-foreground",
  "border-blue-500 text-blue-600 dark:text-blue-400",
  "border-violet-500 text-violet-600 dark:text-violet-400",
  "border-amber-500 text-amber-600 dark:text-amber-400",
  "border-emerald-500 text-emerald-600 dark:text-emerald-400",
];

const dataFormats = [
  { fmt: "GeoPackage .gpkg", how: "better-sqlite3 reads SQLite, parses WKB header, bulk INSERT via ST_GeomFromWKB" },
  { fmt: "GeoJSON .geojson", how: "JSON.parse → validate → ST_GeomFromGeoJSON stream" },
  { fmt: "Shapefile .zip", how: "Unzip → shapefile npm → proj4 reproject → PostGIS" },
  { fmt: "KML / KMZ", how: "@tmcw/togeojson conversion → GeoJSON path" },
  { fmt: "CSV with lat/lng", how: "csv-parse → detect coord cols → ST_MakePoint" },
  { fmt: "Excel .xlsx/.xls", how: "SheetJS workbook → rows → type inference · detect spatial" },
  { fmt: "DHIS2 export .json", how: "Parse dataValues[] → map orgUnit → disease_burden UPSERT" },
  { fmt: "PDF", how: "pdf-parse → text extract → tsvector for full-text search" },
];

const dataAssets = [
  {
    title: "Niger Health Facilities.gpkg",
    stats: [
      { k: "Features", v: "2,191" },
      { k: "Source", v: "NHFR 2024 / GRID3" },
      { k: "CRS", v: "EPSG:4326" },
      { k: "Key fields", v: "nhfr_code · level · ownership · lga · ward" },
    ],
  },
  {
    title: "Niger Local Govt Areas.gpkg",
    stats: [
      { k: "Features", v: "25 LGA polygons" },
      { k: "Source", v: "INEC" },
      { k: "CRS", v: "EPSG:4326" },
      { k: "Key fields", v: "lganame · lgacode · amapcode" },
    ],
  },
  {
    title: "Additional Confirmed Sources",
    stats: [
      { k: "Niger Wards.gpkg", v: "274 ward boundaries" },
      { k: "Niger Pop Estimates LGA.csv", v: "Population by LGA" },
      { k: "Niger Primary & Sec Roads.gpkg", v: "Road network" },
      { k: "MLoS V12.1 (.gpkg + .xlsx)", v: "Master List of Services" },
      { k: "AFP Surveillance (.xlsx)", v: "Disease reporting" },
      { k: "LGA HF Lists (25 × .xlsx)", v: "Facility validation lists" },
    ],
  },
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

function PermCell({ value }: { value: boolean | string }) {
  if (value === true) {
    return <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Yes</span>;
  }
  if (value === "org-scoped") {
    return <span className="text-amber-600 dark:text-amber-400 font-medium">Org-scoped</span>;
  }
  return <span className="text-muted-foreground/50">—</span>;
}

export default function PortalArchitectureView() {
  return (
    <div className="min-h-full bg-background text-foreground px-6 py-10 sm:px-8 max-w-[1320px] mx-auto">
      <h1 className="text-2xl font-bold tracking-tight">
        NSPHCDA Data Portal — Updated System Architecture
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Post-Debrief Architecture · 8-Role Governance Model · PRD v3.0 · FACT Foundation / Zerasage
        Technologies · July 2026
      </p>

      {/* Role journey bar */}
      <div className="mt-8 hidden lg:flex items-stretch gap-0">
        {roles.map((role, i) => (
          <div key={role.id} className="flex items-center flex-1 min-w-0">
            <div
              className={cn(
                "flex-1 rounded-lg border px-3 py-2.5 text-center min-w-0",
                tierHeaderClass[role.tier]
              )}
            >
              <div className="text-xs font-semibold truncate">{role.label}</div>
              <div className={cn("text-[10px] mt-0.5 truncate", tierGateClass[role.tier])}>
                {role.gate}
              </div>
            </div>
            {i < roles.length - 1 && (
              <div className="shrink-0 px-1 text-muted-foreground/60" aria-hidden="true">
                →
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Feature columns */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {roles.map((role) => (
          <div
            key={role.id}
            className={cn("rounded-lg border overflow-hidden flex flex-col", tierColumnClass[role.tier])}
          >
            <div className={cn("px-3 py-2 border-b text-[10px] font-medium", tierHeaderClass[role.tier])}>
              <span className={tierGateClass[role.tier]}>{role.sub}</span>
            </div>
            <div className="bg-background px-3 py-2.5 flex-1">
              {role.features.map(({ page, desc }, fi) => (
                <div
                  key={page}
                  className={cn(
                    fi < role.features.length - 1 && "pb-2 mb-2 border-b border-border"
                  )}
                >
                  <div className="text-xs font-medium leading-snug">{page}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <SectionDivider />

      {/* Delegatable permissions */}
      <h2 className="text-lg font-bold">Permission Delegation Layer (Super Admin)</h2>
      <p className="mt-1 mb-4 text-sm text-muted-foreground">
        Super Admin can grant or revoke any of these 10 atomic permissions per user group,
        independent of core role. Includes four programme CRUD actions alongside dataset governance.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {delegatablePerms.map(({ action, target }) => (
          <div key={action} className="rounded-md border border-border overflow-hidden bg-card">
            <div className="bg-muted/60 px-2.5 py-2 border-b border-border">
              <code className="text-[10px] font-bold text-primary leading-snug block">{action}</code>
            </div>
            <div className="px-2.5 py-2">
              <p className="text-[10px] text-muted-foreground leading-relaxed">{target}</p>
            </div>
          </div>
        ))}
      </div>

      <SectionDivider />

      {/* Programme CRUD baseline */}
      <h2 className="text-lg font-bold">Programme CRUD — Role Baseline</h2>
      <p className="mt-1 mb-4 text-sm text-muted-foreground">
        Base permissions before group delegation. Groups such as Programme Leads can extend create,
        edit, and upload beyond these defaults. Delete is not delegated by default.
      </p>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/60 border-b border-border">
              <th className="px-4 py-2.5 text-left font-semibold">Role</th>
              <th className="px-3 py-2.5 text-center font-semibold">Create</th>
              <th className="px-3 py-2.5 text-center font-semibold">Edit</th>
              <th className="px-3 py-2.5 text-center font-semibold">Delete</th>
              <th className="px-3 py-2.5 text-center font-semibold">Upload Reports</th>
            </tr>
          </thead>
          <tbody>
            {programRoleBaseline.map((row, i) => (
              <tr key={row.role} className={cn(i % 2 === 0 ? "bg-background" : "bg-muted/20")}>
                <td className="px-4 py-2.5 font-medium border-r border-border">{row.role}</td>
                <td className="px-3 py-2.5 text-center border-r border-border">
                  <PermCell value={row.create} />
                </td>
                <td className="px-3 py-2.5 text-center border-r border-border">
                  <PermCell value={row.edit} />
                </td>
                <td className="px-3 py-2.5 text-center border-r border-border">
                  <PermCell value={row.delete} />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <PermCell value={row.upload} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionDivider />

      {/* User groups */}
      <h2 className="text-lg font-bold">User Groups — Delegation Examples</h2>
      <p className="mt-1 mb-4 text-sm text-muted-foreground">
        Named groups managed in Admin → User Groups. Permissions stack on top of each member&apos;s
        core role.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {userGroups.map((group) => (
          <div key={group.name} className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="bg-muted/60 px-4 py-2.5 border-b border-border">
              <div className="text-sm font-semibold">{group.name}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{group.description}</div>
            </div>
            <div className="px-4 py-3 flex flex-wrap gap-1.5">
              {group.permissions.map((perm) => (
                <code
                  key={perm}
                  className="text-[10px] font-medium bg-muted text-primary px-2 py-0.5 rounded border border-border"
                >
                  {perm}
                </code>
              ))}
            </div>
          </div>
        ))}
      </div>

      <SectionDivider />

      {/* Dataset lifecycle */}
      <h2 className="text-lg font-bold">Dataset Governance Lifecycle — 5 Steps</h2>
      <p className="mt-1 mb-2 text-sm text-muted-foreground">
        {LIFECYCLE_RATIONALE.summary} Stage is visible on every dataset card at all times.
      </p>
      <p className="mb-4 text-xs text-muted-foreground">
        <strong className="text-foreground">Under Review</strong> replaces three former micro-gates
        (metadata review, technical validation, QA) — the 8-dimension checklist covers them in one
        session. <strong className="text-foreground">Archived</strong> is an admin end-of-life action,
        not a pipeline step.
      </p>

      <div className="relative">
        <div className="absolute top-5 left-4 right-4 h-px bg-border hidden sm:block" aria-hidden="true" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 relative">
          {LIFECYCLE_PIPELINE.map(({ label, role, description }, i) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center">
              <div
                className={cn(
                  "size-10 rounded-full border-2 bg-background flex items-center justify-center font-bold text-sm",
                  lifecycleColours[i]
                )}
              >
                {i + 1}
              </div>
              <div>
                <div className="text-[11px] font-semibold leading-snug">{label}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{role}</div>
                <div className="text-[10px] text-muted-foreground/80 mt-1 leading-snug hidden lg:block">
                  {description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
        <p className="text-xs font-semibold mb-2">What the QA checklist replaces</p>
        <ul className="text-[11px] text-muted-foreground space-y-1">
          {LIFECYCLE_RATIONALE.checklistReplaces.map((item) => (
            <li key={item}>· {item}</li>
          ))}
        </ul>
      </div>

      <SectionDivider />

      {/* System architecture */}
      <h2 className="text-lg font-bold">System Architecture</h2>
      <p className="mt-1 mb-4 text-sm text-muted-foreground">
        4-tier stack — Frontend · API Gateway · Background Workers (8 queues) · Data
      </p>

      <div className="flex flex-col gap-2">
        {sysLayers.map((layer) => (
          <div key={layer.label} className="flex flex-col sm:flex-row rounded-lg border border-border overflow-hidden bg-card">
            <div className="bg-muted/60 px-4 py-3 sm:w-52 shrink-0 border-b sm:border-b-0 sm:border-r border-border">
              <div className="text-sm font-semibold">{layer.label}</div>
              <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{layer.tech}</div>
            </div>
            <div className="p-3 flex flex-wrap gap-1.5 flex-1">
              {layer.items.map((item) => (
                <span
                  key={item}
                  className="text-xs text-muted-foreground bg-muted/40 border border-border rounded px-2 py-1 leading-snug"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pl-0 sm:pl-52 flex flex-wrap gap-x-6 gap-y-1 text-[10px] text-muted-foreground">
        {[
          "File upload → Worker queue",
          "Worker → PostGIS bulk load",
          "GovernanceWorker → lifecycle event",
          "PostGIS → API aggregation",
          "API → Frontend TanStack Query",
        ].map((lbl) => (
          <span key={lbl}>{lbl} →</span>
        ))}
      </div>

      <SectionDivider />

      {/* Geospatial formats */}
      <h2 className="text-lg font-bold">Geospatial & Data Format Support</h2>
      <p className="mt-1 mb-4 text-sm text-muted-foreground">
        8 formats handled natively in the worker pipeline — no GDAL binary dependency
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {dataFormats.map(({ fmt, how }) => (
          <div key={fmt} className="flex rounded-md border border-border overflow-hidden bg-card">
            <div className="bg-muted/60 px-3 py-2.5 w-44 shrink-0 border-r border-border flex items-center">
              <span className="text-xs font-semibold">{fmt}</span>
            </div>
            <div className="px-3 py-2.5 text-xs text-muted-foreground leading-relaxed flex items-center">
              {how}
            </div>
          </div>
        ))}
      </div>

      <SectionDivider />

      {/* Data assets */}
      <h2 className="text-lg font-bold">Confirmed Real Data Assets (at deployment)</h2>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        {dataAssets.map(({ title, stats }) => (
          <div key={title} className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="bg-muted/60 px-4 py-2.5 border-b border-border">
              <div className="text-xs font-semibold">{title}</div>
            </div>
            <div className="px-4 py-3">
              {stats.map(({ k, v }) => (
                <div key={k} className="flex gap-2 mb-1.5 text-xs leading-relaxed">
                  <span className="text-muted-foreground shrink-0 min-w-[90px]">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-[11px] text-muted-foreground/70">
        Source: Stakeholder Engagement Debrief Report · Data Governance Framework · User Feedback
        Analysis (Jun 2026) · Backend_Architecture_v1.0.md · PRD v3.0
      </p>
    </div>
  );
}
