import type { UserRole } from "@/types";
import type { ProgramPermissionAction } from "@/types/permissions";

/** Org-group capability that unlocks full My Programmes management. */
export const ORG_PROGRAM_MANAGE_CAPABILITY = "manage:programs" as const;

const FULL_PROGRAM_ACTIONS: Record<
  Extract<UserRole, "contributor" | "admin" | "super_admin">,
  ProgramPermissionAction[]
> = {
  contributor: ["manage:programs"],
  admin: ["manage:programs"],
  super_admin: ["manage:programs", "delete:programs"],
};

function orgCapabilities(
  organisationCapabilities: string[] | undefined,
): string[] {
  return organisationCapabilities ?? [];
}

function orgHasManageAccess(caps: string[]): boolean {
  return caps.includes(ORG_PROGRAM_MANAGE_CAPABILITY);
}

export function getEffectiveProgramPermissions(
  role: UserRole,
  organisationCapabilities?: string[],
): ProgramPermissionAction[] {
  if (role === "super_admin") {
    return FULL_PROGRAM_ACTIONS.super_admin;
  }

  const caps = orgCapabilities(organisationCapabilities);
  if ((role === "contributor" || role === "admin") && orgHasManageAccess(caps)) {
    return FULL_PROGRAM_ACTIONS[role];
  }

  return [];
}

export function hasProgramPermission(
  role: UserRole,
  action: ProgramPermissionAction,
  organisationCapabilities?: string[],
): boolean {
  return getEffectiveProgramPermissions(role, organisationCapabilities).includes(
    action,
  );
}

export type ProgramCapability = "create" | "edit" | "delete" | "upload";

const CAPABILITY_ACTION: Record<ProgramCapability, ProgramPermissionAction> = {
  create: "manage:programs",
  edit: "manage:programs",
  delete: "delete:programs",
  upload: "manage:programs",
};

export function canProgram(
  role: UserRole,
  capability: ProgramCapability,
  organisationCapabilities?: string[],
): boolean {
  return hasProgramPermission(
    role,
    CAPABILITY_ACTION[capability],
    organisationCapabilities,
  );
}

/** True when the user may open My Programmes (manage org grant). */
export function canAccessPrograms(
  role: UserRole,
  organisationCapabilities?: string[],
): boolean {
  if (role === "super_admin") return true;
  if (role !== "contributor" && role !== "admin") return false;
  const caps = orgCapabilities(organisationCapabilities);
  return orgHasManageAccess(caps);
}
