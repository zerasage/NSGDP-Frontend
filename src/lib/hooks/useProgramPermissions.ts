"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import {
  canAccessPrograms,
  canProgram,
  getEffectiveProgramPermissions,
} from "@/lib/auth/program-permissions";
import type { ProgramCapability } from "@/lib/auth/program-permissions";

// Org-scoping is enforced by my-organization endpoints and ownership checks.
// Portal access additionally requires the organisation's `create:programs`
// Organisation Group capability (surfaced on /auth/me).
export function useProgramPermissions() {
  const { user } = useAuth();
  const role = user?.role ?? "public";
  const organisationCapabilities = user?.organisationCapabilities;

  return useMemo(
    () => ({
      permissions: getEffectiveProgramPermissions(role, organisationCapabilities),
      canAccess: canAccessPrograms(role, organisationCapabilities),
      can: (capability: ProgramCapability) =>
        canProgram(role, capability, organisationCapabilities),
      canCreate: canProgram(role, "create", organisationCapabilities),
      canUpload: canProgram(role, "upload", organisationCapabilities),
      canDelete: canProgram(role, "delete", organisationCapabilities),
    }),
    [role, organisationCapabilities],
  );
}
