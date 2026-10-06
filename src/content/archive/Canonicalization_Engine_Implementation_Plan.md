> **Historical document.** Written before the system was built. Parts of it no longer match the code. The current view is the documentation site at `/docs` (source: `nsgdp-frontend/`).

# Canonicalization Engine — Implementation Plan

| Field | Detail |
|---|---|
| **Product** | Niger State GeoHealth Data Portal (NSGDP-Backend) |
| **Document Type** | Engineering implementation plan (sprint-level build authority) |
| **Version** | 2.0 |
| **Date** | August 2026 |
| **Governs** | Full implementation of the Canonicalization Engine **and** the parts of Backend Architecture v1.1 the engine depends on that were never built |
| **Source documents** | `Backend_Architecture_v1.1.md` (platform design) · `Data_Ingestion_Canonicalization_Engine_v1_1.md` (engine design) · `nhmis_dictionary.json` (seed vocabulary) |
| **Relationship** | Both source documents are **design authorities**. This document is the **build authority**: it merges them into one data model and one service topology, resolves every conflict between them and the running code, and sequences the work. Where any document conflicts with this one on infrastructure, this one wins and the conflict is recorded in Part A or B. |
| **Status** | Executing. Phase 0 complete (runtime checks still need the deployed stack). Phases 1–5 implemented; gazetteer and dictionary seeded locally. |
| **Client decisions locked** | AI provider: **Anthropic hosted API** (Part E). Production host: **2 vCore / 4 GB C4, Host Africa, upgradable to 8 GB** (B10). |

**What changed in v2.0.** v1.0 treated the engine spec as the whole scope and the architecture as background. That was wrong. The engine spec assumes the architecture was fully built; it was not. This version reconciles all three sources — architecture, engine, code — into a single unified build, and adds three things v1.0 under-specified: the **spatial reference layer** the engine's gazetteer actually needs, the **queue and worker platform** that lets the engine run without blocking the API, and a proper **AI service layer** rather than a single LLM call.

---

## Part A — Three-way ground truth

The platform is a working MVP. Milestone 2 (repository MVP) shipped; Milestone 3 phases 1–4 and 7 shipped. The engine is being added to a live system, so the plan's first obligation is to be exact about what is already there.

### A.1 What exists and is reusable

| Capability | Where | Role in the engine |
|---|---|---|
| NestJS 11, TypeORM, 50 migrations, UUID PKs throughout, `synchronize: false` | `src/database/migrations/` | Convention to follow for every new table |
| Queue infrastructure with 4 live processors | `src/workers/`, `src/modules/sms/processors/` | Pattern to follow — but see A.4, the runtime is not what the docs assume |
| `upload-processing` queue **declared, never consumed** | `bull.config.ts:26` | Reserved for the engine, as both docs intend |
| Object storage abstraction (B2 / MinIO / S3) | `src/modules/uploads/storage/` | Fetches workbooks and reference GeoPackages |
| Upload → ClamAV validation → file attach | `src/workers/validation.processor.ts` | Unchanged; still gates the queue |
| Dataset lifecycle: draft → pending → under_review → approved, plus publish/unpublish, QA checklist, submission tickets | `src/modules/datasets/approval.service.ts` | The approval gate hooks onto the existing publish action |
| GeoPackage reader (`better-sqlite3`) | `src/common/utils/geopackage.util.ts` | How the spatial tables get loaded |
| SheetJS + `csv-parse` tabular parsing | `src/common/utils/tabular.util.ts` | Preview-grade only; the Reader needs far more |
| Permissions, permission groups, audit log, admin portal | `src/modules/admin/` | The governance endpoints plug into these, not a parallel scheme |
| PostGIS (16-3.4 dev / 15-3.3 prod) | `docker-compose*.yml` | Available for geometry; **not** for pgvector |
| Ward gazetteer with curated name variants | `gis_reference_areas`, `GisReferenceService` | Real but much thinner than the engine spec believes — see A.3 |

### A.2 Architecture v1.1 components that were never built and the engine needs

This is the material the engine spec assumed away. Each row is work this sprint owns.

| Architecture § | Component | Status | Why the engine needs it |
|---|---|---|---|
| §4.1 | `lga_boundaries` (25 MULTIPOLYGON) | **Built in P1** | Stage 5 rung 3 fuzzy-matches against the LGA gazetteer; `disease_burden.lga_id` FK |
| §4.1 | `ward_boundaries` (≥274; source GPKG has 275) | **Built in P1** | Ward tier of Stage 5; `disease_burden.ward_id` FK |
| §4.1 | `health_facilities` (2,191 POINT) | **Built in P1** | Stage 5 rung 4 phonetic matching, scoped to LGA+ward; `disease_burden.facility_id` FK |
| §4.6 | `population_estimates` | **Built in P1** | Incidence per 1,000 in every burden aggregation |
| §4.1 | `road_network` | **Not built** | Marked "future use" — **out of scope this sprint** |
| §4.6 | `disease_indicators` | **Built in P2** | The canonical registry the whole resolution ladder targets |
| §4.6 | `disease_burden` | **Built in P2** | The publication target. Created with engine §6.4 columns so no later ALTER |
| §4.6 | `analytics_cache` | **Built in P2** | Persistent cache; the retraction engine invalidates by `affected_keys` |
| §4.14 | `indicator_revisions` | **Built in P2** | Written on confirmed successions and on governance edits |
| §4.8 | `ingestion_jobs` (status, progress 0–100, `steps` JSONB, worker_id) | **Built in P0** | Job-progress tracking. Already fully specified here |
| §2, §7.3 | GeoWorker (GPKG → PostGIS) | **Built in P1** | Loads the spatial gazetteer onto `geo-extraction` |
| §2 | ETLWorker | **Superseded by Reader (P3–5)** | The WorkbookReader is the engine spec's whole purpose |
| §2, §12 | Worker as a **separate process / container** | **Not built** — everything runs in the API process | The engine is CPU-heavy; in-process execution blocks API requests |
| §6 | Per-queue concurrency, priority, TTL, dead-letter queue, Bull Board, `job:progress` pub/sub | **Not built** — `bull.config.ts` sets none of it | Required for the engine to run predictably alongside live traffic |
| §4.8 | `export_jobs` + ExportWorker | **Not built** | Analytics CSV/PDF export — **deferred**, not engine-critical |
| §4.7 | `campaigns`, `campaign_lga_coverage` | **Not built** | Covered functionally by the Programmes module — **out of scope** |
| §4.14 | `sop_register` | **Not built** | Governance/documents, not the engine — **out of scope** |
| §4.4 | `dataset_key_attributes` | Satisfied differently via `dataset.metadata.datasetInsights` | **No action** |

Two consequences worth stating plainly. First, the engine is not an ingestion layer bolted in front of an existing warehouse — **it builds the warehouse too**. Second, `AnalyticsService` currently and deliberately avoids disease burden ("not disease-burden figures, which have no real source yet", `analytics.service.ts:349-354`), so the engine's §5 claim that AnalyticsWorker has "unchanged inputs" is false; analytics needs new aggregation code before publication has any visible effect.

### A.3 `GisReferenceService` is thinner than engine §12.3 claims

Engine §12.3 says the service already reconciles "messy LGA/ward name strings against the real boundary data" and concludes we should extend it instead of building `orgunit_aliases`. In fact `gis-reference.service.ts:342-375` does a single exact lookup against a map keyed `${lga_code}|${variant.toLowerCase()}`. No fuzzy tier, no phonetic tier, no confidence, no pending/confirmed state, no facility level. Geometry lives in GeoPackages in object storage and is read per call, so a per-row ladder over 2,191 facilities would open a GeoPackage mid-ingestion.

The intent of §12.3 — one gazetteer, not two — is right and is preserved. The route differs: Phase 1 builds the architecture's real PostGIS tables, and `GisReferenceService` is refactored to resolve against them through the shared ladder. See decision B4.

### A.4 The queue runtime is Bull v4, not BullMQ

Both design documents specify BullMQ. The application actually runs **`@nestjs/bull` 11.0.4 on `bull` 4.16.5**. `bullmq` 5.79.3 is installed but unused — except in `notifications.service.ts:6`, which imports the `Queue` type from `bullmq` while `@nestjs/bull` injects a Bull v4 queue. That is a latent type bug today and a real one the moment anybody relies on a BullMQ-only method.

This matters because the engine needs three things Bull v4 does not give cleanly: parent/child **flows** for a staged pipeline, **object-valued progress** (not just a 0–100 number) to drive stage-level reporting, and per-queue **concurrency and priority** control. Resolved in decision B1.

### A.5 Corpus findings — what the real workbooks do

Both sample workbooks in `scripts/Data/` were parsed directly rather than trusted. Every species in engine §2's F1–F8 inventory is genuinely present:

