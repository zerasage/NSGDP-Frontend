import type { FaqItem, GlossaryTerm } from "./types";

export const GLOSSARY: GlossaryTerm[] = [
  {
    term: "Draft",
    category: "Workflow",
    definition:
      "A dataset you have saved but not submitted. It is not in the review queue and only your partner can see it.",
  },
  {
    term: "Pending",
    category: "Workflow",
    definition:
      "Submitted and waiting in the review queue for a validator to pick it up.",
  },
  {
    term: "Under review",
    category: "Workflow",
    definition:
      "A validator is working through the 8-dimension QA checklist.",
  },
  {
    term: "Validated",
    category: "Workflow",
    definition:
      "QA passed. Waiting for a separate approver to give final sign-off.",
  },
  {
    term: "Approved",
    category: "Workflow",
    definition:
      "Accepted after final sign-off. Not yet visible to the public until published.",
  },
  {
    term: "Published",
    category: "Workflow",
    definition:
      "Live in the public catalogue. Visibility then decides who can preview and download.",
  },
  {
    term: "Revision requested",
    category: "Workflow",
    definition:
      "A reviewer sent the dataset back to you with comments. Fix and resubmit to open a new pending ticket.",
  },
  {
    term: "Retract",
    category: "Workflow",
    definition:
      "Withdraw and archive a dataset. Immediate for drafts and pending items; needs super admin approval otherwise.",
  },
  {
    term: "Public",
    category: "Access",
    definition:
      "Anyone can find and preview the dataset; downloading requires a free account.",
  },
  {
    term: "Restricted",
    category: "Access",
    definition:
      "Listed in the catalogue, but preview and download need an approved access request.",
  },
  {
    term: "Private",
    category: "Access",
    definition:
      "Visible only to your development partner's members and NSPHCDA administrators.",
  },
  {
    term: "Access request",
    category: "Access",
    definition:
      "A signed-in user's request to download a restricted dataset, with a stated reason of at least 20 characters.",
  },
  {
    term: "Development Partner Admin",
    category: "Access",
    definition:
      "A member of a partner organisation who can manage its team, edit its profile, and approve access to its restricted datasets.",
  },
  {
    term: "Consent agreement",
    category: "Access",
    definition:
      "The Data Contribution & Usage Consent Agreement your organisation accepts before contributing. You keep ownership; NSPHCDA holds publication rights.",
  },
  {
    term: "Metadata",
    category: "Data",
    definition:
      "Descriptive information about a dataset — title, coverage, period, methodology, licence, contact — that lets others find and trust it.",
  },
  {
    term: "Data licence",
    category: "Data",
    definition:
      "The terms under which others may reuse your data, for example CC-BY-4.0 (reuse with attribution).",
  },
  {
    term: "Version",
    category: "Data",
    definition:
      "Each upload against the same dataset creates a version. History is kept so you can see what changed.",
  },
  {
    term: "Update frequency",
    category: "Data",
    definition:
      "How often you plan to refresh a dataset. Missed dates make it show as overdue.",
  },
  {
    term: "QA checklist",
    category: "Data",
    definition:
      "Eight dimensions reviewers assess: completeness, accuracy, consistency, timeliness, validity, uniqueness, geo-references, and documentation.",
  },
  {
    term: "DHIS2",
    category: "Data",
    definition:
      "The national health information system. The portal complements it. DHIS2 exports are uploaded manually and tagged dhis2.",
  },
  {
    term: "LGA",
    category: "Geography",
    definition: "Local Government Area. Niger State has 25.",
  },
  {
    term: "Ward",
    category: "Geography",
    definition:
      "A smaller administrative area within an LGA. There are around 274 wards in Niger State.",
  },
  {
    term: "EPSG:4326 (WGS 84)",
    category: "Geography",
    definition:
      "The coordinate system the portal expects for spatial data — latitude and longitude on the WGS 84 datum.",
  },
  {
    term: "GeoPackage",
    category: "Geography",
    definition:
      "A single-file spatial format (.gpkg) that holds vector layers and attributes. Opens directly in QGIS.",
  },
  {
    term: "Indicator",
    category: "Analytics",
    definition:
      "A named health measure, such as confirmed malaria cases, that the analytics dashboard tracks over time and place.",
  },
  {
    term: "Measure kind",
    category: "Analytics",
    definition:
      "The type of an indicator — cases, stock, population, or rate. Analytics keeps them separate so you never compare unlike measures.",
  },
  {
    term: "Incidence per 1,000",
    category: "Analytics",
    definition:
      "Cases divided by population, multiplied by 1,000. Shown only for case-based measures with a population denominator.",
  },
  {
    term: "Completeness",
    category: "Analytics",
    definition:
      "The share of expected facility-month reports that are present for an indicator in the selected period.",
  },
  {
    term: "Facility outlier",
    category: "Analytics",
    definition:
      "A facility whose value sits two or more standard deviations from its LGA mean. A prompt to check reporting, not a verdict.",
  },
  {
    term: "Choropleth",
    category: "Analytics",
    definition:
      "A map where areas are shaded by a value, such as cases per LGA.",
  },
];

