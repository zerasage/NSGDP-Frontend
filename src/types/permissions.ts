// NSPHCDA Data Portal — programme permission types
//
// Programme permissions are the only permission-shaped thing this app
// checks, and they're baked into role (see lib/auth/program-permissions.ts),
// never fetched or delegated — only staff accounts can hold a delegated
// permission-group grant, and staff don't use this portal.
export type ProgramPermissionAction =
  | "create:programs"
  | "edit:programs"
  | "delete:programs"
  | "upload:programs";
