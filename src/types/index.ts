// NSPHCDA Data Portal — domain types (PRD v3.0)

export type UserRole =
  | "public"        // Unauthenticated/guest user
  | "registered"    // Authenticated user (can browse/download)
  | "contributor"   // Can upload/submit datasets
  | "admin"         // Organization/Repository administrator
  | "staff"         // Agency staff — admin-portal only, never authenticates here
  | "super_admin";  // Platform owner — admin-portal only, never authenticates here

export type Visibility = "public" | "restricted" | "private";

// Backend status values (from dataset.entity.ts)
export type DatasetStatus =
  | "draft"
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "archived";

/** 5-step governance lifecycle — checklist-driven review replaces micro-gates */
export type LifecycleStage =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "published"
  | "archived";

export const LIFECYCLE_LABELS: Record<LifecycleStage, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  published: "Published",
  archived: "Archived",
};

export type FileFormat =
  | "CSV"
  | "XLSX"
  | "PDF"
  | "JSON"
  | "GeoJSON"
  | "Shapefile"
  | "KML"
  | "Other";

export type HealthCategory =
  | "disease"
  | "facilities"
  | "population"
  | "surveillance";

export type AccessLevel = "public" | "partner" | "administrator";

export type ProgramStatus = "ongoing" | "completed" | "planned";

/** @deprecated use ProgramStatus */
export type CampaignStatus = ProgramStatus;

export type ProgramType =
  | "campaign"
  | "surveillance"
  | "screening"
  | "training"
  | "infrastructure"
  | "research"
  | "other";

export type ProgrammeProgressMode =
  | "lga_coverage"
  | "outcome_metric"
  | "combined";

export type FacilityType = "PHC" | "Secondary" | "General Hospital";

export type AnalyticsMetric =
  | "severe_malaria"
  | "meningitis"
  | "cholera"
  | "diphtheria"
  | "anc_attendance"
  | "delivery_sba"
  | "routine_immunisation"
  | "u5_mortality"
  | "death_cases";

export interface KeyAttribute {
  fieldName: string;
  exampleValue: string;
  description: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  organisationIds: string[];
}

export interface Organisation {
  id: string;
  slug: string;
  name: string;
  acronym?: string;
  sector: string;
  logoUrl?: string;
  brandColor?: string;
  description?: string;
  datasetCount: number;
  dataSharingAgreement?: DataSharingAgreement;
}

export interface Group {
  id: string;
  slug: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  datasetCount: number;
  healthCategory?: HealthCategory;
}

export interface DatasetResource {
  id: string;
  name: string;
  format: FileFormat;
  sizeBytes: number;
  updatedAt: string;
}

/** Version history entry for a published dataset */
export interface DatasetVersion {
  version: string;        // e.g. "v1.0", "v1.1"
  publishedAt: string;
  publishedBy?: string;   // backend only stores a raw user UUID, no name resolution yet
  changeNote: string;
  resourceId?: string;    // links to specific DatasetResource
}

export interface Dataset {
  id: string;
  slug: string;
  title: string;
  description?: string;
  organisation: Pick<Organisation, "id" | "slug" | "name" | "logoUrl">;
  groups: Pick<Group, "id" | "slug" | "name">[];
  healthCategory: HealthCategory;
  visibility: Visibility;
  status: DatasetStatus;
  formats: FileFormat[];
  lgaCoverage: string[];
  downloadCount: number;
  updatedAt: string;
  resources?: DatasetResource[];
  // ── PRD v2.0 extended metadata ──────────────────────────────────────────
  custodian?: string;
  dateCollected?: string;
  updateFrequency?: string;
  methodology?: string;
  citation?: string;
  dataType?: "spatial" | "attribute";
  source?: string;
  portalSource?: string;
  keyAttributes?: KeyAttribute[];
  programId?: string;
  // ── PRD v3.0 — governance metadata (all 14 required fields) ─────────────
  /** Responsible department within the owning organisation */
  responsibleDept?: string;
  /** Name and contact details for the data focal person */
  contactPerson?: string;
  /** Geographic scope in plain language e.g. "All 25 LGAs, Niger State" */
  geographicCoverage?: string;
  /** The time period this data covers e.g. "Jan 2024 – Dec 2024" */
  reportingPeriod?: string;
  /** ISO date the dataset was first published to this portal */
  datePublished?: string;
  /** Usage license e.g. "CC BY 4.0", "Open Government License", "Restricted" */
  dataLicense?: string;
  /** Searchable keywords / tags */
  tags?: string[];
  // ── Advanced filter metadata ─────────────────────────────────────────────
  disease?: string;
  reportingYear?: number;
  wardCoverage?: string[];
  facilityScope?: string;
  linkedProgram?: string;
  // ── Governance lifecycle & versioning ────────────────────────────────────
  lifecycleStage?: LifecycleStage;
  versions?: DatasetVersion[];
  archiveInfo?: DatasetArchiveInfo;
}

