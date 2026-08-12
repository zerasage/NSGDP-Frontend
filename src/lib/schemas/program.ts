import { z } from "zod";

export const programFormSchema = z.object({
  name: z.string().min(5, "Programme name must be at least 5 characters"),
  type: z.enum([
    "campaign",
    "surveillance",
    "screening",
    "training",
    "infrastructure",
    "research",
    "other",
  ]),
  status: z.enum(["planned", "ongoing", "completed"]),
  description: z.string().min(20, "Description must be at least 20 characters"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  primaryMetric: z.string().min(2, "Primary metric is required"),
  targetCount: z.number().min(1, "Target must be at least 1"),
  reachCount: z.number().min(0).optional(),
  lgasCovered: z.number().min(0).max(25).optional(),
});

export type ProgramFormData = z.infer<typeof programFormSchema>;

export const programReportSchema = z.object({
  title: z.string().min(5, "Report title is required"),
  fileFormat: z.enum(["PDF", "DOCX", "XLSX"]),
  notes: z.string().optional(),
});

export type ProgramReportFormData = z.infer<typeof programReportSchema>;
