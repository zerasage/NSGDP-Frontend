import type { UserRole } from "@/types";
import type { DatasetStatus } from "@/types";
import { isOrgAdmin } from "./portal-access";

export interface DatasetPermissionFields {
  status: DatasetStatus | string;
  owner_id: string;
  metadata?: Record<string, unknown> | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  review_comment?: string | null;
  approved_at?: string | null;
  status_before_archive?: string | null;
}

type DatasetUser = { id: string; role: UserRole } | null | undefined;

/** Admin may edit any org dataset; contributors only their own non-approved rows. */
export function canEditDataset(
  user: DatasetUser,
  dataset: DatasetPermissionFields | null | undefined,
): boolean {
  if (!user || !dataset) return false;
  // Draft and pending only — under review / approved / published need a retract request.
  if (dataset.status !== "draft" && dataset.status !== "pending") return false;
  if (isOrgAdmin(user.role)) return true;
  if (user.role === "contributor" && dataset.owner_id === user.id) return true;
  return false;
}

/** Who may use the Retract action (self-archive or request). */
export function canRetractDataset(
  user: DatasetUser,
  dataset: DatasetPermissionFields | null | undefined,
): boolean {
  if (!user || !dataset) return false;
  if (dataset.status === "archived") return false;

  const selfArchive = ["draft", "pending"];
  const needsRequest = ["rejected", "under_review", "approved"];
  if (![...selfArchive, ...needsRequest].includes(dataset.status)) return false;

  if (isOrgAdmin(user.role)) return true;
  if (user.role === "contributor" && dataset.owner_id === user.id) return true;
  return false;
}

/** True when retract queues a super-admin request instead of archiving immediately. */
export function retractRequiresApproval(
  dataset: DatasetPermissionFields | null | undefined,
): boolean {
  if (!dataset) return false;
  return ["rejected", "under_review", "approved"].includes(dataset.status);
}

/** Portal users may restore datasets archived from draft or pending. */
export function canUnarchiveDataset(
  user: DatasetUser,
  dataset: DatasetPermissionFields | null | undefined,
): boolean {
  if (!user || !dataset || dataset.status !== "archived") return false;
  if (
    !isOrgAdmin(user.role) &&
    !(user.role === "contributor" && dataset.owner_id === user.id)
  ) {
    return false;
  }

  const savedStatus =
    dataset.status_before_archive ?? dataset.metadata?._status_before_archive;
  if (typeof savedStatus === "string") {
    return savedStatus === "draft" || savedStatus === "pending";
  }

  if (dataset.approved_at || (dataset.reviewed_at && dataset.review_comment)) {
    return false;
  }
  return true;
}

/** Portal users may directly archive draft or pending datasets only. */
export function canDeleteDataset(
  user: DatasetUser,
  dataset: DatasetPermissionFields | null | undefined,
): boolean {
  if (!user || !dataset) return false;

  const deletableStatuses = ["draft", "pending"];
  if (isOrgAdmin(user.role) && deletableStatuses.includes(dataset.status)) {
    return true;
  }
  if (user.role === "contributor" && dataset.owner_id === user.id) {
    return (
      dataset.status === "draft" || dataset.status === "pending"
    );
  }
  return false;
}

/** Admin may submit any org draft/rejected dataset; contributors their own only. */
export function canSubmitDataset(
  user: DatasetUser,
  dataset: DatasetPermissionFields | null | undefined,
): boolean {
  if (!user || !dataset) return false;
  if (dataset.status !== "draft" && dataset.status !== "rejected") {
    return false;
  }
  if (isOrgAdmin(user.role)) return true;
  if (user.role === "contributor" && dataset.owner_id === user.id) return true;
  return false;
}
