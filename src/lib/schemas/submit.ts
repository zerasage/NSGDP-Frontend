import { z } from "zod";

export const submitDatasetSchema = z.object({
  // ── Core identification ──────────────────────────────────────────────
  datasetName: z.string().min(3, "Dataset name must be at least 3 characters"),
  organisation: z.string().min(2, "Development Partner is required"),
  responsibleDept: z.string().min(2, "Responsible department is required"),
  contactPerson: z.string().min(2, "Contact person name is required"),
  contactEmail: z.string().email("Enter a valid email address"),

  // ── Coverage & period ────────────────────────────────────────────────
  geographicCoverage: z
    .string()
    .min(3, "Geographic coverage is required, e.g. 'All 25 LGAs, Niger State'"),
  reportingPeriod: z
    .string()
    .min(4, "Reporting period is required, e.g. 'Jan 2024 – Dec 2024'"),

  // ── Technical ────────────────────────────────────────────────────────
  category: z.enum(["Disease Data", "Health Facilities", "Population", "Surveillance"], {
    message: "Select a category",
  }),
  dataFormat: z.enum(
    ["CSV", "Excel", "JSON", "GeoJSON", "Shapefile", "DHIS2 Export"],
    { message: "Select a data format" }
  ),
  updateFrequency: z.enum(
    ["Daily", "Weekly", "Monthly", "Quarterly", "Bi-annually", "Annually", "One-time"],
    { message: "Select update frequency" }
  ),

  // ── Governance ───────────────────────────────────────────────────────
  dataLicense: z.string().min(1, "Enter or select a license"),

  // ── Description & keywords ───────────────────────────────────────────
  description: z.string().min(20, "Description must be at least 20 characters"),
  tags: z.string().min(1, "Add at least one tag"),
});

export type SubmitDatasetFormData = z.infer<typeof submitDatasetSchema>;
