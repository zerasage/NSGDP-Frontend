import type { UserRole } from "@/types";
import type { ProgramPermissionAction } from "@/types/permissions";

/** Org-group capability that unlocks My Programmes for contributor/admin. */
export const ORG_PROGRAM_CAPABILITY = "create:programs" as const;

// Role defines the *shape* of programme actions once the org is granted access.
// CONTRIBUTOR/ADMIN still need `create:programs` on their organisation via an
// Organisation Group — without that grant they get nothing in the portal.
export const ROLE_PROGRAM_BASE: Record<UserRole, ProgramPermissionAction[]> = {
  public: [],
  registered: [],
  contributor: ["edit:programs", "upload:programs"],
  admin: ["create:programs", "edit:programs", "upload:programs"],
  staff: [],
  super_admin: ["create:programs", "edit:programs", "delete:programs", "upload:programs"],
};

function orgHasProgramAccess(
  role: UserRole,
  organisationCapabilities: string[] | undefined,
): boolean {
  if (role === "super_admin") return true;
  if (role !== "contributor" && role !== "admin") return false;
  return (organisationCapabilities ?? []).includes(ORG_PROGRAM_CAPABILITY);
}

export function getEffectiveProgramPermissions(
  role: UserRole,
  organisationCapabilities?: string[],
): ProgramPermissionAction[] {
  if (!orgHasProgramAccess(role, organisationCapabilities)) return [];
  return ROLE_PROGRAM_BASE[role] ?? [];
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
  create: "create:programs",
  edit: "edit:programs",
  delete: "delete:programs",
  upload: "upload:programs",
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

/** True when the user may open My Programmes at all (nav + page gate). */
export function canAccessPrograms(
  role: UserRole,
  organisationCapabilities?: string[],
): boolean {
  return orgHasProgramAccess(role, organisationCapabilities);
}