| Workbook / sheet | Species | Evidence |
|---|---|---|
| DHIS `DHIS Data 2022 to 2026` | F1 | 122 cols, one header row, `"% of ANC attendees receiving heamatinics 2022"` — indicator and year fused, and that misspelling is already in `nhmis_dictionary.json` |
| DHIS `HIV_AIDS` | F2 | 51 merges; `B1:F1` = `"ART Monthly_08_PLHIV who RESTARTED ART during the month Female"` over row 1 = `2022..2026` |
| DHIS `DHIS2.0 Reporting Rate` | F2 | 15 merges, `"Year 2022"` under a merged form name |
| DHIS `Cases 2020-2026` | F3 | Merges `D3:G3`, `H3:K3` — year over `Q1..Q4` |
| DHIS `Cohort 2020-2026` | F4 | Repeating 8-column tail under `Q1 2020`, `Q2 2020` |
| DHIS, 4 sheets | F5 | Kobo/ODK `start` / `end` columns |
| AFP `NIE`, `DSNO Assign`, `LGA_Track` | F8 | Flat long format |
| AFP `Sheet4`, `Sheet2` | F6 | `Row Labels` |
| AFP `dropdown` | F7 | Lookup sheet |
| AFP `Summary_Auto` | Expected `UNKNOWN` | Multi-state derived summary, no valid spine |

Five behaviours neither document accounts for, each a silent-corruption risk if built as written:

- **Declared sheet ranges are wrong and must be recomputed.** `HIV_AIDS` declares `A1:IV1000` against 29 real rows; `DHIS Data 2022 to 2026` declares 1000 rows against 30. Parsing the declared range inflates staging roughly 34× and invalidates engine §4.1's numeric-density rule, computed over a region 97% empty. `Cases 2020-2026` declares `B1:AD1000` while holding content in column A, so the declared range is not even a reliable lower bound. A real-extent scan must run before every other stage.

- **Merged-range expansion must exclude title rows.** `Cases 2020-2026` carries merge `E1:T2` holding `"NIGER STATE"`. Expanding it per engine §4.2 copies that across 16 columns of the header block, so every composed header begins `"NIGER STATE | ..."`.

- **F4 period heads float inside blocks rather than announcing them.** `Cohort 2020-2026` has zero merges; `Q1 2020` sits at column 4 and `Q2 2020` at column 10, while the repeating 8-column blocks begin at 1, 9, 17. Block boundaries must come from tail repetition first, with each period token attached to the block that **contains** it.

- **Multi-state national workbooks are already in the corpus.** Engine §2 lists them as absent and to be requested later. `LGA_Track` holds 775 rows spanning every Nigerian state; `Summary_Auto` compares Niger against Benue, Kogi, FCT. Stage 5 needs a state-scope filter and must report out-of-scope counts rather than drop them.

- **Survey sheets carry personal data.** The F5 sheets contain `Name of Midwife`, `Phone number`, `Email`, `Name of Supervisor`. This is live PII inside the ingestion path, which constrains both the survey store and — critically — what may ever be sent to an AI provider. See B7 and Part E.

One finding runs the other way: `Niger Health Facilities.gpkg` already carries `lga_alt_names` and `ward_alt_names` alongside `facility_name`, `nhfr_facility_code`, `ownership`, `facility_level`, and coordinates for all 2,191 facilities. That is authoritative NHFR/GRID3 alias data, free to seed.

### A.6 The migration chain does not run from an empty database — **RESOLVED in Phase 0 Stage B**

Found while validating the Phase 0 migrations, and unrelated to this sprint. Running the full chain against a fresh database fails on the ninth migration:

```
53 migrations were found in the source code.
Migration "AgencyStaff1738175520000" failed:
  type "users_role_enum" does not exist
```

The cause is a timestamp that sorts wrongly. `AgencyStaff` is stamped `1738175520000` — January 2025 — while the migrations that create `users`, `permission_groups` and the `users_role_enum` type are stamped `178…`, mid-2026. TypeORM orders by timestamp, so `AgencyStaff` runs ninth, before the tables and enum it references exist. Production is unaffected because its schema was built incrementally and its `migrations` table already records the row; the breakage only appears when building from scratch.

Consequences worth being explicit about, because two of them bite this sprint:

- **No new environment can be provisioned from migrations today.** That includes the staging environment mentioned in `DEPLOYMENT.md` and any CI job that would verify migrations against a clean database.
- **`down()` is effectively untested across the chain**, so migration rollback is not a rehearsed recovery path.
- **Phase 0's own migrations are unaffected** — they are appended at `17850…`, well after the schema they depend on — and were verified separately by running their `up()` and `down()` against a scratch database seeded with `users` and `datasets` stubs, including the `progress` CHECK constraint, the partial unique index on `idempotency_key`, and `(publication_id, seq)` uniqueness.

**Resolution.** The client confirmed the January-2025 timestamps were an agent error — the project started in July 2026 — and directed that they be corrected. All six affected migrations were re-stamped into the gap after `PermissionGroups` (`1783769100000`–`1783769600000`), preserving their relative order, which is the position their dependencies require.

The production concern was handled by making the migrations idempotent rather than by editing the `migrations` table. TypeORM records applied migrations by class name, so re-stamping means production sees six new migrations and runs them again; a reconciliation migration cannot prevent that, because the pending list is computed once before any migration runs. Four of the six were already guarded; `AgencyStaff` gained `IF NOT EXISTS` on its table and indexes, and `UniqueStaffGroupMembership` gained a `pg_constraint` existence check, since `ADD CONSTRAINT` has no `IF NOT EXISTS` and promoting an index to a constraint consumes the index.

Verified both ways: the full 53-migration chain now runs against an empty database, and `npm run migration:verify-restamped --seed-fixture` re-runs all six against an already-migrated database with zero state drift across eight measured counts.

Binding for the whole build. Changing one later is a refactor, not a tweak.

### B1 — Migrate to BullMQ first, before any engine code depends on the queue

Both design documents specify BullMQ; the engine needs flows, object-valued progress, and per-queue concurrency; and the codebase already has a latent Bull/BullMQ type conflict (A.4). Migrating after the engine is written means rewriting its processors.

Decision: replace `@nestjs/bull` with `@nestjs/bullmq` as the **first task of Phase 0**, converting the four existing processors 1:1 (`@Process` → `WorkerHost.process()`), with no behaviour change and the existing worker tests green before anything else starts. Remove `bull` from dependencies so the two cannot be mixed again.

### B2 — The worker runs as a separate process, in the same image

Architecture §2 and §12 both specify the worker as its own process with no HTTP server, sharing the codebase. It was never split; today every processor runs inside the API process. The engine's inner loops (fuzzy matching thousands of candidate pairs, embedding inference, PELT) are CPU-bound and will stall the Node event loop — which, in-process, means stalling live API requests. This is precisely the outcome the sprint is meant to avoid.

Decision: add `src/worker.ts` bootstrapping `NestFactory.createApplicationContext(WorkerModule)` with no HTTP listener, run it from the **same Docker image** with a different command (one image to build, tag, and scan), and add a `worker` service to both compose files. `ROLE=api|worker` selects behaviour: the API registers queues as a producer only and must never register a processor; the worker registers processors and no controllers. A startup assertion enforces this in both directions.

Within the worker, long loops yield to the event loop on a fixed cadence so progress reporting and heartbeats stay live, and the heaviest math (embedding inference, changepoint scan) goes to a `worker_threads` pool. The process split is the load-bearing fix; the thread pool is a second-order optimisation and is scoped accordingly.

### B3 — Keys, naming, and DDL follow the repo, not either document

Architecture §4 and engine §6 both use `SERIAL` / `BIGSERIAL`. All 37 existing entities use `@PrimaryGeneratedColumn('uuid')` and every migration defaults to `uuid_generate_v4()`. **All new tables use uuid PKs with `uuid_generate_v4()`.** Migration filenames follow `{13-digit-ms}-{PascalCase}.ts` with class `{PascalCase}{Timestamp}`, continuing from `1785000000000`.

### B4 — The spatial reference layer is the architecture's concrete tables, not a generic org-unit table

Engine §6.2 models `orgunit_aliases` as level-polymorphic (`orgunit_level` + `orgunit_id`), and engine §5's comparison endpoint keys on `(indicator_id, lga_id, ward_id, facility_id, period)`. Both assume the architecture's three concrete tables exist. They agree with each other; only the code disagrees, by not having them.

Decision: build architecture §4.1's `lga_boundaries`, `ward_boundaries`, `health_facilities` (plus `population_estimates`) as real PostGIS tables with GIST indexes, loaded by a GeoWorker. Keep `disease_burden`'s three nullable FKs exactly as architecture §4.6 specifies. Keep `orgunit_aliases` level-polymorphic exactly as engine §6.2 specifies. This serves the engine, the GIS module, and the analytics module from one gazetteer.

`GisReferenceService` is refactored to resolve against these tables through the shared ladder, `gis_reference_areas.name_variants` migrates into `orgunit_aliases` as confirmed human-method rows, and the ward reconciliation admin page keeps working. §12.3's outcome is reached; only its route changes.

### B5 — Vector search: interface first, brute force by default, pgvector opt-in

pgvector is absent from the `postgis/postgis` image, so engine §6.3's `CREATE EXTENSION vector` fails. Swapping the production database image mid-sprint is a risk this project should not be forced to absorb.

Decision: an `EmbeddingIndex` interface with one method, `nearest(vector, k)`, and two implementations. **Default (`memory`)**: embeddings in a `real[]` column, whole registry loaded into a `Float32Array` matrix at worker boot, cosine by brute force — a 5,000 × 384 matrix is under 8 MB and a full scan is single-digit milliseconds, which is the correct answer at this scale, not a compromise. **Opt-in (`pgvector`)**: selected by `EMBEDDING_INDEX=pgvector`, with the HNSW migration guarded on extension availability. Revisit above ~50,000 vectors.

