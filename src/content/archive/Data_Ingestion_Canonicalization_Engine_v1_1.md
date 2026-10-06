> **Historical document.** Written before the system was built. Parts of it no longer match the code. The current view is the documentation site at `/docs` (source: `nsgdp-frontend/`).

# Niger State GeoHealth Portal — Data Ingestion & Canonicalization Engine

| Field | Detail |
|---|---|
| **Product** | Niger State GeoHealth Data Portal |
| **Document Type** | Ingestion Engine Specification (Addendum to Backend Architecture v1.1) |
| **Version** | 1.1 |
| **Date** | August 2026 |
| **Prepared by** | Zerasage Technologies — Engineering |
| **Audience** | Backend Engineer, CTO, DevOps |
| **Status** | Ready for implementation. v1.1 adds Section 13 (approval gate and rollback engine) and amends Sections 3.3 and 11 accordingly. |
| **Supersedes** | ETLWorker Excel/CSV handling as described in Backend Architecture v1.1, Part 2. All other v1.1 components remain in force. |
| **Companion file** | `nhmis_dictionary.json` (seed vocabulary, ships with this document) |
| **Build authority** | `Canonicalization_Engine_Implementation_Plan.md`. This document is the design authority — what the engine does and why. The plan is the build authority — phase order, file layout, and exit gates. Where the two conflict on infrastructure, the plan wins; every such conflict is recorded in Section 12 below. |

---

## 1. Scope and Relationship to v1.1

This document replaces the tabular ingestion logic of the ETLWorker with a dedicated Python worker called the **Reader**. The Reader consumes the same `upload-processing` queue defined in v1.1, writes to the same PostgreSQL database, and publishes to the same `disease_burden` and `disease_indicators` tables. The Fastify API, GeoWorker, AnalyticsWorker, NotifyWorker, MinIO layout, and all Part 4 tables of v1.1 are unchanged except for the schema additions in Section 6 of this document.

The Reader exists because real NSPHCDA workbooks do not have predictable headers, consistent indicator names, or single-table sheets. The design principle throughout is **resolve once, replay forever**: every raw string encountered is recorded, mapped to a canonical entity through an escalation ladder, and from then on resolved by lookup. The system's accuracy and cost profile improve with every upload and every admin confirmation.

---

## 2. Known Format Inventory and Coverage Register

Analysis of the sample corpus (DHIS routine/BHCPF workbook, AFP surveillance workbook) identified the following table species. Each has a named handler in the Reader.

| Code | Species | Signature | Handler |
|---|---|---|---|
| F1 | Wide pivot, single header row, indicator and year fused in one string | Header cells match `<text> <year>` | `WideFusedHandler` |
| F2 | Two-row header, merged indicator group over year columns | Merged ranges in row 0, year tokens in row 1 | `GroupedYearHandler` |
| F3 | Nested multi-row header, year spanning quarters | 3-4 header rows, `Q1-Q4` tokens under year tokens | `NestedPeriodHandler` |
| F4 | Repeating column blocks per period | Same column-name sequence repeats N times, period token announces each block | `RepeatingBlockHandler` |
| F5 | Kobo/ODK survey export | `start`, `end`, `_uuid`, `_submission_time` columns present | `SurveyHandler` (routes to survey store, not indicator pipeline) |
| F6 | Excel pivot output | `Row Labels` cell in first 5 rows | Skip, archive as derived |
| F7 | Lookup/validation sheet | Short text lists, no numeric density, or sheet named `dropdown` | Skip, archive as metadata |
| F8 | Flat long-format table | One header row, one row per (org, period) or per record | `FlatHandler` |

Because the sample corpus is two files, the Reader must assume this inventory is incomplete. A `format_coverage_register` table (Section 6.6) records every sheet processed, its detected species, handler used, and resolution rate. Sheets that fail structural detection are stored with species `UNKNOWN`, held in staging, and surfaced to the review queue rather than parsed on guesswork. Unknown formats therefore degrade to a human task, never to silent corruption. When an unknown species recurs, it becomes a candidate for a new handler, and the register is the evidence trail that justifies building it.

Formats considered likely in the wider NSPHCDA environment but absent from the sample corpus, to be requested from the client for corpus expansion before go-live: IDSR weekly surveillance line lists and SORMAS exports, scanned or born-digital PDF paper summary forms (NHMIS-001 family), NDHS and MICS survey extracts, MSDAT portal downloads, immunization campaign tally sheets and LQAS workbooks, cold chain inventories, HRH staffing lists, legacy `.xls` files, CSV exports from partner NGOs, and multi-state national workbooks where Niger is one block among 36 states.

---

## 3. Runtime Architecture

### 3.1 Process layout

```
┌────────────────────────────────────────────────────────────────────┐
│                    HostAfrica C4 (2 vCore / 4GB)                   │
│                                                                    │
│  nginx ── fastify-api (Node 22) ── postgres16+postgis+pgvector     │
│                 │                        ▲                         │
│                 ▼                        │                         │
│              redis7 ◄── bullmq queues ───┤                         │
│                 ▲                        │                         │
│                 │                        │                         │
│        reader-worker (Python 3.12) ──────┘                         │
│        · consumes: upload-processing                                │
│        · emits:    analytics-compute, notification-dispatch         │
│        · embeds:   fastembed ONNX MiniLM (CPU)                      │
└────────────────────────────────────────────────────────────────────┘
```

The Reader is one additional Docker container. It uses the official `bullmq` Python package (PyPI) so the Fastify API keeps enqueuing jobs exactly as in v1.1 with no protocol shim. Job payload contract is unchanged: `{ dataset_id, object_key, uploader_id, declared_type }`.

### 3.2 Container definition

```dockerfile
FROM python:3.12-slim
RUN pip install --no-cache-dir \
    bullmq redis psycopg[binary] openpyxl pandas python-calamine \
    rapidfuzz jellyfish fastembed pgvector ruptures pydantic \
    xlrd minio httpx tenacity
COPY reader/ /app/reader/
COPY models/ /app/models/          # ONNX embedding model, baked into image
WORKDIR /app
CMD ["python", "-m", "reader.worker"]
```

Baking the embedding model into the image is deliberate: the container never needs internet access at runtime, which is the offline guarantee for Niger State connectivity. Memory budget on the C4: Postgres ~1.2GB, Redis ~150MB, Fastify ~300MB, Reader ~500MB peak during embedding (MiniLM ONNX resident set is ~250MB), nginx ~30MB. Headroom remains under load; the Reader processes one file at a time (`concurrency: 1`).

### 3.3 Reader job lifecycle

```
upload-processing job (runs immediately on upload)
  → download object from MinIO
  → Stage 1  sheet triage
  → Stage 2  structural detection per sheet
  → Stage 3  unpivot to staging_observations
  → Stage 4  period parsing
  → Stage 5  org unit resolution
  → Stage 6  indicator resolution ladder
  → Stage 7  value semantics + validation
  → write ingestion report, review queue notified
  → dataset enters status 'processed_pending_approval'

dataset-publish job (runs ONLY on admin approval, Section 13)
  → Stage 8  publish resolved rows to disease_burden inside the
             mutation ledger transaction (Section 13.2)
  → Stage 9  enqueue analytics-compute
  → pending rows remain in staging awaiting alias confirmation
```

