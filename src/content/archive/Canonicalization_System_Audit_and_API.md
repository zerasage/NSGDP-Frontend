> **Historical document.** Written before the system was built. Parts of it no longer match the code. The current view is the documentation site at `/docs` (source: `nsgdp-frontend/`).

# Canonicalization Engine — System Audit & API Guide

**As of:** 2026-08-20  
**Codebase:** NSGDP-Backend  
**Specification:** `docs/Canonicalization_Engine_Implementation_Plan.md` + `docs/Data_Ingestion_Canonicalization_Engine_v1_1.md`  
**Verification:** `EMBEDDING_BACKEND=hash npm test` → **523 tests / 71 suites** passing; `npm run build` green.

---

## 1. Executive status

| Area | Status |
|------|--------|
| Phases 0–10 implementation checklist | **Done**, except one deferred exit-gate item |
| Unit / component tests for new surfaces | **Done** (523 suite-wide) |
| Live deployed-stack E2E (Phase 0) | **Not done** — explicitly deferred |
| Production go-live confidence | **Code-complete**; still needs deploy E2E + MiniLM bake validation on target host |

### Sole open plan checkbox

- [ ] **Phase 0 live-stack runtime verification** (deferred 2026-08-20): email, SMS, validation, nightly analytics on deployed containers; 60s progress via poll + SSE; peak RSS vs 4 GB budget.

### Soft operational gaps (implemented, but ops-sensitive)

| Item | Notes |
|------|--------|
| MiniLM on local Mac | Requires working `sharp` optionalDependency; falls back to `hashEmbed` if worker boot fails |
| Model cache not in git | `models/` is gitignored (~23 MB ONNX). Download once locally or bake at Docker build — see §6.5 and `docs/DEPLOYMENT.md` |
| Image bake | Dockerfile downloads MiniLM at **build** time (remote once), then `EMBEDDING_ALLOW_REMOTE=false` at runtime |
| Client corpus | Sample CSVs under `test/fixtures/ingestion/corpus/`; full FACT historical files still expected from client |
| Retract MFA | Body `mfaCode` (TOTP); SMS MFA path cannot satisfy retract today |
| `EXPORT` queue | Declared in topology but **not registered** yet |

---

## 2. Phase-by-phase audit (plan Part G)

| Phase | Title | Checklist | Exit-gate notes |
|-------|--------|-----------|-----------------|
| **0** | Queue & worker platform | All `[x]` except live E2E | BullMQ, dead-letter, API/worker split, progress SSE |
| **1** | Gazetteer / GeoWorker | Complete | PostGIS LGA/ward/facility + rebuild admin |
| **2** | Indicator registry & warehouse | Complete | Dictionary seed, governance CRUD |
| **3** | Reader Stages 1–3 (F1, F8) | Complete | Workbook fixtures + golden tuples |
| **4** | Handlers F2–F7 | Complete | Survey → PII store; F6/F7 archived |
| **5** | Period + org-unit ladder | Complete | ≥60 period cases; gazetteer fuzzy |
| **6** | Indicator 6a–6c + review | Complete | Resolution queue, training pairs |
| **7** | Validation, publish, retract | Complete | Ledger, §13.6 unit coverage, reporting-rate, S3 delete, 90d prune |
| **8** | Embeddings + calibration | Complete | MiniLM pool, calibration report, fine-tune doc |
| **9** | AI service layer | Complete | 6 tasks, PII gate, budget, circuit, audit |
| **10** | Analytics, GIS, Stage 8 | Complete | Burden APIs, GIS bubbles, succession/changepoint, observability |

### What “done” means in code (high level)

```
Upload → ClamAV → upload-processing (Reader Stages 1–7)
       → staging_observations + review queue
       → admin approve → POST publish → dataset-publish queue
       → disease_burden + ledger → analytics/GIS cache
       → optional retract (MFA) → reverse ledger + invalidate caches
```

Background schedulers (worker must be running):

| Cron | Job |
|------|-----|
| `0 2 * * *` | Nightly analytics aggregate |
| `0 3 * * *` | Stage 8 succession scan |
| `0 4 * * 0` | Weekly PELT changepoint |
| `0 5 * * *` | Prune retracted publications >90 days |
| `0 6 1 */3 *` | Quarterly embedding calibration |

---

## 3. Specification additions delivered (vs original engine)

