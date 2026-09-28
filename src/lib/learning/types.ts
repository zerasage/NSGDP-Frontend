export type LearningAudience = "contributor" | "partner_admin" | "viewer";

export type AudienceFilter = "all" | LearningAudience;

export type GuideCategory =
  | "getting-started"
  | "contribute"
  | "manage"
  | "explore"
  | "gis";

export type GuideLevel = "Beginner" | "Intermediate" | "Advanced";

/** Icon keys resolved in components/learning/learning-icons.ts so content stays serializable. */
export type LearningIconKey =
  | "book"
  | "rocket"
  | "layout"
  | "file-check"
  | "upload"
  | "tags"
  | "eye"
  | "workflow"
  | "refresh"
  | "archive"
  | "users"
  | "key"
  | "target"
  | "file-text"
  | "search"
  | "bar-chart"
  | "map"
  | "sparkles"
  | "layers"
  | "database"
  | "shield"
  | "mail"
  | "graduation";

export interface GuideStep {
  title: string;
  body: string;
  tip?: string;
  /** Caption for a screenshot placeholder shown under the step. */
  screenshot?: string;
  link?: { label: string; href: string };
}

export interface GuideCallout {
  tone: "tip" | "warning" | "info";
  title: string;
  body: string;
}

export interface Guide {
  slug: string;
  title: string;
  summary: string;
  category: GuideCategory;
  audience: LearningAudience[];
  minutes: number;
  level: GuideLevel;
  icon: LearningIconKey;
  featured?: boolean;
  updated: string;
  outcomes: string[];
  steps: GuideStep[];
  callouts?: GuideCallout[];
  /** Real portal page that lets the reader do what the guide describes. */
  cta?: { label: string; href: string };
  related: string[];
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  audience: LearningAudience;
  icon: LearningIconKey;
  guides: string[];
}

export interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: GuideCategory;
  guide?: string;
  chapters: Array<{ time: string; label: string }>;
  featured?: boolean;
  status: "available" | "coming-soon";
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  category: "Workflow" | "Access" | "Data" | "Geography" | "Analytics";
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  group: "Getting started" | "Uploading" | "Review & publishing" | "Access & privacy" | "Analytics & maps";
}

export interface TrainingSession {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  format: "Virtual" | "In person";
  location: string;
  audience: LearningAudience[];
  seatsLeft?: number;
}

export interface PlatformUpdate {
  id: string;
  date: string;
  title: string;
  description: string;
  tag: "New" | "Improved" | "Heads up";
  guide?: string;
}

export interface TemplateAsset {
  id: string;
  name: string;
  description: string;
  format: "CSV" | "TXT";
  filename: string;
  audience: LearningAudience[];
}

export interface LearningProgressState {
  completed: string[];
  bookmarks: string[];
  checklist: Record<string, boolean>;
  feedback: Record<string, "up" | "down">;
}
