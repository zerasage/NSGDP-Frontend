import type { UserRole } from "@/types";
import type { ProgramPermissionAction } from "@/types/permissions";

// Programme permissions are baked into role — never delegated. Only staff
// accounts can be added to a permission group (backend-enforced), and staff
// don't use this portal, so there's no delegated grant to fetch here.
export const ROLE_PROGRAM_BASE: Record<UserRole, ProgramPermissionAction[]> = {
  public: [],
  registered: [],
  // Contributors can edit their own organisation's programmes — the backend
  // edit:programs decorator already allows CONTRIBUTOR, this just makes the
  // UI consistent with that instead of hiding a capability the API grants.
  contributor: ["edit:programs", "upload:programs"],
  admin: ["create:programs", "edit:programs", "upload:programs"],
  staff: [],
  super_admin: ["create:programs", "edit:programs", "delete:programs", "upload:programs"],
};

export function getEffectiveProgramPermissions(role: UserRole): ProgramPermissionAction[] {
  return ROLE_PROGRAM_BASE[role] ?? [];
}

export function hasProgramPermission(role: UserRole, action: ProgramPermissionAction): boolean {
  return getEffectiveProgramPermissions(role).includes(action);
}

export type ProgramCapability = "create" | "edit" | "delete" | "upload";

const CAPABILITY_ACTION: Record<ProgramCapability, ProgramPermissionAction> = {
  create: "create:programs",
  edit: "edit:programs",
  delete: "delete:programs",
  upload: "upload:programs",
};

export function canProgram(role: UserRole, capability: ProgramCapability): boolean {
  return hasProgramPermission(role, CAPABILITY_ACTION[capability]);
}
