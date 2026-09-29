import type { GuideCategory } from "@/lib/learning/types";

/** Guides-tab category filter, shared between the hub, GuidesTab, and the side panel. */
export type CategoryFilter = GuideCategory | "all" | "saved";
