import type { LearningPath } from "./types";

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: "contributor",
    title: "Data contributor path",
    description:
      "From your first login to a published dataset — everything a contributor needs, in the order you'll need it.",
    audience: "contributor",
    icon: "upload",
    guides: [
      "welcome-to-the-portal",
      "accept-your-invite",
      "tour-your-dashboard",
      "prepare-your-data",
      "upload-your-first-dataset",
      "metadata-field-guide",
      "choose-visibility",
      "after-you-submit",
      "handle-revision-requests",
      "publish-new-versions",
    ],
  },
  {
    id: "partner-admin",
    title: "Development partner admin path",
    description:
      "Run your organisation's presence: team, access decisions, programmes, and documents.",
    audience: "partner_admin",
    icon: "shield",
    guides: [
      "welcome-to-the-portal",
      "invite-your-team",
      "approve-access-requests",
      "choose-visibility",
      "track-programmes",
      "manage-documents",
      "retract-a-dataset",
    ],
  },
  {
    id: "explorer",
    title: "Explore and analyse path",
    description:
      "Find the data you need, read the analytics with confidence, and take it into GIS tools.",
    audience: "viewer",
    icon: "search",
    guides: [
      "find-and-download-data",
      "read-the-analytics-dashboard",
      "use-the-maps",
      "use-the-ai-assistant",
      "open-portal-data-in-qgis",
    ],
  },
];
