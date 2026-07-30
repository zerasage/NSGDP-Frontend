"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import {
  canEditProgram,
  canProgram,
  getEffectiveProgramPermissions,
} from "@/lib/auth/program-permissions";
import type { ProgramCapability } from "@/lib/auth/program-permissions";

export function useProgramPermissions() {
  const { user } = useAuth();
  const role = user?.role ?? "public";
  const organisationId = user?.organisationId;

  return useMemo(
    () => ({
      permissions: getEffectiveProgramPermissions(role),
      can: (capability: ProgramCapability) => canProgram(role, capability),
      canEdit: (programOrganisationId?: string) =>
        canEditProgram(role, organisationId ? [organisationId] : [], programOrganisationId),
      canCreate: canProgram(role, "create"),
      canUpload: canProgram(role, "upload"),
      canDelete: canProgram(role, "delete"),
    }),
    [role, organisationId]
  );
}