export const FAQS: FaqItem[] = [
  {
    id: "faq-who",
    group: "Getting started",
    question: "Who can upload datasets?",
    answer:
      "Members of a development partner with the Contributor or Development Partner Admin role. New partners start with the Contribute Data form; NSPHCDA reviews it and, if approved, sends an invitation.",
  },
  {
    id: "faq-account",
    group: "Getting started",
    question: "I didn't get my invite email. What now?",
    answer:
      "Check spam first. Then ask your Development Partner Admin to resend the invite from Dev Partner → Invites. If you are the first person at your organisation, contact the data team.",
  },
  {
    id: "faq-role",
    group: "Getting started",
    question: "What is the difference between a contributor and an admin?",
    answer:
      "Contributors upload and track datasets, documents, and programme reports. Admins do all of that plus invite and manage members, approve access requests, and edit the partner profile.",
  },
  {
    id: "faq-formats",
    group: "Uploading",
    question: "Which file formats can I upload?",
    answer:
      "CSV, Excel, JSON, GeoJSON, zipped Shapefile, GeoPackage, KML, and PDF documentation. You can attach several files to one dataset.",
  },
  {
    id: "faq-draft-file",
    group: "Uploading",
    question: "Can I save a draft without a file?",
    answer:
      "No. A file is required even for drafts so reviewers have something to check when you submit. Attach a placeholder file if you need to hold the record.",
  },
  {
    id: "faq-dhis2",
    group: "Uploading",
    question: "How do I share DHIS2 data?",
    answer:
      "Export from DHIS2 as CSV or Excel and upload it like any dataset. Tag it dhis2, mention DHIS2 in Methodology, and set the update frequency. Automatic sync is not available yet.",
  },
  {
    id: "faq-leave",
    group: "Uploading",
    question: "What if I leave the wizard halfway?",
    answer:
      "You will be warned before leaving a filled-in form. Save as draft on the last step to keep your work; drafts appear under Datasets.",
  },
  {
    id: "faq-time",
    group: "Review & publishing",
    question: "How long does review take?",
    answer:
      "It depends on queue size and dataset complexity. You are notified at each stage, so there is no need to keep checking. Complete metadata and tidy files are the biggest speed-ups.",
  },
  {
    id: "faq-approved",
    group: "Review & publishing",
    question: "My dataset is Approved but not in the catalogue. Why?",
    answer:
      "Approval is final sign-off; publishing is a separate action by a publisher. Once published it appears in the catalogue according to its visibility.",
  },
  {
    id: "faq-edit",
    group: "Review & publishing",
    question: "Can I edit a dataset while it's under review?",
    answer:
      "Not while it is being reviewed. If reviewers request revisions it returns to you for editing; after publishing, admins can edit and trigger re-review.",
  },
  {
    id: "faq-versions",
    group: "Review & publishing",
    question: "How do I update a dataset for a new period?",
    answer:
      "Add the new file to the existing dataset instead of creating a new one. Each upload becomes a version and goes back through review.",
  },
  {
    id: "faq-visibility",
    group: "Access & privacy",
    question: "Who can see my Private datasets?",
    answer:
      "Only members of your development partner and NSPHCDA administrators. They never appear in the public catalogue.",
  },
  {
    id: "faq-pii",
    group: "Access & privacy",
    question: "Can I upload patient-level data?",
    answer:
      "No. Aggregate or de-identify data before upload. Datasets containing identifiable personal health information will be returned or rejected.",
  },
  {
    id: "faq-withdraw",
    group: "Access & privacy",
    question: "Can I take my data down later?",
    answer:
      "Yes — use Retract on the dataset page. Drafts and pending datasets are archived immediately; reviewed or published ones need super admin approval. NSPHCDA may keep a copy where the law or audit requires it.",
  },
  {
    id: "faq-preview",
    group: "Analytics & maps",
    question: "Why does the preview show only some rows?",
    answer:
      "Previews are a limited sample to help you judge a dataset. Download it for the full data.",
  },
  {
    id: "faq-analytics-missing",
    group: "Analytics & maps",
    question: "My dataset is published but not in analytics. Why?",
    answer:
      "Analytics uses data that has been loaded into the analytics warehouse. That happens after publication and can wait on resolving indicator names. Ask the data team if it has been several days.",
  },
  {
    id: "faq-ward-empty",
    group: "Analytics & maps",
    question: "Why is the ward chart empty?",
    answer:
      "Many indicators are reported only at LGA level. An empty ward chart usually means no ward breakdown exists, not that data is missing.",
  },
];

export const FAQ_GROUPS: FaqItem["group"][] = [
  "Getting started",
  "Uploading",
  "Review & publishing",
  "Access & privacy",
  "Analytics & maps",
];
