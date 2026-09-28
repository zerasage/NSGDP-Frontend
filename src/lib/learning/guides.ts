import type { Guide, GuideCategory } from "./types";

export const GUIDE_CATEGORIES: Array<{
  id: GuideCategory;
  label: string;
  description: string;
}> = [
  {
    id: "getting-started",
    label: "Getting started",
    description: "Accounts, invites, and your first look around the portal.",
  },
  {
    id: "contribute",
    label: "Contribute data",
    description: "Prepare, upload, and publish datasets your team owns.",
  },
  {
    id: "manage",
    label: "Manage your partner",
    description: "Team, access requests, programmes, and documents.",
  },
  {
    id: "explore",
    label: "Explore & analyse",
    description: "Search the catalogue, read analytics, and use the maps.",
  },
  {
    id: "gis",
    label: "GIS skills",
    description: "Work with portal data in desktop GIS tools.",
  },
];

export const GUIDES: Guide[] = [
  // ── Getting started ───────────────────────────────────────────────────
  {
    slug: "welcome-to-the-portal",
    title: "Welcome to the portal: how development partners fit in",
    summary:
      "A five-minute orientation to what the portal is for, who reviews your data, and where your team's work shows up.",
    category: "getting-started",
    audience: ["contributor", "partner_admin", "viewer"],
    minutes: 5,
    level: "Beginner",
    icon: "rocket",
    featured: true,
    updated: "2026-09-24",
    outcomes: [
      "Explain what the portal does and what it does not replace",
      "Tell the difference between the public site and your dashboard",
      "Know who reviews and publishes the data you submit",
    ],
    steps: [
      {
        title: "Understand the purpose",
        body: "The portal is Niger State's official health and geospatial data platform, run by NSPHCDA. It complements DHIS2 — it does not replace it. Partners share programme datasets here so planners can see them alongside state data.",
      },
      {
        title: "Know the two places you'll work",
        body: "The public site (catalogue, analytics, maps, programmes) is what everyone sees. Your dashboard is your private workspace for uploads, team management, programmes, and notifications.",
        screenshot: "Public site navigation and the Dashboard link in the account menu",
        link: { label: "Open your dashboard", href: "/dashboard" },
      },
      {
        title: "See who is involved after you submit",
        body: "Nothing you upload goes live immediately. Reviewers check quality first, a separate approver signs off, and a publisher releases it to the catalogue. You are notified at each stage.",
        tip: "Approved does not mean public — publishing is a separate step.",
      },
      {
        title: "Learn your role",
        body: "Contributors upload and track datasets. Development Partner Admins do everything contributors do, plus manage the team, approve access requests to restricted datasets, and edit the partner profile.",
      },
      {
        title: "Find help any time",
        body: "The green assistant button (bottom-right) answers how-to questions instantly and looks up live data for the rest. This learning hub, the FAQ, and the contact form cover everything else.",
      },
    ],
    callouts: [
      {
        tone: "info",
        title: "Data stays yours",
        body: "You keep ownership of the data you contribute. NSPHCDA holds publication rights for datasets accepted into the portal, under the Data Contribution & Usage Consent Agreement.",
      },
    ],
    cta: { label: "Go to your dashboard", href: "/dashboard" },
    related: ["accept-your-invite", "tour-your-dashboard", "after-you-submit"],
  },
  {
    slug: "accept-your-invite",
    title: "Accept your invite and set up your account",
    summary:
      "Create your login from the invite email, review the consent agreement on behalf of your organisation, and secure your account.",
    category: "getting-started",
    audience: ["contributor", "partner_admin"],
    minutes: 4,
    level: "Beginner",
    icon: "mail",
    updated: "2026-09-22",
    outcomes: [
      "Accept an invitation and choose a strong password",
      "Understand the consent agreement you are agreeing to",
      "Recover access if the invite link expires",
    ],
    steps: [
      {
        title: "Open the invite email",
        body: "Your Development Partner Admin (or NSPHCDA) sends the invite to your work email. The link opens a page showing your organisation, role, and who invited you.",
        tip: "Invites expire — the page warns you when only a few days are left.",
        screenshot: "Invite page showing organisation, role, and expiry warning",
      },
      {
        title: "Review the consent agreement (first member only)",
        body: "If your organisation has not yet consented, the first person to accept must read and agree to the Data Contribution & Usage Consent Agreement on the organisation's behalf. Later members skip this step.",
      },
      {
        title: "Set your name and password",
        body: "Enter your full name and a strong password. The strength meter turns green when the password is strong enough. Use a passphrase you do not reuse elsewhere.",
      },
      {
        title: "Sign in and check your profile",
        body: "After accepting, sign in and open Profile to confirm your details. Email and organisation membership are managed by admins — contact them if either needs to change.",
        link: { label: "Open profile", href: "/profile" },
      },
      {
        title: "If the link has expired",
        body: "Ask your Development Partner Admin to resend or reissue the invite from Dev Partner → Invites. They can revoke old links and send a fresh one in a few clicks.",
      },
    ],
    cta: { label: "Open profile", href: "/profile" },
    related: ["welcome-to-the-portal", "invite-your-team"],
  },
  {
    slug: "tour-your-dashboard",
    title: "A tour of your dashboard",
    summary:
      "Learn what every card, chip, and sidebar link does so you can find datasets, notifications, and team tools quickly.",
    category: "getting-started",
    audience: ["contributor", "partner_admin"],
    minutes: 4,
    level: "Beginner",
    icon: "layout",
    updated: "2026-09-20",
    outcomes: [
      "Read the dashboard summary cards at a glance",
      "Jump to any workspace area from the sidebar",
      "Spot items that need your attention",
    ],
    steps: [
      {
        title: "Read the summary cards",
        body: "The large card shows how many datasets your partner owns across every status. Smaller cards show datasets pending review, team members, your own contributions, and your downloads.",
        screenshot: "Dashboard hero metric card and summary cards",
      },
      {
        title: "Use the quick-action chips",
        body: "Chips under the welcome message take you straight to Browse data, Upload, Datasets, Programmes, Documents, and Team. They scroll sideways on small screens.",
      },
      {
        title: "Watch for attention banners",
        body: "An amber banner appears when datasets are awaiting review; admins also see pending access requests. Click a banner to jump to the filtered list.",
        link: { label: "See pending datasets", href: "/datasets?status=pending" },
      },
      {
        title: "Check notifications",
        body: "The Notifications panel lists review outcomes, invites, and system announcements. Unread items are bold with a dot; the bell in the top bar shows the count everywhere.",
        link: { label: "Open notifications", href: "/notifications" },
      },
      {
        title: "Use the sidebar",
        body: "Datasets, Documents, Programmes, and Dev Partner sit under Workspace. Downloads, Notifications, Learning, and Profile sit under Account. The Upload dataset button stays pinned at the bottom.",
      },
    ],
    cta: { label: "Open your dashboard", href: "/dashboard" },
    related: ["welcome-to-the-portal", "upload-your-first-dataset"],
  },

  // ── Contribute data ───────────────────────────────────────────────────
  {
    slug: "prepare-your-data",
    title: "Prepare your data before you upload",
    summary:
      "Formats the portal accepts, how to structure tables, and how to bring in DHIS2 exports the right way.",
    category: "contribute",
    audience: ["contributor", "partner_admin"],
    minutes: 8,
    level: "Beginner",
    icon: "file-check",
    updated: "2026-09-25",
    outcomes: [
      "Pick the right file format for your data",
      "Structure tables so reviewers and analytics can read them",
      "Export from DHIS2 and tag it correctly",
    ],
    steps: [
      {
        title: "Choose a supported format",
        body: "Tabular data: CSV or Excel (.xlsx/.xls). Structured exports: JSON. Spatial data: GeoJSON, Shapefile (zipped), GeoPackage, or KML. Reference documents can be PDF. You can attach more than one file to a dataset.",
        tip: "Health data tables belong in Upload dataset. SOPs and reports belong in Documents.",
      },
      {
        title: "Keep tables tidy",
        body: "One header row, one row per record or per period, no merged cells, no blank spacer rows. Use the official LGA names (all 25) and consistent spelling for wards and facilities.",
        screenshot: "A well-structured spreadsheet next to one with merged headers",
        link: { label: "Download a table template", href: "/learning?tab=templates" },
      },
      {
        title: "Use ISO dates and plain numbers",
        body: "Dates as YYYY-MM-DD. Numbers without thousands separators or units in the cell. Put units in the column name (for example cases_confirmed).",
      },
      {
        title: "Check spatial data",
        body: "Use WGS 84 (EPSG:4326). Points must fall inside Niger State. Polygons should close cleanly without gaps or overlaps. Reviewers check this in the Geo-References step of QA.",
      },
      {
        title: "Bringing in DHIS2 data",
        body: "Export your report from DHIS2 as CSV or Excel and upload it like any other dataset. There is no automatic DHIS2 sync yet. Tag the dataset dhis2, say so in Methodology, and set the update frequency to match how often you will re-export.",
        tip: "For the next period, upload a new version against the same dataset instead of creating a duplicate.",
      },
      {
        title: "Remove personal information",
        body: "Do not upload patient-level identifiable data. Aggregate or de-identify before sharing. If a dataset is sensitive, use Restricted visibility instead of Public.",
      },
    ],
    callouts: [
      {
        tone: "warning",
        title: "No personal health information",
        body: "Files containing identifiable patient data will be returned or rejected during review. The Nigeria Data Protection Act 2023 applies to what you share.",
      },
    ],
    cta: { label: "Start an upload", href: "/upload" },
    related: ["upload-your-first-dataset", "metadata-field-guide", "choose-visibility"],
  },
  {
    slug: "upload-your-first-dataset",
    title: "Upload your first dataset (step by step)",
    summary:
      "Walk through the five-step wizard, save a draft, and submit for review with everything reviewers need.",
    category: "contribute",
    audience: ["contributor", "partner_admin"],
    minutes: 10,
    level: "Beginner",
    icon: "upload",
    featured: true,
    updated: "2026-09-26",
    outcomes: [
      "Complete all five steps of the upload wizard",
      "Save a draft and come back later",
      "Submit a dataset for review",
    ],
    steps: [
      {
        title: "Open the wizard",
        body: "Click Upload dataset in the sidebar (or Upload in the quick actions). The stepper at the top shows five stages; you can click back to a completed step at any time.",
        screenshot: "Upload wizard stepper: Basic Info → Coverage → Files → Governance → Contact",
        link: { label: "Open the upload wizard", href: "/upload" },
      },
      {
        title: "Step 1 — Basic info",
        body: "Give the dataset a clear title, a description of at least 20 characters, a category, and at least one tag. A good title names the subject, geography, and year — for example Niger State Malaria Burden by LGA, 2025.",
        tip: "Tags power search. Add specific keywords such as malaria, quarterly, DHIS2.",
      },
      {
        title: "Step 2 — Coverage & indicators",
        body: "Tick every LGA the data covers (Select all for statewide). Set the reporting period start and end dates. Add the disease or health indicators the data measures, pressing Enter after each one.",
      },
      {
        title: "Step 3 — Upload files",
        body: "Drag files onto the upload area or browse for them. You can add several files. A file is required even for a draft, so reviewers have something to look at.",
        screenshot: "File upload area with two files attached",
      },
      {
        title: "Step 4 — Governance",
        body: "Choose a data licence (suggestions are provided, or type your own). Describe the methodology and any known limitations — reviewers read these closely.",
      },
      {
        title: "Step 5 — Contact & visibility",
        body: "Add a responsible department, contact person and email, and an update frequency. Pick visibility: Public, Restricted, or Private.",
        link: { label: "How to choose visibility", href: "/learning/choose-visibility" },
      },
      {
        title: "Save a draft or submit",
        body: "Save as draft to finish later — it will not enter the review queue. Submit for review when you are ready; the dataset becomes Pending and reviewers are notified.",
        tip: "Use the self-check before submitting to catch the most common review problems.",
        link: { label: "Run the self-check", href: "/learning?tab=self-check" },
      },
    ],
    callouts: [
      {
        tone: "tip",
        title: "Your work is not lost",
        body: "The wizard warns you before you leave a filled-in form. Drafts you save appear under Datasets with the Draft status.",
      },
    ],
    cta: { label: "Open the upload wizard", href: "/upload" },
    related: ["metadata-field-guide", "after-you-submit", "prepare-your-data"],
  },
  {
    slug: "metadata-field-guide",
    title: "Write metadata reviewers approve first time",
    summary:
      "What each metadata field means, what good looks like, and the small mistakes that trigger revision requests.",
    category: "contribute",
    audience: ["contributor", "partner_admin"],
    minutes: 8,
    level: "Intermediate",
    icon: "tags",
    updated: "2026-09-23",
    outcomes: [
      "Fill every required field with useful detail",
      "Write a methodology note a stranger could follow",
      "Avoid the most common revision requests",
    ],
    steps: [
      {
        title: "Title and description",
        body: "Titles should be specific and searchable. The description should say what the data contains, the period, the source, and its intended use — not just repeat the title.",
        tip: "If a colleague could not find it by searching, the title is too vague.",
      },
      {
        title: "Category and tags",
        body: "Pick the health domain that best fits. Add several tags mixing topic (malaria), method (DHIS2), and cadence (quarterly). Tags are required.",
      },
      {
        title: "Coverage and reporting period",
        body: "List only the LGAs actually covered. The reporting period must match the data — reviewers compare it against the dates inside the file (Timeliness check).",
      },
      {
        title: "Indicators",
        body: "Name the measures precisely, for example Confirmed cases or ANC 4th visit attendance. Use the same wording as the column headers where you can.",
      },
      {
        title: "Licence, methodology, limitations",
        body: "Say how the data was collected (for example Facility-based routine reporting via DHIS2). Be honest about gaps — reporting delays or excluded private facilities help users use the data correctly.",
        screenshot: "Governance step with methodology and limitations filled in",
      },
      {
        title: "Contact and update frequency",
        body: "Give a real person and email who can answer questions. Choose an update frequency you can keep — overdue datasets are flagged.",
      },
    ],
    callouts: [
      {
        tone: "warning",
        title: "Top reasons for revision requests",
        body: "Empty methodology, LGA names that do not match the official list, reporting periods that disagree with the file, and duplicate uploads of an existing dataset.",
      },
    ],
    cta: { label: "Run the self-check", href: "/learning?tab=self-check" },
    related: ["upload-your-first-dataset", "choose-visibility", "handle-revision-requests"],
  },
  {
    slug: "choose-visibility",
    title: "Choose the right visibility and licence",
    summary:
      "Public, Restricted, or Private — what each means for who can see, preview, and download your dataset.",
    category: "contribute",
    audience: ["contributor", "partner_admin"],
    minutes: 5,
    level: "Beginner",
    icon: "eye",
    updated: "2026-09-21",
    outcomes: [
      "Match a dataset's sensitivity to a visibility setting",
      "Explain what happens when someone requests access",
      "Pick a licence that fits how you want data reused",
    ],
    steps: [
      {
        title: "Public",
        body: "Anyone can find, preview, and (after logging in) download the dataset. Best for aggregated, non-sensitive data such as facility lists or LGA-level indicators.",
      },
      {
        title: "Restricted",
        body: "The dataset appears in the catalogue, but preview and download require an approved access request. Requesters must explain why they need it (at least 20 characters). Your Development Partner Admin or authorised staff decide.",
        screenshot: "Restricted dataset showing a Request Access button",
      },
      {
        title: "Private",
        body: "Only members of your development partner and NSPHCDA administrators can see it. It is not shown in the public catalogue. Use for drafts of sensitive work or internal reference files.",
      },
      {
        title: "Change visibility later",
        body: "Visibility can be adjusted after approval without reverting the review. NSPHCDA may also reclassify a dataset if there is a data-protection concern and will try to notify you.",
      },
      {
        title: "Pick a licence",
        body: "CC-BY-4.0 allows open reuse with attribution. Restricted use or All Rights Reserved limits reuse. The field accepts custom text if none of the suggestions fit.",
      },
    ],
    cta: { label: "Open your datasets", href: "/datasets" },
    related: ["approve-access-requests", "metadata-field-guide", "upload-your-first-dataset"],
  },
  {
    slug: "after-you-submit",
    title: "What happens after you submit",
    summary:
      "Follow a dataset through review, validation, approval, and publishing — and see exactly what you can do at each stage.",
    category: "contribute",
    audience: ["contributor", "partner_admin", "viewer"],
    minutes: 6,
    level: "Beginner",
    icon: "workflow",
    featured: true,
    updated: "2026-09-26",
    outcomes: [
      "Read your dataset's status on the Datasets page",
      "Know who acts at each stage",
      "Understand why approved is not the same as public",
    ],
    steps: [
      {
        title: "Pending",
        body: "You submitted. The dataset is in the review queue for your scope (Development Partners or Agency). Reviewers are notified. You can view it but not edit it while it waits.",
      },
      {
        title: "Under review",
        body: "A validator has claimed it and is working through the 8-dimension QA checklist: completeness, accuracy, consistency, timeliness, validity, uniqueness, geo-references, and documentation.",
      },
      {
        title: "Validated",
        body: "QA passed. A separate approver now decides. Splitting validation from approval means two people check every dataset.",
      },
      {
        title: "Approved",
        body: "Final sign-off. The dataset is accepted, but it is still hidden from the public until someone publishes it.",
        tip: "If your dataset shows Approved but is not in the catalogue, it is waiting for publication.",
      },
      {
        title: "Published",
        body: "The dataset is live in the catalogue. Visibility decides who can preview and download it. Analytics figures update once the data has been loaded into the warehouse.",
      },
      {
        title: "Side paths",
        body: "Reviewers can request revisions (the dataset returns to you) or reject it (final). Approvers can also send a validated dataset back to review — that is internal and you are not asked to do anything.",
      },
    ],
    callouts: [
      {
        tone: "info",
        title: "You are told at every step",
        body: "Status changes appear in Notifications and by email. You never need to keep checking the queue.",
      },
    ],
    cta: { label: "Check your dataset statuses", href: "/datasets" },
    related: ["handle-revision-requests", "publish-new-versions", "retract-a-dataset"],
  },
  {
    slug: "handle-revision-requests",
    title: "Respond to a revision request or rejection",
    summary:
      "Read reviewer feedback, fix what they found, and resubmit — plus what a rejection means and what to do next.",
    category: "contribute",
    audience: ["contributor", "partner_admin"],
    minutes: 5,
    level: "Beginner",
    icon: "refresh",
    updated: "2026-09-22",
    outcomes: [
      "Find and understand reviewer comments",
      "Correct the dataset and resubmit",
      "Know when a rejection is final",
    ],
    steps: [
      {
        title: "Open the notification",
        body: "A revision request arrives as a notification and an email with the reviewer's comment. Open the dataset from the notification to see the full feedback.",
        link: { label: "Open notifications", href: "/notifications" },
      },
      {
        title: "Read the comment carefully",
        body: "Comments name the QA dimension that failed — for example a duplicate LGA-period combination or a missing methodology. Make a list before you start editing.",
      },
      {
        title: "Edit the dataset",
        body: "Open the dataset and choose Edit. Update metadata, replace or add files, or change visibility. Saving keeps the current status; it does not resubmit automatically.",
        screenshot: "Dataset detail page with Edit and Submit for review buttons",
      },
      {
        title: "Submit for review again",
        body: "Use Submit for review on the dataset page. This opens a fresh pending ticket, so reviewers see it as a new submission with your fixes.",
        tip: "Mention in the description or methodology what you changed — it helps reviewers re-check quickly.",
      },
      {
        title: "If it was rejected",
        body: "Rejection is final for that submission and does not requeue automatically. Read the reason, correct the underlying problem, and upload a new dataset if the reviewer says the data is unsuitable.",
      },
    ],
    cta: { label: "Open your datasets", href: "/datasets" },
    related: ["metadata-field-guide", "after-you-submit", "upload-your-first-dataset"],
  },
  {
    slug: "publish-new-versions",
    title: "Keep a dataset current with new versions",
    summary:
      "Update the same dataset each reporting period instead of creating duplicates, and keep your update frequency honest.",
    category: "contribute",
    audience: ["contributor", "partner_admin"],
    minutes: 5,
    level: "Intermediate",
    icon: "refresh",
    updated: "2026-09-19",
    outcomes: [
      "Add a new period to an existing dataset",
      "Explain how version history works",
      "Avoid duplicate datasets for the same indicator",
    ],
    steps: [
      {
        title: "Find the dataset",
        body: "Open Datasets and select the dataset you want to refresh. Check the update frequency you declared so you know when the next version is due.",
      },
      {
        title: "Prepare the new period's file",
        body: "Keep the same column names and structure as the earlier upload so trends line up. Update the reporting period dates in metadata to include the new period.",
        tip: "Duplicate LGA-period rows are a common cause of revision requests.",
      },
      {
        title: "Upload against the same dataset",
        body: "Add the file to the existing dataset rather than creating a new one. Each upload becomes a version; the history is kept and visible on the dataset page.",
        screenshot: "Version history panel with three versions listed",
      },
      {
        title: "Resubmit for review",
        body: "A changed dataset goes back through review before the new data goes live. Watch Notifications for the outcome.",
      },
      {
        title: "Set reminders",
        body: "Datasets that miss their declared update date are flagged as overdue. If your cadence changes, update the update-frequency field.",
      },
    ],
    cta: { label: "Open your datasets", href: "/datasets" },
    related: ["after-you-submit", "prepare-your-data"],
  },
  {
    slug: "retract-a-dataset",
    title: "Retract or archive a dataset",
    summary:
      "Withdraw a dataset that was submitted by mistake or is no longer valid — and when a super admin has to approve it.",
    category: "contribute",
    audience: ["contributor", "partner_admin"],
    minutes: 4,
    level: "Intermediate",
    icon: "archive",
    updated: "2026-09-18",
    outcomes: [
      "Retract a draft or pending dataset immediately",
      "Request withdrawal of a reviewed or published dataset",
      "Know what happens to your data afterwards",
    ],
    steps: [
      {
        title: "Open the dataset",
        body: "From Datasets, open the dataset you want to withdraw. The Retract button appears on the dataset page when you are allowed to use it.",
      },
      {
        title: "Drafts and pending datasets",
        body: "These retract and archive immediately after you confirm. You can upload a fresh dataset afterwards.",
      },
      {
        title: "Under review, approved, or published",
        body: "A super admin must approve the withdrawal. Explain why (at least 10 characters) and send the request. The button changes to Request pending so you cannot send duplicates.",
        screenshot: "Retract dialog asking for a reason",
      },
      {
        title: "Wait for the outcome",
        body: "You are notified when the request is approved or denied. Approved requests archive the dataset and remove it from the catalogue.",
      },
      {
        title: "What NSPHCDA may keep",
        body: "Under the consent agreement, NSPHCDA may retain a copy where required by law, for audit, or where the data has already been aggregated into derived statistics.",
      },
    ],
    cta: { label: "Open your datasets", href: "/datasets" },
    related: ["after-you-submit", "choose-visibility"],
  },

  // ── Manage your partner ───────────────────────────────────────────────
  {
    slug: "invite-your-team",
    title: "Invite and manage your team",
    summary:
      "Add colleagues, choose their role, resend or revoke invites, and promote or remove members.",
    category: "manage",
    audience: ["partner_admin"],
    minutes: 6,
    level: "Beginner",
    icon: "users",
    updated: "2026-09-24",
    outcomes: [
      "Send, resend, and revoke invitations",
      "Choose between contributor and admin roles",
      "Remove someone who has left your organisation",
    ],
    steps: [
      {
        title: "Open Dev Partner",
        body: "Go to Dev Partner in the sidebar. The Team section lists active members; Invites lists pending and revoked invitations. Only Development Partner Admins see the Invites and Access sections.",
        link: { label: "Open Dev Partner", href: "/development-partner" },
      },
      {
        title: "Send an invite",
        body: "Click Invite member, enter the colleague's work email, and choose a role. The invite email includes a link that expires, so ask them to accept promptly.",
        screenshot: "Invite member dialog with email and role fields",
      },
      {
        title: "Resend or revoke",
        body: "From the three-dot menu on a pending invite you can resend it (for example after it expired) or revoke it if it was sent to the wrong address.",
      },
      {
        title: "Change a role",
        body: "Promote a contributor to Dev Partner Admin when they need to manage the team and approve access. Demote them back if their responsibilities change.",
        tip: "Keep the number of admins small — they can invite and remove members.",
      },
      {
        title: "Remove a member",
        body: "Removing someone detaches them from your development partner. They lose access to your partner's data but their account is not deleted.",
      },
    ],
    cta: { label: "Invite a member", href: "/development-partner" },
    related: ["accept-your-invite", "approve-access-requests"],
  },
  {
    slug: "approve-access-requests",
    title: "Handle access requests to your restricted datasets",
    summary:
      "Review who is asking for your data and why, then approve or deny — and what the requester sees.",
    category: "manage",
    audience: ["partner_admin"],
    minutes: 5,
    level: "Intermediate",
    icon: "key",
    updated: "2026-09-23",
    outcomes: [
      "Open the access request queue",
      "Judge a request from the stated reason",
      "Approve or deny and know what happens next",
    ],
    steps: [
      {
        title: "Open the Access section",
        body: "In Dev Partner, choose the Access chip. Pending requests for your restricted datasets are listed with the dataset, requester, and their reason.",
        link: { label: "Open Dev Partner", href: "/development-partner" },
      },
      {
        title: "Read the reason",
        body: "Requesters must explain their intended use (at least 20 characters). Look for a specific purpose, an organisation, and how the data will be handled.",
        screenshot: "Access request card with dataset, requester, and reason",
      },
      {
        title: "Approve",
        body: "Approving grants that requester preview and download for the dataset. They are notified and the button on the dataset page changes from Request Access to Download.",
      },
      {
        title: "Deny",
        body: "Denying returns them to the Request Access state; they may submit a new request later with more detail. Consider contacting them if a short reply would resolve it.",
      },
      {
        title: "Check your sensitivity settings",
        body: "If you approve the same kind of request repeatedly, the dataset may not need to be Restricted. Review visibility for that dataset.",
        link: { label: "Learn about visibility", href: "/learning/choose-visibility" },
      },
    ],
    cta: { label: "Review requests", href: "/development-partner" },
    related: ["choose-visibility", "invite-your-team"],
  },
  {
    slug: "track-programmes",
    title: "Create and track programmes",
    summary:
      "Register a health programme, choose how progress is measured, update coverage, and attach reports.",
    category: "manage",
    audience: ["contributor", "partner_admin"],
    minutes: 9,
    level: "Intermediate",
    icon: "target",
    updated: "2026-09-25",
    outcomes: [
      "Create a programme with target LGAs and objectives",
      "Pick a progress tracking mode that fits",
      "Update progress and upload reports",
    ],
    steps: [
      {
        title: "Open Programmes",
        body: "Programmes in the sidebar lists the programmes your partner owns or contributes to. Admins can create programmes; contributors with upload access can attach reports and update progress.",
        link: { label: "Open Programmes", href: "/my-programs" },
      },
      {
        title: "Create the programme",
        body: "Give it a name, a type (campaign, surveillance, screening, training, infrastructure, research, or other), a description, and its target LGAs. Objectives support rich text.",
        screenshot: "Programme form with type, status, and target LGAs",
      },
      {
        title: "Choose a progress mode",
        body: "LGA coverage tracks target LGAs against LGAs marked covered. Outcome count tracks a number you define, such as people trained. Combined tracks both — for example a campaign across 15 LGAs aiming to vaccinate 50,000 children.",
        tip: "The form suggests a sensible default for each programme type.",
      },
      {
        title: "Update progress",
        body: "As work proceeds, mark LGAs as covered and update the reach count. The progress bar and percentage on the public Programmes page update from what you enter.",
      },
      {
        title: "Attach reports",
        body: "Upload monitoring reports and evaluation briefs against the programme. They are submitted for admin review and appear on the programme page once approved.",
      },
      {
        title: "Close it out",
        body: "Set the status to Completed when the programme ends. Completed programmes keep their final reports available for download.",
      },
    ],
    callouts: [
      {
        tone: "info",
        title: "Self-reported progress",
        body: "Programme progress on the public site is what programme owners report. It is not calculated from disease data.",
      },
    ],
    cta: { label: "Go to My Programmes", href: "/my-programs" },
    related: ["read-the-analytics-dashboard", "manage-documents"],
  },
  {
    slug: "manage-documents",
    title: "Share SOPs and reports through Documents",
    summary:
      "Upload policy documents, SOPs, and evaluation reports for review and publication in the public library.",
    category: "manage",
    audience: ["contributor", "partner_admin"],
    minutes: 4,
    level: "Beginner",
    icon: "file-text",
    updated: "2026-09-17",
    outcomes: [
      "Choose Documents versus Datasets correctly",
      "Draft, attach a file, and submit for review",
      "Find your published document in the library",
    ],
    steps: [
      {
        title: "Pick the right place",
        body: "Health data tables (CSV, Excel, spatial files) go through Upload dataset. Narrative material — SOPs, guidelines, policies, research, evaluation reports — goes through Documents.",
        link: { label: "Open Documents", href: "/dashboard/documents" },
      },
      {
        title: "Create a document",
        body: "Choose Upload, enter a title, type, and description, and attach the file. Save as a draft while you finish; a file must be attached before you can submit.",
      },
      {
        title: "Submit for review",
        body: "Submit drafts (or rejected documents after fixing them). NSPHCDA staff review and publish. Status names match datasets: Draft, Pending, Under review, Approved, Published.",
        screenshot: "Document detail with Submit for review button",
      },
      {
        title: "Find it in the library",
        body: "Published documents appear in the public Document Library under their category, searchable by title and description.",
        link: { label: "Browse the library", href: "/documents" },
      },
    ],
    cta: { label: "Open Documents", href: "/dashboard/documents" },
    related: ["track-programmes", "after-you-submit"],
  },

  // ── Explore & analyse ─────────────────────────────────────────────────
  {
    slug: "find-and-download-data",
    title: "Find and download datasets",
    summary:
      "Search the catalogue, combine filters, preview data, and download one dataset or many at once.",
    category: "explore",
    audience: ["viewer", "contributor", "partner_admin"],
    minutes: 6,
    level: "Beginner",
    icon: "search",
    updated: "2026-09-26",
    outcomes: [
      "Narrow the catalogue with filters and search",
      "Read a dataset page and preview its data",
      "Bulk-download a selection as a ZIP",
    ],
    steps: [
      {
        title: "Search and filter",
        body: "Type in the search box, then refine with Category, Development Partners, LGAs, Disease, Ward, Year, and Format. Active filters show as chips you can remove one by one.",
        screenshot: "Data portal with filters and active filter chips",
        link: { label: "Open the data portal", href: "/dataportal" },
      },
      {
        title: "Sort results",
        body: "Order by Most Recent, Most Downloaded, or Alphabetical to surface what matters. Your page and sort choice stay in the URL so you can share the view.",
      },
      {
        title: "Open a dataset",
        body: "The dataset page shows the description, a preview of the data, automated insights (when dates and numeric columns are detected), files, methodology, limitations, and contact details.",
        tip: "Previews show a limited sample of rows. Download the dataset for the full data.",
      },
      {
        title: "Download",
        body: "Downloading requires a free account. Log in, then use Download dataset or Download all files as ZIP. Restricted datasets need an approved access request first.",
      },
      {
        title: "Bulk download",
        body: "Click Select on the catalogue, tick datasets (up to the limit shown), and choose Download ZIP. Datasets you cannot access are skipped and listed in _download-report.json inside the ZIP.",
      },
      {
        title: "Revisit later",
        body: "My Downloads keeps your history so you can find and re-download datasets you used before.",
        link: { label: "Open My Downloads", href: "/downloads" },
      },
    ],
    cta: { label: "Browse datasets", href: "/dataportal" },
    related: ["choose-visibility", "read-the-analytics-dashboard", "open-portal-data-in-qgis"],
  },
  {
    slug: "read-the-analytics-dashboard",
    title: "Read the analytics dashboard",
    summary:
      "Understand indicators, measure kinds, trends, LGA rankings, ward drill-downs, and outliers — and export what you see.",
    category: "explore",
    audience: ["viewer", "contributor", "partner_admin"],
    minutes: 9,
    level: "Intermediate",
    icon: "bar-chart",
    featured: true,
    updated: "2026-09-27",
    outcomes: [
      "Choose an indicator and year and read the headline figures",
      "Compare LGAs and spot facility outliers",
      "Filter by development partner and export to CSV",
    ],
    steps: [
      {
        title: "Pick a measure kind",
        body: "Switch between cases, stock, population, and rate/percent. Only indicators tagged for that kind appear in the dropdown, so you never compare unlike measures.",
        screenshot: "Analytics header with measure-kind buttons and indicator/year selectors",
        link: { label: "Open analytics", href: "/analytics" },
      },
      {
        title: "Read the summary cards",
        body: "State total for the year, LGAs reporting (out of 25), data completeness, and the number of facility outliers. Partial years are marked year-to-date with the months reported.",
      },
      {
        title: "Use the trend chart",
        body: "Annual view shows year-on-year totals. Seasonal view groups by calendar month across years, which makes seasonal peaks such as meningitis season easy to see.",
      },
      {
        title: "Compare LGAs",
        body: "The top-10 chart and the sortable LGA table rank areas. Incidence per 1,000 appears only for case-based measures and only where a population denominator exists. Rows above the threshold are tinted.",
        tip: "Click a table header to sort; click again to reverse.",
      },
      {
        title: "Drill into wards",
        body: "The Ward-level tab shows ward totals for one LGA. Many indicators are reported only at LGA level — an empty chart usually means no ward breakdown, not missing data.",
      },
      {
        title: "Spot outliers",
        body: "Facilities whose values sit two or more standard deviations from their LGA average are listed with a z-score. Treat them as prompts to check reporting, not as proof of error.",
      },
      {
        title: "Filter and export",
        body: "On the Ward and Programmes tabs you can limit results to one development partner. Export CSV downloads the dashboard data. When several sources publish the same indicator, the latest approved dataset wins.",
      },
    ],
    callouts: [
      {
        tone: "info",
        title: "Where the numbers come from",
        body: "Analytics uses published, approved datasets that have been loaded into the analytics warehouse. A dataset can be public in the catalogue before its figures appear here.",
      },
    ],
    cta: { label: "Open analytics", href: "/analytics" },
    related: ["use-the-maps", "find-and-download-data", "track-programmes"],
  },
  {
    slug: "use-the-maps",
    title: "Use the four maps",
    summary:
      "Choose the right map for the question you are asking — coverage, population and facilities, facility lookup, or settlement access.",
    category: "explore",
    audience: ["viewer", "contributor", "partner_admin"],
    minutes: 8,
    level: "Beginner",
    icon: "map",
    updated: "2026-09-25",
    outcomes: [
      "Pick the map that answers your question",
      "Switch layers and filters, and read the legend",
      "Open a facility or LGA for details",
    ],
    steps: [
      {
        title: "Dataset Coverage Map",
        body: "Shows how many published datasets cover each LGA, with a marker per dataset. Filter by topic, format, spatial versus tabular, or LGA to see where your own data adds coverage.",
        link: { label: "Open coverage map", href: "/map" },
        screenshot: "Coverage choropleth with dataset markers",
      },
      {
        title: "Population & Facility Map",
        body: "Switch layers between population density, facility density, and disease burden. For disease burden, choose an indicator and year. Turn on ward boundaries after selecting an LGA.",
        link: { label: "Open population map", href: "/population-map" },
        tip: "Click an LGA for a popup; disease-burden popups include a small trend sparkline.",
      },
      {
        title: "Facility Finder",
        body: "Search the registry of more than 2,000 health facilities by name, and filter by LGA, ward, and level (Primary, Secondary, Tertiary). Markers cluster when zoomed out.",
        link: { label: "Open facility finder", href: "/facilities" },
      },
      {
        title: "Settlement Access Map",
        body: "Pick an LGA first, then view settlements by accessibility (fully, partially, inaccessible). Filter by flags such as hard to reach, riverine, or border settlement to plan outreach.",
        link: { label: "Open settlement map", href: "/settlements" },
      },
      {
        title: "Use the controls",
        body: "The filter panel and legend can be collapsed to free up space on mobile. Colours follow the legend, and the reset button clears all filters.",
      },
    ],
    cta: { label: "Open a map", href: "/map" },
    related: ["read-the-analytics-dashboard", "open-portal-data-in-qgis"],
  },
  {
    slug: "use-the-ai-assistant",
    title: "Get answers from the AI assistant",
    summary:
      "What the Health Data Assistant can look up, how to ask good questions, and what it will never do.",
    category: "explore",
    audience: ["viewer", "contributor", "partner_admin"],
    minutes: 3,
    level: "Beginner",
    icon: "sparkles",
    updated: "2026-09-16",
    outcomes: [
      "Open the assistant and use quick questions",
      "Ask data questions that return real numbers",
      "Follow source links to verify an answer",
    ],
    steps: [
      {
        title: "Open the assistant",
        body: "Click the green chat button at the bottom-right of any page. Quick-question chips get you started.",
      },
      {
        title: "Ask how-to questions",
        body: "Questions like How do I submit a dataset? are answered instantly with links to the right page.",
      },
      {
        title: "Ask data questions",
        body: "Ask for datasets, facilities in an LGA, indicator trends, or LGA burden. It uses live portal tools and quotes the indicator and year it used.",
        tip: "Be specific: Which LGAs had the highest malaria cases in 2025?",
      },
      {
        title: "Verify with source links",
        body: "Answers end with Open: links to the analytics view or dataset it used. Follow them to check the numbers yourself.",
      },
      {
        title: "Know the limits",
        body: "Guests see published public data only; signed-in partner users can also see their own datasets. It never invents figures and never asks for passwords or patient records.",
      },
    ],
    related: ["find-and-download-data", "read-the-analytics-dashboard"],
  },

  // ── GIS skills ────────────────────────────────────────────────────────
  {
    slug: "open-portal-data-in-qgis",
    title: "Open portal data in QGIS",
    summary:
      "Download a GeoPackage from the portal, load it into QGIS, join it to population figures, and make a simple choropleth map.",
    category: "gis",
    audience: ["viewer", "contributor", "partner_admin"],
    minutes: 15,
    level: "Intermediate",
    icon: "layers",
    updated: "2026-09-14",
    outcomes: [
      "Load a portal GeoPackage into QGIS",
      "Join a tabular dataset to LGA boundaries",
      "Style and export a choropleth map",
    ],
    steps: [
      {
        title: "Install QGIS",
        body: "Download the long-term release from qgis.org and install it. QGIS is free and open source; nothing on the portal requires it, but it is the best tool for deeper spatial analysis.",
        link: { label: "qgis.org", href: "https://qgis.org" },
      },
      {
        title: "Download the data",
        body: "From the data portal, log in and download a GeoPackage dataset (for example LGA boundaries) and a tabular dataset with LGA-level values.",
        link: { label: "Find spatial datasets", href: "/dataportal" },
      },
      {
        title: "Add the layer",
        body: "In QGIS choose Layer → Add Layer → Add Vector Layer and select the .gpkg file. Confirm the CRS is EPSG:4326 (WGS 84).",
        screenshot: "QGIS Add Vector Layer dialog with a GeoPackage selected",
      },
      {
        title: "Join the table",
        body: "Add the CSV as a delimited-text layer with no geometry, then open the boundary layer's Properties → Joins and join on the LGA name field. Check that names match exactly.",
        tip: "Trailing spaces and different spellings are the usual join problem.",
      },
      {
        title: "Style as a choropleth",
        body: "Open Symbology, choose Graduated, pick the joined value field, and select a colour ramp and class method. Five classes with Natural Breaks works well for most health indicators.",
      },
      {
        title: "Export a map",
        body: "Use Project → New Print Layout to add a title, legend, and scale bar, then export as an image or PDF for briefings.",
      },
    ],
    callouts: [
      {
        tone: "tip",
        title: "Further learning",
        body: "The QGIS Training Manual and GRID3 documentation cover projections, spatial joins, and buffer analysis in more depth.",
      },
    ],
    cta: { label: "Find spatial datasets", href: "/dataportal" },
    related: ["use-the-maps", "find-and-download-data"],
  },
];

export const GUIDE_BY_SLUG: Record<string, Guide> = Object.fromEntries(
  GUIDES.map((g) => [g.slug, g]),
);

export function getGuide(slug: string): Guide | undefined {
  return GUIDE_BY_SLUG[slug];
}
