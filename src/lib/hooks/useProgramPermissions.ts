"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import {
  canProgram,
  getEffectiveProgramPermissions,
} from "@/lib/auth/program-permissions";
import type { ProgramCapability } from "@/lib/auth/program-permissions";

// Org-scoping used to be handled here (canEditProgram compared the caller's
// org to the programme's), but every programme-management page now sources
// its data from an org-scoped endpoint (my-organization) and the backend
// enforces ownership on every mutation — so these are plain role checks;
// there is no longer a programme in scope that could belong to another org.
export function useProgramPermissions() {
  const { user } = useAuth();
  const role = user?.role ?? "public";

  return useMemo(
    () => ({
      permissions: getEffectiveProgramPermissions(role),
      can: (capability: ProgramCapability) => canProgram(role, capability),
      canCreate: canProgram(role, "create"),
      canUpload: canProgram(role, "upload"),
      canDelete: canProgram(role, "delete"),
    }),
    [role]
  );
}