| Spec theme | Delivered in this codebase |
|------------|----------------------------|
| Mutation ledger + retract (§13) | `dataset_publications`, `ingestion_mutations`, publish/retract processors |
| Completeness indicators | Reporting-rate → `COMPLETENESS` flag + `category=completeness` |
| Offline embeddings (§7) | `@xenova/transformers` MiniLM, baked in Docker; hash fallback |
| Calibration (§7.4) | `POST …/calibration/run` + `docs/calibration-report.json` |
| Optional fine-tune (§7.5) | `docs/embedding-fine-tuning.md` (not a deploy dependency) |
| AI residue 6e (§8) | `AiModule` + `indicator.classify` (pending until human confirm) |
| PII exclusion | Survey content blocked before provider; unit test |
| Stage 8 shift detection | Succession + PELT RBF + dataset relations |
| Analytics on `disease_burden` | KPIs, LGA burden, trends, outliers, compare |
| GIS burden map | `/gis/disease-burden` + `/simplified` |
| Observability KPIs | `/governance/ingestion/observability` |

---

## 4. Global API conventions

| Item | Value |
|------|--------|
| Base URL (local) | `http://localhost:3001/api/v1` |
| Auth header | `Authorization: Bearer <JWT>` |
| Admin JWT | From `POST /api/v1/admin/auth/login` (`JWT_ADMIN_SECRET`) |
| User JWT | From `POST /api/v1/auth/login` (`JWT_ACCESS_SECRET`) |
| Success envelope | `{ "success": true, "statusCode": 200, "timestamp": "…", "path": "…", "data": <payload> }` |
| Errors | Nest HTTP exceptions; typically `{ statusCode, message, error }` (not always enveloped) |
| Swagger | `/api/docs` when enabled (`SWAGGER_ENABLED` / non-prod) |
| SSE note | Use `fetch` + `ReadableStream`; browser `EventSource` cannot send Bearer |

### Permission keys (canonicalization surface)

| Key | Used for |
|-----|----------|
| `manage:indicators` | Governance, review, AI admin |
| `manage:gis-reference-data` | Gazetteer / GIS slots |
| `manage:analytics` | Force analytics refresh |
| `publish:datasets` | Publish / retract / unpublish |
| `approve:datasets` | Approval workflow (adjacent) |

Queues health/DLQ: **super_admin role only** (no permission key).

---

## 5. Route catalogue with examples

Unless noted, responses show the **`data`** field of the success envelope.

### 5.1 Auth (prerequisites)

**Admin login**

```http
POST /api/v1/admin/auth/login
Content-Type: application/json

{ "email": "admin@example.com", "password": "…" }
```

```json
{
  "accessToken": "<admin-jwt>",
  "refreshToken": "…",
  "requiresMfa": false
}
```

If MFA is required, complete `POST /api/v1/admin/auth/verify-mfa` before calling retract.

---

### 5.2 Upload & progress

**Upload dataset file**

```http
POST /api/v1/uploads
Authorization: Bearer <user-or-admin-jwt>
Content-Type: multipart/form-data

file=<workbook.xlsx>
datasetId=<uuid>
```

```json
{
  "jobId": "bull-job-id",
  "fileName": "dhis.xlsx",
  "fileSize": 1100000,
  "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "status": "queued",
  "message": "Upload accepted",
  "uploadedAt": "2026-08-20T18:00:00.000Z"
}
```

**Upload / ingestion job status**

```http
GET /api/v1/uploads/{jobId}
Authorization: Bearer <jwt>
```

**Dataset ingestion progress (poll)**

```http
GET /api/v1/datasets/{datasetId}/ingestion
Authorization: Bearer <jwt>
```

```json
{
  "jobId": "…",
  "datasetId": "…",
  "status": "processing",
  "progress": 42,
  "currentStage": "INDICATOR_RESOLVE",
  "steps": [{ "stage": "TRIAGE", "status": "done", "progress": 100 }],
  "errorMessage": null,
  "startedAt": "…",
  "completedAt": null
}
```

**SSE stream**

```http
GET /api/v1/datasets/{datasetId}/ingestion/stream
Authorization: Bearer <jwt>
Accept: text/event-stream
```

---

### 5.3 Indicator governance

```http
GET /api/v1/admin/governance/indicators
Authorization: Bearer <admin-jwt>
```

```http
POST /api/v1/admin/governance/indicators
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "name": "antenatal care first visit",
  "category": "maternal",
  "unit": "count",
  "isActive": true
}
```

```http
PATCH /api/v1/admin/governance/indicators/{id}
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{ "unit": "percent", "isActive": true }
```

