// Auth Module Exports
// Central export point for authentication functionality

// Real auth context (production)
export { AuthProvider, useAuth } from "./auth-context";

// Mock session (development/testing)
export { MockSessionProvider, useMockSession } from "./mock-session";
export type { DatasetAccessState } from "./mock-session";

// Program permissions
export {
  ORG_PROGRAM_MANAGE_CAPABILITY,
  ORG_PROGRAM_UPLOAD_CAPABILITY,
  getEffectiveProgramPermissions,
  hasProgramPermission,
  canProgram,
  canAccessPrograms,
} from "./program-permissions";
export type { ProgramCapability } from "./program-permissions";
