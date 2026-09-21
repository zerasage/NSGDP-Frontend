import type { LifecycleStage } from "@/types";

/**
 * Editorial approval pipeline (DatasetStatus) + catalogue publish.
 *
 * Two staff capabilities after submit:
 * - validate:datasets — pending → under_review → validated (QA checklist)
 * - approve:datasets  — validated → approved (final sign-off)
 * - publish:datasets  — approved → catalogue live (sets published_at; not a status enum)
 *
 * Archived / rejected are terminal side-paths, not pipeline steps.
 * Analytics warehouse load is a parallel ingestion track (see DatasetIngestionStatus).
 */
export const LIFECYCLE_PIPELINE: Array<{
  stage: LifecycleStage;
  label: string;
  role: string;
  permission?: string;
  description: string;
}> = [
  {
    stage: "draft",
    label: "Draft",
    role: "Contributor",
    description: "Owner prepares metadata and files; not in the review queue.",
  },
  {
    stage: "submitted",
    label: "Pending",
    role: "Contributor submits",
    description: "Entered review queue (status=pending). Dual scope: Development Partners or Agency.",
  },
  {
    stage: "under_review",
    label: "Under Review",
    role: "Validator",
    permission: "validate:datasets",
    description: "Claimed by a validator; 8-dimension QA checklist in progress.",
  },
  {
    stage: "validated",
    label: "Validated",
    role: "Validator",
    permission: "validate:datasets",
    description: "QA passed. Waiting for a separate Approver — not yet catalogue-visible.",
  },
  {
    stage: "approved",
    label: "Approved",
    role: "Approver",
    permission: "approve:datasets",
    description: "Final sign-off. Still hidden from public until explicitly published.",
  },
  {
    stage: "published",
    label: "Published",
    role: "Publisher",
    permission: "publish:datasets",
    description: "published_at set — live in the public catalogue. Analytics may auto-enqueue.",
  },
];

export const LIFECYCLE_PIPELINE_STAGES = LIFECYCLE_PIPELINE.map((s) => s.stage);

/** Maps backend DatasetStatus (and legacy labels) onto LifecycleStage. */
export function normalizeLifecycleStage(stage: string): LifecycleStage {
  const map: Record<string, LifecycleStage> = {
    creation: "draft",
    submission: "submitted",
    metadata_review: "under_review",
    technical_validation: "under_review",
    quality_assurance: "under_review",
    director_approval: "approved",
    periodic_update: "published",
    draft: "draft",
    pending: "submitted",
    submitted: "submitted",
    under_review: "under_review",
    validated: "validated",
    approved: "approved",
    published: "published",
    archived: "archived",
  };
  return map[stage] ?? "submitted";
}

export const LIFECYCLE_RATIONALE = {
  headline: "Two-stage review: validate, then approve, then publish",
  summary:
    "Validators run the QA checklist and mark datasets validated. Approvers give final sign-off. Catalogue publish is a separate action — approved does not mean public.",
  checklistReplaces: [
    "Metadata Review → Completeness, Documentation, Validity",
    "Technical Validation → Geo-References, Uniqueness, Validity",
    "Quality Assurance → Accuracy, Consistency, Timeliness",
  ],
  sidePaths: [
    "Reject — terminal; submitter notified; does not auto-requeue",
    "Request revision — back to contributor; resubmit opens a new pending ticket",
    "Archive — admin end-of-life; catalogue removed, admin can still see",
  ],
};

/** Parallel warehouse track (DatasetIngestionStatus) — independent of editorial status. */
export const INGESTION_PIPELINE: Array<{
  status: string;
  label: string;
  description: string;
}> = [
  {
    status: "not_ingested / uploaded",
    label: "Upload",
    description: "File landed; validation / upload-processing queues start.",
  },
  {
    status: "processing",
    label: "Processing",
    description: "Geo-extraction · staging · entity resolution · alias proposals.",
  },
  {
    status: "processed_pending_approval",
    label: "Ready to load",
    description: "Staging resolved; awaiting warehouse load in Ingestion Ops.",
  },
  {
    status: "published",
    label: "Analytics published",
    description: "disease_burden (and related) facts loaded; public analytics can use them.",
  },
];