```http
DELETE /api/v1/admin/governance/indicators/{id}
Authorization: Bearer <admin-jwt>
```

```http
GET /api/v1/admin/governance/indicators/{id}/revisions
Authorization: Bearer <admin-jwt>
```

Requires: `super_admin`/`admin` **or** permission `manage:indicators`.

---

### 5.4 Ingestion review & Stage 8 tools

**Review queue**

```http
GET /api/v1/admin/governance/ingestion/review-queue?datasetId={uuid}&limit=50
Authorization: Bearer <admin-jwt>
```

```json
[
  {
    "id": "alias-uuid",
    "kind": "indicator",
    "rawText": "ANC Attendence",
    "normalized": "antenatal care attendance",
    "sheetName": "ANC",
    "cellRef": "E12",
    "datasetId": "…",
    "candidates": [
      { "indicatorId": "…", "name": "antenatal care first visit", "score": 0.91, "method": "fuzzy" }
    ],
    "method": "fuzzy",
    "confidence": "0.910",
    "indicatorId": null
  }
]
```

**Confirm / reject alias**

```http
POST /api/v1/admin/governance/ingestion/aliases/{aliasId}/confirm
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{ "indicatorId": "indicator-uuid" }
```

```json
{ "promoted": 128 }
```

```http
POST /api/v1/admin/governance/ingestion/aliases/{aliasId}/reject
Authorization: Bearer <admin-jwt>
```

**Activate new indicator (gate)**

```http
POST /api/v1/admin/governance/ingestion/indicators/{id}/activate
Authorization: Bearer <admin-jwt>
```

**Report & coverage**

```http
GET /api/v1/admin/governance/ingestion/datasets/{datasetId}/report
GET /api/v1/admin/governance/ingestion/datasets/{datasetId}/coverage
GET /api/v1/admin/governance/ingestion/datasets/{datasetId}/related
Authorization: Bearer <admin-jwt>
```

**Manual Stage 8 / calibration (super_admin + manage:indicators)**

```http
POST /api/v1/admin/governance/ingestion/shift-detection/run
POST /api/v1/admin/governance/ingestion/changepoints/run
POST /api/v1/admin/governance/ingestion/relations/match
POST /api/v1/admin/governance/ingestion/calibration/run
POST /api/v1/admin/governance/ingestion/succession/{candidateId}/confirm
POST /api/v1/admin/governance/ingestion/relations/{id}/confirm
Authorization: Bearer <admin-jwt>
```

**Observability**

```http
GET /api/v1/admin/governance/ingestion/observability
Authorization: Bearer <admin-jwt>
```

```json
{
  "autoResolutionRate": 0.72,
  "stagingTotal": 14000,
  "indicatorPending": 380,
  "reviewQueueAge": { "p50Seconds": 120, "p95Seconds": 3600, "pendingAliases": 42 },
  "conflictsPerDataset": [{ "dataset_id": "…", "conflicts": 3 }],
  "speciesDistribution": [{ "species": "F1", "sheets": 12 }],
  "ai": { "calls30d": 40, "cacheHitRate": 0.35, "spendUsd30d": 1.2 },
  "targets": { "month1AutoResolution": 0.6, "month3AutoResolution": 0.9 }
}
```

**AI assist (never auto-publishes)**

```http
POST /api/v1/admin/governance/ingestion/datasets/{datasetId}/narrate
Authorization: Bearer <admin-jwt>
```

```http
POST /api/v1/admin/governance/ingestion/sheets/interpret
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "datasetId": "…",
  "sheetName": "UnknownSheet",
  "headers": [["LGA", "Indicator", "2023"]],
  "mergeMap": {},
  "realExtent": { "rows": 40, "cols": 12 },
  "containsPii": false
}
```

---

### 5.5 Publish & retract

**Publish (async enqueue)** — uses **slug**

```http
POST /api/v1/admin/datasets/{slug}/publish
Authorization: Bearer <admin-jwt>
```

Requires `publish:datasets`. Warehouse write runs on `dataset-publish` queue.

**Retract (async, MFA)** — uses **dataset UUID**

```http
POST /api/v1/admin/datasets/{datasetId}/retract
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "reason": "Incorrect source workbook uploaded",
  "mfaCode": "123456",
  "forgetAliases": false,
  "purgeStaging": false
}
```

```json
{ "publicationId": "publication-uuid" }
```

