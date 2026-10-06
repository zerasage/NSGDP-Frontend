> **Historical document.** Written before the system was built. Parts of it no longer match the code. The current view is the documentation site at `/docs` (source: `nsgdp-frontend/`).

# Niger State GeoHealth Portal — Backend Architecture v1.1

| Field | Detail |
|---|---|
| **Product** | Niger State GeoHealth Data Portal |
| **Document Type** | Full Backend & System Architecture Specification |
| **Version** | 1.1 |
| **Date** | July 2026 |
| **Prepared by** | Zerasage Technologies — Engineering |
| **Audience** | Backend Engineer, CTO, DevOps |
| **Status** | **Updated to reflect backend requirements for 6 prototype features** (B10.01-B10.05, B10.07) |
| **Data Confirmed** | Niger Health Facilities.gpkg (2,191 facilities, NHFR 2024, GRID3-verified, EPSG:4326) · Niger Local Govt Areas.gpkg (25 LGA polygons, INEC-sourced) · Niger Wards.gpkg · Niger Pop Estimates LGA.csv · Niger Primary and Sec Roads.gpkg · Niger State MLoS V12.1 (xlsx + gpkg) · AFP Surveillance data |

---

## Changelog

**v1.1 (July 2026)**
- Added backend support for 6 Tier 1 undocumented features from prototype Phase A+B:
  - **B10.01**: Document Repository (`/documents`) — SOPs, policies, research papers, guidelines
  - **B10.02**: Partner Data Portal (`/partner-data`) — partner-specific dataset filtering
  - **B10.03**: User Groups Management (`/admin/user-groups`) — team-based access control
  - **B10.04**: Permission Delegation (`/admin/permissions`) — granular resource permissions
  - **B10.05**: Admin Governance Module (`/admin/governance`) — indicator and SOP management
  - **B10.07**: Programme Management CRUD (`/programs`) — intervention tracking system
- Added 8 new database tables: `programmes`, `programme_reports`, `documents`, `user_groups`, `user_group_members`, `permissions`, `indicator_revisions`, `sop_register`
- Added 5 new service classes: `ProgrammeService`, `DocumentService`, `GovernanceService`, `UserGroupService`, `PermissionService`
- Added 6 new API route sections (§5.7-§5.12) with 40+ new endpoints
- Total API surface expanded from ~60 to ~100 endpoints

**v1.0 (June 2026)**
- Initial comprehensive architecture for Phase C backend implementation

---

