import type { UserRole } from "@/types";

/** Portal org-member roles (Organisation Group members). */
export const ORG_MEMBER_ROLES = ["contributor", "admin"] as const;

export type OrgMemberRole = (typeof ORG_MEMBER_ROLES)[number];

export function isOrgMember(
  role: UserRole | undefined | null,
): role is OrgMemberRole {
  return !!role && (ORG_MEMBER_ROLES as readonly string[]).includes(role);
}

export function isOrgAdmin(role: UserRole | undefined | null): boolean {
  return role === "admin";
}
