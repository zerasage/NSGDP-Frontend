import type { PlatformUpdate, TemplateAsset, TrainingSession } from "./types";

export const TEMPLATES: TemplateAsset[] = [
  {
    id: "tpl-lga",
    name: "LGA-level indicator template",
    description:
      "One row per LGA per period, pre-filled with all 25 LGAs. Use for annual or monthly indicator totals.",
    format: "CSV",
    filename: "lga-indicator-template.csv",
    audience: ["contributor", "partner_admin"],
  },
  {
    id: "tpl-facility",
    name: "Facility-level monthly reporting template",
    description:
      "Facility, ward, and LGA with year, month, indicator, and value columns in tidy long format.",
    format: "CSV",
    filename: "facility-monthly-template.csv",
    audience: ["contributor", "partner_admin"],
  },
  {
    id: "tpl-dictionary",
    name: "Data dictionary template",
    description:
      "Describe every column: meaning, type, allowed values, and an example. Attach it as a second file.",
    format: "CSV",
    filename: "data-dictionary-template.csv",
    audience: ["contributor", "partner_admin"],
  },
  {
    id: "tpl-metadata",
    name: "Metadata worksheet",
    description:
      "The upload fields with guidance and examples, so your team can agree answers before opening the wizard.",
    format: "CSV",
    filename: "metadata-worksheet.csv",
    audience: ["contributor", "partner_admin"],
  },
  {
    id: "tpl-qa",
    name: "Pre-submission QA checklist",
    description:
      "The eight review dimensions as a printable checklist for your team.",
    format: "TXT",
    filename: "pre-submission-qa-checklist.txt",
    audience: ["contributor", "partner_admin"],
  },
];

export const TRAINING_SESSIONS: TrainingSession[] = [
  {
    id: "ts-onboarding",
    title: "Contributor onboarding",
    description:
      "A live walk-through of the upload wizard using your own sample file. Bring a CSV.",
    date: "2026-10-08",
    time: "10:00 – 12:00 WAT",
    format: "Virtual",
    location: "Video call — link sent on registration",
    audience: ["contributor", "partner_admin"],
    seatsLeft: 12,
  },
  {
    id: "ts-metadata",
    title: "Metadata clinic",
    description:
      "Bring a draft dataset and get direct feedback on your metadata from the data team.",
    date: "2026-10-15",
    time: "14:00 – 15:30 WAT",
    format: "Virtual",
    location: "Video call — link sent on registration",
    audience: ["contributor", "partner_admin"],
    seatsLeft: 8,
  },
  {
    id: "ts-analytics",
    title: "Analytics and maps workshop",
    description:
      "Hands-on with the analytics dashboard and all four maps, followed by an introduction to QGIS.",
    date: "2026-10-22",
    time: "09:00 – 16:00 WAT",
    format: "In person",
    location: "NSPHCDA, Minna",
    audience: ["viewer", "contributor", "partner_admin"],
    seatsLeft: 20,
  },
  {
    id: "ts-admin",
    title: "Partner admin office hours",
    description:
      "Open drop-in for questions on team management, access requests, and programmes.",
    date: "2026-10-29",
    time: "11:00 – 12:00 WAT",
    format: "Virtual",
    location: "Video call — link sent on registration",
    audience: ["partner_admin"],
  },
];

export const PLATFORM_UPDATES: PlatformUpdate[] = [
  {
    id: "up-review",
    date: "2026-09-26",
    tag: "New",
    title: "Two-stage review is live",
    description:
      "Datasets are now validated by one reviewer and approved by another before publication. Your statuses now include Validated.",
    guide: "after-you-submit",
  },
  {
    id: "up-preview",
    date: "2026-09-25",
    tag: "Improved",
    title: "Dataset previews show a limited sample",
    description:
      "Previews now show a short sample of rows to help you judge a dataset. Download for the full file.",
    guide: "find-and-download-data",
  },
  {
    id: "up-bulk",
    date: "2026-09-18",
    tag: "New",
    title: "Bulk download as a ZIP",
    description:
      "Select several datasets in the catalogue and download them together. Datasets you cannot access are listed in a report inside the ZIP.",
    guide: "find-and-download-data",
  },
  {
    id: "up-analytics-filter",
    date: "2026-09-12",
    tag: "Improved",
    title: "Analytics can be filtered by partner",
    description:
      "The Ward and Programmes tabs now let you limit figures to one development partner.",
    guide: "read-the-analytics-dashboard",
  },
  {
    id: "up-dhis2",
    date: "2026-09-05",
    tag: "Heads up",
    title: "DHIS2 sync is still manual",
    description:
      "Continue to export from DHIS2 and upload as a dataset tagged dhis2. Automatic sync is planned for a later release.",
    guide: "prepare-your-data",
  },
];