export interface DatasetArchiveInfo {
  archivedAt: string;
  archivedBy: string;
  reason: string;
}

export interface DataSharingAgreement {
  status: "active" | "pending" | "expired" | "none";
  signedDate?: string;
  expiryDate?: string;
  contactName?: string;
  datasetCount?: number;
}

export interface Facility {
  id: string;
  name: string;
  lga: string;
  ward: string;
  facilityType: FacilityType;
  facilityCode: string;
  coordinates: { lat: number; lng: number };
}

export interface ProgramReport {
  id: string;
  /** Document slug — used to request a fresh presigned download URL. */
  slug?: string;
  title: string;
  uploadedAt: string;
  uploadedBy: string;
  fileSizeBytes: number;
  fileFormat: "PDF" | "DOCX" | "XLSX";
  url: string;
}

export interface Program {
  id: string;
  slug: string;
  name: string;
  type: ProgramType;
  status: ProgramStatus;
  /** True backend status (active/completed/suspended/archived) — `status` above collapses suspended/archived into "planned" for public display; the org-scoped dashboard needs the real value to filter/manage those. */
  rawStatus?: "active" | "completed" | "suspended" | "archived";
  description: string;
  startDate: string;
  endDate?: string;
  progressMode?: ProgrammeProgressMode | null;
  targetLgas?: string[];
  coveredLgas?: string[];
  objectives?: string[];
  primaryMetric: string;
  completionPercent: number;
  reachCount: number;
  targetCount: number;
  activeDays: number;
  lgasCovered: number;
  /** Owning organisation (data source / programme owner) */
  organisationId?: string;
  organisationName?: string;
  updatedAt?: string;
  /** Reports are only visible when completionPercent === 100 */
  reports?: ProgramReport[];
  linkedDatasetIds?: string[];
}

/** @deprecated use Program */
export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  startDate: string;
  endDate?: string;
  primaryMetric: string;
  coveragePercent: number;
  vaccinatedCount: number;
  targetCount: number;
  activeDays: number;
  lgasCovered: number;
}

export interface LGABurden {
  rank: number;
  lga: string;
  totalCases: number;
  missingRows: number;
  facilities: number;
  population: number | null;
  incidencePer1000: number;
}

export interface OutlierFacility {
  facility: string;
  lga: string;
  totalCases: number;
  zScore: number;
  interpretation: string;
}

export interface DiseaseTimeSeriesPoint {
  year: number;
  month?: number;
  value: number;
}

export interface LGACaseData {
  lga: string;
  cases: number;
  population: number;
  facilities: number;
}

// ── Document Repository ───────────────────────────────────────────────────────

export type DocumentCategory =
  | "sop"
  | "policy"
  | "research"
  | "report"
  | "guideline"
  | "archive"
  | "evaluation";

export interface PortalDocument {
  id: string;
  slug: string;
  title: string;
  category: DocumentCategory;
  description?: string;
  fileFormat: "PDF" | "DOCX" | "XLSX" | "PPTX";
  fileSizeBytes: number;
  uploadedAt: string;
  uploadedBy: string;
  organisationName: string;
  tags?: string[];
  restricted?: boolean;
  programId?: string;
}

// ── Programme Milestones ──────────────────────────────────────────────────────

export interface ProgramMilestone {
  id: string;
  title: string;
  targetDate: string;
  completedDate?: string;
  status: "pending" | "completed" | "overdue";
}

// ── Data Freshness Compliance ─────────────────────────────────────────────────

/** ISO date of the next expected update, derived from updateFrequency + updatedAt */
export type FreshnessStatus = "fresh" | "due_soon" | "overdue" | "unknown";

// ── Notification ─────────────────────────────────────────────────────────────

export type NotificationType =
  | "dataset_published"
  | "dataset_updated"
  | "approval_request"
  | "revision_request"
  | "access_granted"
  | "disease_alert"
  | "qa_flag"
  | "sop_updated";

export interface PortalNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  link?: string;
}

// ── Outbreak Alert ────────────────────────────────────────────────────────────

export type AlertSeverity = "info" | "warning" | "critical";

export interface OutbreakAlert {
  id: string;
  title: string;
  summary: string;
  disease: string;
  affectedLGAs: string[];
  severity: AlertSeverity;
  publishedAt: string;
  active: boolean;
}

// ── SOP ──────────────────────────────────────────────────────────────────────

export type SOPCategory = "submission" | "validation" | "publication" | "archival" | "correction";

export interface SOP {
  id: string;
  title: string;
  category: SOPCategory;
  version: string;
  effectiveDate: string;
  summary: string;
  fileUrl?: string;
  lastReviewed?: string;
}