## Part 1 — System Architecture (Holistic)

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                        NIGER STATE GEOHEALTH PORTAL                            ║
║                         FULL SYSTEM ARCHITECTURE                               ║
╚══════════════════════════════════════════════════════════════════════════════════╝

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                          CLIENT TIER                                    │
  │                                                                         │
  │   ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────┐   │
  │   │  Next.js 15 App  │  │  Mobile Browser  │  │  DHIS2 / Partner   │   │
  │   │  (App Router)    │  │  (375px+)        │  │  API Clients       │   │
  │   │  React 19 / TS   │  │                  │  │  (future)          │   │
  │   └────────┬─────────┘  └────────┬─────────┘  └─────────┬──────────┘   │
  └────────────┼────────────────────┼─────────────────────── ┼─────────────┘
               │                    │                         │
               └────────────────────┴─────────────────────────┘
                                    │  HTTPS / TLS 1.3
  ┌─────────────────────────────────▼───────────────────────────────────────┐
  │                          EDGE / INGRESS TIER                            │
  │                                                                         │
  │   ┌─────────────────────────────────────────────────────────────────┐   │
  │   │              Nginx Reverse Proxy (Docker container)             │   │
  │   │  • SSL/TLS termination (Let's Encrypt)                          │   │
  │   │  • Gzip / Brotli compression                                    │   │
  │   │  • Rate limiting (100 req/min public, 500 req/min authed)       │   │
  │   │  • Static asset serving (cached)                                │   │
  │   │  • WebSocket proxy (future notifications)                       │   │
  │   │  • Request logging → stdout (structured JSON)                   │   │
  │   └─────────────────────────────────────────────────────────────────┘   │
  └─────────────────────────────────┬───────────────────────────────────────┘
                                    │
  ┌─────────────────────────────────▼───────────────────────────────────────┐
  │                          API TIER                                       │
  │                                                                         │
  │   ┌─────────────────────────────────────────────────────────────────┐   │
  │   │          Fastify REST API — Node.js 22 + TypeScript             │   │
  │   │                    Port 3001 (internal)                         │   │
  │   │                                                                 │   │
  │   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │   │
  │   │  │  Auth    │ │ Dataset  │ │Analytics │ │  GIS / Spatial   │  │   │
  │   │  │  Module  │ │  Module  │ │  Module  │ │     Module       │  │   │
  │   │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │   │
  │   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │   │
  │   │  │  Admin   │ │ Campaign │ │  Search  │ │   Notification   │  │   │
  │   │  │  Module  │ │  Module  │ │  Module  │ │     Module       │  │   │
  │   │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │   │
  │   └─────────────────────────────────────────────────────────────────┘   │
  └─────────────────────────────────┬───────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         │                                                      │
  ┌──────▼───────────────────────────────┐   ┌─────────────────▼──────────────┐
  │        MESSAGE / QUEUE TIER          │   │         CACHE TIER             │
  │                                      │   │                                │
  │   ┌──────────────────────────────┐   │   │   ┌────────────────────────┐   │
  │   │     BullMQ Job Queues        │   │   │   │       Redis 7          │   │
  │   │     (Redis-backed)           │   │   │   │                        │   │
  │   │                              │   │   │   │  • Session store       │   │
  │   │  • upload-processing         │   │   │   │  • BullMQ backend      │   │
  │   │  • geo-extraction            │   │   │   │  • Analytics cache     │   │
  │   │  • analytics-compute         │   │   │   │    (TTL 1h–24h)        │   │
  │   │  • notification-dispatch     │   │   │   │  • Rate limit counters │   │
  │   │  • export-generation         │   │   │   │  • Search cache        │   │
  │   │  • spatial-indexing          │   │   │   │  • Pub/Sub (future     │   │
  │   │  • data-validation           │   │   │   │    WebSocket events)   │   │
  │   └──────────────┬───────────────┘   │   │   └────────────────────────┘   │
  └─────────────────┼────────────────────┘   └────────────────────────────────┘
                    │
  ┌─────────────────▼────────────────────────────────────────────────────────┐
  │                       BACKGROUND WORKER TIER                             │
  │                 (Separate Node.js process / Docker container)            │
  │                                                                          │
  │  ┌──────────────┐ ┌───────────────┐ ┌────────────────┐ ┌─────────────┐  │
  │  │  GeoWorker   │ │   ETLWorker   │ │AnalyticsWorker │ │NotifyWorker │  │
  │  │              │ │               │ │                │ │             │  │
  │  │ GPKG→PostGIS │ │ CSV / Excel   │ │ LGA burden     │ │ Email SMTP  │  │
  │  │ SHP→PostGIS  │ │ DHIS2 parse  │ │ Z-score calc   │ │ In-app bell │  │
  │  │ KML→PostGIS  │ │ PDF extract  │ │ Trend series   │ │             │  │
  │  │ GeoJSON load │ │ Type infer   │ │ Cache warm     │ │             │  │
  │  │ Spatial idx  │ │ Schema map   │ │                │ │             │  │
  │  └──────────────┘ └───────────────┘ └────────────────┘ └─────────────┘  │
  │  ┌──────────────┐ ┌───────────────┐                                      │
  │  │ExportWorker  │ │ ValidWorker   │                                      │
  │  │              │ │               │                                      │
  │  │ CSV/PDF gen  │ │ File virus    │                                      │
  │  │ MinIO temp   │ │ scan (ClamAV) │                                      │
  │  │ Presign URL  │ │ Format check  │                                      │
  │  └──────────────┘ └───────────────┘                                      │
  └──────────────────────────────────────────────────────────────────────────┘
                                    │
  ┌─────────────────────────────────▼────────────────────────────────────────┐
  │                           DATA TIER                                      │
  │                                                                          │
  │  ┌──────────────────────────┐  ┌───────────────┐  ┌──────────────────┐  │
  │  │  PostgreSQL 16           │  │  MinIO (S3)   │  │  Elasticsearch   │  │
  │  │  + PostGIS 3.4           │  │               │  │  (optional M3)   │  │
  │  │  + pg_trgm               │  │  Buckets:     │  │                  │  │
  │  │  + btree_gist            │  │  • datasets   │  │  • Full-text     │  │
  │  │                          │  │  • avatars    │  │    dataset search│  │
  │  │  Primary spatial DB      │  │  • exports    │  │  • Metadata idx  │  │
  │  │  All LGA/Ward/Facility   │  │  • temp       │  │  • Health vocab  │  │
  │  │  Disease burden tables   │  │               │  │                  │  │
  │  │  Time-series data        │  │  Max 50MB/    │  │                  │  │
  │  │  Full-text search index  │  │  file upload  │  │                  │  │
  │  └──────────────────────────┘  └───────────────┘  └──────────────────┘  │
  └──────────────────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────────────────┐
  │                      EXTERNAL INTEGRATIONS                               │
  │                                                                          │
  │  DHIS2 API → [future M2+]    SMTP/SendGrid → Email notifications         │
  │  GRID3 Nigeria GeoData       NPHCDA NHFR API → [future validation]       │
  │  OSM Tile Server → Maps      ClamAV → File virus scanning               │
  └──────────────────────────────────────────────────────────────────────────┘
```

---

## Part 2 — Backend Architecture (Detailed)

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                     BACKEND ARCHITECTURE — DETAILED VIEW                       ║
╚══════════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────────┐
│  FASTIFY API SERVER  (src/server.ts)                                             │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │  PLUGIN LAYER (Fastify plugins registered in order)                        │  │
│  │                                                                            │  │
│  │  @fastify/cors    @fastify/helmet   @fastify/rate-limit   @fastify/jwt    │  │
│  │  @fastify/multipart (file upload)  @fastify/swagger (OpenAPI 3.0)         │  │
│  │  @fastify/cookie  @fastify/sensible  fastify-plugin (custom)              │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │  MIDDLEWARE PIPELINE (applied to all routes)                               │  │
│  │                                                                            │  │
│  │  Request ID injection → Auth token verify → Role resolver →               │  │
│  │  Request validation (Zod) → Audit log hook → Response serialise           │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  ROUTE MODULES  (src/routes/)                                           │    │
│  │                                                                         │    │
│  │  /auth/*         /datasets/*      /organisations/*   /groups/*          │    │
│  │  /search         /analytics/*     /gis/*             /campaigns/*       │    │
│  │  /admin/*        /facilities/*    /submissions/*     /notifications/*   │    │
│  │  /exports/*      /uploads         /health            /programs/*        │    │
│  │  /documents/*    /partner-data    /user-groups/*     /permissions/*     │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  SERVICE LAYER  (src/services/)                                         │    │
│  │                                                                         │    │
│  │  ┌──────────────────┐  ┌───────────────────┐  ┌──────────────────────┐ │    │
│  │  │  AuthService     │  │  DatasetService   │  │  GeoSpatialService   │ │    │
│  │  │                  │  │                   │  │                      │ │    │
│  │  │ register()       │  │ list(filters)     │  │ getFacilities(bbox)  │ │    │
│  │  │ login()          │  │ getBySlug()       │  │ getLGABoundaries()   │ │    │
│  │  │ refreshToken()   │  │ create()          │  │ getDiseaseBubbles()  │ │    │
│  │  │ revokeToken()    │  │ update()          │  │ getWardBoundaries()  │ │    │
│  │  │ setupMFA()       │  │ archive()         │  │ spatialJoin()        │ │    │
│  │  │ verifyMFA()      │  │ getVersions()     │  │ simplifyGeom()       │ │    │
│  │  │ resetPassword()  │  │ requestDownload() │  │ clusterPoints()      │ │    │
│  │  └──────────────────┘  └───────────────────┘  └──────────────────────┘ │    │
│  │                                                                         │    │
│  │  ┌──────────────────┐  ┌───────────────────┐  ┌──────────────────────┐ │    │
│  │  │ AnalyticsService │  │  SearchService    │  │  UploadService       │ │    │
│  │  │                  │  │                   │  │                      │ │    │
│  │  │ getLGABurden()   │  │ fullText()        │  │ processFile()        │ │    │
│  │  │ getTrends()      │  │ suggest()         │  │ detectFormat()       │ │    │
│  │  │ getOutliers()    │  │ searchFacilities()│  │ validateFile()       │ │    │
│  │  │ getKPIs()        │  │                   │  │ enqueueIngestion()   │ │    │
│  │  │ exportCSV()      │  │                   │  │ trackProgress()      │ │    │
│  │  │ exportPDF()      │  │                   │  │                      │ │    │
│  │  └──────────────────┘  └───────────────────┘  └──────────────────────┘ │    │
│  │                                                                         │    │
│  │  ┌──────────────────┐  ┌───────────────────┐  ┌──────────────────────┐ │    │
│  │  │  AdminService    │  │  NotifyService    │  │  AuditService        │ │    │
│  │  │                  │  │                   │  │                      │ │    │
│  │  │ getReviewQueue() │  │ sendEmail()       │  │ log(event)           │ │    │
│  │  │ approveDataset() │  │ createInApp()     │  │ query(filters)       │ │    │
│  │  │ rejectDataset()  │  │ markRead()        │  │ exportCSV()          │ │    │
│  │  │ manageUsers()    │  │                   │  │                      │ │    │
│  │  │ getAuditLogs()   │  │                   │  │                      │ │    │
│  │  └──────────────────┘  └───────────────────┘  └──────────────────────┘ │    │
│  │                                                                         │    │
│  │  ┌──────────────────┐  ┌───────────────────┐  ┌──────────────────────┐ │    │
│  │  │ ProgrammeService │  │ DocumentService   │  │ GovernanceService    │ │    │
│  │  │                  │  │                   │  │                      │ │    │
│  │  │ list()           │  │ list()            │  │ getIndicators()      │ │    │
│  │  │ getById()        │  │ getBySlug()       │  │ createIndicator()    │ │    │
│  │  │ create()         │  │ search()          │  │ updateIndicator()    │ │    │
│  │  │ update()         │  │ uploadSOP()       │  │ archiveIndicator()   │ │    │
│  │  │ archive()        │  │ uploadPolicy()    │  │ getSOPs()            │ │    │
│  │  │ uploadReport()   │  │ uploadResearch()  │  │ manageSOPs()         │ │    │
│  │  └──────────────────┘  └───────────────────┘  └──────────────────────┘ │    │
│  │                                                                         │    │
│  │  ┌──────────────────┐  ┌───────────────────┐                             │    │
│  │  │UserGroupService  │  │ PermissionService │                             │    │
│  │  │                  │  │                   │                             │    │
│  │  │ listGroups()     │  │ getMatrix()       │                             │    │
│  │  │ createGroup()    │  │ assignPermission()│                             │    │
│  │  │ updateGroup()    │  │ revokePermission()│                             │    │
│  │  │ deleteGroup()    │  │ delegateToUser()  │                             │    │
│  │  │ addMembers()     │  │ getEffective()    │                             │    │
│  │  │ removeMembers()  │  │                   │                             │    │
│  │  └──────────────────┘  └───────────────────┘                             │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  DATA ACCESS LAYER  (src/db/)                                           │    │
│  │                                                                         │    │
│  │  postgres.ts (pg pool singleton)  redis.ts (ioredis singleton)          │    │
│  │  minio.ts (MinIO client)          queries/ (raw SQL — no ORM)           │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────┐
│  BACKGROUND WORKER PROCESS  (src/workers/)                                       │
│  Runs as a separate Node.js process, shares same codebase, no HTTP server        │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐   │
│  │  GeoWorker — handles ALL geospatial file ingestion                        │   │
│  │                                                                           │   │
│  │  Formats handled natively (no GDAL dependency):                           │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │   │
│  │  │  GeoPackage (.gpkg)  → better-sqlite3 reads SQLite layer            │  │   │
│  │  │    → parse WKB geometry (gpkg-geom header strip)                   │  │   │
│  │  │    → bulk INSERT to PostGIS via ST_GeomFromWKB($1, 4326)            │  │   │
│  │  │    → build GIST spatial index after bulk load                       │  │   │
│  │  │                                                                     │  │   │
│  │  │  GeoJSON (.geojson)  → native JSON.parse()                          │  │   │
│  │  │    → validate with @turf/helpers isValid()                          │  │   │
│  │  │    → stream features → INSERT ST_GeomFromGeoJSON()                  │  │   │
│  │  │                                                                     │  │   │
│  │  │  Shapefile (.zip with .shp/.dbf/.shx/.prj)                          │  │   │
│  │  │    → unzip → shapefile npm pkg → stream features                    │  │   │
│  │  │    → project to 4326 if PRJ ≠ WGS84 (proj4 npm pkg)                │  │   │
│  │  │    → INSERT to staging table → classify → copy to target             │  │   │
│  │  │                                                                     │  │   │
│  │  │  KML / KMZ (.kml, .kmz)                                             │  │   │
│  │  │    → if .kmz: unzip → .kml → @tmcw/togeojson → GeoJSON path        │  │   │
│  │  │                                                                     │  │   │
│  │  │  CSV with lat/lng columns                                           │  │   │
│  │  │    → csv-parse stream → detect lat/lng col by heuristic             │  │   │
│  │  │    → ST_SetSRID(ST_MakePoint(lng, lat), 4326)                       │  │   │
│  │  └─────────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                           │   │
│  │  After any geo load:                                                      │   │
│  │    1. ANALYZE table (update planner stats)                                │   │
│  │    2. Compute bbox → store in datasets.bbox (EPSG:4326)                   │   │
│  │    3. Generate simplified GeoJSON preview (ST_Simplify tolerance=0.001)   │   │
│  │    4. Cache preview in Redis (key: geo:preview:{dataset_id}, TTL 24h)     │   │
│  │    5. Emit 'geo-loaded' event → triggers analytics recompute if relevant  │   │
│  └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐   │
│  │  ETLWorker — handles ALL tabular / document ingestion                     │   │
│  │                                                                           │   │
│  │  CSV / TSV                                                                │   │
│  │    → csv-parse with autodetect delimiter                                  │   │
│  │    → infer column types (number / date / text / boolean)                  │   │
│  │    → detect lat/lng columns (regex: lat|latitude|y_coord etc.)            │   │
│  │    → if spatial: route to GeoWorker via 'geo-extraction' queue            │   │
│  │    → build key_attributes schema (field_name, type, sample, count_null)   │   │
│  │    → store raw data in JSONB dataset_content column for preview            │   │
│  │    → build tsvector for full-text search                                  │   │
│  │                                                                           │   │
│  │  Excel (.xlsx / .xls)                                                     │   │
│  │    → xlsx (SheetJS) reads workbook                                        │   │
│  │    → iterate sheets → convert each to row array                           │   │
│  │    → same column inference as CSV                                         │   │
│  │    → extract first 100 rows as preview                                    │   │
│  │                                                                           │   │
│  │  DHIS2 Export (.json DHIS2 format)                                        │   │
│  │    → parse dataValues[] array                                             │   │
│  │    → map dataElement → disease_indicators.dhis2_data_element_id           │   │
│  │    → map orgUnit → lga_boundaries / ward_boundaries / health_facilities   │   │
│  │    → map period ('202401' → year=2024, month=1)                           │   │
│  │    → UPSERT into disease_burden table                                     │   │
│  │                                                                           │   │
│  │  PDF                                                                      │   │
│  │    → pdf-parse → extract raw text                                         │   │
│  │    → update dataset.extracted_text for search indexing                    │   │
│  │    → store first 2 pages as description supplement                        │   │
│  └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐   │
│  │  AnalyticsWorker — pre-computes and caches all dashboard aggregations     │   │
│  │                                                                           │   │
│  │  Triggered by: dataset approved event | scheduled (0 2 * * * UTC)        │   │
│  │                                                                           │   │
│  │  For each disease indicator × each year in dataset range:                 │   │
│  │    1. LGA Burden Table:                                                   │   │
│  │       SELECT lga_id, SUM(value) as total_cases,                           │   │
│  │              COUNT(DISTINCT facility_id) as facility_count,               │   │
│  │              (SUM(value) / pop.population * 1000) as incidence            │   │
│  │       FROM disease_burden JOIN lga_boundaries ON ...                      │   │
│  │       GROUP BY lga_id ORDER BY total_cases DESC                           │   │
│  │       → Store in analytics_cache (key: lga_burden:{indicator}:{year})     │   │
│  │                                                                           │   │
│  │    2. Outlier Detection (Z-Score):                                        │   │
│  │       mean = AVG(value) per LGA group                                     │   │
│  │       stddev = STDDEV(value) per LGA group                                │   │
│  │       z_score = (facility_value - mean) / stddev                          │   │
│  │       WHERE ABS(z_score) >= 2.0 → flagged as outlier                      │   │
│  │       → Store in outlier_facilities cache                                  │   │
│  │                                                                           │   │
│  │    3. Trends:                                                             │   │
│  │       Annual: GROUP BY year → sorted time series                         │   │
│  │       Monthly: GROUP BY year, month → seasonality array                   │   │
│  │       → Store in trend_cache (key: trend:{indicator}:annual)              │   │
│  │                                                                           │   │
│  │    4. KPI Totals:                                                         │   │
│  │       total_cases (all time), facility_count, lga_count (25), outlier_n  │   │
│  │       → Store in kpi_cache (key: kpi:{indicator})                         │   │
│  │       → Redis TTL: 1 hour (volatile data), 24h (stable reference data)    │   │
│  └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐   │
│  │  ValidationWorker — runs before any ingestion job proceeds                │   │
│  │                                                                           │   │
│  │  1. File format validation (mime type + magic bytes check)                │   │
│  │  2. File size enforcement (≤ 50MB)                                        │   │
│  │  3. ClamAV virus scan (via clamav npm / TCP socket to ClamAV daemon)      │   │
│  │  4. Geometry validity check (ST_IsValid for loaded features)              │   │
│  │  5. Coordinate range check (for Niger State: bbox 3°–7.5°E, 8°–11.5°N)   │   │
│  │  6. Required metadata completeness check (95% threshold)                  │   │
│  │  → Pass: enqueue to geo-extraction or ETL queue                           │   │
│  │  → Fail: update job status to 'validation_failed', notify contributor     │   │
│  └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐   │
│  │  NotificationWorker                                                       │   │
│  │                                                                           │   │
│  │  Email events (nodemailer + SMTP/SendGrid):                               │   │
│  │  • submission_received: to contributor                                    │   │
│  │  • dataset_approved: to contributor (+ presigned download of dataset)     │   │
│  │  • dataset_rejected: to contributor (with rejection reason)               │   │
│  │  • revision_requested: to contributor (with comment text)                 │   │
│  │  • account_approved: to new partner/admin user                            │   │
│  │  → Handlebars email templates in src/templates/email/                     │   │
│  │  → In-app: INSERT into notifications table (bell icon count via API)      │   │
│  └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐   │
│  │  ExportWorker                                                             │   │
│  │                                                                           │   │
│  │  CSV export:  query → papaparse → stream to MinIO temp bucket             │   │
│  │  PDF export:  puppeteer headless → render analytics HTML → print PDF      │   │
│  │  GeoJSON export: PostGIS ST_AsGeoJSON → stream to MinIO                   │   │
│  │  Shapefile export: geojson-to-shp → zip → MinIO                           │   │
│  │  → All exports: presigned URL (TTL 1 hour), stored in export_jobs table   │   │
│  └───────────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 3 — Data Ingestion Pipeline

```
                    FILE UPLOAD → PROCESSING → PUBLICATION FLOW

  Contributor                 API Server              Worker Tier           Database
      │                           │                       │                    │
      │── POST /uploads ─────────▶│                       │                    │
      │   multipart/form-data     │                       │                    │
      │   (≤ 50MB)                │                       │                    │
      │                           │── write to MinIO ────▶│                    │
      │                           │   (staging bucket)    │                    │
      │                           │── INSERT ingestion ──▶│                    │
      │                           │   _jobs (PENDING)     │                    │
      │                           │── enqueue validation ─▶│                   │
      │                           │   job (BullMQ)        │                    │
      │◀── 202 Accepted ──────────│                       │                    │
      │    {jobId, status}        │                       │                    │
      │                           │                       │── ValidationWorker │
      │                           │                       │   • mime check     │
      │                           │                       │   • size check     │
      │                           │                       │   • ClamAV scan    │
      │                           │                       │                    │
      │                           │                       │── IF FAIL ─────────│
      │                           │                       │   update job FAILED│
      │                           │                       │   enqueue notify   │
      │                           │                       │                    │
      │                           │                       │── IF PASS ─────────│
      │                           │                       │   detect format    │
      │                           │                       │   route to queue:  │
      │                           │                       │                    │
      │                           │                       │  GPKG/SHP/KML/GeoJSON
      │                           │                       │  → geo-extraction  │
      │                           │                       │    queue           │
      │                           │                       │                    │
      │                           │                       │  CSV/XLSX/DHIS2/PDF
      │                           │                       │  → etl queue       │
      │                           │                       │                    │
      │── GET /uploads/{jobId} ──▶│                       │── GeoWorker ──────▶│
      │   (polling progress)      │◀─ progress% ──────────│   or ETLWorker     │
      │◀── {status, progress} ────│                       │   → INSERT data    │
      │                           │                       │   → build index    │
      │                           │                       │   → generate preview
      │                           │                       │                    │
      │                           │                       │── UPDATE job       │
      │                           │                       │   COMPLETED        │
      │                           │                       │── UPDATE dataset   │
      │                           │                       │   status=submitted │
      │                           │                       │── enqueue notify   │
      │                           │                       │   (submission_rcvd)│
      │                           │                       │                    │
                            ADMIN REVIEW                                        │
      │                           │                       │                    │
 Admin│── POST /admin/datasets ──▶│                       │                    │
      │   /{id}/approve           │── UPDATE dataset ────────────────────────▶ │
      │                           │   status=published    │                    │
      │                           │── enqueue analytics ─▶│                    │
      │                           │   recompute           │                    │
      │                           │── enqueue notify ────▶│                    │
      │                           │   (approved email)    │                    │
      │◀── 200 OK ────────────────│                       │                    │
```

---

## Part 4 — Database Schema (Complete)

### 4.1 Spatial Reference Tables (pre-seeded at deployment)

```sql
-- ============================================================
-- LGA BOUNDARIES  (from Niger Local Govt Areas.gpkg)
-- 25 LGAs: Agaie, Agwara, Bida, Borgu, Bosso, Chanchaga, 
--          Edati, Gbako, Gurara, Katcha, Kontagora, Lapai,
--          Lavun, Magama, Mariga, Mashegu, Mokwa, Munya,
--          Paikoro, Rafi, Rijau, Shiroro, Suleja, Tafa, Wushishi
-- ============================================================
CREATE TABLE lga_boundaries (
  id            SERIAL PRIMARY KEY,
  lga_code      VARCHAR(10)  UNIQUE NOT NULL,  -- '27001' (INEC)
  lga_name      VARCHAR(100) NOT NULL,          -- 'Agaie'
  state_name    VARCHAR(50)  DEFAULT 'Niger',
  state_code    VARCHAR(5)   DEFAULT 'NI',
  global_id     UUID,
  source        VARCHAR(50),                   -- 'INEC'
  amap_code     VARCHAR(50),                   -- 'NIE NIS AGA'
  population    INTEGER,                       -- from Niger Pop Estimates LGA.csv
  area_sqkm     NUMERIC(10,2),
  geom          GEOMETRY(MULTIPOLYGON, 4326),
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX idx_lga_geom       ON lga_boundaries USING GIST(geom);
CREATE INDEX idx_lga_name       ON lga_boundaries(lga_name);
CREATE INDEX idx_lga_code       ON lga_boundaries(lga_code);

-- ============================================================
-- WARD BOUNDARIES  (from Niger Wards.gpkg — 274 wards)
-- ============================================================
CREATE TABLE ward_boundaries (
  id         SERIAL PRIMARY KEY,
  ward_name  VARCHAR(100) NOT NULL,
  ward_code  VARCHAR(30),
  lga_id     INTEGER REFERENCES lga_boundaries(id),
  lga_name   VARCHAR(100),
  population INTEGER,
  geom       GEOMETRY(MULTIPOLYGON, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_ward_geom ON ward_boundaries USING GIST(geom);
CREATE INDEX idx_ward_lga  ON ward_boundaries(lga_id);

-- ============================================================
-- HEALTH FACILITIES  (from Niger Health Facilities.gpkg)
-- 2,191 facilities. Real schema derived from actual file.
-- nhfr_facility_code format: '26/01/1/1/1/0029'
--   → state/lga/type/level/ownership/serial
-- Sources: NHFR 2024, GRID3/eHealth Africa, CIESIN
-- ============================================================
CREATE TABLE health_facilities (
  id                       SERIAL PRIMARY KEY,
  nhfr_uid                 BIGINT  UNIQUE,                 -- 27501514
  nhfr_facility_code       VARCHAR(30),                    -- '26/01/1/1/1/0029'
  global_id                UUID,
  facility_name            VARCHAR(200) NOT NULL,
  facility_name_source     VARCHAR(50),                    -- 'NHFR_2024'
  ownership                VARCHAR(30),                    -- 'Public' / 'Private'
  ownership_type           VARCHAR(100),                   -- 'Local Government'
  facility_level           VARCHAR(20),                    -- 'Primary' / 'Secondary' / 'Tertiary'
  facility_level_option    VARCHAR(100),                   -- 'Primary Health Center'
  lga_id                   INTEGER REFERENCES lga_boundaries(id),
  lga_name                 VARCHAR(100),                   -- denormalised for query speed
  lga_name_disagreement    NUMERIC(5,2),
  ward_id                  INTEGER REFERENCES ward_boundaries(id),
  ward_name                VARCHAR(100),
  ward_name_disagreement   NUMERIC(5,2),
  latitude                 NUMERIC(10,7),
  longitude                NUMERIC(10,7),
  geom                     GEOMETRY(POINT, 4326),
  geocoordinates_source    VARCHAR(50),                    -- 'GRID3_EHEALTH'
  is_mapped                BOOLEAN DEFAULT TRUE,
  is_active                BOOLEAN DEFAULT TRUE,
  needs_validation         BOOLEAN DEFAULT FALSE,
  state_code               VARCHAR(5) DEFAULT 'NI',
  source_name              VARCHAR(50),                    -- 'CIESIN'
  source_dataset_id        INTEGER,
  last_updated             DATE,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_facility_geom      ON health_facilities USING GIST(geom);
CREATE INDEX idx_facility_lga       ON health_facilities(lga_id);
CREATE INDEX idx_facility_ward      ON health_facilities(ward_id);
CREATE INDEX idx_facility_level     ON health_facilities(facility_level);
CREATE INDEX idx_facility_ownership ON health_facilities(ownership);
CREATE INDEX idx_facility_nhfr_code ON health_facilities(nhfr_facility_code);
-- Full-text search on facility name
CREATE INDEX idx_facility_name_fts  ON health_facilities 
  USING GIN(to_tsvector('english', facility_name));

-- ============================================================
-- ROADS  (from Niger Primary and Sec Roads.gpkg — for future use)
-- ============================================================
CREATE TABLE road_network (
  id         SERIAL PRIMARY KEY,
  road_name  VARCHAR(200),
  road_type  VARCHAR(50),     -- 'Primary' / 'Secondary'
  lga_id     INTEGER REFERENCES lga_boundaries(id),
  geom       GEOMETRY(MULTILINESTRING, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_road_geom ON road_network USING GIST(geom);
```

### 4.2 User & Authentication Tables

```sql
CREATE TYPE user_role AS ENUM (
  'public', 'registered', 'contributor', 'org_admin', 
  'nsphcda_admin', 'super_admin'
);
CREATE TYPE access_level AS ENUM ('public', 'partner', 'admin');
CREATE TYPE account_status AS ENUM ('pending', 'active', 'suspended', 'banned');

CREATE TABLE users (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  username         VARCHAR(50)  UNIQUE NOT NULL,
  full_name        VARCHAR(200),
  email            VARCHAR(255) UNIQUE NOT NULL,
  phone            VARCHAR(20),
  password_hash    VARCHAR(255) NOT NULL,                 -- bcrypt, cost 12
  role             user_role    NOT NULL DEFAULT 'registered',
  access_level     access_level NOT NULL DEFAULT 'public',
  status           account_status DEFAULT 'pending',
  reason           TEXT,                                  -- reason for registering (500 chars)
  organisation_id  INTEGER,                              -- FK set after table created
  approved_by      UUID REFERENCES users(id),
  approved_at      TIMESTAMPTZ,
  last_login_at    TIMESTAMPTZ,
  login_count      INTEGER DEFAULT 0,
  failed_attempts  SMALLINT DEFAULT 0,
  locked_until     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_users_email  ON users(email);
CREATE INDEX idx_users_role   ON users(role);
CREATE INDEX idx_users_status ON users(status);

CREATE TABLE refresh_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) UNIQUE NOT NULL,               -- SHA-256 of token
  expires_at  TIMESTAMPTZ NOT NULL,
  ip_address  INET,
  user_agent  VARCHAR(500),
  revoked     BOOLEAN     DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);

CREATE TABLE mfa_credentials (
  user_id      UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  secret       VARCHAR(100) NOT NULL,                     -- TOTP secret (encrypted at rest)
  is_verified  BOOLEAN DEFAULT FALSE,
  backup_codes TEXT[],                                    -- encrypted backup codes
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE password_reset_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3 Organisation & Group Tables

```sql
CREATE TABLE organisations (
  id           SERIAL PRIMARY KEY,
  slug         VARCHAR(100) UNIQUE NOT NULL,
  name         VARCHAR(200) NOT NULL,
  acronym      VARCHAR(20),
  sector       VARCHAR(100),
  logo_url     VARCHAR(500),
  brand_color  VARCHAR(7),
  description  TEXT,
  website_url  VARCHAR(500),
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE categories (
  id              SERIAL PRIMARY KEY,
  slug            VARCHAR(100) UNIQUE NOT NULL,
  name            VARCHAR(200) NOT NULL,           -- 'Disease Data'
  description     TEXT,
  icon            VARCHAR(50),                     -- emoji or icon name
  cover_image_url VARCHAR(500),
  display_order   SMALLINT DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE
);

-- Seed categories:
-- ('disease-data',  'Disease Data',        '🦠', 1)
-- ('health-facilities', 'Health Facilities','🏥', 2)
-- ('population',    'Population',          '👥', 3)
-- ('surveillance',  'Surveillance',        '🔍', 4)

CREATE TABLE organisation_members (
  organisation_id  INTEGER   REFERENCES organisations(id) ON DELETE CASCADE,
  user_id          UUID      REFERENCES users(id) ON DELETE CASCADE,
  role             VARCHAR(50) DEFAULT 'member',
  joined_at        TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (organisation_id, user_id)
);
```

### 4.4 Dataset Management Tables

```sql
CREATE TYPE dataset_status AS ENUM (
  'draft', 'submitted', 'under_review', 'needs_revision',
  'published', 'rejected', 'archived'
);
CREATE TYPE visibility_level AS ENUM ('public', 'restricted', 'private');
CREATE TYPE file_format AS ENUM (
  'CSV', 'XLSX', 'JSON', 'GeoJSON', 'GeoPackage', 'Shapefile',
  'KML', 'KMZ', 'PDF', 'DHIS2', 'Other'
);
CREATE TYPE update_frequency AS ENUM (
  'daily', 'weekly', 'monthly', 'quarterly', 'annually', 'one_time', 'irregular'
);

CREATE TABLE datasets (
  id               SERIAL PRIMARY KEY,
  slug             VARCHAR(200) UNIQUE NOT NULL,
  title            VARCHAR(300) NOT NULL,
  description      TEXT,
  category_id      INTEGER REFERENCES categories(id),
  organisation_id  INTEGER REFERENCES organisations(id),
  custodian        VARCHAR(200),                          -- data custodian name
  contact_email    VARCHAR(255),
  date_collected   DATE,
  date_updated     DATE,
  update_frequency update_frequency,
  methodology      TEXT,
  citation         TEXT,
  tags             TEXT[],
  format           file_format,
  file_size_bytes  BIGINT,
  visibility       visibility_level DEFAULT 'public',
  status           dataset_status DEFAULT 'draft',
  
  -- Geospatial metadata (populated by GeoWorker)
  is_spatial       BOOLEAN DEFAULT FALSE,
  geom_type        VARCHAR(50),                           -- 'Point', 'Polygon', etc.
  bbox             GEOMETRY(POLYGON, 4326),               -- bounding box
  srid             INTEGER DEFAULT 4326,
  feature_count    INTEGER,
  lga_coverage     INTEGER[],                             -- array of lga_boundary IDs
  
  -- Content (populated by ETLWorker)  
  extracted_text   TEXT,                                  -- for PDF full-text search
  column_schema    JSONB,                                 -- [{name, type, sample, null_count}]
  preview_url      VARCHAR(500),                          -- MinIO presigned URL to GeoJSON preview
  
  -- Versioning
  version          INTEGER DEFAULT 1,
  parent_id        INTEGER REFERENCES datasets(id),       -- for version chain
  
  -- Tracking
  download_count   INTEGER DEFAULT 0,
  view_count       INTEGER DEFAULT 0,
  submitted_by     UUID REFERENCES users(id),
  reviewed_by      UUID REFERENCES users(id),
  approved_at      TIMESTAMPTZ,
  
  -- Search vector (auto-maintained by trigger)
  search_vector    tsvector,
  
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dataset_status      ON datasets(status);
CREATE INDEX idx_dataset_visibility  ON datasets(visibility);
CREATE INDEX idx_dataset_category    ON datasets(category_id);
CREATE INDEX idx_dataset_org         ON datasets(organisation_id);
CREATE INDEX idx_dataset_format      ON datasets(format);
CREATE INDEX idx_dataset_spatial     ON datasets(is_spatial);
CREATE INDEX idx_dataset_bbox        ON datasets USING GIST(bbox) WHERE is_spatial = TRUE;
CREATE INDEX idx_dataset_search      ON datasets USING GIN(search_vector);
CREATE INDEX idx_dataset_tags        ON datasets USING GIN(tags);
CREATE INDEX idx_dataset_lga_cov     ON datasets USING GIN(lga_coverage);

-- Auto-update search_vector on upsert
CREATE TRIGGER tsvector_update
  BEFORE INSERT OR UPDATE ON datasets
  FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.english',
    title, description, methodology, extracted_text);

CREATE TABLE dataset_resources (
  id                SERIAL PRIMARY KEY,
  dataset_id        INTEGER REFERENCES datasets(id) ON DELETE CASCADE,
  name              VARCHAR(300) NOT NULL,
  format            file_format,
  file_path         VARCHAR(500) NOT NULL,               -- MinIO object key
  file_size_bytes   BIGINT,
  checksum_sha256   VARCHAR(64),
  is_primary        BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dataset_key_attributes (
  id           SERIAL PRIMARY KEY,
  dataset_id   INTEGER REFERENCES datasets(id) ON DELETE CASCADE,
  field_name   VARCHAR(200) NOT NULL,
  data_type    VARCHAR(50),
  example_value TEXT,
  description  TEXT,
  display_order SMALLINT DEFAULT 0
);

CREATE TABLE dataset_downloads (
  id          BIGSERIAL PRIMARY KEY,
  dataset_id  INTEGER     REFERENCES datasets(id),
  user_id     UUID        REFERENCES users(id),          -- NULL for public downloads
  ip_address  INET,
  user_agent  VARCHAR(500),
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_downloads_dataset ON dataset_downloads(dataset_id);
CREATE INDEX idx_downloads_user    ON dataset_downloads(user_id);
CREATE INDEX idx_downloads_date    ON dataset_downloads(downloaded_at);

CREATE TABLE access_requests (
  id           SERIAL PRIMARY KEY,
  user_id      UUID    NOT NULL REFERENCES users(id),
  dataset_id   INTEGER NOT NULL REFERENCES datasets(id),
  reason       TEXT    NOT NULL,
  status       VARCHAR(20) DEFAULT 'pending',           -- pending/approved/denied
  reviewed_by  UUID REFERENCES users(id),
  reviewed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, dataset_id)
);
```

### 4.5 Approval Workflow Tables

```sql
CREATE TABLE submission_tickets (
  id                  SERIAL PRIMARY KEY,
  reference           VARCHAR(30) UNIQUE NOT NULL,       -- 'SUB-2026-00042'
  dataset_id          INTEGER NOT NULL REFERENCES datasets(id),
  submitted_by        UUID    NOT NULL REFERENCES users(id),
  
  -- Step 1: Initial Review
  initial_review_at   TIMESTAMPTZ,
  initial_reviewer_id UUID REFERENCES users(id),
  
  -- Step 2: Quality Assessment
  qa_at               TIMESTAMPTZ,
  qa_reviewer_id      UUID REFERENCES users(id),
  qa_notes            TEXT,
  completeness_score  NUMERIC(5,2),                     -- % of required metadata filled
  
  -- Step 3: Approval/Rejection
  final_action        VARCHAR(20),                      -- 'approved' | 'rejected' | 'revision_requested'
  final_action_at     TIMESTAMPTZ,
  final_reviewer_id   UUID REFERENCES users(id),
  rejection_reason    TEXT,
  revision_comment    TEXT,
  
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workflow_actions (
  id          SERIAL PRIMARY KEY,
  ticket_id   INTEGER NOT NULL REFERENCES submission_tickets(id),
  action      VARCHAR(50) NOT NULL,                     -- 'submitted', 'approved', 'rejected', ...
  performed_by UUID REFERENCES users(id),
  comment     TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_workflow_ticket ON workflow_actions(ticket_id);
```

### 4.6 Disease Burden & Analytics Tables

```sql
-- Master list of health metrics/indicators
CREATE TABLE disease_indicators (
  id                      SERIAL PRIMARY KEY,
  slug                    VARCHAR(100) UNIQUE NOT NULL,
  name                    VARCHAR(200) NOT NULL,         -- 'Severe Malaria Cases'
  category                VARCHAR(50),                  -- 'disease', 'maternal', 'immunisation'
  unit                    VARCHAR(50),                  -- 'cases', 'coverage_pct', 'deaths'
  description             TEXT,
  dhis2_data_element_id   VARCHAR(50),                  -- for future DHIS2 sync
  dhis2_indicator_id      VARCHAR(50),
  is_active               BOOLEAN DEFAULT TRUE,
  display_order           SMALLINT DEFAULT 0
);

-- Seed indicators (from PRD v2.0 FR-06.1):
-- Severe Malaria Cases | Meningitis Cases | Cholera Cases | Diphtheria Cases
-- ANC Attendance | Delivery with SBA | Routine Immunisation | U5 Mortality | Death Cases

-- Core time-series disease burden table
-- Designed to handle both aggregate (LGA-level) and facility-level data
CREATE TABLE disease_burden (
  id               BIGSERIAL PRIMARY KEY,
  indicator_id     INTEGER      NOT NULL REFERENCES disease_indicators(id),
  lga_id           INTEGER      REFERENCES lga_boundaries(id),
  ward_id          INTEGER      REFERENCES ward_boundaries(id),
  facility_id      INTEGER      REFERENCES health_facilities(id),
  
  value            NUMERIC(12,2) NOT NULL,
  period_year      SMALLINT     NOT NULL,
  period_month     SMALLINT,                            -- NULL = annual aggregate
  period_quarter   SMALLINT,
  period_type      VARCHAR(10)  DEFAULT 'annual',       -- 'annual' | 'monthly' | 'quarterly'
  
  data_source      VARCHAR(100),                        -- 'DHIS2' | 'NHMIS' | 'NSPHCDA' | 'AFP'
  source_dataset_id INTEGER REFERENCES datasets(id),
  notes            TEXT,
  
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  
  -- Composite unique constraint to prevent duplicate entries
  UNIQUE (indicator_id, lga_id, ward_id, facility_id, period_year, period_month, data_source)
);
CREATE INDEX idx_burden_indicator ON disease_burden(indicator_id);
CREATE INDEX idx_burden_lga       ON disease_burden(lga_id);
CREATE INDEX idx_burden_facility  ON disease_burden(facility_id);
CREATE INDEX idx_burden_period    ON disease_burden(period_year, period_month);
CREATE INDEX idx_burden_source    ON disease_burden(data_source);

-- Pre-computed analytics cache (also backed by Redis)
-- Stores JSON blobs of expensive aggregation results
CREATE TABLE analytics_cache (
  cache_key     VARCHAR(300) PRIMARY KEY,               -- 'lga_burden:malaria:2024'
  data          JSONB        NOT NULL,
  computed_at   TIMESTAMPTZ  DEFAULT NOW(),
  expires_at    TIMESTAMPTZ,
  indicator_id  INTEGER REFERENCES disease_indicators(id),
  year          SMALLINT
);
CREATE INDEX idx_analytics_expires ON analytics_cache(expires_at);

-- Population reference table (from Niger Pop Estimates LGA.csv)
CREATE TABLE population_estimates (
  id          SERIAL PRIMARY KEY,
  lga_id      INTEGER REFERENCES lga_boundaries(id),
  ward_id     INTEGER REFERENCES ward_boundaries(id),
  year        SMALLINT NOT NULL,
  population  INTEGER  NOT NULL,
  source      VARCHAR(100),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (lga_id, ward_id, year)
);
```

### 4.7 Campaigns Table

```sql
CREATE TYPE campaign_status AS ENUM ('planned', 'ongoing', 'completed', 'cancelled');

CREATE TABLE campaigns (
  id               SERIAL PRIMARY KEY,
  slug             VARCHAR(200) UNIQUE NOT NULL,
  name             VARCHAR(300) NOT NULL,
  description      TEXT,
  status           campaign_status DEFAULT 'planned',
  start_date       DATE,
  end_date         DATE,
  coverage_metric  VARCHAR(200),                        -- 'MR Coverage %'
  vaccinated_count INTEGER DEFAULT 0,
  target_count     INTEGER DEFAULT 0,
  lga_count        SMALLINT DEFAULT 0,
  active_days      INTEGER,
  disease_focus    VARCHAR(100),                        -- 'Measles-Rubella'
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campaign_lga_coverage (
  campaign_id  INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
  lga_id       INTEGER REFERENCES lga_boundaries(id),
  coverage_pct NUMERIC(5,2),
  vaccinated   INTEGER,
  target       INTEGER,
  PRIMARY KEY (campaign_id, lga_id)
);
```

### 4.8 Audit, Notifications & Jobs Tables

```sql
-- Immutable audit log — never UPDATE or DELETE rows here
CREATE TABLE audit_logs (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID      REFERENCES users(id),
  action        VARCHAR(100) NOT NULL,                  -- 'dataset.upload', 'dataset.approve', etc.
  resource_type VARCHAR(50),                            -- 'dataset', 'user', 'facility', etc.
  resource_id   VARCHAR(100),
  metadata      JSONB,                                  -- additional context as JSON
  ip_address    INET,
  user_agent    VARCHAR(500),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_user     ON audit_logs(user_id);
CREATE INDEX idx_audit_action   ON audit_logs(action);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_date     ON audit_logs(created_at DESC);

CREATE TABLE notifications (
  id          SERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(100) NOT NULL,                    -- 'dataset_approved', 'account_approved'
  title       VARCHAR(300),
  body        TEXT,
  action_url  VARCHAR(500),
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notif_user    ON notifications(user_id, is_read);
CREATE INDEX idx_notif_created ON notifications(created_at DESC);

-- Background job tracking (all worker jobs logged here)
CREATE TYPE job_status AS ENUM (
  'pending', 'validating', 'processing', 'completed', 'failed', 'cancelled'
);

CREATE TABLE ingestion_jobs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id      INTEGER     REFERENCES datasets(id),
  queue_name      VARCHAR(100) NOT NULL,                -- 'geo-extraction', 'etl', etc.
  file_path       VARCHAR(500),                         -- MinIO object key
  file_format     VARCHAR(50),
  file_size_bytes BIGINT,
  status          job_status  DEFAULT 'pending',
  progress        SMALLINT    DEFAULT 0,                -- 0–100
  error_message   TEXT,
  steps           JSONB,                                -- [{name, status, completed_at}]
  worker_id       VARCHAR(100),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_jobs_dataset ON ingestion_jobs(dataset_id);
CREATE INDEX idx_jobs_status  ON ingestion_jobs(status);

CREATE TABLE export_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  export_type   VARCHAR(20),                            -- 'csv', 'pdf', 'geojson', 'shapefile'
  parameters    JSONB,                                  -- filter state that generated the export
  status        VARCHAR(20) DEFAULT 'pending',
  file_url      VARCHAR(500),                           -- presigned MinIO URL
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.11 Programme Management Tables

```sql
-- Programmes (intervention/campaign tracking system)
-- Supports B10.07 Programme Management CRUD feature
CREATE TABLE programmes (
  id               SERIAL PRIMARY KEY,
  slug             VARCHAR(200) UNIQUE NOT NULL,
  title            VARCHAR(500) NOT NULL,
  description      TEXT,
  programme_type   VARCHAR(100),                       -- 'routine-immunization', 'outbreak-response', 'nutrition', etc.
  status           VARCHAR(50) DEFAULT 'planned',      -- 'planned', 'active', 'completed', 'suspended'
  start_date       DATE,
  end_date         DATE,
  target_lgas      INTEGER[],                          -- Array of LGA IDs
  lead_organisation_id  INTEGER REFERENCES organisations(id),
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_programmes_status ON programmes(status);
CREATE INDEX idx_programmes_type ON programmes(programme_type);

-- Programme reports/documents uploaded by M&E officers
CREATE TABLE programme_reports (
  id               SERIAL PRIMARY KEY,
  programme_id     INTEGER NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
  title            VARCHAR(300) NOT NULL,
  report_type      VARCHAR(100),                       -- 'monthly', 'quarterly', 'final', 'adhoc'
  report_period    VARCHAR(100),                       -- 'Q1 2024', 'January 2024'
  file_url         VARCHAR(500),                       -- MinIO URL
  uploaded_by      UUID REFERENCES users(id),
  uploaded_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_programme_reports_programme ON programme_reports(programme_id);
```

### 4.12 Document Repository Tables

```sql
-- Document Repository (B10.01)
-- Stores SOPs, policies, research papers, guidelines
CREATE TYPE document_category AS ENUM ('sop', 'policy', 'research', 'guideline', 'report', 'training', 'other');

CREATE TABLE documents (
  id               SERIAL PRIMARY KEY,
  slug             VARCHAR(200) UNIQUE NOT NULL,
  title            VARCHAR(500) NOT NULL,
  description      TEXT,
  document_category  document_category NOT NULL,
  file_url         VARCHAR(500),                       -- MinIO URL
  file_size_bytes  BIGINT,
  file_format      VARCHAR(50),                        -- 'PDF', 'DOCX', 'XLSX'
  version          VARCHAR(50),                        -- '1.0', '2.1', etc.
  effective_date   DATE,                               -- When SOP/policy takes effect
  expiry_date      DATE,                               -- When SOP/policy expires
  tags             VARCHAR(100)[],                     -- ['maternal-health', 'data-quality']
  uploaded_by      UUID REFERENCES users(id),
  organisation_id  INTEGER REFERENCES organisations(id),
  is_public        BOOLEAN DEFAULT true,
  download_count   INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  
  -- Full-text search
  search_vector    tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'B')
  ) STORED
);

CREATE INDEX idx_documents_category ON documents(document_category);
CREATE INDEX idx_documents_organisation ON documents(organisation_id);
CREATE INDEX idx_documents_tags ON documents USING gin(tags);
CREATE INDEX idx_documents_search ON documents USING gin(search_vector);
CREATE INDEX idx_documents_public ON documents(is_public) WHERE is_public = true;
```

### 4.13 User Groups & Permissions Tables

```sql
-- User Groups (B10.03)
-- Team-based access control beyond simple role-based RBAC
CREATE TABLE user_groups (
  id               SERIAL PRIMARY KEY,
  slug             VARCHAR(100) UNIQUE NOT NULL,
  name             VARCHAR(200) NOT NULL,
  description      TEXT,
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_group_members (
  group_id         INTEGER REFERENCES user_groups(id) ON DELETE CASCADE,
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  added_by         UUID REFERENCES users(id),
  added_at         TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX idx_group_members_user ON user_group_members(user_id);

-- Granular Permissions (B10.04)
-- Resource-level permission delegation beyond role-based access
CREATE TYPE permission_action AS ENUM ('read', 'write', 'delete', 'approve', 'manage');
CREATE TYPE permission_resource AS ENUM ('dataset', 'programme', 'document', 'user', 'campaign', 'all');

CREATE TABLE permissions (
  id                SERIAL PRIMARY KEY,
  grantee_type      VARCHAR(20) NOT NULL,               -- 'user' or 'group'
  grantee_id        VARCHAR(100) NOT NULL,              -- user UUID or group ID
  resource_type     permission_resource NOT NULL,
  resource_id       INTEGER,                            -- NULL = all resources of type
  action            permission_action NOT NULL,
  granted_by        UUID REFERENCES users(id),
  granted_at        TIMESTAMPTZ DEFAULT NOW(),
  expires_at        TIMESTAMPTZ,                        -- NULL = never expires
  
  UNIQUE (grantee_type, grantee_id, resource_type, resource_id, action)
);

CREATE INDEX idx_permissions_grantee ON permissions(grantee_type, grantee_id);
CREATE INDEX idx_permissions_resource ON permissions(resource_type, resource_id);
```

### 4.14 Governance Reference Tables

```sql
-- Admin-managed health indicator master list (B10.05)
-- This supplements disease_indicators table with admin CRUD interface
-- NOTE: disease_indicators already exists in §4.7, this adds audit trail

CREATE TABLE indicator_revisions (
  id               SERIAL PRIMARY KEY,
  indicator_id     INTEGER REFERENCES disease_indicators(id) ON DELETE CASCADE,
  field_changed    VARCHAR(100),                       -- 'name', 'definition', 'dhis2_mapping'
  old_value        TEXT,
  new_value        TEXT,
  changed_by       UUID REFERENCES users(id),
  changed_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_indicator_revisions_indicator ON indicator_revisions(indicator_id);

-- Admin-managed SOP master register (links to documents table)
-- NOTE: documents table already stores SOPs, this adds governance metadata
CREATE TABLE sop_register (
  id               SERIAL PRIMARY KEY,
  document_id      INTEGER UNIQUE REFERENCES documents(id) ON DELETE CASCADE,
  sop_code         VARCHAR(100) UNIQUE NOT NULL,       -- 'SOP-DS-001'
  department       VARCHAR(200),                       -- 'Disease Surveillance', 'Data Management'
  review_frequency VARCHAR(50),                        -- 'annual', 'biannual', 'triannual'
  next_review_date DATE,
  responsible_officer_id  UUID REFERENCES users(id),
  approval_status  VARCHAR(50) DEFAULT 'draft',        -- 'draft', 'review', 'approved', 'retired'
  approved_by      UUID REFERENCES users(id),
  approved_at      TIMESTAMPTZ
);

CREATE INDEX idx_sop_register_status ON sop_register(approval_status);
CREATE INDEX idx_sop_register_review ON sop_register(next_review_date);
```

---

## Part 5 — REST API Surface (OpenAPI 3.0)

### 5.1 Auth Routes (`/auth`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login, return access + refresh tokens |
| POST | `/auth/refresh` | Bearer (refresh) | Rotate access token |
| POST | `/auth/logout` | Bearer | Revoke refresh token |
| POST | `/auth/forgot-password` | Public | Send reset email (always 200) |
| POST | `/auth/reset-password` | Public | Consume token, set new password |
| POST | `/auth/verify-email` | Public | Verify email OTP |
| POST | `/auth/mfa/setup` | Bearer | Generate TOTP secret |
| POST | `/auth/mfa/verify` | Bearer | Verify TOTP, mark enabled |
| POST | `/auth/mfa/confirm` | Bearer | Confirm MFA code during login |
| GET  | `/auth/me` | Bearer | Return current user + role |

### 5.2 Dataset Routes (`/datasets`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET  | `/datasets` | Public | List datasets (filters, sort, paginate, search) |
| GET  | `/datasets/:slug` | Public | Get dataset + metadata |
| POST | `/datasets` | Contributor+ | Create dataset record |
| PATCH | `/datasets/:slug` | Owner/Admin | Update metadata |
| DELETE | `/datasets/:slug` | Owner/Admin | Archive dataset |
| POST | `/datasets/:slug/submit` | Owner | Submit for review |
| POST | `/datasets/:slug/download` | Auth (visibility check) | Log + return presigned URL |
| GET  | `/datasets/:slug/versions` | Public | List version history |
| GET  | `/datasets/:slug/preview` | Public | Simplified GeoJSON preview |
| POST | `/datasets/:slug/access-request` | Auth | Request access to RESTRICTED dataset |

**Supported query params for `GET /datasets`:**
```
?q=malaria            Full-text search
&category=disease-data
&organisation=nsphcda
&format=GeoJSON
&lga=27001,27002      LGA codes (multi)
&status=published     (admin only for non-published)
&visibility=public
&is_spatial=true
&sort=recent|downloads|alphabetical|relevant
&page=1
&limit=20             20 | 50 | 100
&date_from=2024-01-01
&date_to=2024-12-31
```

### 5.3 Upload Route (`/uploads`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/uploads` | Contributor+ | Upload file (multipart), returns job ID |
| GET  | `/uploads/:jobId` | Owner/Admin | Poll ingestion job progress |
| DELETE | `/uploads/:jobId` | Owner/Admin | Cancel pending job |

### 5.4 GIS / Spatial Routes (`/gis`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/gis/lga-boundaries` | Public | All 25 LGA polygons as GeoJSON |
| GET | `/gis/lga-boundaries/:lgaCode` | Public | Single LGA polygon |
| GET | `/gis/ward-boundaries` | Public | Ward polygons (filtered by `?lga=`) |
| GET | `/gis/facilities` | Public | Facility points GeoJSON (filtered) |
| GET | `/gis/disease-burden` | Public | Bubble map data (aggregated, filtered) |
| GET | `/gis/disease-burden/simplified` | Public | Simplified for low-bandwidth (≤20KB) |

**`GET /gis/facilities` params:**
```
?lga=27001            Filter by LGA code
&ward=Tagagi          Filter by ward name
&type=Primary         facility_level
&ownership=Public
&q=tagagi             Search facility name
&bbox=6.2,8.5,6.6,9.3  Bounding box filter
```

**`GET /gis/disease-burden` params:**
```
?indicator=malaria
&year=2024
&month=4              Optional (annual if omitted)
&lga=27001
&value_type=cases|rate|coverage
&min_cases=10
&max_cases=500
```

### 5.5 Analytics Routes (`/analytics`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/analytics/kpis` | Public | 4 KPI cards (cached) |
| GET | `/analytics/lga-burden` | Public | All 25 LGAs burden table |
| GET | `/analytics/trends` | Public | Time-series (annual/monthly) |
| GET | `/analytics/top-lgas` | Public | Top 10 LGAs by case count |
| GET | `/analytics/outliers` | Public | Outlier facilities (z≥2) |
| POST | `/analytics/export` | Auth | Queue CSV/PDF export, return job ID |
| GET | `/analytics/export/:jobId` | Auth | Poll export job, get presigned URL |

**All analytics endpoints accept:** `?indicator=malaria&year=2024`

### 5.6 Admin Routes (`/admin`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/admin/review-queue` | Admin+ | Pending submissions |
| POST | `/admin/datasets/:id/approve` | Admin+ | Approve dataset |
| POST | `/admin/datasets/:id/reject` | Admin+ | Reject (body: `{reason}`) |
| POST | `/admin/datasets/:id/revise` | Admin+ | Request revision (body: `{comment}`) |
| GET | `/admin/users` | Admin+ | List all users |
| PATCH | `/admin/users/:id/role` | Admin+ | Change user role |
| PATCH | `/admin/users/:id/status` | Admin+ | Suspend/activate user |
| GET | `/admin/audit-logs` | Admin+ | Searchable audit log |
| GET | `/admin/audit-logs/export` | Admin+ | Export as CSV |
| GET | `/admin/stats` | Admin+ | Platform-wide statistics |
| CRUD | `/admin/campaigns` | Admin+ | Campaign management |
| CRUD | `/admin/organisations` | Admin+ | Organisation management |
| CRUD | `/admin/groups` | Admin+ | Category/group management |

### 5.7 Programme Management Routes (`/programs`)

**Supports B10.07 — Programme Management CRUD feature built in prototype**

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/programs` | Public | List all programmes (with filters) |
| GET | `/programs/:slug` | Public | Get programme details + timeline |
| POST | `/programs` | Admin+ | Create new programme |
| PATCH | `/programs/:slug` | Admin+ | Update programme metadata |
| DELETE | `/programs/:slug` | Admin+ | Archive programme |
| POST | `/programs/:slug/reports` | Contributor+ | Upload programme report |
| GET | `/programs/:slug/reports` | Public | List reports for programme |
| DELETE | `/programs/:slug/reports/:id` | Admin+ | Delete report |

**Query params for `GET /programs`:**
```
?status=active|planned|completed|suspended
&type=routine-immunization|outbreak-response|nutrition
&lga=27001                    Filter by target LGA
&organisation=nsphcda         Filter by lead organisation
&q=malaria                    Search title/description
&sort=recent|alphabetical
```

### 5.8 Document Repository Routes (`/documents`)

**Supports B10.01 — Document Repository feature built in prototype**

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/documents` | Public | Browse SOPs, policies, research papers, guidelines |
| GET | `/documents/:slug` | Public | Get document details + download URL |
| POST | `/documents` | Admin+ | Upload new document |
| PATCH | `/documents/:slug` | Admin+ | Update document metadata |
| DELETE | `/documents/:slug` | Admin+ | Archive document |
| POST | `/documents/:slug/download` | Auth | Log download + return presigned URL |

**Query params for `GET /documents`:**
```
?category=sop|policy|research|guideline|report|training
&organisation=nsphcda
&tags=maternal-health,data-quality    Comma-separated
&q=surveillance                       Full-text search
&effective_date_from=2024-01-01
&is_public=true
&sort=recent|alphabetical|downloads
```

### 5.9 Partner Data Portal Routes (`/partner-data`)

**Supports B10.02 — Partner Data Portal feature built in prototype**

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/partner-data` | Auth | Partner-specific dataset portal with role-based filtering |

**Note:** This endpoint filters datasets by user's organisation and applies partner-specific visibility rules. Uses same underlying dataset infrastructure with enhanced filtering.

### 5.10 User Groups & Permissions Routes

**Supports B10.03 (User Groups) and B10.04 (Permission Delegation) features built in prototype**

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/admin/user-groups` | Admin+ | List all user groups |
| POST | `/admin/user-groups` | Admin+ | Create user group |
| GET | `/admin/user-groups/:id` | Admin+ | Get group + members |
| PATCH | `/admin/user-groups/:id` | Admin+ | Update group metadata |
| DELETE | `/admin/user-groups/:id` | Admin+ | Delete group |
| POST | `/admin/user-groups/:id/members` | Admin+ | Add users to group (bulk) |
| DELETE | `/admin/user-groups/:id/members/:userId` | Admin+ | Remove user from group |
| GET | `/admin/permissions` | Admin+ | Get permission matrix (all grants) |
| POST | `/admin/permissions` | Admin+ | Grant permission to user or group |
| DELETE | `/admin/permissions/:id` | Admin+ | Revoke permission |
| GET | `/admin/permissions/effective/:userId` | Admin+ | Get effective permissions for user (merged from user + groups) |

**POST `/admin/permissions` body:**
```json
{
  "granteeType": "user|group",
  "granteeId": "uuid|groupId",
  "resourceType": "dataset|programme|document|user|campaign|all",
  "resourceId": 123,           // null for all resources
  "action": "read|write|delete|approve|manage",
  "expiresAt": "2025-12-31T23:59:59Z"  // null for permanent
}
```

### 5.11 Governance Admin Routes (`/admin/governance`)

**Supports B10.05 — Admin Governance Module feature built in prototype**

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/admin/governance/indicators` | Admin+ | List all health indicators with revision history |
| POST | `/admin/governance/indicators` | Admin+ | Create new health indicator |
| PATCH | `/admin/governance/indicators/:id` | Admin+ | Update indicator (creates revision record) |
| DELETE | `/admin/governance/indicators/:id` | Admin+ | Archive indicator |
| GET | `/admin/governance/indicators/:id/revisions` | Admin+ | Get revision history |
| GET | `/admin/governance/sops` | Admin+ | SOP register with governance metadata |
| POST | `/admin/governance/sops` | Admin+ | Add SOP to register (links to document) |
| PATCH | `/admin/governance/sops/:id` | Admin+ | Update SOP governance metadata |
| POST | `/admin/governance/sops/:id/approve` | Admin+ | Approve SOP |
| POST | `/admin/governance/sops/:id/retire` | Admin+ | Retire SOP |

### 5.12 Other Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/search` | Public | Cross-entity full-text search |
| GET | `/organisations` | Public | List organisations |
| GET | `/organisations/:slug` | Public | Org detail + datasets |
| GET | `/categories` | Public | List health categories |
| GET | `/categories/:slug` | Public | Category + datasets |
| GET | `/campaigns` | Public | List campaigns |
| GET | `/facilities` | Public | Facility list (non-geo) |
| GET | `/notifications` | Auth | User notifications |
| PATCH | `/notifications/:id/read` | Auth | Mark read |
| GET | `/health` | Public | Server health check |

---

## Part 6 — BullMQ Job Queue Architecture

```
Queue Name            Concurrency   Priority   TTL     Description
─────────────────────────────────────────────────────────────────────────────
validation            5             HIGH       5 min   File validation before ingestion
geo-extraction        3             HIGH       30 min  GeoPackage/Shapefile/GeoJSON load
etl                   5             MEDIUM     20 min  CSV/Excel/DHIS2/PDF processing
spatial-indexing      2             MEDIUM     15 min  PostGIS index rebuild after bulk load
analytics-compute     2             LOW        60 min  LGA burden / z-score / trend recompute
notification-dispatch 10            HIGH       2 min   Email + in-app notifications
export-generation     3             MEDIUM     10 min  CSV/PDF/GeoJSON export generation
data-validation       3             MEDIUM     10 min  Metadata completeness scoring
─────────────────────────────────────────────────────────────────────────────

Job Lifecycle:
  WAITING → ACTIVE → COMPLETED
                  ↘ FAILED → (retry up to 3 times with exponential backoff)
                           → (after max retries) → DEAD LETTER

Dead Letter Queue:
  Failed jobs after 3 retries → 'dead-letter' queue
  Admin dashboard shows dead letter queue count
  Manual retry available from admin panel
  
Job Events (emitted via Redis Pub/Sub):
  job:progress  → {jobId, progress%, currentStep}
  job:completed → {jobId, datasetId}
  job:failed    → {jobId, error, willRetry}
  
Frontend can poll GET /uploads/:jobId for progress
(future: WebSocket subscription to job events)
```

---

## Part 7 — Geospatial Architecture (PostGIS)

### 7.1 Spatial Query Patterns

```sql
-- PATTERN 1: Facilities within LGA (used by Facility Map filter)
SELECT hf.id, hf.facility_name, hf.facility_level, hf.ownership,
       ST_AsGeoJSON(hf.geom)::json as geometry
FROM health_facilities hf
JOIN lga_boundaries lb ON hf.lga_id = lb.id
WHERE lb.lga_code = $1
  AND hf.is_active = TRUE
  AND ($2::text IS NULL OR hf.facility_level = $2);

-- PATTERN 2: Disease burden bubbles for GIS Mapping page
-- Returns GeoJSON FeatureCollection with case-weighted centroids
SELECT
  ST_AsGeoJSON(ST_Centroid(lb.geom))::json as geometry,
  lb.lga_name,
  lb.lga_code,
  COALESCE(db.total_cases, 0) as total_cases,
  COALESCE(db.total_cases::float / NULLIF(pe.population, 0) * 1000, 0) as incidence_per_1000
FROM lga_boundaries lb
LEFT JOIN (
  SELECT lga_id, SUM(value) as total_cases
  FROM disease_burden
  WHERE indicator_id = $1
    AND period_year = $2
    AND ($3::smallint IS NULL OR period_month = $3)
  GROUP BY lga_id
) db ON lb.id = db.lga_id
LEFT JOIN population_estimates pe ON lb.id = pe.lga_id AND pe.year = $2
ORDER BY total_cases DESC;

-- PATTERN 3: Spatial join — find LGA for a point (used during facility upload)
SELECT lb.id, lb.lga_name, lb.lga_code
FROM lga_boundaries lb
WHERE ST_Contains(lb.geom, ST_SetSRID(ST_MakePoint($1, $2), 4326));

-- PATTERN 4: Outlier detection (z-score ≥ 2.0)
WITH facility_stats AS (
  SELECT
    db.facility_id,
    hf.facility_name,
    hf.lga_id,
    lb.lga_name,
    SUM(db.value) as total_cases,
    AVG(SUM(db.value)) OVER (PARTITION BY hf.lga_id) as lga_avg,
    STDDEV(SUM(db.value)) OVER (PARTITION BY hf.lga_id) as lga_stddev
  FROM disease_burden db
  JOIN health_facilities hf ON db.facility_id = hf.id
  JOIN lga_boundaries lb ON hf.lga_id = lb.id
  WHERE db.indicator_id = $1 AND db.period_year = $2
  GROUP BY db.facility_id, hf.facility_name, hf.lga_id, lb.lga_name
)
SELECT *,
  (total_cases - lga_avg) / NULLIF(lga_stddev, 0) as z_score
FROM facility_stats
WHERE ABS((total_cases - lga_avg) / NULLIF(lga_stddev, 0)) >= 2.0
ORDER BY ABS((total_cases - lga_avg) / NULLIF(lga_stddev, 0)) DESC;

-- PATTERN 5: Simplified GeoJSON for low-bandwidth clients
-- Reduce polygon vertex count while preserving shape
SELECT ST_AsGeoJSON(ST_Simplify(geom, 0.005))::json as geometry,
       lga_name, lga_code
FROM lga_boundaries;
```

### 7.2 Geometry Column Reference

| Table | Column | Type | SRID | Index |
|---|---|---|---|---|
| `lga_boundaries` | `geom` | MULTIPOLYGON | 4326 | GIST |
| `ward_boundaries` | `geom` | MULTIPOLYGON | 4326 | GIST |
| `health_facilities` | `geom` | POINT | 4326 | GIST |
| `road_network` | `geom` | MULTILINESTRING | 4326 | GIST |
| `datasets` | `bbox` | POLYGON | 4326 | GIST (conditional) |

### 7.3 GeoPackage Loading Strategy (GeoWorker)

```typescript
// src/workers/geo-worker.ts — GPKG loading without GDAL
import Database from 'better-sqlite3';

interface GpkgGeomHeader {
  magic: string;   // 'GP'
  version: number;
  flags: number;   // bit 0: endian; bits 1-3: envelope type; bit 5: empty
  srsId: number;
}

function parseGpkgGeometry(buffer: Buffer): Buffer {
  // GeoPackage Binary Format (OGC 12-128r18)
  // [G][P][version][flags][srs_id][envelope?][WKB]
  let offset = 0;
  const magic = buffer.slice(0, 2).toString();   // 'GP'
  if (magic !== 'GP') throw new Error('Not a GeoPackage geometry');
  offset = 2;
  const version = buffer[offset++];
  const flags = buffer[offset++];
  const envelopeType = (flags >> 1) & 0x07;
  offset += 4; // srs_id (4 bytes)
  // Skip envelope bytes based on envelope type
  const envelopeSizes = [0, 32, 48, 48, 64]; // bytes per type 0-4
  offset += envelopeSizes[envelopeType] || 0;
  // Remaining bytes are WKB
  return buffer.slice(offset);
}

async function loadGpkgToPostGIS(
  gpkgPath: string, 
  datasetId: number,
  targetTable: string
): Promise<void> {
  const db = new Database(gpkgPath, { readonly: true });
  const pgClient = await pgPool.connect();
  
  try {
    // Get feature table info from gpkg_contents
    const layerInfo = db.prepare(
      `SELECT table_name, min_x, min_y, max_x, max_y, srs_id 
       FROM gpkg_contents WHERE data_type = 'features'`
    ).all();
    
    for (const layer of layerInfo) {
      const count = db.prepare(`SELECT COUNT(*) as n FROM "${layer.table_name}"`).get();
      const features = db.prepare(`SELECT * FROM "${layer.table_name}"`).all();
      
      await pgClient.query('BEGIN');
      
      // Bulk insert using COPY-style batching
      const BATCH_SIZE = 500;
      for (let i = 0; i < features.length; i += BATCH_SIZE) {
        const batch = features.slice(i, i + BATCH_SIZE);
        const values = batch.map((row, idx) => {
          const wkb = parseGpkgGeometry(row.geom);
          // Build parameterized insert...
          return { ...row, wkb };
        });
        await bulkInsert(pgClient, targetTable, values, layer.srs_id);
        await updateJobProgress(datasetId, Math.round((i / features.length) * 80));
      }
      
      await pgClient.query('COMMIT');
    }
    
    // Build spatial index
    await pgClient.query(
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_${targetTable}_geom 
       ON ${targetTable} USING GIST(geom)`
    );
    
    // Compute and store bbox
    await pgClient.query(
      `UPDATE datasets SET 
         bbox = (SELECT ST_Envelope(ST_Collect(geom)) FROM ${targetTable}),
         feature_count = $1,
         is_spatial = TRUE
       WHERE id = $2`,
      [features.length, datasetId]
    );
  } finally {
    pgClient.release();
    db.close();
  }
}
```

---

## Part 8 — Caching Strategy

```
Cache Layer        Key Pattern                     TTL       Source of Truth
──────────────────────────────────────────────────────────────────────────────────
Redis (hot cache)
  Analytics KPIs   kpi:{indicator}                 1 hour    analytics_cache table
  LGA burden       lga_burden:{indicator}:{year}   1 hour    disease_burden table
  Trends series    trend:{indicator}:annual        1 hour    disease_burden table
  Seasonality      trend:{indicator}:{year}:monthly 1 hour   disease_burden table
  Outliers         outliers:{indicator}:{year}     1 hour    disease_burden table
  Top 10 LGAs      top10:{indicator}:{year}        1 hour    disease_burden table
  
  Geo previews     geo:preview:{dataset_id}        24 hours  MinIO GeoJSON file
  LGA boundaries   geo:lga:all                     24 hours  lga_boundaries table
  Ward boundaries  geo:wards:{lga_code}            24 hours  ward_boundaries table
  
  Search results   search:{hash(query+filters)}    5 min     PostgreSQL FTS
  Dataset list     datasets:{hash(filters)}        5 min     datasets table
  
  Rate limits      ratelimit:{ip}:{window}         1 min     In-memory (Redis)
  Session data     session:{userId}                30 days   refresh_tokens table

PostgreSQL (analytical cache)
  analytics_cache  (persistent, survives Redis restart)
  Invalidated when: new dataset approved for given indicator

Cache Invalidation Rules:
  ON dataset.approved where is_spatial:
    → DEL geo:preview:{datasetId}
    → Enqueue analytics-compute job for affected indicators
    
  ON disease_burden INSERT/UPDATE:
    → DEL kpi:*, lga_burden:*, trend:*, outliers:*, top10:*
    → Analytics worker recomputes and re-populates
    
  ON lga_boundaries change (rare):
    → DEL geo:lga:all, geo:wards:*
    → CLUSTER lga_boundaries USING idx_lga_geom (re-cluster for spatial perf)
```

---

## Part 9 — Security Architecture

```
LAYER 1: TRANSPORT
  TLS 1.3 enforced, TLS 1.2 minimum, 1.0/1.1 disabled
  HSTS header (max-age=31536000; includeSubDomains)
  Certificate: Let's Encrypt auto-renewal via certbot

LAYER 2: AUTHENTICATION
  JWT: RS256 asymmetric signing (not HS256)
    Access token:  15-minute TTL, minimal payload (userId, role)
    Refresh token: 30-day TTL, httpOnly + Secure + SameSite=Strict cookie
    Rotation:      New refresh token issued on every /auth/refresh call
    Revocation:    token_hash stored in refresh_tokens; revoked flag on logout
  
  MFA (TOTP, RFC 6238):
    Required for: nsphcda_admin, super_admin, partner (access_level)
    Secret: AES-256 encrypted at rest in mfa_credentials.secret
    Backup codes: 8 × 8-char alphanumeric, bcrypt-hashed, single-use

LAYER 3: AUTHORISATION (RBAC)
  Role hierarchy (ascending privileges):
    public → registered → contributor → admin → super_admin
    
  Permission matrix (key entries):
  Action                    public  registered  contributor  admin  super_admin
  ──────────────────────────────────────────────────────────────────────────────
  View public datasets        ✅      ✅           ✅          ✅      ✅
  Download public datasets    ✅      ✅           ✅          ✅      ✅
  Download restricted         ❌      (request)    ✅          ✅      ✅
  Submit datasets             ❌      ❌           ✅          ✅      ✅
  Edit own datasets           ❌      ❌           ✅          ✅      ✅
  Approve/reject datasets     ❌      ❌           ❌          ✅      ✅
  Manage users                ❌      ❌           ❌          ✅      ✅
  View audit logs             ❌      ❌           ❌          ✅      ✅
  System configuration        ❌      ❌           ❌          ❌      ✅
  
  Notes:
  - PUBLIC: Unauthenticated/guest - browse only
  - REGISTERED: Authenticated user - download & request restricted access
  - CONTRIBUTOR: Upload/maintain datasets
  - ADMIN: Organization/Repository administrator (org-scoped via permissions)
  - SUPER_ADMIN: Full system + permission delegation
  Approve/reject datasets     ❌      ❌           ❌          ❌         ✅      ✅
  Manage users                ❌      ❌           ❌          ❌         ✅      ✅
  View audit logs             ❌      ❌           ❌          ❌         ✅      ✅
  System configuration        ❌      ❌           ❌          ❌         ❌      ✅

LAYER 4: API SECURITY
  All inputs validated with Zod before route handler executes
  SQL: parameterized queries only (pg library), NO string interpolation
  XSS: DOMPurify on text fields stored in DB (server-side)
  CSRF: Not needed (stateless JWT), double-submit cookie pattern if needed
  File uploads: MIME type validation + magic bytes check + ClamAV scan
  Presigned URLs: 1-hour TTL, not guessable (UUID-based MinIO keys)
  
LAYER 5: INFRASTRUCTURE
  Secrets: Environment variables only, never in code or git
  Database: Not exposed on public network (internal Docker network only)
  MinIO: Not exposed publicly (all access via API presigned URLs)
  Redis: AUTH password enabled, bind to internal network only
  Logging: No PII in logs (mask email, phone, IP after 90 days)
  NDPA Compliance: No health PII stored in public-facing tables
```

---

## Part 10 — Technology Stack Decisions (with Rationale)

| Concern | Choice | Rationale |
|---|---|---|
| **Runtime** | Node.js 22 LTS | Long-term support, async I/O suits geo streaming, team familiarity |
| **API Framework** | **Fastify** (not Express) | 3× faster than Express, first-class TypeScript, built-in schema validation, Zod plugin, production-grade |
| **Language** | TypeScript 5 (strict) | Type safety across API ↔ DB ↔ worker boundaries; shared types with frontend |
| **ORM / Query** | **Raw SQL with `pg`** (no ORM) | PostGIS queries are too complex for ORMs (ST_* functions, GIST indexes). Type safety via Zod schemas on query results |
| **Spatial DB** | PostgreSQL 16 + PostGIS 3.4 | Industry standard for geospatial; GIST indexes; ST_Simplify; ST_Contains; spatial joins; tsvector FTS all in one |
| **Queue** | **BullMQ** (not Agenda/Bull) | Redis-backed, TypeScript-native, flow/dependency jobs, dead-letter queue, built-in UI (Bull Board) |
| **File Storage** | **MinIO** | S3-compatible, self-hosted, no egress costs, NSPHCDA data sovereignty, presigned URLs |
| **Cache** | Redis 7 | BullMQ backend + session + analytics cache + rate limiting — one service, multiple purposes |
| **GeoPackage parsing** | **better-sqlite3** (not GDAL) | GPKG is SQLite. Native Node.js driver eliminates GDAL binary dependency. Easier Docker builds. Falls back to GDAL sidecar only for format exotic edge cases |
| **Shapefile parsing** | `shapefile` npm package | Pure JS, no native deps, handles all standard SHP variants |
| **Coordinate projection** | `proj4` npm package | Lightweight CRS reprojection for non-WGS84 inputs |
| **GeoJSON ops** | `@turf/turf` | Bounding box, simplify, buffer, spatial validation — client-side spatial ops without PostGIS round-trip |
| **Email** | nodemailer + Handlebars templates | Self-hosted SMTP or SendGrid; template-based; queue-backed |
| **PDF export** | Puppeteer (headless Chromium) | Renders analytics dashboard HTML to PDF; ensures pixel-perfect charts |
| **Search** | PostgreSQL `tsvector` (Phase 1) → Elasticsearch (Phase 2) | pg FTS handles health dataset search well at this scale; ES upgrade path if corpus > 100k documents |
| **Auth** | JWT RS256 (not sessions) | Stateless, works across future microservices, no sticky sessions needed |
| **Containerisation** | Docker Compose (dev/staging) → Docker Swarm or Portainer (production) | Single-host VPS production; easy NSPHCDA IT handover; no Kubernetes complexity |
| **Process Manager** | PM2 (in production container) | Zero-downtime reload, crash recovery, log management |

---

## Part 11 — Supported File Formats & Processing Matrix

| Format | Extension | Parser | Spatial? | PostGIS Load | Preview |
|---|---|---|---|---|---|
| GeoPackage | `.gpkg` | `better-sqlite3` | ✅ | ST_GeomFromWKB | Simplified GeoJSON |
| GeoJSON | `.geojson`, `.json` | `JSON.parse` | ✅ | ST_GeomFromGeoJSON | Direct (if < 500KB) |
| Shapefile | `.zip` (shp+dbf+shx+prj) | `shapefile` npm | ✅ | ST_GeomFromText + proj4 | Simplified GeoJSON |
| KML | `.kml` | `@tmcw/togeojson` | ✅ | via GeoJSON path | GeoJSON conversion |
| KMZ | `.kmz` | unzip → KML path | ✅ | via KML path | GeoJSON conversion |
| CSV (spatial) | `.csv` with lat/lng | `csv-parse` | ✅ | ST_MakePoint | Point GeoJSON |
| CSV (tabular) | `.csv` | `csv-parse` | ❌ | — | First 100 rows |
| Excel | `.xlsx`, `.xls` | `xlsx` (SheetJS) | Optional | Detect lat/lng cols | First 100 rows |
| DHIS2 export | `.json` (DHIS2 schema) | Custom parser | ❌ | disease_burden rows | Time series chart |
| PDF | `.pdf` | `pdf-parse` | ❌ | — | Extracted text |

---

## Part 12 — Deployment Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                   PRODUCTION SERVER (NSPHCDA-controlled)                     │
│                   Ubuntu 22.04 LTS · Minimum 8 vCPU · 16GB RAM · 200GB SSD  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                    Docker Compose Stack                                 │ │
│  │                                                                         │ │
│  │  nginx          → Port 80/443  (SSL termination, reverse proxy)         │ │
│  │  api            → Port 3001    (Fastify API server)                     │ │
│  │  worker         → (no port)    (BullMQ worker processes)                │ │
│  │  postgres       → Port 5432    (internal only, not exposed)             │ │
│  │  redis          → Port 6379    (internal only)                          │ │
│  │  minio          → Port 9000    (internal) / 9001 (admin, restricted)    │ │
│  │  clamav         → Port 3310    (internal, virus scanning socket)        │ │
│  │  bull-board     → Port 3002    (admin-only, behind auth, job monitor)   │ │
│  │                                                                         │ │
│  │  Volumes:                                                               │ │
│  │    postgres_data  → /var/lib/postgresql/data  (persistent)              │ │
│  │    minio_data     → /mnt/minio-data           (persistent, large disk)  │ │
│  │    redis_data     → /var/lib/redis            (persistent)              │ │
│  │    nginx_certs    → /etc/letsencrypt          (SSL certs)               │ │
│  │    clamav_db      → /var/lib/clamav           (virus definitions)       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  BACKUP STRATEGY                                                        │ │
│  │  • PostgreSQL: pg_dump (daily, encrypted, offsite S3 or Google Drive)   │ │
│  │  • MinIO: mc mirror to backup bucket (daily)                            │ │
│  │  • Redis: RDB persistence (daily snapshot)                              │ │
│  │  • Retention: 30 days rolling                                           │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘

STAGING ENVIRONMENT:
  Same docker-compose stack on a separate VPS or Railway.app
  Seeded with a copy of production data (anonymised where needed)
  Frontend Vercel preview → staging API (env: NEXT_PUBLIC_API_URL=staging)

CI/CD PIPELINE (GitHub Actions):
  PR opened        → lint + typecheck + unit tests
  Merge to main    → build Docker images + push to registry + deploy to staging
  Manual trigger   → promote staging → production (with DB migration run)
  
Database Migrations:
  Tool: node-pg-migrate (SQL files, tracked in migrations/ folder)
  Run order: migration → seed reference data → start API
  Never modify production schema without a migration file
```

---

## Part 13 — Directory Structure (Backend)

```
backend/
├── src/
│   ├── server.ts               # Fastify server bootstrap
│   ├── app.ts                  # Plugin registration
│   ├── config.ts               # Env var parsing + validation (Zod)
│   │
│   ├── routes/                 # Route handlers (thin controllers)
│   │   ├── auth.ts
│   │   ├── datasets.ts
│   │   ├── uploads.ts
│   │   ├── gis.ts
│   │   ├── analytics.ts
│   │   ├── admin.ts
│   │   ├── search.ts
│   │   ├── campaigns.ts
│   │   ├── facilities.ts
│   │   ├── organisations.ts
│   │   └── notifications.ts
│   │
│   ├── services/               # Business logic (called by routes)
│   │   ├── auth.service.ts
│   │   ├── dataset.service.ts
│   │   ├── upload.service.ts
│   │   ├── geo.service.ts
│   │   ├── analytics.service.ts
│   │   ├── search.service.ts
│   │   ├── admin.service.ts
│   │   ├── notification.service.ts
│   │   └── audit.service.ts
│   │
│   ├── workers/                # BullMQ worker processors
│   │   ├── index.ts            # Worker process entry point
│   │   ├── geo.worker.ts       # GeoPackage/SHP/KML/GeoJSON ingestion
│   │   ├── etl.worker.ts       # CSV/Excel/DHIS2/PDF processing
│   │   ├── analytics.worker.ts # Aggregation + caching
│   │   ├── validation.worker.ts# File validation + virus scan
│   │   ├── notification.worker.ts # Email + in-app dispatch
│   │   └── export.worker.ts    # CSV/PDF/GeoJSON export
│   │
│   ├── queues/                 # BullMQ queue definitions
│   │   ├── index.ts            # All queue instances exported
│   │   └── types.ts            # Job data type definitions
│   │
│   ├── db/                     # Database access
│   │   ├── postgres.ts         # pg Pool singleton
│   │   ├── redis.ts            # ioredis singleton
│   │   ├── minio.ts            # MinIO client singleton
│   │   └── queries/            # Typed SQL query functions
│   │       ├── datasets.queries.ts
│   │       ├── gis.queries.ts
│   │       ├── analytics.queries.ts
│   │       ├── auth.queries.ts
│   │       └── admin.queries.ts
│   │
│   ├── middleware/
│   │   ├── authenticate.ts     # JWT verification
│   │   ├── authorize.ts        # Role/permission check
│   │   └── audit.ts            # Audit log hook
│   │
│   ├── schemas/                # Zod schemas (request validation + response types)
│   │   ├── auth.schema.ts
│   │   ├── dataset.schema.ts
│   │   ├── upload.schema.ts
│   │   ├── analytics.schema.ts
│   │   └── gis.schema.ts
│   │
│   ├── lib/
│   │   ├── gpkg-parser.ts      # GeoPackage WKB parser (better-sqlite3)
│   │   ├── shapefile-loader.ts # Shapefile reader + proj4 reprojection
│   │   ├── dhis2-parser.ts     # DHIS2 export format parser
│   │   ├── format-detector.ts  # MIME + magic bytes detection
│   │   ├── z-score.ts          # Statistical outlier calculation
│   │   ├── presign.ts          # MinIO presigned URL helpers
│   │   └── slug.ts             # Slug generation
│   │
│   ├── templates/
│   │   └── email/              # Handlebars email templates
│   │       ├── submission-received.hbs
│   │       ├── dataset-approved.hbs
│   │       ├── dataset-rejected.hbs
│   │       └── account-approved.hbs
│   │
│   └── types/
│       ├── index.ts            # Shared domain types
│       └── fastify.d.ts        # Fastify augmentation (user on request)
│
├── migrations/                 # node-pg-migrate SQL files
│   ├── 001_initial_schema.sql
│   ├── 002_seed_lga_boundaries.sql
│   ├── 003_seed_health_facilities.sql
│   ├── 004_seed_disease_indicators.sql
│   └── 005_seed_population_estimates.sql
│
├── scripts/
│   ├── seed-lga.ts             # Load Niger Local Govt Areas.gpkg
│   ├── seed-facilities.ts      # Load Niger Health Facilities.gpkg (2191 facilities)
│   ├── seed-wards.ts           # Load Niger Wards.gpkg
│   ├── seed-population.ts      # Load Niger Pop Estimates LGA.csv
│   └── seed-roads.ts           # Load Niger Primary and Sec Roads.gpkg
│
├── docker-compose.yml          # Full stack (dev)
├── docker-compose.prod.yml     # Production overrides
├── Dockerfile                  # API server image
├── Dockerfile.worker           # Worker image (shared codebase)
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Part 14 — Scalability Roadmap

### Current Architecture (Phase 1 — Monolith + Queue, 1 Server)
Sufficient for: 500 concurrent users, 25 LGAs, <10,000 datasets, 2,191 facilities

### Phase 2 Scaling Path (if needed)
- **Read replicas:** Add PostgreSQL read replica. Route all analytics + GIS read queries to replica. API server gets `DB_READ_URL` for read pool.
- **Worker scale-out:** Run worker container on a separate server. Same Redis queue, multiple consumers (BullMQ supports this natively). Add more worker concurrency.
- **Redis Cluster:** Upgrade single Redis to Redis Sentinel (primary + 2 replicas) for HA.
- **Elasticsearch:** Replace pg_trgm full-text search with Elasticsearch for health-specific tokenisation and multi-field boosting.
- **CDN:** Add Cloudflare in front of Nginx for static asset caching and DDoS protection.

### What Does NOT Need Scaling in This Project
- No microservices decomposition needed — the domain is cohesive and a well-factored monolith is simpler to hand over to NSPHCDA
- No Kubernetes — a single well-provisioned VPS handles this workload with room to grow

---

## Part 15 — Seed Data Loading Order

The following scripts must run in this exact order at first deployment:

```bash
# 1. Run all migrations
npm run db:migrate

# 2. Load spatial reference data (25 LGAs from gpkg)
npx ts-node scripts/seed-lga.ts

# 3. Load ward boundaries (274 wards from gpkg)
npx ts-node scripts/seed-wards.ts

# 4. Load population estimates (from Niger Pop Estimates LGA.csv)
npx ts-node scripts/seed-population.ts

# 5. Load health facilities (2,191 from Niger Health Facilities.gpkg)
#    This script performs spatial join to assign lga_id + ward_id via ST_Contains
npx ts-node scripts/seed-facilities.ts

# 6. Load road network (for future use)
npx ts-node scripts/seed-roads.ts

# 7. Seed categories, disease indicators, default admin user
npx ts-node scripts/seed-reference.ts

# 8. Load initial health datasets (from Google Drive / NSPHCDA data team)
#    Via the standard upload API or bulk import script
```

**Health Facility Loading Note:**
The `Niger Health Facilities.gpkg` contains 2,191 facilities already with `latitude`/`longitude` populated and in EPSG:4326. The seed script uses `ST_Contains(lb.geom, ST_MakePoint(longitude, latitude))` to assign `lga_id` and `ward_id` programmatically rather than relying on the text `lga`/`ward` name fields (which have known disagreement flags in the source data).

---

## Part 16 — Environment Variables

```bash
# Server
NODE_ENV=production
PORT=3001
API_BASE_URL=https://api.nsgeohealthportal.ng.gov

# PostgreSQL + PostGIS
DATABASE_URL=postgresql://nsgh_user:STRONG_PASSWORD@postgres:5432/nsgh_db
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# Redis
REDIS_URL=redis://:REDIS_PASSWORD@redis:6379/0

# MinIO (S3-compatible)
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=MINIO_ACCESS_KEY
MINIO_SECRET_KEY=MINIO_SECRET_KEY
MINIO_BUCKET_DATASETS=nsgh-datasets
MINIO_BUCKET_EXPORTS=nsgh-exports
MINIO_BUCKET_AVATARS=nsgh-avatars

# JWT (RS256 — generate with: openssl genrsa -out private.pem 2048)
JWT_PRIVATE_KEY_PATH=/run/secrets/jwt_private_key
JWT_PUBLIC_KEY_PATH=/run/secrets/jwt_public_key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxx
EMAIL_FROM=noreply@nsgeohealthportal.ng.gov
EMAIL_FROM_NAME=Niger State GeoHealth Portal

# Security
BCRYPT_ROUNDS=12
MFA_ENCRYPTION_KEY=32_BYTE_HEX_KEY
RATE_LIMIT_PUBLIC=100           # requests per minute
RATE_LIMIT_AUTHENTICATED=500

# ClamAV
CLAMAV_HOST=clamav
CLAMAV_PORT=3310

# File Upload
MAX_FILE_SIZE_BYTES=52428800    # 50MB
ALLOWED_FORMATS=gpkg,geojson,shp,kml,kmz,csv,xlsx,xls,json,pdf

# CORS
CORS_ORIGINS=https://nsgeohealthportal.ng.gov,https://nsgdp.vercel.app

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

---

*End of Backend Architecture v1.0 — Niger State GeoHealth Data Portal | Zerasage Technologies | June 2026*