| Flag | Effect |
|------|--------|
| `forgetAliases` | Deletes aliases first seen on this dataset (poisoned-source) |
| `purgeStaging` | Deletes staging rows (default: keep) |
| *(always)* | Deletes objects from dataset storage bucket |

**Unpublish** (catalogue only — not ledger reverse)

```http
POST /api/v1/admin/datasets/{slug}/unpublish
Authorization: Bearer <admin-jwt>
```

---

### 5.6 Disease-burden analytics (public)

```http
GET /api/v1/analytics/indicators
```

Returns active `disease_indicators` (`id`, `slug`, `name`, `category`, `unit`) for public picker UIs.

```http
GET /api/v1/analytics/kpis?indicator=antenatal-care-first-visit&year=2024
```

```json
{
  "indicator": "antenatal-care-first-visit",
  "year": 2024,
  "totalCases": 15230,
  "lgasReporting": 22,
  "completeness": 0.91,
  "found": true
}
```

```http
GET /api/v1/analytics/lga-burden?indicator=antenatal-care-first-visit&year=2024
GET /api/v1/analytics/trends?indicator=antenatal-care-first-visit&granularity=annual
GET /api/v1/analytics/top-lgas?indicator=antenatal-care-first-visit&year=2024
GET /api/v1/analytics/outliers?indicator=antenatal-care-first-visit&year=2024
GET /api/v1/analytics/compare?dataset_a={uuid}&dataset_b={uuid}
GET /api/v1/analytics/data-sources
GET /api/v1/analytics/ward-burden?indicator=antenatal-care-first-visit&year=2024&lga=Bosso&organisationId={uuid}&limit=20
GET /api/v1/analytics/lga-trend?indicator=antenatal-care-first-visit&lga=Bosso
GET /api/v1/analytics/dashboard
GET /api/v1/analytics/export
```

`GET /analytics/data-sources` — orgs with ≥1 published dataset that contributed `disease_burden` rows (`id`, `slug`, `name`).

`GET /analytics/ward-burden` — ward-level aggregation for indicator + LGA; optional `organisationId` scopes via `source_dataset_id → datasets.organisation_id`.

`GET /analytics/lga-trend` — `[{ year, total }]` annual series for one LGA (map popup sparklines).

```http
POST /api/v1/analytics/refresh
Authorization: Bearer <admin-jwt>
```

Requires `manage:analytics` (super_admin path).

---

### 5.7 GIS disease-burden (public)

```http
GET /api/v1/gis/disease-burden?indicator=antenatal-care-first-visit&year=2024
```

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [6.55, 9.58] },
      "properties": {
        "lgaName": "Chanchaga",
        "lgaCode": "NG…",
        "totalCases": 412,
        "incidencePer1000": 3.2
      }
    }
  ]
}
```

```http
GET /api/v1/gis/disease-burden/simplified?indicator=antenatal-care-first-visit&year=2024
```

Also public: `/gis/lga-summary`, `/gis/ward-summary`, `/gis/facilities`, `/gis/state-boundary`, `/gis/settlements`.

---

### 5.8 GIS reference / gazetteer (admin)

```http
GET  /api/v1/admin/gis-reference-layers
PUT  /api/v1/admin/gis-reference-layers/{slot}
POST /api/v1/admin/gis-reference-layers/rebuild
POST /api/v1/admin/gis-reference-layers/gazetteer-rebuild
GET  /api/v1/admin/gis-reference-layers/{slot}/resolution-report
POST /api/v1/admin/gis-reference-layers/wards/{wardCode}/variants
```

Slots: `lga_boundaries` | `ward_boundaries` | `facility_registry` | `population` | `settlements`.  
Requires `manage:gis-reference-data`.

---

### 5.9 Queues & AI spend

```http
GET    /api/v1/admin/queues/health
GET    /api/v1/admin/queues/dead-letter?limit=50
POST   /api/v1/admin/queues/dead-letter/{id}/retry
DELETE /api/v1/admin/queues/dead-letter/{id}
```

Super_admin only.

```http
GET  /api/v1/admin/ai/spend?days=7
POST /api/v1/admin/ai/invocations/{id}/confirm
Authorization: Bearer <admin-jwt>
```

```json
{
  "budget": { "tokensUsed": 12000, "costUsd": 0.4, "tokenCeiling": 500000 },
  "circuit": { "open": false, "failures": 0 },
  "periodDays": 7,
  "totalCostUsd": 0.4,
  "totalTokens": 12000,
  "cacheHitRate": 0.25,
  "byTask": [
    { "task": "indicator.classify", "calls": 10, "cacheHits": 2, "skipped": 1, "costUsd": 0.2, "acceptanceRate": 0.5 }
  ]
}
```

---

## 6. How-to: local setup

### 6.1 Prerequisites

- Node 20+ (22 preferred for AWS SDK longevity)
- Docker for Postgres/PostGIS, Redis, ClamAV (`docker-compose.yml`)
- Copy `.env.example` → `.env`

### 6.2 Boot sequence

```bash
# 1. Infra
docker compose up -d

