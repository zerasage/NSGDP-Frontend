import type { UserRole } from "@/types";
import type { DatasetStatus } from "@/types";
import { isOrgAdmin } from "./portal-access";

export interface DatasetPermissionFields {
  status: DatasetStatus | string;
  owner_id: string;
}

type DatasetUser = { id: string; role: UserRole } | null | undefined;

/** Admin may edit any org dataset; contributors only their own non-approved rows. */
export function canEditDataset(
  user: DatasetUser,
  dataset: DatasetPermissionFields | null | undefined,
): boolean {
  if (!user || !dataset) return false;
  if (isOrgAdmin(user.role)) return true;
  if (dataset.status === "approved") return false;
  if (user.role === "contributor" && dataset.owner_id === user.id) return true;
  return false;
}

/** Admin may delete draft/rejected/pending/approved; contributors own draft/rejected only. */
export function canDeleteDataset(
  user: DatasetUser,
  dataset: DatasetPermissionFields | null | undefined,
): boolean {
  if (!user || !dataset) return false;

  const deletableStatuses = ["draft", "rejected", "pending", "approved"];
  if (isOrgAdmin(user.role) && deletableStatuses.includes(dataset.status)) {
    return true;
  }
  if (user.role === "contributor" && dataset.owner_id === user.id) {
    return dataset.status === "draft" || dataset.status === "rejected";
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