Stages 1-7 run on upload so the admin reviews the file with full information: the ingestion report, resolution rates, flags, and preview are available before any approval decision. Nothing touches `disease_burden`, `disease_indicators` activation, or analytics until approval. A job never fails because of unresolved strings. It fails only on I/O errors or corrupt files. Partial resolution is the normal, expected outcome for a first-seen template and shrinks to near zero on repeat templates.

---

## 4. Pipeline Stages: Algorithms

### 4.1 Stage 1 — Sheet triage

Evaluate rules in order, first match wins:

1. Sheet name in `{dropdown, lookup, ref, metadata}` (case-insensitive) → F7
2. Any cell in rows 0-4 equals `Row Labels` → F6
3. Columns include ≥2 of `{start, end, _uuid, _submission_time, deviceid}` → F5
4. Fewer than 10 non-empty rows and numeric density < 0.05 → F7
5. Otherwise → candidate data table, continue to Stage 2

Numeric density = numeric cells ÷ non-empty cells over the sampled region (first 200 rows).

### 4.2 Stage 2 — Structural detection

Read with openpyxl (`read_only=False` for sheets under 5MB so `merged_cells.ranges` is available; for larger sheets, fall back to a two-pass read: calamine for values, openpyxl read-only for a merged-range probe of the first 15 rows only).

**Header block detection.** For each of the first 12 rows compute `text_ratio(r)` = share of non-empty cells that fail numeric parsing. The header block is rows `0..k` where `k` is the last row before the first row with `text_ratio < 0.4` that is followed by ≥3 consecutive rows also below 0.4. This three-row confirmation prevents a text-heavy data row (facility names) from terminating the header early; the spine column is excluded from the ratio.

**Merged-range expansion.** For every merged range intersecting the header block, copy the anchor value into all covered cells. This turns the HIV_AIDS species (F2) and the quarterly species (F3) into dense header matrices.

**Vertical forward fill.** Within the header block, fill blank header cells downward from the row above, then compose each column's full header as the ` | `-joined non-duplicate sequence of its header-block cells, top to bottom. Example outputs:

```
F2: "ART Monthly_08_PLHIV who RESTARTED ART during the month Female | 2023"
F3: "QUARTER | 2020 | Q2"
F4: "Q1 2020 | Died"
```

**Spine detection.** For each of the first 4 columns, fuzzy-match its first 30 non-empty body values against the org unit gazetteer (Section 5.1). The column with the highest mean match score above 0.75 is the spine. Columns left of the spine are discarded. If no column qualifies, mark the sheet species `UNKNOWN` and stop.

**Species assignment.** With composed headers in hand: year token in every non-spine header with no sub-period token → F1; distinct indicator strings each paired with a year token from a lower header row → F2; quarter or month tokens present under year tokens → F3; a repeating subsequence of identical header tails under distinct period heads → F4 (detect by finding the smallest period P such that `tail[i] == tail[i+P]` for ≥80% of columns); single header row, periods absent from headers → F8.

### 4.3 Stage 3 — Unpivot

Every handler emits the same record shape into `staging_observations`:

```
(dataset_id, sheet_name, cell_ref, raw_orgunit, raw_indicator, raw_period, raw_value)
```

`cell_ref` (e.g. `HIV_AIDS!D7`) is mandatory. It is the provenance anchor that lets any published number be traced to the exact source cell when challenged.

### 4.4 Stage 4 — Period grammar

Deterministic tokenizer over the composed header string plus sheet-level context. Token classes and precedence:

1. ISO timestamps (Kobo) → full date
2. `Q[1-4]` with the nearest year token to its left or above → quarterly
3. Month names and 3-letter abbreviations with nearest year → monthly
4. Range tokens `Jan-Jun 2026`, `Jul – Dec 2025` → stored as the covering half-year with `period_type='range'` and explicit `period_start`/`period_end`
5. `Year 2022`, bare `2022`/`2022.0` within 1990-2100 → annual
6. No period token anywhere in header → inherit from the dataset's declared reporting period; if the dataset declares none, hold in staging with reason `PERIOD_UNRESOLVED`

Numeric year cells arriving as floats (`2023.0`) are normalized before matching. The grammar is a pure function with a golden-file test suite (Section 10).

### 4.5 Stage 5 — Org unit resolution

Escalation order, stop at first hit:

1. Exact lookup in `orgunit_aliases`
2. Decoration stripping: known DHIS2 hierarchy affixes (`^ni\s+` prefix, `\s+a$` suffix), `LGA`, `Local Government( Area)?`, `State`, double spaces, then retry exact lookup
3. RapidFuzz `token_set_ratio` + Jaro-Winkler against the gazetteer for the expected admin level; accept ≥0.95, review 0.85-0.95, escalate below
4. Metaphone phonetic match (jellyfish) for facility names, constrained to facilities within the already-resolved LGA and ward context, which shrinks the candidate set from 2,191 to under ~100 and makes phonetic matching safe
5. Residual → review queue with top 3 candidates attached

The gazetteer is built once from data already in PostGIS: 25 LGA names from `lga_boundaries`, ward names from `ward_boundaries`, facility names from `health_facilities` (NHFR/GRID3). Every confirmed resolution writes an `orgunit_aliases` row, so decorated variants like `ni Agaie a` cost fuzzy matching exactly once.

### 4.6 Stage 6 — Indicator resolution ladder

Applied to each distinct composed indicator string in the upload (deduplicate first; a 121-column sheet typically yields 20-30 distinct indicator strings after period stripping).

**6a Normalize.** Lowercase; NFC unicode; collapse whitespace; strip punctuation except `/` and `%`; strip period tokens already consumed by Stage 4; expand abbreviations using `nhmis_dictionary.json` (longest-match-first over the token stream); extract and remove dimension tokens (sex, age bands, initiation status) into a `disaggregation` JSONB. The result is the `normalized` key.

**6b Alias lookup.** Exact hash lookup on `indicator_aliases.normalized` where `status='confirmed'`. Expected to resolve the large majority of every upload after the first month of operation, and 100% of a re-uploaded template.

**6c Fuzzy match.** RapidFuzz against all confirmed alias `normalized` values and all `disease_indicators.name` values. Score = max(token_set_ratio, Jaro-Winkler). Bands: ≥0.95 auto-accept (method `fuzzy`), 0.85-0.949 review, <0.85 continue. Catches source misspellings (`heamatinics`, `supperviser`) without semantic machinery.

**6d Embedding match.** Embed the normalized string with the local model (Section 7); cosine nearest-neighbour against the indicator embedding registry in pgvector:

```sql
SELECT indicator_id, 1 - (embedding <=> $1) AS sim
FROM indicator_embeddings ORDER BY embedding <=> $1 LIMIT 3;
```