### B6 — Dataset lifecycle: add `ingestion_status`, leave `DatasetStatus` alone

Engine §13.1's lifecycle overlaps but does not match the live `DatasetStatus` enum, which drives the admin portal, the QA checklist gate, submission tickets, and the public visibility check. Architecture §4.4 specifies a third, different enum (`submitted`, `needs_revision`, `published`) that was also never adopted.

Decision: leave `DatasetStatus` untouched. Add `datasets.ingestion_status` carrying the engine lifecycle, and `datasets.ingestion_report` JSONB. The existing `POST /admin/datasets/:id/publish` becomes the trigger that enqueues `dataset-publish`. Editorial approval and ingestion publication stay orthogonal — which is also more honest, since a dataset can be editorially approved while its observations are still resolving.

### B7 — AI is a governed service layer, not a single call

Engine §8 specifies one LLM call per upload for unresolved indicator strings. That is the highest-value use but not the only one, and a single ad-hoc adapter will not survive a government audit. Decision: build a first-class `AiModule` with versioned prompts, schema-validated outputs, a persistent response cache, hard budgets, a circuit breaker, and a full invocation audit trail. Every AI-derived decision is written `method='llm'`, `status='pending'` and cannot affect published data until a human confirms it. **No F5 survey row data, and no cell values from any sheet carrying personal data, may ever be placed in a prompt** (A.5). Detailed in Part E.

### B8 — CommonJS discipline on every new dependency

The repo compiles to CommonJS (`package.json` has no `"type": "module"`; `tsconfig.json` uses `module: nodenext`). ESM-only dependencies break at runtime, and this project already lost time to exactly that with `otplib@13` pulling ESM-only `@scure/base` (commit `b3dece9`).

Every dependency this plan adds must be CJS-loadable or reached via dynamic `import()`, verified with an actual `node -e "require('pkg')"` before commit. Concretely: `@xenova/transformers` pinned to the 2.x line (3.x is ESM-only); `fuzzball` for token-set ratio; Jaro-Winkler and Double Metaphone vendored as small utilities under `src/modules/ingestion/resolver/` rather than taken as dependencies.

### B9 — `nhmis_dictionary.json` is split between build and seed

Detailed in Part F.

### B10 — Memory budget: the host is 2 vCore / 4 GB, and it is already the binding constraint

Client-confirmed (August 2026): production is a 2 vCore / 4 GB C4 at Host Africa, upgradable to 8 GB as the engine's needs grow. Architecture §12's assumption of 8 vCPU / 16 GB does not apply and should be read as aspirational throughout that document.

This constraint bites immediately, because Phase 0 adds a **seventh** container to a host that already runs Postgres+PostGIS, Redis, ClamAV, nginx, and the API — and **no service in either compose file declares a memory limit today**. ClamAV alone typically holds its signature database in RAM at over 1 GB resident. Unbounded, a single container's spike gets resolved by the kernel OOM killer choosing a victim, and the most likely victim on this host is Postgres.

Decisions:

- **Every service gets an explicit `mem_limit` in `docker-compose.prod.yml`, in Phase 0**, alongside the worker container rather than after it. Adding a container to an unbounded 4 GB host without doing this would be negligent.
- Indicative starting allocation on 4 GB, to be tuned against measured RSS: Postgres 1 GB, ClamAV 1 GB, API 512 MB, worker 512 MB, Redis 256 MB, nginx 64 MB, leaving roughly 600 MB of headroom for the OS and page cache.
- **The worker gets `NODE_OPTIONS=--max-old-space-size`** set below its container limit so V8 applies backpressure through GC before the kernel applies it through SIGKILL.
- **Phase 8 is the phase that forces the 8 GB upgrade.** A quantized MiniLM adds roughly 250 MB resident to the worker, and 512 MB will not hold the worker plus the model plus a workbook in flight. The plan's position is that the upgrade is requested when Phase 8 starts, not preemptively — Phases 0–7 fit in 4 GB and deliver the shippable core, so the spend is deferred until it buys something.
- Phase 0 and Phase 8 gates both record measured peak RSS per container, so the upgrade request is backed by numbers rather than by estimate.

This is also a second, independent argument for B2's process split: with API and worker as separate containers, the engine's memory ceiling is enforced by Docker on the worker alone, and a runaway ingestion cannot take the API down with it.

---

## Part C — The unified data model

One merged catalogue. Every table is tagged with its source and the phase that creates it. All uuid PKs per B3.

### C.1 Spatial reference — Phase 1

| Table | Source | Notes |
|---|---|---|
| `lga_boundaries` | Arch §4.1 | 25 rows, `geom MULTIPOLYGON(4326)` + GIST, `lga_code` (INEC) unique, `population` |
| `ward_boundaries` | Arch §4.1 | ≥274 rows (live GRID3 GPKG has 275 distinct `(lga, ward)` polygons), `geom MULTIPOLYGON(4326)` + GIST, FK to LGA |
| `health_facilities` | Arch §4.1 | 2,191 rows, `geom POINT(4326)` + GIST, `nhfr_facility_code`, `facility_level`, `ownership`, name FTS index, FKs to LGA and ward assigned by `ST_Intersects` (smallest polygon; covers boundary points that `ST_Contains` would miss) |
| `population_estimates` | Arch §4.6 | Per LGA/ward/year, drives incidence |
| ~~`road_network`~~ | Arch §4.1 | **Out of scope** — marked "future use" |

### C.2 Indicator and burden — Phase 2

| Table | Source | Notes |
|---|---|---|
| `disease_indicators` | Arch §4.6 **+** Engine §6.4 | Architecture's columns plus the engine's `succeeds_indicator_id`, `canonical_source`, `first_seen_dataset_id`. `is_active` defaults **false** — the engine's new-indicator gate |
| `disease_burden` | Arch §4.6 **+** Engine §6.4 | Architecture's three nullable org FKs and period columns, **created with** the engine's `value_status`, `disaggregation` JSONB, `cell_ref`, `flags TEXT[]`, nullable `value`. Composite unique gains a generated `disaggregation_hash` so disaggregated rows never collide with totals |
| `analytics_cache` | Arch §4.6 | Persistent cache; the retraction engine invalidates exactly the keys in `affected_keys` |
| `indicator_revisions` | Arch §4.14 | Written on confirmed successions and on governance edits |

### C.3 Engine staging and resolution — Phases 3–8

| Table | Source | Notes |
|---|---|---|
| `staging_observations` | Engine §6.1 | Plus real FKs to the C.1 tables |
| `indicator_aliases` | Engine §6.2 | `normalized` unique, `method`, `status`, `candidates` JSONB. **Created in P2** so the dictionary seeder has a home |
| `orgunit_aliases` | Engine §6.2 | Level-polymorphic per B4. **Created in P1** so gazetteer harvest has a home; remaining alias methods land in P5 |
| `indicator_embeddings`, `alias_embeddings` | Engine §6.3 | `real[]` per B5 |
| `observation_conflicts` | Engine §6.5 | |
| `format_coverage_register` | Engine §6.6 | Plus declared-vs-real extent columns (A.5) |
| `resolver_config` | Engine §7.4 | Threshold bands, `dictionary_version`, `model_tag`, evaluation metrics. **Created and seeded in P2** |
| `training_pairs` | Engine §7.3 | Confirmations write `label=1`, rejections `label=0` |

### C.4 Publication ledger — created Phase 0, used Phase 7

| Table | Source | Notes |
|---|---|---|
| `dataset_publications` | Engine §13.2 | `affected_keys` JSONB drives targeted cache invalidation |
| `ingestion_mutations` | Engine §13.2 | `(publication_id, seq)` unique, `before_image` only where history is destroyed |

Created in Phase 0 so no schema migration can ever block the ledger later. See the standing rule in Part F.

### C.5 Jobs, progress, and AI — Phase 0 and Phase 9

| Table | Source | Notes |
|---|---|---|
| `ingestion_jobs` | Arch §4.8 | `status`, `progress` 0–100, `steps` JSONB, `worker_id`, `error_message`, timings. The backbone of the progress API |
| `ai_invocations` | **New** | Full audit: task, prompt version, model, input hash, tokens, latency, cost, decision, outcome |
| `ai_response_cache` | **New** (Engine §8 specifies a cache, not a store) | Keyed by task + prompt version + input hash + registry version; persistent so it survives a Redis flush and remains auditable |
| ~~`export_jobs`~~ | Arch §4.8 | **Deferred** — analytics export is not engine-critical |

### C.6 Column additions to existing tables

- `datasets.ingestion_status` (enum, default `not_ingested`) and `datasets.ingestion_report` JSONB — per B6.
- No changes to `DatasetStatus`, `submission_tickets`, or the permissions tables.

---

## Part D — Runtime, concurrency, and progress

This is the part that answers "users must not wait for the engine, and the frontend must be able to show progress."

### D.1 Queue topology

Merging architecture §6 with what the engine actually needs. Concurrency is set per queue; the current `bull.config.ts` sets none.

