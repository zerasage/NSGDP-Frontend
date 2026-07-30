import type { UserRole } from "@/types";
import type { PermissionAction } from "@/types/permissions";
import { PROGRAM_PERMISSION_ACTIONS } from "@/types/permissions";
import { mockUserGroups } from "@/lib/mock/permissions";

/** Base programme permissions granted by role (before group delegation) */
export const ROLE_PROGRAM_BASE: Record<UserRole, PermissionAction[]> = {
  public: [],
  registered: [],
  contributor: ["upload:programs"],
  admin: ["create:programs", "edit:programs", "upload:programs"],
  staff: [],
  super_admin: ["create:programs", "edit:programs", "delete:programs", "upload:programs"],
};

export function getDelegatedProgramPermissions(userId: string): PermissionAction[] {
  const actions = new Set<PermissionAction>();
  for (const group of mockUserGroups) {
    if (!group.memberIds.includes(userId)) continue;
    for (const action of group.delegatedPermissions) {
      if (PROGRAM_PERMISSION_ACTIONS.includes(action)) {
        actions.add(action);
      }
    }
  }
  return [...actions];
}

export function getEffectiveProgramPermissions(
  role: UserRole,
  userId: string
): PermissionAction[] {
  const base = ROLE_PROGRAM_BASE[role] ?? [];
  const delegated = getDelegatedProgramPermissions(userId);
  return [...new Set([...base, ...delegated])];
}

export function hasProgramPermission(
  role: UserRole,
  userId: string,
  action: PermissionAction
): boolean {
  return getEffectiveProgramPermissions(role, userId).includes(action);
}

export type ProgramCapability = "create" | "edit" | "delete" | "upload";

const CAPABILITY_ACTION: Record<ProgramCapability, PermissionAction> = {
  create: "create:programs",
  edit: "edit:programs",
  delete: "delete:programs",
  upload: "upload:programs",
};

export function canProgram(
  role: UserRole,
  userId: string,
  capability: ProgramCapability
): boolean {
  return hasProgramPermission(role, userId, CAPABILITY_ACTION[capability]);
}

/** Org admins may only edit programmes owned by their organisation */
export function canEditProgram(
  role: UserRole,
  userId: string,
  organisationIds: string[],
  programOrganisationId?: string
): boolean {
  if (!canProgram(role, userId, "edit")) return false;
  if (role === "admin" && programOrganisationId) {
    return organisationIds.includes(programOrganisationId);
  }
  return true;
}