Bands (initial, recalibrated per Section 7.4): ≥0.90 auto-accept (method `embed`), 0.78-0.899 review, <0.78 continue. This is the stage where `ANC Attendance` meets `Antenatal care first visit`.

**6e LLM residue.** All strings surviving 6a-6d for the upload are batched into a single structured call (Section 8). Output per string: `match` (indicator_id + confidence), `new_indicator` (proposed name, category, unit), or `human`. `match` at confidence ≥0.9 auto-accepts with method `llm`; everything else lands in review. If no provider is reachable (offline), the stage is skipped and strings go directly to review; the pipeline is fully functional without it.

**6f Review queue.** Rows with `status='pending'` in `indicator_aliases` and `orgunit_aliases`, surfaced through the Governance module (Section 9). Every admin decision writes a confirmed alias and, where relevant, a new `disease_indicators` row. Confirmation triggers re-resolution of any staged observations waiting on that alias, which then flow to `disease_burden` automatically.

**New-indicator gate.** An auto-created indicator is never published silently. When 6d/6e propose `new_indicator`, the indicator row is created with `is_active=FALSE` and appears in review; observations attach to it in staging. Activation is an admin action. This keeps the registry curated while never blocking ingestion.

### 4.7 Stage 7 — Value semantics and validation

**Zero versus missing.** Cell parsing emits `value_status`: numeric including 0 → `reported` (0 additionally flagged `zero_reported`); empty cell where the row and column both exist → `missing` (stored with `value=NULL`); non-numeric garbage → `invalid`, held in staging. Missing values are stored, not dropped, because completeness is itself an analytic product and blank-versus-zero is an epidemiological distinction the dashboard must preserve.

**Validation rules** (violations annotate, never delete):
- Percent-typed indicators outside 0-100 → flag `RANGE`
- Value > 6 median absolute deviations from that (indicator, LGA) history → flag `OUTLIER` (WHO DQR consistency check)
- LGA aggregate present alongside facility rows summing to a different total (>5% divergence) → flag `SUM_MISMATCH`
- Duplicate key with conflicting value across datasets → both stored, conflict row written to `observation_conflicts`, precedence decided by dataset approval order unless admin overrides

Reporting-rate sheets are ingested as first-class completeness indicators so every burden series can render alongside its reporting completeness.

### 4.8 Stage 8 — System shift detection

Two detectors, both writing candidates to review rather than acting autonomously:

1. **Alias succession.** Nightly SQL: for each indicator pair (A, B) in the same category where A's observations stop within 6 months of B's aliases first appearing, and A and B embedding similarity ≥0.7, emit a succession candidate. Admin confirmation sets `disease_indicators.succeeds_indicator_id` and writes an `indicator_revisions` row.
2. **Changepoint scan.** Weekly job using `ruptures` (PELT, RBF cost) over each indicator's state-level monthly series. A breakpoint shared by ≥60% of LGAs in the same period is a reporting regime change signal (form revision, target rebasing), annotated on the series so trend charts mark the seam instead of narrating it as an epidemic. The national NHMIS 2013→2019 form transition, completed by all states in 2021, is exactly the class of event this catches.

Confirmed successions let the analytics layer offer bridged series with the seam marked, or split series, at the user's choice.

---

## 5. Interaction with Existing v1.1 Components

- **UploadService / ValidationWorker**: unchanged. ClamAV and format checks still gate the queue.
- **AnalyticsWorker**: unchanged inputs. It reads `disease_burden`; resolved rows arrive there exactly as before. Add one filter: exclude `value_status='missing'` from burden aggregations, include it in completeness aggregations.
- **DHIS2 JSON path** from v1.1 remains the preferred ingestion route when exports are available, and it now also writes aliases: every `dataElement` name observed is recorded so future Excel headers matching DHIS2 element names resolve at stage 6b.
- **Comparison endpoint** (new, `GET /analytics/compare?dataset_a&dataset_b`): intersect resolved observation keys `(indicator_id, lga_id, ward_id, facility_id, period)` of both datasets; return coverage overlap, shared series, per-key conflicts, and each dataset's resolution and completeness rates. Pure SQL over `disease_burden` filtered by `source_dataset_id`; no model inference at query time.

---

## 6. Schema Additions (DDL)

### 6.1 Staging

```sql
CREATE TABLE staging_observations (
  id              BIGSERIAL PRIMARY KEY,
  dataset_id      INTEGER NOT NULL REFERENCES datasets(id),
  sheet_name      VARCHAR(120) NOT NULL,
  cell_ref        VARCHAR(40)  NOT NULL,
  raw_orgunit     TEXT,
  raw_indicator   TEXT,
  raw_period      TEXT,
  raw_value       TEXT,
  orgunit_id      INTEGER,          -- resolved FK, level-polymorphic via orgunit_level
  orgunit_level   VARCHAR(10),      -- 'lga' | 'ward' | 'facility'
  indicator_id    INTEGER REFERENCES disease_indicators(id),
  disaggregation  JSONB,
  period_year     SMALLINT, period_quarter SMALLINT, period_month SMALLINT,
  period_type     VARCHAR(10),
  value           NUMERIC(14,2),
  value_status    VARCHAR(15),      -- reported|zero_reported|missing|invalid
  resolution_state VARCHAR(20) NOT NULL DEFAULT 'pending',
                                    -- pending|resolved|published|rejected
  hold_reason     VARCHAR(40),      -- PERIOD_UNRESOLVED|INDICATOR_PENDING|ORG_PENDING|INVALID_VALUE
  flags           TEXT[],           -- RANGE|OUTLIER|SUM_MISMATCH
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_staging_state ON staging_observations(resolution_state, dataset_id);
```

### 6.2 Alias tables

```sql
CREATE TABLE indicator_aliases (
  id             SERIAL PRIMARY KEY,
  raw_text       TEXT NOT NULL,
  normalized     TEXT NOT NULL UNIQUE,
  indicator_id   INTEGER REFERENCES disease_indicators(id),
  disaggregation JSONB,
  confidence     NUMERIC(4,3),
  method         VARCHAR(10) NOT NULL,   -- exact|dict|fuzzy|embed|llm|human
  status         VARCHAR(10) NOT NULL DEFAULT 'pending',  -- confirmed|pending|rejected
  candidates     JSONB,                  -- top-3 suggestions snapshot for review UI
  first_seen_dataset_id INTEGER REFERENCES datasets(id),
  decided_by     INTEGER REFERENCES users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  decided_at     TIMESTAMPTZ
);

CREATE TABLE orgunit_aliases (
  id           SERIAL PRIMARY KEY,
  raw_text     TEXT NOT NULL,
  normalized   TEXT NOT NULL,
  orgunit_level VARCHAR(10) NOT NULL,
  orgunit_id   INTEGER NOT NULL,
  confidence   NUMERIC(4,3),
  method       VARCHAR(10) NOT NULL,
  status       VARCHAR(10) NOT NULL DEFAULT 'pending',
  decided_by   INTEGER REFERENCES users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (normalized, orgunit_level)
);
```