| Queue | Concurrency | Priority | Purpose | Status |
|---|---|---|---|---|
| `validation` | 5 | high | ClamAV + format gate | Exists |
| `geo-extraction` | 2 | high | GPKG/SHP/KML → PostGIS | **Built in P1** (`gazetteer-build`) |
| `upload-processing` | 1 | medium | Reader parent flow (Stages 1–7) | **Built in P3** |
| `resolution` | 2 | medium | Re-resolve staged rows after alias confirmation | **New, P6** |
| `ai-inference` | 1 | low | All LLM calls, budget-capped | **New, P9** |
| `dataset-publish` | 1 | high | Publish **and** retract | **New, P7** |
| `analytics-compute` | 2 | low | Burden aggregation, cache warm | Extend existing `analytics` |
| `notification` | 10 | high | Email + in-app | Exists |
| `sms` | 3 | high | Termii | Exists |
| `dead-letter` | — | — | Terminal failures after 3 retries | **New, P0** |

Publish and retract deliberately share one concurrency-1 queue. They must never interleave for the same dataset, and a single-consumer queue gives that guarantee structurally, on top of the Postgres advisory lock engine §13.3 requires.

The Reader runs at concurrency 1 by design (engine §3.2): one workbook at a time, bounded memory. Parallelism comes from the other queues continuing to drain, and from the worker being a separate process (B2) so none of it touches API latency.

### D.2 Job model and staged progress

The Reader is a BullMQ **flow**: one parent job per dataset with child jobs per stage. Each child reports into the parent's `ingestion_jobs` row.

Stage weights, chosen so progress is monotonic and roughly linear in wall-clock time:

| Stage | Weight |
|---|---|
| 1 — download and open workbook | 5% |
| 2 — sheet triage | 5% |
| 3 — structural detection | 10% |
| 4 — unpivot to staging | 25% |
| 5 — period grammar | 10% |
| 6 — org unit resolution | 15% |
| 7 — indicator resolution (6a–6d) | 20% |
| 8 — validation, flags, report | 10% |

`ingestion_jobs.steps` holds one object per stage: `{ key, label, status, startedAt, completedAt, itemsTotal, itemsDone, message }`. Within a stage, batch loops tick `itemsDone` and recompute overall progress, throttled to at most one write per second so progress reporting never becomes the bottleneck.

