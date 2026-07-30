// Auth Module Exports
// Central export point for authentication functionality

// Real auth context (production)
export { AuthProvider, useAuth } from "./auth-context";

// Mock session (development/testing)
export { MockSessionProvider, useMockSession } from "./mock-session";
export type { DatasetAccessState } from "./mock-session";

// Program permissions
export {
  ROLE_PROGRAM_BASE,
  getEffectiveProgramPermissions,
  hasProgramPermission,
  canProgram,
  canEditProgram,
} from "./program-permissions";
export type { ProgramCapability } from "./program-permissions";