### 6.3 Embeddings (pgvector)

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE indicator_embeddings (
  indicator_id INTEGER PRIMARY KEY REFERENCES disease_indicators(id),
  embedding    vector(384) NOT NULL,      -- MiniLM-L6 dimension
  model_tag    VARCHAR(60) NOT NULL,      -- e.g. 'minilm-l6-v2-onnx-q'
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_ind_emb ON indicator_embeddings
  USING hnsw (embedding vector_cosine_ops);
```

Alias confirmations for an indicator append that alias's embedding as an additional row in a companion `alias_embeddings` table with the same shape, so future queries match against the full observed vocabulary of each indicator, not only its canonical name.

### 6.4 Disease burden amendments

```sql
ALTER TABLE disease_burden
  ADD COLUMN value_status   VARCHAR(15) NOT NULL DEFAULT 'reported',
  ADD COLUMN disaggregation JSONB,
  ADD COLUMN cell_ref       VARCHAR(160),   -- 'sheet!cell' provenance
  ADD COLUMN flags          TEXT[];

ALTER TABLE disease_burden ALTER COLUMN value DROP NOT NULL;  -- missing rows carry NULL

ALTER TABLE disease_indicators
  ADD COLUMN succeeds_indicator_id INTEGER REFERENCES disease_indicators(id),
  ADD COLUMN canonical_source VARCHAR(30);  -- 'nhmis-dhis2' | 'ocl' | 'local'
```

The v1.1 composite unique constraint gains `disaggregation` via a generated hash column to keep sex-disaggregated rows from colliding with totals.

### 6.5 Conflicts

```sql
CREATE TABLE observation_conflicts (
  id            BIGSERIAL PRIMARY KEY,
  burden_id_a   BIGINT REFERENCES disease_burden(id),
  burden_id_b   BIGINT REFERENCES disease_burden(id),
  divergence    NUMERIC(8,2),
  resolved_by   INTEGER REFERENCES users(id),
  resolution    VARCHAR(20),    -- prefer_a|prefer_b|keep_both|merged
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.6 Format coverage register

```sql
CREATE TABLE format_coverage_register (
  id              SERIAL PRIMARY KEY,
  dataset_id      INTEGER REFERENCES datasets(id),
  sheet_name      VARCHAR(120),
  species         VARCHAR(20),      -- F1..F8 | UNKNOWN
  handler         VARCHAR(40),
  columns_seen    SMALLINT,
  rows_emitted    INTEGER,
  distinct_indicators SMALLINT,
  resolution_rate NUMERIC(5,2),     -- % of observations published without review
  processed_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. Embedding Model: Setup, Seeding, Calibration, and Training

### 7.1 Model selection and setup

Default model: `sentence-transformers/all-MiniLM-L6-v2`, quantized ONNX, served via `fastembed`. 384 dimensions, ~80MB on disk, ~250MB resident, single-string embedding in ~15ms on the C4's vCores. Alternative if English medical phrasing recall proves insufficient during calibration: `BAAI/bge-small-en-v1.5` (same dimension, slightly heavier, measurably better on short domain phrases).

```python
from fastembed import TextEmbedding
model = TextEmbedding("sentence-transformers/all-MiniLM-L6-v2",
                      cache_dir="/app/models")   # pre-baked, no download
vec = next(model.embed(["antenatal care first visit attendance"]))
```

Model files are downloaded once at image build time and pinned by SHA. Runtime never fetches.

### 7.2 Registry seeding (one-time, any connection)

1. **National NHMIS DHIS2 metadata.** Pull the data element and indicator dictionaries from the national instance metadata API (coordinate access through FACT/NSPHCDA; a read-only account suffices). Insert each element as a `disease_indicators` row (or map to existing seeds), populate `dhis2_data_element_id`, and write each element's name and shortName as confirmed aliases with method `dict`. This front-loads stage 6b with the authoritative national vocabulary before the first upload.
2. **Open Concept Lab.** Import relevant concept collections (HIV/PMTCT, immunization, maternal health) as additional confirmed synonyms. OCL is the terminology service used across the DHIS2/PEPFAR ecosystem; importing its dictionaries is a file download, not a service dependency.
3. **`nhmis_dictionary.json`.** Load the abbreviation, synonym, misspelling, dimension, and org-pattern sets shipped with this document into the normalizer and alias tables.
4. **Embed everything.** Batch-embed all indicator names and confirmed aliases into `indicator_embeddings` / `alias_embeddings`. At a few thousand strings this completes in under a minute.

### 7.3 The learning loop (operational training)

The system's primary training signal is the review queue. Each admin confirmation:

1. Writes a confirmed alias (deterministic replay forever)
2. Appends the alias embedding to the indicator's vocabulary
3. Accumulates a labeled pair `(alias_text, indicator_canonical_text, label=1)` in `training_pairs`

Rejections accumulate `label=0` pairs. No model weights change in this loop; accuracy still climbs because stages 6b and the widening embedding vocabulary absorb an ever-larger share of traffic. This is the zero-cost, zero-risk default and is sufficient on its own.

### 7.4 Threshold calibration (before go-live, then quarterly)

1. Build an evaluation set: all confirmed pairs (positives) plus hard negatives (each alias against its 5 nearest non-matching indicators by embedding distance). The seed dictionaries alone yield several hundred pairs before any uploads.
2. Score every pair with the fuzzy scorer and the embedding scorer independently.
3. For each scorer, sweep thresholds and record precision/recall. Choose the auto-accept threshold as the highest score achieving ≥99% precision, and the review-band floor as the score at ~90% recall.
4. Store chosen bands in a `resolver_config` table with the evaluation date and metrics. The Reader reads bands at startup; changing them is a config update, not a deploy.

### 7.5 Optional fine-tuning (when training_pairs > ~2,000)

Fine-tuning specializes the embedding space to Nigerian health phrasing. It is deliberately performed **off-server** (any developer laptop; no GPU required at this scale, CPU training completes in under an hour) and only the exported ONNX artifact is shipped.

```python
from sentence_transformers import SentenceTransformer, InputExample, losses
from torch.utils.data import DataLoader

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
examples = [InputExample(texts=[a, c]) for a, c in positive_pairs]  # from training_pairs
loader   = DataLoader(examples, shuffle=True, batch_size=32)
loss     = losses.MultipleNegativesRankingLoss(model)   # in-batch negatives
model.fit(train_objectives=[(loader, loss)], epochs=2, warmup_steps=100)
model.save("minilm-nhmis-v2")
```

Export to ONNX (`optimum-cli export onnx ...`), quantize, evaluate against the held-out 20% of pairs, and promote only if auto-accept precision at the calibrated threshold improves. Version the model tag, re-embed the registry with the new model (embeddings from different models are never compared), and keep the previous image for rollback. Fine-tuning is an optimization, never a dependency; skip it entirely and the system still works.

---

## 8. LLM Residue Stage

Provider-agnostic adapter with a single interface: `classify(batch: list[UnresolvedString], context: CandidateSets) -> list[Decision]`. Configuration selects any OpenAI-compatible endpoint, so the cheapest adequate hosted model at any given time can be swapped in without code changes, and a local endpoint (Ollama on an office machine) satisfies the same interface.

**Prompt contract.** One call per upload, not per string. Input: the unresolved normalized strings, each with its top-3 fuzzy and embedding candidates and scores, plus the indicator category list. Required output: strict JSON, one decision object per string, schema-validated with pydantic; malformed output is retried once, then the whole batch falls through to review.

**Controls.**
- Response cache keyed by normalized string + registry version; a string is never asked about twice
- Hard budget: max 1 call and max 60 strings per upload; overflow goes to review
- Offline behavior: unreachable provider = skip stage, route to review; ingestion never blocks on connectivity
- Every LLM auto-accept is still written as `method='llm'` with `status='pending'` until an admin has confirmed at least one observation from that alias in a published dashboard context, or explicitly confirms it; this keeps the trust chain auditable in a government deployment

**Local option.** A quantized 3B instruct model (Qwen2.5-3B or Phi-3.5-mini via llama.cpp) handles this classification task adequately. The C4 cannot host it alongside Postgres; the supported pattern is an office workstation running Ollama, exposed to the Reader over the LAN or invoked in an overnight batch, with only resulting alias rows synced. This keeps heavy inference where power and hardware exist and keeps the server lean.

---

## 9. Governance Module Extensions (B10.05)

New endpoints on the existing Fastify Admin Governance routes:

```
GET    /admin/governance/review-queue            ?type=indicator|orgunit&status=pending
POST   /admin/governance/aliases/{id}/confirm    { indicator_id }        → confirm + re-resolve staged rows
POST   /admin/governance/aliases/{id}/remap      { indicator_id }
POST   /admin/governance/aliases/{id}/reject
POST   /admin/governance/indicators/{id}/activate                        → new-indicator gate
POST   /admin/governance/successions/{id}/confirm { note }               → writes indicator_revisions
GET    /admin/governance/ingestion-report/{dataset_id}                   → per-sheet species, rates, flags
GET    /admin/governance/coverage-register
```

Review UI requirements: show raw string, source workbook/sheet/cell, top-3 candidates with scores and methods, and a one-click "create new indicator" path that pre-fills name/category/unit from the LLM proposal when present. Confirmations must be keyboard-fast; a data officer should clear a 30-item queue in minutes.

Fastify-side re-resolution trigger: alias confirmation enqueues a lightweight `re-resolve` job naming the alias; the Reader promotes all staged rows waiting on it and enqueues `analytics-compute` for affected indicators.

---

## 10. Testing and Acceptance

**Golden fixtures.** The two sample workbooks are committed as test fixtures with hand-verified expected outputs: per sheet, the expected species, header compositions, distinct indicator strings, and 20 spot-checked `(org, indicator, period, value, value_status)` tuples including at least one explicit zero, one blank, one misspelling, and one decorated org name each.

**Unit suites.** Period grammar (≥60 cases), normalizer (dictionary expansion order, dimension extraction), header detection (synthetic sheets per species F1-F4 and F8), spine detection, banding logic.

**Acceptance criteria for go-live:**
1. Both fixture workbooks ingest with zero `UNKNOWN` species and zero silent value corruption against golden tuples
2. Re-ingesting the same workbook yields 100% stage-6b resolution and no duplicate burden rows
3. A deliberately perturbed fixture (renamed indicators, injected misspellings, shuffled header rows) resolves ≥80% automatically with the remainder correctly queued, never mis-published
4. Full pipeline for the 1.1MB DHIS workbook completes in under 3 minutes on C4-equivalent resources
5. Kill network on the Reader container: ingestion still completes end to end minus the LLM stage

**KPIs in production** (Grafana/pg_stat views): auto-resolution rate per upload (target trajectory: >60% first month, >90% by month three), review queue age p50/p95, conflicts per dataset, species distribution, LLM calls and cache hit rate per upload.

---

## 11. Implementation Order

| Step | Deliverable | Depends on |
|---|---|---|
| 1 | Schema migrations (Section 6), pgvector install | — |
| 2 | Reader skeleton: bullmq consumer, MinIO fetch, staging writes | 1 |
| 3 | Stages 1-3 with F1/F8 handlers + golden fixtures | 2 |
| 4 | Period grammar + org resolution | 3 |
| 5 | Dictionary load + stages 6a-6c | 4 |
| 6 | F2/F3/F4 handlers | 3 |
| 7 | Embedding registry, seeding, stage 6d, calibration | 5 |
| 8 | Review queue endpoints + UI, re-resolve loop | 5 |
| 9 | Validation flags, conflicts, comparison endpoint | 8 |
| 10 | LLM adapter + cache + budget | 8 |
| 11 | Succession + changepoint jobs | 9 |
| 12 | Corpus expansion pass with client-supplied historical files | 8 |
| 13 | Approval gate: split lifecycle into process + publish jobs (Sections 3.3, 13.1) | 2 |
| 14 | Mutation ledger + transactional publish (Section 13.2) | 13 |
| 15 | Retraction engine + cascade rules + retraction report (Sections 13.3-13.6) | 14 |

Steps 1-5, 8, and 13-14 constitute a shippable core: deterministic parsing, dictionary and fuzzy resolution, human review, and reversible publication. Step 15 must land before the first production approval is granted, because a ledger written from day one is what makes every historical dataset retractable; retrofitting it later leaves early datasets irreversible.

**Execution order is governed by `Canonicalization_Engine_Implementation_Plan.md`**, which resequences these 15 steps into 11 phases with per-phase exit gates, and adds four units of work this table omits: the queue and worker platform the engine runs on (12.8), the spatial reference tables the gazetteer needs (12.6), the fact and dimension tables the engine publishes into (12.4), and the analytics work that makes published data visible. The appendix of that document maps every step above to its phase.

---

## 12. Implementation Findings — Real Backend Reconciliation

The following points were identified when reconciling this spec against the backend actually built for this project (NestJS/TypeORM/Postgres, not the Fastify/Python stack assumed above). Sections 12.1–12.3 change what infrastructure carries the design. Sections 12.4–12.8 correct premises in this document that turned out to be false when checked against the code and the sample corpus; they are the reason the implementation plan exists as a separate document.

The root cause of most of them is a single assumption worth naming: this document was written as though Backend Architecture v1.1 had been fully implemented. It has not. Milestone 2 and much of Milestone 3 shipped, but the spatial reference tables (§4.1), the disease burden and indicator tables (§4.6), the job tracking table (§4.8), the GeoWorker and ETLWorker (§2), the queue topology (§6), and the separate worker process (§2, §12) were never built. The engine therefore cannot be layered onto that architecture — the sprint builds both, as one unified data model and service topology.

### 12.1 Node/Postgres, not Fastify/Python

Every stage and algorithm in Sections 3-8 is implemented in the real backend's existing NestJS application, not a separate Python "Reader" container. This is a runtime substitution, not a redesign — each Python-specific piece has a direct Node/Postgres equivalent:

| This spec assumes | Real backend uses |
|---|---|
| Separate Python worker container, `bullmq` (PyPI) | A BullMQ processor class inside the existing NestJS app, same pattern as its existing `ValidationProcessor` |
| Fastify API | The existing NestJS controllers |
| `pgvector` via a Python client | The same extension, same Postgres instance, queried via TypeORM raw SQL |
| `fastembed` ONNX MiniLM (Python) | `@xenova/transformers` (Transformers.js) running the same `all-MiniLM-L6-v2` model locally in Node — same offline, baked-into-build guarantee |
| `ruptures` (Python changepoint library) | PELT reimplemented directly in TypeScript — the algorithm isn't Python-specific, only that library is |
| `RapidFuzz` / `jellyfish` (Python) | `fuzzball` (token-set-ratio) + a phonetic-match utility, JS equivalents |
| `SERIAL` / `BIGSERIAL` PKs | `uuid`, matching every existing entity in the real schema |

Why: this project has one deployed backend, not two. Standing up a second language runtime and container solely for this pipeline would double the operational surface (deploys, monitoring, dependency upgrades) for capability that Node already has equivalents for.

### 12.2 Cross-dataset relation matching — new capability, built on Section 5's comparison endpoint

This spec's `/analytics/compare` endpoint (Section 5) computes overlap between two already-resolved datasets but stops at returning the result. The real implementation adds a matching workflow on top of it: once two datasets both have published resolved observations, their shared `(indicator_id, orgunit_id, period)` keys are compared automatically; a strong overlap is surfaced as a candidate "same study, different source" relation, routed through the same review queue as indicator/org-unit aliases, and a confirmed relation is displayed as "Related datasets" wherever the dataset is shown.

Why: this project's real-world case is the same study appearing more than once under different filenames, org names, or abbreviations (different organisation, same LGA/period/indicators). The spec's comparison endpoint gives the exact data needed to detect this (real matching keys are a strong, free signal — deterministic SQL, no model inference), but detection and review only becomes real if something acts on that output. This is additive; it does not change Sections 1-11.

### 12.3 Org-unit resolution reuses the existing `GisReferenceService`, not a new `orgunit_aliases` table

Section 4.5 and Section 6.2 of this spec define Stage 5 around a new `orgunit_aliases` table and its own escalation logic (exact → decoration-stripped → fuzzy → phonetic). The real backend already has a working service, `GisReferenceService`, that performs this same job — reconciling messy LGA/ward name strings against the real boundary data and remembering confirmed matches — built for this project's existing GIS features.

The real implementation extends that existing service (adding the facility-level phonetic tier Section 4.5 describes) rather than building a second, parallel alias table and matching system next to it. Unresolved names route to the same existing GIS Reference admin review page rather than a new one.

Why: the resolution logic Section 4.5 describes already exists and is already in production use for a different feature. Building `orgunit_aliases` as specified here would duplicate that logic against the same gazetteer, creating two systems that could drift out of sync with each other over time.

**Correction (see 12.6).** The goal stated above is right, but the premise is not: `GisReferenceService` performs exact-variant lookup only. The plan reaches the same one-system outcome by a different route.

### 12.4 `disease_burden` and `disease_indicators` do not exist yet

Section 1 states that the Reader "publishes to the same `disease_burden` and `disease_indicators` tables", and Section 6.4 issues `ALTER TABLE disease_burden ADD COLUMN ...`. Neither table has ever been created in this backend. They are described in Backend Architecture v1.1 §4.6 but were never built; the only `disease_indicators` in the running system is a free-text `simple-array` **column** on `datasets`.

The engine therefore builds the fact and dimension layer as well as the ingestion layer. Section 6.4's `ALTER` statements are executed as `CREATE` statements carrying those columns from birth, which is strictly simpler than the migration path this section describes. Primary keys are `uuid` with `uuid_generate_v4()`, matching all 37 existing entities, not the `SERIAL`/`BIGSERIAL` shown in Section 6.

Relatedly, Section 5's claim that `AnalyticsWorker` has "unchanged inputs" does not hold. The live `AnalyticsService` deliberately aggregates facility and population density rather than disease burden, because no burden source existed. Publishing observations has no downstream effect until analytics is extended to read the new fact table.

### 12.5 pgvector is not available in the deployed Postgres image

Section 6.3 opens with `CREATE EXTENSION IF NOT EXISTS vector`. The deployed image is `postgis/postgis` (16-3.4 in development, 15-3.3 in production), which does not ship pgvector, so that statement fails.

The implementation defines an `EmbeddingIndex` interface with two backends. The default stores embeddings in a `real[]` column and computes cosine similarity by brute force over an in-memory matrix loaded at worker boot; at a few thousand vectors this is a sub-10ms full scan and is the correct answer at this scale. A pgvector backend with the HNSW index exactly as specified in Section 6.3 is selectable by configuration once a Postgres image carrying the extension is in place. The algorithm in Section 4.6d is unchanged either way.

### 12.6 `GisReferenceService` cannot carry Stage 5 as it stands

Section 12.3 describes the existing service as already "reconciling messy LGA/ward name strings against the real boundary data and remembering confirmed matches". In fact it performs a single exact lookup against a preloaded index keyed on `lga_code` plus a lowercased curated variant. There is no fuzzy tier, no phonetic tier, no confidence score, no pending/confirmed state, and no facility level at all. LGA, ward, and facility geometry live in GeoPackage files in object storage and are read per call, so a per-row escalation ladder over 2,191 facilities would mean opening a GeoPackage during ingestion.

The implementation honours 12.3's intent — one gazetteer, one alias store — by building the spatial reference tables Backend Architecture v1.1 §4.1 already specifies and that were never created: `lga_boundaries`, `ward_boundaries`, and `health_facilities`, loaded into PostGIS from those same GeoPackages by a GeoWorker, with facility LGA and ward assigned by `ST_Contains` spatial join rather than by the source's text name fields. `orgunit_aliases` is then built exactly as Section 6.2 specifies, level-polymorphic over those three tables, and `GisReferenceService` is refactored to resolve through the same ladder. The existing ward reconciliation admin page continues to work, and `gis_reference_areas.name_variants` migrates into `orgunit_aliases` as confirmed human-method rows.

This also aligns the two specifications rather than choosing between them: Section 5's comparison endpoint already keys on `(indicator_id, lga_id, ward_id, facility_id, period)`, which presumes precisely these tables. The outcome 12.3 asked for is reached; it simply could not be reached by extending a lookup map in place.

### 12.7 Corpus findings that amend Sections 4.1 and 4.2

Parsing the two sample workbooks directly confirmed every species in the Section 2 inventory, and surfaced four behaviours this document does not account for. Each is a silent-corruption risk if implemented as written.

- **Declared sheet ranges cannot be trusted.** `HIV_AIDS` declares `A1:IV1000` against 29 real rows; `DHIS Data 2022 to 2026` declares 1000 rows against 30. Parsing the declared range inflates `staging_observations` by roughly 34× and invalidates the Section 4.1 numeric-density rule, which would be computed over a region that is 97% empty. `Cases 2020-2026` declares `B1:AD1000` while holding content in column A, so the declared range is not even a reliable lower bound. A real-extent scan must precede every other stage.

- **Merged-range expansion must exclude title rows.** `Cases 2020-2026` carries merge `E1:T2` holding `"NIGER STATE"`. Expanding it per Section 4.2 copies that string across 16 columns of the header block, so every composed header begins `"NIGER STATE | ..."`. A merged range spanning most of the sheet width and carrying no period or indicator token is decoration and must be dropped, not expanded.

- **F4 period heads float inside their blocks rather than announcing them.** `Cohort 2020-2026` has no merges at all; `Q1 2020` sits at column index 4 and `Q2 2020` at index 10, while the repeating 8-column blocks begin at indices 1, 9, and 17. Section 4.2's period-detection method is correct, but block boundaries must be established from tail repetition **first**, with each period token then attached to the block that contains it. Forward-filling from the head misassigns columns in either direction.

- **Multi-state national workbooks are already in the corpus.** Section 2 lists these as absent and to be requested later. The AFP surveillance workbook is one: `LGA_Track` holds 775 rows spanning every Nigerian state and `Summary_Auto` compares Niger against Benue, Kogi, and FCT. Stage 5 needs a state-scope filter, and out-of-scope rows must be counted and surfaced on the ingestion report rather than silently dropped.

One finding runs the other way. `Niger Health Facilities.gpkg` already carries `lga_alt_names` and `ward_alt_names` alongside `facility_name` and `nhfr_facility_code` for all 2,191 facilities — authoritative NHFR/GRID3 alias data that seeds `orgunit_aliases` at no cost, in addition to the `nhmis_dictionary.json` vocabulary.

A fifth finding constrains Section 8. The F5 survey sheets carry live personal data — `Name of Midwife`, `Phone number`, `Email`, `Name of Supervisor`. Personal data is therefore inside the ingestion path, and no survey row content may ever be placed in an LLM prompt. The implementation enforces this in code with a build-failing test rather than by convention, which extends Backend Architecture v1.1 §9 Layer 5's no-PII rule to a surface that did not exist when it was written.

### 12.8 The queue runtime is Bull v4, and the worker is not a separate process

Section 3.1 and Section 12.1 both assume BullMQ. The application actually runs `@nestjs/bull` 11.0.4 on `bull` 4.16.5. `bullmq` 5.79.3 is installed but unused, except that `notifications.service.ts` imports the `Queue` type from `bullmq` while `@nestjs/bull` injects a Bull v4 queue — a latent conflict today and a real defect the moment any BullMQ-only method is called.

Three capabilities this specification depends on are not available cleanly on Bull v4: parent/child **flows** for the staged pipeline in Section 3.3, **object-valued progress** rather than a bare 0–100 number for per-stage reporting, and per-queue **concurrency and priority** control, which `bull.config.ts` currently does not configure at all. The implementation therefore migrates to `@nestjs/bullmq` before any engine code is written.

Separately, Backend Architecture v1.1 §2 and §12 specify the worker as its own process with no HTTP server. That split was never made; every processor currently runs inside the API process. Because this engine's inner loops are CPU-bound, running it in-process would block the Node event loop and stall live API requests. The implementation runs the worker as a separate container from the same image, so ingestion cannot affect API latency, and reports progress through an `ingestion_jobs` table — a table Backend Architecture v1.1 §4.8 already specifies, with `status`, `progress`, and a `steps` JSONB column, and which was likewise never built.

---

## 13. Approval Gate and Rollback Engine

This section makes every publication reversible. The design goal is stated plainly: an admin removing a dataset must undo every effect that dataset had on indicators, burden data, statistics, and analytics, and the system must do this without snapshotting whole tables. The mechanism is a per-dataset mutation ledger written in the same transaction as publication, which functions as a targeted undo log. Rollback cost is proportional to what the dataset changed, never to the size of the database.

Implementation follows the Section 12 stack: NestJS services, TypeORM, uuid keys, BullMQ processors inside the existing application.

### 13.1 Approval gate

Dataset lifecycle gains explicit states:

```
uploaded → processing → processed_pending_approval → approved → published
                                    │                                │
                                    ├→ rejected (staging purged,     ├→ retracting → retracted
                                    │  file archived per policy)     │
                                    └──────────────────────────── re-approval republishes
                                                                  from retained staging
```

Rules:

1. Stages 1-7 run on upload. Their outputs (staging rows, ingestion report, coverage register entries, review-queue candidates) are read-only intelligence for the approving admin. Alias confirmations made during review are permitted before approval, since aliases are registry knowledge, not dataset effects.
2. `AnalyticsWorker` is never enqueued for a dataset that is not `published`. The existing v1.1 approval endpoint (`POST /admin/datasets/{id}/approve`) now enqueues the `dataset-publish` job instead of publication happening inline during ingestion.
3. Publication is the only writer of dataset effects. The complete set of effect surfaces, each of which the ledger must cover, is: `disease_burden` rows, `disease_indicators` rows created or activated by this dataset, `observation_conflicts` rows, analytics/trend/KPI cache keys, and succession or changepoint annotations derived after this dataset's values entered the series.

### 13.2 Mutation ledger

One table records every row-level effect of publication, grouped by an atomic publication batch:

```sql
CREATE TABLE dataset_publications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id   UUID NOT NULL REFERENCES datasets(id),
  approved_by  UUID NOT NULL REFERENCES users(id),
  status       VARCHAR(15) NOT NULL DEFAULT 'publishing',
               -- publishing | published | retracting | retracted | failed
  rows_inserted INTEGER DEFAULT 0,
  rows_updated  INTEGER DEFAULT 0,
  affected_keys JSONB,          -- distinct (indicator_id, period_year) pairs, for cache invalidation
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  retracted_at TIMESTAMPTZ
);

CREATE TABLE ingestion_mutations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id UUID NOT NULL REFERENCES dataset_publications(id),
  seq            BIGINT NOT NULL,             -- strict write order within the publication
  table_name     VARCHAR(60) NOT NULL,        -- 'disease_burden' | 'disease_indicators' | 'observation_conflicts'
  row_pk         UUID NOT NULL,
  op             VARCHAR(10) NOT NULL,        -- 'insert' | 'update'
  before_image   JSONB,                       -- full row as JSON; NULL for inserts
  after_image    JSONB,                       -- NULL is acceptable for inserts (row itself is the after-image)
  reversed_at    TIMESTAMPTZ,
  UNIQUE (publication_id, seq)
);
CREATE INDEX idx_mut_pub ON ingestion_mutations(publication_id, seq DESC);
```

Why this shape is the efficient answer:

- **Inserts dominate.** `disease_burden` is an append-mostly fact table. An insert costs one ledger row holding only the pk; no image is needed because reversal is deletion. A 15,000-observation workbook costs roughly 15,000 slim ledger rows, a few MB of JSONB, written in the same batched insert statements as the data itself.
- **Before-images exist only where history is destroyed.** The only updates publication can perform are conflict-precedence overwrites (Section 4.7) and indicator activation. Both are rare, both capture a compact `before_image`, and both are exactly restorable.
- **No table snapshots, no PITR dependency.** Point-in-time database recovery cannot remove one dataset's effects without also destroying every later dataset's effects. The ledger removes exactly one dataset's effects while every other dataset's data stands untouched, which is the actual requirement.

**Transactional publish.** The `dataset-publish` processor writes data rows and their ledger rows in the same transaction, chunked (2,000 observations per transaction) with `seq` strictly increasing across chunks. If publication dies mid-way, the publication is `failed` and the retraction path (13.3) runs over whatever `seq` range exists, returning the database to the pre-approval state before a retry. Publication is therefore atomic-or-cleanly-reversible, never half-applied.

**New indicator effects.** When publication activates an indicator created by this dataset (the Section 4.6 new-indicator gate), the ledger records an `update` on `disease_indicators` with the `is_active=false` before-image. The indicator row's creation itself is recorded as an `insert` mutation at creation time if and only if the dataset is that indicator's `first_seen_dataset_id`.

### 13.3 Retraction engine

`POST /admin/datasets/{id}/retract` (admin, MFA-gated, reason required) enqueues a `dataset-retract` job:

```
1. Guard      dataset status must be 'published' or publication 'failed'.
              Take a Postgres advisory lock on the dataset id so retraction,
              republication, and analytics recompute cannot interleave.