### D.3 Progress API

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/uploads/:jobId` | Existing endpoint, extended to read `ingestion_jobs` rather than only BullMQ state |
| `GET /api/v1/datasets/:id/ingestion` | Current status, per-stage `steps`, counts, and the ingestion report when complete |
| `GET /api/v1/datasets/:id/ingestion/stream` | Server-Sent Events stream of progress updates |
| `GET /api/v1/admin/queues/health` | Queue depths, active/failed counts, dead-letter count, oldest waiting job age |

SSE rather than WebSockets: architecture §6 anticipated "future WebSocket subscription", but SSE is one-directional, which is all progress needs, works through the existing nginx reverse proxy with buffering disabled on that location, and needs no new protocol handling. The polling endpoint remains for clients that cannot hold a connection, so the frontend can choose.

### D.4 Reliability

- **Idempotency.** Every ingestion job carries a key of `datasetId + fileHash`. A duplicate enqueue returns the existing job instead of reprocessing, and a retried job resumes rather than double-inserting.
- **Dead-letter queue.** After 3 attempts with exponential backoff, jobs move to `dead-letter` with the full error. Surfaced in `GET /admin/queues/health` and manually retryable.
- **Bull Board** mounted at an admin-only route behind the existing admin guards, per architecture §12.
- **Graceful shutdown.** The worker drains in-flight jobs on SIGTERM before exit so a deploy never leaves a half-written staging batch.
- **Heartbeat.** `ingestion_jobs.worker_id` plus a timestamp; a job whose worker has not beaten in 5 minutes is reclaimable.
- **Job failure discipline** (engine §3.3): a job fails only on I/O errors and corrupt files. Unresolved strings are the normal, expected outcome and never a failure.

---

## Part E — The AI service layer

Engine §8 gives the contract for one task. This expands it into a governed service that several stages call, without loosening any of §8's controls.

### E.1 Module shape

`src/modules/ai/` containing the provider adapter, an `AiService` exposing a single generic `invoke<T>(task, input, schema)`, a versioned prompt registry, the cache, the budget guard, and the invocation audit.

**Provider: Anthropic, hosted API** (client-confirmed, August 2026). Engine §8's Ollama-on-a-workstation option is not being taken. Three consequences:

- The adapter targets the Anthropic Messages API via `@anthropic-ai/sdk`. Structured output uses **tool-use with a declared input schema** rather than a JSON-mode flag, which is Anthropic's reliable path to schema-conforming output; the zod schema in each prompt module is the source of both the tool schema and the response validation, so they cannot drift.
- The adapter interface stays provider-agnostic (`AiProvider` with one `complete(prompt, schema)` method) so a second provider or a local fallback is a new class, not a refactor. That costs almost nothing now and is the difference between a swap and a rewrite later.
- Model choice, temperature (0 for every classification task), and max tokens are per-task configuration in the prompt module, and the resolved model ID is recorded on every `ai_invocations` row so a model upgrade is visible in the audit trail.

**Cross-border data transfer.** A hosted provider means prompt content leaves Nigeria. Combined with the personal data confirmed in the F5 survey sheets (A.5), the PII exclusion in E.3 stops being good hygiene and becomes an NDPA cross-border transfer control. Two things follow: the exclusion must be enforced mechanically, which it is, and NSPHCDA needs a recorded position on the transfer — including whether Anthropic's zero-retention API terms are required for this deployment. Flagged in Part I; it is a paperwork item, not an engineering blocker, but it should be settled before Phase 9 ships rather than after.

Prompts live in code as versioned modules — one file per task exporting `{ id, version, build(input), schema }` — so a prompt change is a reviewable diff, and `ai_invocations.prompt_version` records exactly which text produced any given decision.

### E.2 Tasks

| Task | Stage | Input | Output |
|---|---|---|---|
| `indicator.classify` | 6e, engine §8 | Unresolved normalized strings with their top-3 fuzzy and embedding candidates plus the category list | Per string: `match` (id + confidence), `new_indicator` (name, category, unit), or `human` |
| `indicator.propose` | 6e | A string the classifier marked `new_indicator` | Proposed name, category, unit, definition — pre-fills the review UI's "create new indicator" path |
| `orgunit.disambiguate` | Stage 5 rung 5 | Unresolved org strings with in-scope candidates | Best candidate + confidence, or `human` |
| `sheet.interpret` | Stage 2 fallback | Compact grid of the first 15 rows × 25 cols, the merge map, and the real extent — **headers and structure only, never body values** | Proposed header block rows, spine column, period layout, species, confidence |
| `disaggregation.extract` | 6a residue | Strings the deterministic dimension extractor could not fully decompose | Proposed `disaggregation` JSONB |
| `ingestion.narrate` | Post-Stage 8 | Aggregate counts and flags from the ingestion report — **no row data** | Plain-English summary for the admin review page |

`sheet.interpret` is the highest-leverage addition beyond engine §8. It is the direct answer to the two-file-corpus risk: instead of an unrecognised sheet becoming a bare human task, the admin gets a proposed parse to confirm or reject, and a confirmation becomes evidence for building a real handler. It never parses anything on its own — the output is a proposal, always human-confirmed.

### E.3 Controls

Engine §8's controls, plus what a government deployment needs:

- **Structured output only.** Every task declares a zod schema; malformed output is retried once, then the batch falls through to review.
- **Budget.** Max one call per task per upload, max 60 strings per call, a daily token ceiling, and per-invocation cost recorded against Anthropic's published rates. Overflow goes to review rather than spending. With a hosted provider this is a real monthly bill, so the ceiling is a hard stop, not a warning, and the admin view in Phase 9 reports spend against it.
- **Cache.** Keyed by task + prompt version + input hash + registry version, and persistent. A string is never paid for twice, including across restarts and redeploys. Because the same indicator vocabulary recurs across uploads, the cache is the single largest cost control in the design.
- **Circuit breaker.** N consecutive provider failures opens the breaker for M minutes; the stage is skipped and strings route to review. Also trips on HTTP 429 with backoff.
- **Offline is a supported mode, and it now matters more.** With a hosted provider, every AI stage depends on the Niger State server reaching the public internet. An unreachable or rate-limited provider skips the stage and routes strings to review; ingestion never blocks on connectivity. Stages 6a–6d stay fully local, so the deterministic and embedding ladder continues to resolve the large majority of strings with the network down. This is what keeps a third-party dependency from becoming a single point of failure for data ingestion.
- **Nothing publishes on AI authority.** Every AI decision is `method='llm'`, `status='pending'`, and cannot affect `disease_burden` until a human confirms it.
- **PII exclusion is enforced in code, not by convention.** F5 survey sheets carry names, phone numbers, and emails (A.5). The prompt builder takes a redacted projection — never a raw row — and a unit test asserts that survey-sheet content cannot reach a provider. This is an NDPA obligation and it is also architecture §9 Layer 5's rule applied to a surface that did not exist when that rule was written.
- **Full audit.** Every invocation writes an `ai_invocations` row. "Which model, which prompt, what did it see, what did it decide, who confirmed it" is answerable for any published number.

---

## Part F — `nhmis_dictionary.json`: where it is used

The file stays in the repository as the version-controlled source of truth and is consumed two different ways. Some of its content is *normalizer configuration* — code-like rules with ordering semantics on the hot path — and belongs compiled into the build. The rest is *registry content* and belongs seeded into the database where admins can extend it and the review queue can add to it. Reading the whole file at runtime per string, or seeding all of it into tables, would both be wrong.

| Key | Size | Destination | Why |
|---|---|---|---|
| `abbreviations` | 196 | **Compiled into build** — longest-match-first trie in `NormalizerService` | Hot-path token rewriting with ordering semantics (`IPTp` must beat `IPT`), which a table does not express naturally |
| `common_misspellings` | 40 | **Compiled into build** — applied before abbreviation expansion | Same. Validated: `heamatinics` appears verbatim in the real DHIS header |
| `dimension_tokens` | 7 groups | **Compiled into build** — disaggregation extractor | Validated: `HIV_AIDS` headers terminate in `Female` / `Male`, which must reach `disaggregation`, never indicator identity |
| `period_tokens` | 4 groups | **Compiled into build** — Stage 4 tokenizer | Grammar rules, covered by the golden-file suite |
| `orgunit_patterns.dhis2_decorations` | 5 regexes | **Compiled into build** — Stage 5 rung 2 | Validated: `ni Agaie a` is the literal spine value in one sheet while `Agaie` is the value in another sheet of the same workbook |
| `orgunit_patterns.facility_type_prefixes` | 20 | **Compiled into build** — facility normalisation before phonetic matching | Validated against real names: `Phcc maito`, `PPCH TUTUNGO`, `Comphrensive health center` |
| `orgunit_patterns.niger_state_lgas` | 25 | **Seeded** and used as a build assertion against `lga_boundaries` | The only complete authoritative LGA list in text form. A GeoWorker run that yields 24 or 26 LGAs is a bug, and this is how we catch it |
| `synonym_groups` | 69 canonical, ~300 variants | **Seeded** — 69 `disease_indicators` rows plus ~370 confirmed `indicator_aliases` | **The highest-value use of the file.** The indicator registry does not exist and has no other seed. These 69 canonical names *are* the initial registry, and every variant becomes a confirmed alias, so Stage 6b resolves a real share of the very first upload instead of dumping everything into review |
| `form_and_system_names` | 13 | **Seeded** into `resolver_config` as context | Sheet naming context, and `version_shift_note` primes the Stage 8 succession detector for the 2013→2019 NHMIS form seam |
| `meta.version` | 1 | **Stamped** into `resolver_config.dictionary_version` | Alias provenance and cache invalidation both need to know which dictionary version produced a mapping |

**Seeder rules** (`src/database/seeds/006_nhmis_dictionary.seed.ts`): idempotent and safe against a populated production database; seeded aliases carry `method='dict'`, `status='confirmed'`, null `decided_by`, so they stay distinguishable from human decisions forever; the seeder **never overwrites** a row with `method='human'`; bumping `meta.version` and re-running is the supported upgrade path and reports its diff.

**Augment, do not rely solely on the file.** The gazetteer seed additionally harvests `lga_alt_names` and `ward_alt_names` from `Niger Health Facilities.gpkg` into `orgunit_aliases` — authoritative alias data already in the repo, free to load.

---

## Part G — Phased build

Eleven phases. Each is a shippable unit with an explicit exit gate.

**Phases 0–7 are the core**: platform, warehouse, deterministic parsing, dictionary and fuzzy resolution, human review, and reversible publication. Phases 8–10 are accuracy, intelligence, and activation layers that the system runs correctly without.

**Standing rule, from engine §11 and non-negotiable:** the mutation ledger (Phase 7) must land **before the first production approval is granted**. A ledger written from day one is what makes every historical dataset retractable; retrofitting it later leaves early datasets permanently irreversible. Ledger tables are created in Phase 0 so nothing can block it. **No dataset is published in production until Phase 7's gate passes.**

Module root for engine code: `src/modules/ingestion/`.

---

### Phase 0 — Queue and worker platform

No engine code. This phase makes the engine runnable without degrading the live API.

Delivered in two stages, at the client's direction, so that the additive work is not entangled with the one genuinely risky change. **Stage A** touches nothing that runs today. **Stage B** rewrites the live queue layer — email, SMS, ClamAV validation, and nightly analytics all pass through it — and is reversible with a single `git revert` provided queues are drained before deploying.

**Stage A — additive foundation (complete)**

- [x] `CreateIngestionJobs` migration + entity (arch §4.8) with `steps` JSONB and `worker_id`.
- [x] `CreateDatasetPublications` + `CreateIngestionMutations` migrations (engine §13.2) — **created now, used in Phase 7**.
- [x] `AddDatasetIngestionStatus` migration per B6, plus `ingestion_report` JSONB.
- [x] `JobProgressService` — stage weights per D.2, throttled to ≤1 write/second; also carries the idempotency-key builder and the stalled-job reclaim query.
- [x] Progress API: `GET /datasets/:id/ingestion`, the SSE stream, and `GET /uploads/:jobId` enriched with stage detail (falling back to pure queue state for uploads that never enter ingestion).
- [x] nginx: proxy buffering disabled on the SSE location, via a regex location so the setting applies to that endpoint alone.
- [x] `src/worker.ts` — `NestFactory.createApplicationContext(WorkerModule)`, no HTTP listener, SIGTERM drain with a timeout.
- [x] `ROLE=api|worker` switch; both entry points refuse the wrong role at startup.
- [x] `npm run start:worker` / `start:worker:prod`; `worker` service in `docker-compose.prod.yml` (behind the `worker` profile during Stage A, taken off it in Stage B). `docker-compose.yml` has no application service at all — it provisions Postgres, Redis and ClamAV only — so the npm script is the dev path and no dev compose change is required.
- [x] `mem_limit` on every service in `docker-compose.prod.yml` per B10, plus `NODE_OPTIONS=--max-old-space-size` on API and worker, and a Redis `maxmemory` below its container limit using `volatile-lru` so eviction can never discard a queued job.

**Stage B — queue platform (complete)**

- [x] Migrate `@nestjs/bull` → `@nestjs/bullmq`; convert `ValidationProcessor`, `AnalyticsProcessor`, `NotificationProcessor`, `SmsProcessor` 1:1 to `WorkerHost`. No behaviour change.
- [x] Remove `bull` from dependencies; fix the `bullmq`-typed / Bull-injected queue in `notifications.service.ts:6`. Uninstalling `@nestjs/bull` removed `bull` entirely — it was only ever a transitive dependency.
- [x] Rewrite `bull.config.ts` with the D.1 topology: per-queue concurrency, priority, TTL, and retry policy.
- [x] `dead-letter` queue; failed jobs land there after 3 attempts with the full error, keyed by origin queue and job id so a repeat does not accumulate rows.
- [x] **Bull Board — dropped, by client decision.** It mounts an Express router outside Nest's guard pipeline, and this platform authenticates with Bearer tokens only, which a browser cannot send when navigating to a URL. Making the UI both usable and admin-only would have meant introducing a browser-usable credential path — a cookie session or HTTP Basic — into a codebase that has neither. On a platform holding health data, the client chose the smaller attack surface: no UI, and the JSON endpoints below instead. Revisit only if queue debugging proves painful in practice.
- [x] `GET /admin/queues/health`, plus `GET/POST/DELETE /admin/queues/dead-letter*` so dead-lettered jobs are listable, replayable, and discardable without the board. All super_admin. This replaces the board's observability rather than deferring it.
- [x] Wire the idempotency key at enqueue time, and schedule the heartbeat reclaim scan (`StalledJobReclaimer`, every 60s in the worker).
- [x] Extract processors into a controller-free `WorkersModule` imported only by `WorkerModule`, and take the `worker` service off its compose profile. `shouldConsumeQueues()` was **deleted rather than flipped**: with every `@Processor` declared in one worker-only module, the API cannot construct one, which makes the split structural instead of leaving both processes one misread environment variable away from double-processing.

`WorkerModule` still composes `AppModule` rather than an explicit narrow list. The processors depend on services in modules that also declare controllers (`GisModule`, `NotificationsModule`, `SmsModule`, `UploadsModule`), so a narrow list would require splitting each into service-only and controller-only halves — a wider refactor that buys tidiness, not behaviour. The controllers are inert under `createApplicationContext`, which binds no routes.

**Migration timestamp repair (unplanned, done with Stage B)**

- [x] Six migrations stamped January 2025 re-stamped to `1783769100000`–`1783769600000`, resolving A.6/R18. The full chain now runs against an empty database.
- [x] All six made idempotent, because TypeORM keys applied migrations by class name and production will re-run them once under their new names.
- [x] `npm run migration:verify-restamped` proves the re-run is a no-op; `--seed-fixture` inserts a throwaway super_admin so the two seeding migrations' real insert path is exercised rather than early-returning.

**Exit gate**

- [x] All four processors run on BullMQ with the suite green — 342 tests across 42 suites, up from 273/38.
- [x] The worker boots with all four processors plus the reclaimer, and shuts down cleanly on SIGTERM (exit 0, "Worker shut down cleanly").
- [x] The API boots with **no** processors and no reclaimer; `/api/v1/admin/queues/health` is mounted and returns 401 unauthenticated.
- [x] A deliberately failing job lands in `dead-letter` and is replayable via `POST /admin/queues/dead-letter/:id/retry` — covered by tests over `deadLetter`, `isTerminalFailure`, and `QueueHealthService.retryDeadLetter`, including the case where the replay fails and the record is deliberately kept.
- [ ] **Runtime verification against the live stack still owed** *(explicitly deferred — deploy E2E skipped by decision 2026-08-20)*: email, SMS, validation and nightly analytics exercised end to end on the deployed containers; a synthetic 60-second job reporting smooth progress through both the polling endpoint and the SSE stream with API p95 unchanged; measured peak RSS per container against the 4 GB budget (B10). These need the deployed environment, not a local run.

---

### Phase 1 — Spatial reference layer (GeoWorker + gazetteer)

Architecture §4.1, §7.3, and §15, finally built. This is the engine's gazetteer and it also fixes GIS performance.

- [x] Migrations for `lga_boundaries`, `ward_boundaries`, `health_facilities`, `population_estimates` per C.1, with GIST indexes and the facility-name FTS index.
- [x] `GeoWorker` on `geo-extraction`: GeoPackage → PostGIS via `better-sqlite3`, GPKG binary header strip → WKB → `ST_GeomFromWKB`, batched at 500 rows with progress ticks (arch §7.3).
- [x] Seed scripts per arch §15: LGAs, wards, population, then facilities — facilities assigned `lga_id` / `ward_id` by `ST_Intersects` (smallest intersecting polygon; equivalent to `ST_Contains` plus boundary points), **not** by the text name fields, which carry known disagreement flags in the source.
- [x] Harvest `lga_alt_names` / `ward_alt_names` from the ward and facility GeoPackages into `orgunit_aliases` (created here, ahead of Phase 5) as confirmed, method `dict`. Aliases that collide with a *different* org unit's canonical name are skipped, because the facility GPKG's GRID3 join columns are not always attached to the right polygon.
- [x] Migrate `gis_reference_areas.name_variants` into `orgunit_aliases` as confirmed, method `human`.
- [x] Refactor `GisService` and `GisReferenceService` to read from PostGIS once the gazetteer is loaded, falling back to GeoPackages until the first successful build so a deploy-before-seed does not take the public map offline. `resolveWardName` and `resolveWardCodeFromIndex` behaviour is unchanged.
- [x] Admin endpoint `POST /admin/gis-reference-layers/gazetteer-rebuild` to re-run the gazetteer build (also enqueued when a spatial GIS slot is swapped).
- [x] Cross-check the loaded LGA set against `orgunit_patterns.niger_state_lgas`; the build fails loudly on a mismatch.

**Exit gate**

- 25 LGAs matching the dictionary exactly. Ward count **≥ 274 and equal to the source GeoPackage feature count** (the live GRID3 operational-wards file has 275 distinct `(lga, ward)` polygons and no duplicate to drop; 274 in the architecture was stale). 2,191 facilities, assigned by geometry.
- Every existing GIS endpoint keeps its response shape. After `npm run seed:gazetteer`, LGA/ward/facility/state-boundary reads come from PostGIS.
- LGA cross-check is a build-failing assertion, covered by tests.

---

### Phase 2 — Indicator registry and burden warehouse

- [x] Migrations for `disease_indicators`, `disease_burden`, `analytics_cache`, `indicator_revisions` per C.2 — architecture columns merged with engine §6.4 columns at creation, so no `ALTER` is ever needed.
- [x] `disaggregation_hash` generated column and the composite unique constraint.
- [x] `src/modules/ingestion/resolver/dictionary.ts` — compile-time loader for the five build-side dictionary keys (Part F), exposing a longest-match-first trie.
- [x] `008_nhmis_dictionary.seed.ts` — 69 indicators, ~370 confirmed aliases, `form_and_system_names`, version stamp. Idempotent; never overwrites `method='human'`. (Numbered 008 because 006 is already programmes.)
- [x] `resolver_config` seeded with engine §4.6's starting bands (fuzzy 0.95 / 0.85, embed 0.90 / 0.78).
- [x] `npm run seed:dictionary`.
- [x] Governance indicator CRUD (arch §5.11): list, create, update with revision record, archive, revision history — wired through the existing `PermissionsModule`.

**Exit gate**

- Fresh `migration:run` on an empty database, then `seed` and `seed:dictionary`, both succeed.
- `disease_indicators` has 69 rows; `indicator_aliases` has 304 confirmed `method='dict'` rows on the current file (raw canonical+variant strings collapse under normalisation); re-running the seeder changes nothing.
- Governance indicator endpoints pass integration tests and write `indicator_revisions` rows.

---

### Phase 3 — Reader core: Stages 1–3, F1 and F8

- [x] `IngestionModule`; `upload-processing` registered at concurrency 1; `ValidationProcessor` enqueues it for tabular datasets on successful validation.
- [x] BullMQ flow: parent ingestion job with per-stage children, reporting into `ingestion_jobs` per D.2.
- [x] `WorkbookReader` with a **real-extent scan** replacing `!ref` for every sheet (A.5); both declared and real bounds recorded on the coverage register.
- [x] Merged-range extraction.
- [x] **Stage 1** — the five ordered triage rules (engine §4.1), numeric density computed over the real extent; every sheet gets a `format_coverage_register` row regardless of outcome.
- [x] **Stage 2** — header-block detection with the three-row confirmation rule; merged-range expansion **with the title-row suppressor** (A.5); vertical forward fill; ` | ` header composition; spine detection by fuzzy match against the Phase 1 gazetteer at 0.75 mean. No qualifying spine → species `UNKNOWN`, held, surfaced to review. Never guessed.
- [x] **Stage 3** — `FlatHandler` (F8) and `WideFusedHandler` (F1); mandatory `cell_ref` provenance on every row; chunked inserts into `staging_observations` with progress ticks.
- [x] **Value semantics** (engine §4.7): numeric including 0 → `reported` (0 also flagged `zero_reported`); empty where row and column both exist → `missing` with `value=NULL`; non-numeric → `invalid`, held. Missing values are **stored, not dropped**.
- [x] Both sample workbooks committed to `test/fixtures/ingestion/` with hand-verified golden outputs: per sheet the expected species, header compositions, distinct indicator strings, and 20 spot-checked tuples including at least one explicit zero, one blank, one misspelling, and one decorated org name.
- [x] Synthetic per-species sheets for header-detection unit tests.

**Exit gate**

- The DHIS workbook produces staging rows for its F1 sheets and a coverage-register row for all 10 sheets.
- Row counts track real extent, not the phantom 1000 × 122.
- Golden tuples match exactly; no sheet is silently mis-parsed.
- Progress advances smoothly through all eight stage slots in the SSE stream.

---

### Phase 4 — Remaining format handlers

- [x] `GroupedYearHandler` (F2) — verified against `HIV_AIDS` and `DHIS2.0 Reporting Rate`.
- [x] `NestedPeriodHandler` (F3) — verified against `Cases 2020-2026`, surviving the `E1:T2` title merge.
- [x] `RepeatingBlockHandler` (F4) — **block boundaries from tail repetition first, period head attached by containment** (A.5); verified against `Cohort 2020-2026`.
- [x] `SurveyHandler` (F5) — routes to a survey store, not the indicator pipeline; survey rows tagged as PII-bearing so Part E's exclusion rule can be enforced mechanically.
- [x] F6 and F7 — skip and archive with correct species and archive reason.
- [x] Species assignment completed for all eight species.

**Exit gate**

- Both fixture workbooks ingest with zero `UNKNOWN` species except `Summary_Auto`, which is expected and correct.
- All golden tuples match across all species; the coverage register shows the right handler for every sheet.

---

### Phase 5 — Period grammar and org unit resolution

- [x] **Stage 4** — pure-function tokenizer with engine §4.4's six precedence classes; float year normalisation (`2023.0`); range tokens as `period_type='range'` with explicit bounds; inheritance from the dataset's declared reporting period; `PERIOD_UNRESOLVED` hold otherwise. Golden-file suite of **≥60 cases** drawn from real corpus headers.
- [x] **Stage 5 ladder** — rung 1 exact alias; rung 2 decoration stripping then retry (must turn `ni Agaie a` into `Agaie`); rung 3 `token_set_ratio` + Jaro-Winkler against the gazetteer at the expected level, accept ≥0.95 / review 0.85–0.95; rung 4 Double Metaphone for facilities **constrained to the resolved LGA and ward**, shrinking candidates from 2,191 to under ~100; rung 5 review queue with top-3 candidates.
- [x] **State-scope filter** (A.5): rows resolving outside Niger State are counted and reported on the ingestion report, never silently dropped.
- [x] Every confirmed resolution writes an `orgunit_aliases` row.

**Exit gate**

- `ni Agaie a` and `Agaie` from the same workbook resolve to the same org unit, and the decorated form costs fuzzy matching exactly once.
- The AFP workbook's 775 national rows are correctly scoped to Niger with the out-of-scope count reported.
- Period suite passes ≥60 cases.

---

### Phase 6 — Indicator resolution 6a–6c, review queue, re-resolve loop

- [x] **6a normalizer** — lowercase, NFC, whitespace collapse, punctuation strip except `/` and `%`; misspelling correction then longest-match-first abbreviation expansion, in that order; period-token stripping for tokens Stage 4 consumed; dimension extraction into `disaggregation` JSONB. Dimensions never enter indicator identity. Unit suite covers expansion order and dimension extraction.
- [x] **6b** — exact hash lookup on confirmed `indicator_aliases.normalized`.
- [x] **6c** — `max(token_set_ratio, Jaro-Winkler)` against confirmed aliases and indicator names, bands from `resolver_config`.
- [x] **Governance API** (engine §9): review queue list; alias confirm / remap / reject; indicator activate (the new-indicator gate); ingestion report; coverage register. Every response carries the raw string, source workbook/sheet/cell, and top-3 candidates with scores and methods, so the review UI can be keyboard-fast.
- [x] Auto-created indicators are born `is_active=false` and never publish silently.
- [x] `resolution` queue: alias confirmation enqueues a re-resolve job that promotes all staged rows waiting on that alias.
- [x] Confirmations write `training_pairs` with `label=1`; rejections `label=0`.
- [x] Permissions wired through the existing `PermissionsModule`.

**Exit gate**

- Re-ingesting the same workbook yields **100% Stage 6b resolution** and no duplicate staging rows.
- Confirming an alias promotes waiting staged rows with no re-upload.
- A perturbed fixture (renamed indicators, injected misspellings, shuffled header rows) resolves ≥80% automatically with the remainder correctly queued, never mis-published.

---

### Phase 7 — Validation, approval gate, ledger, publish, retraction

The phase that must land before any production approval.

**Stage 7 — validation and conflicts (engine §4.7)**

- [x] `RANGE` flag — percent-typed indicators outside 0–100.
- [x] `OUTLIER` flag — beyond 6 median absolute deviations from that `(indicator, LGA)` history.
- [x] `SUM_MISMATCH` flag — LGA aggregate diverging >5% from summed facility rows.
- [x] Conflicting duplicate keys → both stored, `observation_conflicts` row written.
- [x] Violations annotate; they never delete.
- [x] Reporting-rate sheets ingested as first-class completeness indicators.

**Approval gate (engine §13.1)**

- [x] Stages 1–7 run on upload; nothing touches `disease_burden` before approval.
- [x] `POST /admin/datasets/:id/publish` enqueues `dataset-publish` instead of publishing inline.
- [x] Alias confirmations stay permitted before approval — aliases are registry knowledge, not dataset effects.
- [x] Analytics is never enqueued for an unpublished dataset.

**Mutation ledger and transactional publish (engine §13.2)**

- [x] Data rows and ledger rows written **in the same transaction**, chunked at 2,000 observations, `seq` strictly increasing across chunks.
- [x] Inserts record only the pk; before-images captured only for conflict-precedence overwrites and indicator activation.
- [x] `affected_keys` recorded as distinct `(indicator_id, period_year)` pairs.
- [x] Mid-publish death → publication `failed`; the retraction path runs over whatever `seq` range exists.

**Retraction engine (engine §13.3–13.6)**

- [x] `POST /admin/datasets/:id/retract` — admin, **MFA-gated**, reason required.
- [x] Postgres advisory lock on the dataset so retraction, republication, and analytics recompute cannot interleave.
- [x] Reverse in `seq DESC`, chunked, marking `reversed_at`; resumable from the highest unreversed `seq`.
- [x] Cascade rules (§13.4): orphaned indicators deactivate and flag; **confirmed aliases survive by default**; `forget_aliases=true` for the poisoned-source case; conflicts close as `retracted_source`; cross-dataset relations go inactive, not deleted.
- [x] Targeted `analytics_cache` invalidation from `affected_keys`, then scoped recompute.
- [x] File deletion from object storage; staging retained by default with a `purge_staging` option.
- [x] Stored retraction report (§13.6), linked from the dataset page.
- [x] Ledger housekeeping — prune retracted publications after 90 days.

**Exit gate — engine §13.6's five acceptance tests, all passing**

- [x] Publish A; publish B overriding two of A's values; retract B → aggregate checksums return **exactly** to the post-A state, including restored A values.
- [x] Retract A while B stands → B's rows and overrides untouched.
- [x] Kill the retract job mid-run and re-run → final state identical, no mutation reversed twice.
- [x] Retract a dataset that created an unreferenced new indicator → it deactivates and appears orphaned; re-approve → it reactivates and the series returns.
- [x] KPI, trend, and LGA burden endpoints reflect retraction after recompute, with no stale cache keys.

---

### Phase 8 — Embeddings, calibration, learning loop

- [x] `EmbeddingIndex` interface with `memory` and `pgvector` implementations per B5.
- [x] `@xenova/transformers` 2.x, `all-MiniLM-L6-v2`, 384 dimensions, model baked into the image at build and pinned by SHA. Runtime never fetches.
- [x] Embedding inference on a `worker_threads` pool so it never stalls the worker's progress reporting.
- [x] Registry seeding — batch-embed all indicator names and confirmed aliases.
- [x] **Stage 6d** — cosine nearest-neighbour, top 3, bands from `resolver_config`.
- [x] Alias confirmations append to `alias_embeddings`, widening each indicator's observed vocabulary.
- [x] Calibration harness (engine §7.4): positives from confirmed pairs plus hard negatives from the 5 nearest non-matching indicators; sweep thresholds; auto-accept at the highest score achieving ≥99% precision, review floor at ~90% recall; results written to `resolver_config` with date and metrics.
- [x] Bands read at worker startup — changing them is a config update, not a deploy.
- [x] Off-server fine-tuning documented (engine §7.5) as an optimisation, explicitly **not** a dependency.

**Exit gate**

- [x] `ANC Attendance` resolves to `antenatal care first visit` through 6d.
- [x] Calibration report committed showing precision and recall at the chosen bands.
- [x] With network access removed from the worker container, 6a–6d remain fully functional.

---

### Phase 9 — AI service layer

- [x] `AiModule` per Part E: OpenAI-compatible provider adapter, `AiService.invoke<T>`, versioned prompt registry, `ai_response_cache`, budget guard, circuit breaker, `ai_invocations` audit.
- [x] `ai-inference` queue at concurrency 1.
- [x] Task `indicator.classify` (engine §8's 6e residue stage).
- [x] Task `indicator.propose` — pre-fills the review UI's new-indicator path.
- [x] Task `orgunit.disambiguate`.
- [x] Task `sheet.interpret` — proposed parse for `UNKNOWN` species, always human-confirmed, never auto-applied.
- [x] Task `disaggregation.extract`.
- [x] Task `ingestion.narrate`.
- [x] **PII exclusion enforced in code**, with a unit test asserting survey-sheet content cannot reach a provider.
- [x] Offline path verified: unreachable provider skips the stage and routes to review.
- [x] Admin view of AI spend, cache hit rate, and per-task acceptance rate.

**Exit gate**

- Every AI decision is auditable end to end: task, prompt version, model, input hash, decision, confirming admin.
- No AI decision can reach `disease_burden` without human confirmation.
- With the provider unreachable, a full ingestion completes with the AI stages skipped.
- The PII exclusion test fails the build if a prompt builder is changed to include survey rows.

---

### Phase 10 — Analytics and GIS activation, shift detection, comparison

The phase where published data finally becomes visible.

- [x] Extend `AnalyticsService` to aggregate `disease_burden`: LGA burden, trends (annual and monthly), top-10 LGAs, KPI totals, z-score outliers — architecture §2 and §7.1 patterns 2 and 4. Exclude `value_status='missing'` from burden aggregations; include it in completeness. Removes the scope-correction comment at `analytics.service.ts:349-354`.
- [x] Persist to `analytics_cache` with the architecture §8 key patterns, and wire Redis TTLs.
- [x] GIS disease-burden endpoints (arch §5.4): bubble map from LGA centroids with incidence per 1,000, plus the simplified low-bandwidth variant.
- [x] Analytics endpoints (arch §5.5): KPIs, LGA burden, trends, top LGAs, outliers.
- [x] Cache invalidation rules from architecture §8, driven by publication `affected_keys`.
- [x] **Stage 8 succession** — nightly scan; candidates to review; confirmation writes `succeeds_indicator_id` and an `indicator_revisions` row.
- [x] **Stage 8 changepoint** — weekly PELT with RBF cost, reimplemented in TypeScript (engine §12.1), on the thread pool; a breakpoint shared by ≥60% of LGAs in a period is annotated as a reporting regime change. Primed by the 2013→2019 form seam.
- [x] `GET /analytics/compare?dataset_a&dataset_b` — pure SQL intersection over `disease_burden` returning coverage overlap, shared series, per-key conflicts, and resolution and completeness rates.
- [x] Cross-dataset relation matching (engine §12.2) — strong key overlap surfaces a "same study, different source" candidate through the same review queue; confirmed relations display as "Related datasets".
- [x] Corpus expansion pass with client-supplied historical files (engine §2).
- [x] KPI observability: auto-resolution rate per upload, review queue age p50/p95, conflicts per dataset, species distribution, AI calls and cache hit rate.

**Exit gate**

- Full pipeline for the 1.1 MB DHIS workbook completes in **under 3 minutes** on C4-equivalent resources.
- The dashboard renders a real disease-burden series sourced from an ingested, approved, published workbook.
- Retracting that dataset makes the series disappear with no stale cache keys.
- Auto-resolution rate is instrumented and visible against its trajectory: >60% first month, >90% by month three.

---

## Part H — Risk register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | BullMQ migration destabilises live email, SMS, or validation | Medium | High | Phase 0 task 1, 1:1 conversion, existing tests green before anything else starts. Nothing else in the sprint proceeds until its gate passes |
| R2 | Engine CPU work stalls API request latency | **Certain if not addressed** | High | Separate worker process (B2) is the structural fix; yield points and a thread pool are the second-order ones. Measured at the Phase 0 gate |
| R3 | An added dependency is ESM-only and breaks the CJS build | Medium | High | B8's `require()` smoke check mandatory before commit; vendor small algorithms rather than depend on them |
| R4 | Phantom ranges inflate staging ~34× and corrupt density heuristics | **Certain — measured** | High | Real-extent scan is a Phase 3 exit-gate item, not an optimisation |
| R5 | Title-row merges pollute every composed header | **Certain — measured** | Medium | Title-row suppressor in Phase 3, verified in Phase 4 |
| R6 | F4 period heads misassigned because they float inside blocks | **Certain — measured** | Medium | Containment-based attachment, Phase 4 |
| R7 | Ledger retrofitted after first production publish, leaving early datasets irreversible | Low | **Severe, irreversible** | Hard rule: no production approval before Phase 7's gate. Ledger tables created in Phase 0 |
| R8 | GIS refactor to PostGIS regresses live map features | Medium | High | Phase 1 exit gate requires equivalent output from every existing GIS endpoint |
| R9 | Two-file corpus hides species we will meet in production | **High** | Medium | Coverage register from Phase 3; `UNKNOWN` degrades to a human task, never to silent corruption; `sheet.interpret` (Phase 9) turns it into a reviewable proposal; corpus expansion in Phase 10 |
| R10 | PII from survey sheets reaches an AI provider or a log | Medium | **Severe — regulatory** | Code-enforced exclusion with a build-failing test (Phase 9); survey rows tagged at parse time in Phase 4 |
| R11 | Multi-state national files publish other states' data as Niger's | Medium | High | State-scope filter is a Phase 5 exit-gate item; out-of-scope rows counted and reported |
| R12 | Embedding model too heavy for the confirmed 2 vCore / 4 GB host | **High** | Medium | Per-service `mem_limit` and `--max-old-space-size` from Phase 0 (B10); concurrency 1; quantized ONNX. Phase 8 is gated on the 8 GB upgrade, requested with measured RSS from the Phase 0 gate as evidence. Phases 0–7 fit in 4 GB and the system is fully functional without 6d |
| R15 | Unbounded containers on a 4 GB host let one spike OOM-kill Postgres | **High** | **Severe** | `mem_limit` on every service in Phase 0, before the seventh container is added, not after (B10) |
| R16 | Anthropic API cost runs away, or the provider becomes a single point of failure for ingestion | Medium | Medium | Hard daily token ceiling that stops rather than warns; persistent cross-restart response cache; circuit breaker on failures and 429s; Stages 6a–6d stay local so ingestion completes with the provider unreachable (E.3) |
| R17 | Cross-border transfer of prompt content to a US provider without a recorded NDPA position | Medium | **Severe — regulatory** | Code-enforced PII exclusion (R10) plus a written NSPHCDA position on the transfer and on zero-retention terms, settled before Phase 9 ships |
| R18 | ~~The migration chain cannot run from an empty database~~ (pre-existing, found in Phase 0) | **Closed** | — | **Resolved in Phase 0 Stage B.** Six migrations re-stamped and made idempotent; full chain verified against an empty database, and the production re-run verified as a no-op. See A.6 |
| R13 | Analytics rewrite destabilises the live dashboard | Medium | Medium | Burden aggregations added alongside existing platform KPIs, not replacing them |
| R14 | Sprint scope is large enough to stall before the core lands | **High** | High | Phases 0–7 are the shippable core and are ordered so each one is independently useful. Phases 8–10 are explicitly droppable without breaking correctness |

---

## Part I — Open questions for the client

Not blockers for Phase 0, but each has a long lead time.

1. **National DHIS2 metadata access** (engine §7.2) — a read-only account on the national instance lets us import the authoritative data element dictionary and front-load Stage 6b before the first upload. Needs coordination through FACT/NSPHCDA.
2. **Corpus expansion** (engine §2) — IDSR weekly line lists, SORMAS exports, NHMIS-001 scans, MSDAT downloads, campaign tally sheets, legacy `.xls`, partner NGO CSVs. Every file received before Phase 4 is a handler built right the first time.
3. ~~**AI provider decision**~~ — **Resolved, August 2026: Anthropic hosted API, no self-hosting.** Reflected in Part E. Two follow-ups remain, neither blocking: a **monthly spend ceiling** to configure as the hard budget stop, and a written **NSPHCDA position on cross-border transfer**, including whether zero-retention API terms are required. Both needed before Phase 9 ships, not before it starts.
4. **Retention policy for retracted dataset files** — retraction deletes the stored object by default. Confirm this matches NSPHCDA records policy.

4b. ~~**How to repair the `AgencyStaff` migration ordering (A.6)**~~ — **Resolved.** The client confirmed the 2025 timestamps were an error and directed the correction. Re-stamped and made idempotent, so nothing is written to production's `migrations` table by hand. See A.6.
5. ~~**Production host sizing**~~ — **Resolved, August 2026: 2 vCore / 4 GB C4 at Host Africa, upgradable to 8 GB.** Reflected in B10. Follow-up: the **8 GB upgrade needs to be procurable within Phase 8's window**, since that is the phase it gates. Phases 0–7 are sized to fit in 4 GB, so this is a scheduling item rather than a dependency — worth confirming lead time with Host Africa now so it is not discovered late.

---

## Appendix — Traceability

Every source-document unit of work, mapped to a phase. Nothing is silently dropped; items marked out of scope are called out as such.

### Architecture v1.1

| § | Item | Phase |
|---|---|---|
| §2 | Worker as separate process | 0 |
| §2, §7.3 | GeoWorker | 1 |
| §2 | ETLWorker | Superseded by the Reader — 3–6 |
| §2, §8 | AnalyticsWorker burden aggregation | 10 |
| §4.1 | `lga_boundaries`, `ward_boundaries`, `health_facilities` | 1 |
| §4.1 | `road_network` | **Out of scope** |
| §4.6 | `disease_indicators`, `disease_burden`, `analytics_cache` | 2 |
| §4.6 | `population_estimates` | 1 |
| §4.7 | `campaigns` | **Out of scope** — Programmes module covers it |
| §4.8 | `ingestion_jobs` | 0 |
| §4.8 | `export_jobs`, ExportWorker | **Deferred** |
| §4.14 | `indicator_revisions` | 2 |
| §4.14 | `sop_register` | **Out of scope** |
| §5.3 | Upload job progress endpoints | 0 |
| §5.4 | GIS disease-burden endpoints | 10 |
| §5.5 | Analytics endpoints | 10 |
| §5.11 | Governance indicator CRUD | 2 |
| §6 | Queue topology, concurrency, DLQ, Bull Board, job events | 0 |
| §7.1 | Spatial query patterns 1–5 | 1 (1, 3, 5) and 10 (2, 4) |
| §8 | Cache keys and invalidation rules | 10 |
| §15 | Seed data loading order | 1 and 2 |

### Canonicalization Engine v1.1

| § | Item | Phase |
|---|---|---|
| §4.1 | Stage 1 sheet triage | 3 |
| §4.2 | Stage 2 structural detection | 3 (F1/F8), 4 (F2–F7) |
| §4.3 | Stage 3 unpivot | 3 |
| §4.4 | Stage 4 period grammar | 5 |
| §4.5 | Stage 5 org resolution | 5 |
| §4.6 6a–6c, 6f | Normalizer, alias, fuzzy, review queue | 6 |
| §4.6 6d | Embedding match | 8 |
| §4.6 6e | LLM residue | 9 |
| §4.7 | Stage 7 value semantics and validation | 3 (semantics), 7 (flags and conflicts) |
| §4.8 | Stage 8 succession and changepoint | 10 |
| §5 | Comparison endpoint | 10 |
| §6.1–6.6 | Staging, aliases, embeddings, conflicts, coverage register | 3–8 |
| §7 | Embedding setup, seeding, calibration, training | 8 |
| §8 | LLM adapter and controls | 9 — expanded per Part E |
| §9 | Governance endpoints | 6 |
| §10 | Golden fixtures, unit suites, acceptance criteria | 3–4 (fixtures), each phase gate thereafter |
| §11 | Implementation order | Superseded by Part G |
| §12.1 | NestJS runtime substitution | 0 |
| §12.2 | Cross-dataset relation matching | 10 |
| §12.3 | Org-unit resolution reuse | 1 and 5, via B4 |
| §12.4–12.7 | Corrections recorded in the spec | Reflected throughout |
| §13.1 | Approval gate | 7 |
| §13.2 | Mutation ledger and transactional publish | 7 (tables created in 0) |
| §13.3–13.6 | Retraction engine, cascade, report | 7 |

### New in this plan, in neither source document

| Item | Phase | Why |
|---|---|---|
| BullMQ migration | 0 | Both docs assume BullMQ; the code runs Bull v4 |
| Real-extent scan, title-row suppressor, F4 containment, state-scope filter | 3–5 | Measured corpus behaviours that would cause silent corruption |
| AI service layer beyond a single call | 9 | Engine §8 covers one task; a government deployment needs governance, audit, and PII enforcement |
| PII exclusion for survey sheets | 4 and 9 | Live personal data confirmed in the ingestion path |
| SSE progress stream | 0 | Both docs specify polling only; the sprint requires live frontend progress |