# 2. Install (ensure sharp native build runs on macOS)
npm ci
# if MiniLM warns about sharp:
npm install sharp --foreground-scripts

# 3. Schema + seeds
npm run migration:run
npm run seed:gazetteer
npm run seed:dictionary

# 4. MiniLM model cache (one-time — see §6.5). Skip if using EMBEDDING_BACKEND=hash.
#    models/ is gitignored; do not commit it.

# 5. Two processes
npm run start:dev          # API  — ROLE=api
npm run start:worker       # Worker — ROLE=worker
```

### 6.3 Important env knobs

| Variable | Local tip |
|----------|-----------|
| `REDIS_HOST` / `REDIS_PORT` | `localhost` / `6380` |
| `DATABASE_PORT` | `5434` (compose mapping) |
| `ANTHROPIC_API_KEY` | Leave unset for offline AI (stages skip) |
| `EMBEDDING_BACKEND` | `hash` for fast local/tests; `minilm` after §6.5 cache exists |
| `EMBEDDING_MODEL` | `Xenova/all-MiniLM-L6-v2` (default) |
| `TRANSFORMERS_CACHE` | `./models` (must exist when backend is `minilm`) |
| `EMBEDDING_ALLOW_REMOTE` | `true` **only** during the one-time download; then `false` |
| `CLAMAV_ENABLED` | `true` when ClamAV container is up |

### 6.4 Production roles

Same image, different `ROLE`:

| Process | `ROLE` | Listens HTTP? | Consumes queues? |
|---------|--------|---------------|------------------|
| API | `api` | yes | no |
| Worker | `worker` | no | yes |

Docker image bakes MiniLM under `/app/models` at **image build** and sets
`EMBEDDING_ALLOW_REMOTE=false` at runtime. Full ops steps:
`docs/DEPLOYMENT.md` → *MiniLM Embedding Model*.

### 6.5 MiniLM model setup (local)

`models/` is **not** in the repository. Without a local cache, set
`EMBEDDING_BACKEND=hash` or the worker falls back to hash embeddings when MiniLM
fails to boot.

**One-time download** (needs npm deps installed + outbound HTTPS):

```bash
mkdir -p models
TRANSFORMERS_CACHE="$(pwd)/models" node --input-type=module -e '
import { pipeline, env } from "@xenova/transformers";
env.allowRemoteModels = true;
env.cacheDir = process.env.TRANSFORMERS_CACHE;
await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { quantized: true });
console.log("MiniLM cached under", process.env.TRANSFORMERS_CACHE);
'
```

**Confirm layout:**

```bash
ls -la models/Xenova/all-MiniLM-L6-v2/onnx/model_quantized.onnx
# ~22–23 MB
```

**Enable MiniLM in `.env`:**

```bash
EMBEDDING_BACKEND=minilm
EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
TRANSFORMERS_CACHE=./models
EMBEDDING_ALLOW_REMOTE=false
```

Restart the worker and look for `MiniLM embedding pool ready`. If you see
`sharp` / worker boot errors, reinstall sharp (`npm install sharp --foreground-scripts`)
and retry.

**Tests** (no model required):

```bash
EMBEDDING_BACKEND=hash npm test
```

**Production bake** (no local `models/` needed on the host):

```bash
docker compose -f docker-compose.prod.yml build backend
# build log must include: MiniLM baked
```

---

## 7. How-to: end-to-end testing (manual)

### 7.1 Happy path — ingest → review → publish → analytics

1. Create/approve a dataset in admin (existing dataset APIs).
2. Upload NHMIS/DHIS fixture:

   ```bash
   curl -s -X POST "$API/uploads" \
     -H "Authorization: Bearer $USER_JWT" \
     -F "file=@test/fixtures/ingestion/dhis-routine-bhcpf.xlsx" \
     -F "datasetId=$DATASET_ID"
   ```

3. Poll until ingestion completes:

   ```bash
   curl -s -H "Authorization: Bearer $USER_JWT" \
     "$API/datasets/$DATASET_ID/ingestion" | jq '.data.status'
   ```

4. Review pending aliases:

   ```bash
   curl -s -H "Authorization: Bearer $ADMIN_JWT" \
     "$API/admin/governance/ingestion/review-queue?datasetId=$DATASET_ID" | jq
   ```

5. Confirm aliases / activate indicators as needed.
6. Publish:

   ```bash
   curl -s -X POST -H "Authorization: Bearer $ADMIN_JWT" \
     "$API/admin/datasets/$SLUG/publish"
   ```

7. Wait for worker; then:

   ```bash
   curl -s "$API/analytics/kpis?indicator=antenatal-care-first-visit&year=2024" | jq
   curl -s "$API/gis/disease-burden?indicator=antenatal-care-first-visit&year=2024" | jq '.features|length'
   ```

### 7.2 Retract path

```bash
curl -s -X POST "$API/admin/datasets/$DATASET_UUID/retract" \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Wrong file version","mfaCode":"123456"}'
```

Confirm KPIs/GIS no longer show that series (cache invalidated via `affected_keys`).

### 7.3 Offline AI

Unset `ANTHROPIC_API_KEY`, re-ingest: pipeline must complete; AI stages skipped; check observability / `ai_invocations.skipped_reason`.

### 7.4 Automated tests

```bash
EMBEDDING_BACKEND=hash npm test
npm run test:integration   # if DB/Redis available
npm run test:e2e
```

Key suites for canonicalization:

- `src/modules/ingestion/reader/*.spec.ts`
- `src/modules/ingestion/resolver/*.spec.ts`
- `src/modules/ingestion/services/dataset-publish.service.spec.ts` (§13.6)
- `src/modules/ai/pii-exclusion.spec.ts`, `ai.service.spec.ts`
- `src/modules/analytics/disease-burden-analytics.service.spec.ts`
- `src/modules/gis/gis-disease-burden.service.spec.ts`

### 7.5 Queue health

```bash
curl -s -H "Authorization: Bearer $ADMIN_JWT" \
  "$API/admin/queues/health" | jq
```

Expect registered queues including `upload-processing`, `resolution`, `dataset-publish`, `ai-inference`, `geo-extraction`, `dead-letter`.

---

## 8. Pipeline stage map (for debugging)

| Stage | What happens | Failure mode |
|-------|----------------|--------------|
| Validate (ClamAV) | Virus scan | Job fails / DLQ |
| Triage / Structure | Species F1–F8 / UNKNOWN | UNKNOWN → review / interpret |
| Unpivot | Staging rows + cell_ref | Held rows with reasons |
| Period | Stage 4 tokenizer | `PERIOD_UNRESOLVED` |
| Org unit | Gazetteer ladder | `ORG_PENDING` |
| Indicator 6a–6d | Alias / fuzzy / embed | `INDICATOR_PENDING` |
| Indicator 6e | LLM classify (optional) | Skip if offline; stays pending |
| Validate Stage 7 | RANGE / OUTLIER / SUM_MISMATCH / CONFLICT | Flags only — never deletes |
| Publish | Ledger + `disease_burden` | Publication `failed`; retractable |
| Retract | Reverse seq DESC | Resumable; files deleted |

---

## 9. Related documents

| Doc | Purpose |
|-----|---------|
| `docs/Canonicalization_Engine_Implementation_Plan.md` | Phase checklist (source of truth for done/not done) |
| `docs/Data_Ingestion_Canonicalization_Engine_v1_1.md` | Engine specification |
| `docs/DEPLOYMENT.md` | Compose / ROLE / production ops |
| `docs/calibration-report.json` | Embedding band baseline |
| `docs/embedding-fine-tuning.md` | Optional off-server fine-tune |
| `docs/nhmis_dictionary.json` | Seed vocabulary |
| Swagger `/api/docs` | Interactive exploration when enabled |

---

## 10. Recommended next actions (ops, not code)

1. Run **Phase 0 live-stack E2E** on deployed compose (only remaining plan checkbox).
2. Build production image once and confirm log line `MiniLM baked` / runtime `MiniLM embedding pool ready` (see `docs/DEPLOYMENT.md` → *MiniLM Embedding Model*). Locally, run the §6.5 one-time download before setting `EMBEDDING_BACKEND=minilm`.
3. Seed gazetteer + dictionary on the target DB; rebuild gazetteer after GIS slot swaps.
4. Walk one real workbook through publish → analytics → retract with MFA before opening the approval gate to operators.