2. Reverse    Iterate ingestion_mutations for the publication in seq DESC order,
              chunked transactions:
                op = insert → DELETE FROM {table} WHERE id = row_pk
                op = update → UPDATE {table} SET row = before_image
              Mark each mutation reversed_at. Resumable: restart continues from
              the highest unreversed seq, so a crash mid-retraction is safe.
3. Cascade    Apply Section 13.4 rules for indicators, aliases, conflicts.
4. Recompute  Read dataset_publications.affected_keys; delete exactly those
              analytics_cache / trend_cache / kpi_cache keys; enqueue
              analytics-compute scoped to those (indicator, year) pairs.
              Re-run the succession and changepoint scans for affected
              indicators so annotations derived from retracted values disappear.
5. Files      Delete the MinIO object (datasets bucket) and any derived
              previews. Staging rows are retained by default (enables
              re-approval without re-upload); a 'purge staging' option on the
              retract call removes them for privacy-sensitive removals.
6. Close      Publication → 'retracted', dataset → 'retracted', audit_logs row
              with reason, actor, row counts, and duration. Retraction report
              (13.6) generated and linked from the dataset page.
```

Reversal order (seq DESC) matters: it guarantees that an update whose before-image was itself written earlier in the same publication is unwound after the row it depends on, so intra-publication dependency order is always respected.

### 13.4 Cascade rules

**Indicators.** After reversal, an indicator whose `first_seen_dataset_id` is the retracted dataset is checked for remaining references: any `disease_burden` row or confirmed alias sourced from another dataset. No references → `is_active=false` and flagged `orphaned` in the review queue (soft removal; hard delete is a separate admin action). References exist → the indicator survives, because other data legitimately depends on it.

**Aliases.** Knowledge survives data. Confirmed aliases are registry learning validated by a human and are kept by default even when the dataset that first surfaced them is retracted, because the mapping between a string and an indicator remains true regardless of one file's fate. Two exceptions: pending aliases whose only evidence is the retracted dataset are deleted, and the retract call accepts `forget_aliases=true` for the poisoned-source case where the admin judges the file's vocabulary itself untrustworthy.

**Conflicts.** `observation_conflicts` rows referencing a reversed burden row are closed with resolution `retracted_source`. Where the retracted dataset had won precedence over another dataset's value, the ledger's before-image restoration automatically reinstates the losing value; no special handling is needed beyond the reversal itself, which is a deliberate consequence of capturing the full row as the before-image.

**Cross-dataset relations (Section 12.2).** Confirmed relations involving the retracted dataset are marked `inactive`, not deleted, so re-approval restores them without re-running matching.

### 13.5 Interaction with re-approval

Because staging survives retraction by default, re-approval is `dataset-publish` again: a new publication row, a fresh ledger, current alias registry applied (so mappings confirmed since the original publication now resolve automatically). Nothing about retraction is one-way except the removal of the original file when purged.

### 13.6 Retraction report and observability

Every retraction produces a stored report: counts reversed per table, indicators deactivated, aliases removed or kept, cache keys invalidated, analytics jobs enqueued, wall-clock duration, and the acting admin with reason. This is the artifact shown to NSPHCDA when a published figure is withdrawn, and it closes the same provenance chain that `cell_ref` opens: the system can demonstrate both where every number came from and that a removed number left no residue.

Ledger housekeeping: `ingestion_mutations` for a `retracted` publication may be pruned 90 days after retraction; for `published` datasets the ledger is retained for the life of the dataset, since it is the only thing that makes future retraction possible. At the observed data volumes (tens of thousands of observations per workbook) ledger storage is a few MB per dataset and is not a capacity concern on the C4.

### 13.7 Dataset fitness verdict (post-pipeline)

After stages complete, the engine writes `ingestion_report.fitness`:

| Field | Meaning |
| --- | --- |
| `verdict` | `ok` \| `flagged` \| `rejected_unusable` |
| `reasons` | Machine codes (`ZERO_OBSERVATIONS`, `WRONG_GEOGRAPHY_HINT`, `UNSUPPORTED_FORMAT`, …) |
| `metrics` | Observation / hold / usable percentages and sheet counts |

**`rejected_unusable`:** non-tabular format; or zero staging observations; or usable &lt; 5% with out-of-scope ≥ 80%.  
**`flagged`:** elevated out-of-scope / pending rates; majority unknown sheets; non-Niger state names in title, sheet name, or banner cells.  
Rows are still kept for review (soft). Staff with `manage:indicators` get email + in-app alert when the verdict is not `ok` and changed since the last notification. See `src/modules/ingestion/services/ingestion-fitness.ts`.

**Acceptance tests (extend Section 10).**
1. Publish fixture workbook A, snapshot `disease_burden` aggregate checksums; publish B where B overrides two of A's values; retract B; checksums return exactly to the post-A state, including restored A values.
2. Retract A while B stands: B's rows and B's override values are untouched.
3. Kill the retract job mid-run; re-run; final state identical to an uninterrupted retraction, no mutation reversed twice.
4. Retract a dataset that created a new indicator with no other references: indicator deactivates and appears as orphaned; re-approve: indicator reactivates and series returns.
5. Dashboard KPI, trend, and LGA burden endpoints reflect retraction after recompute with no stale cache keys for affected pairs.
