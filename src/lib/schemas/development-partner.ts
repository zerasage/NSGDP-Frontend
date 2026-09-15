import { z } from "zod";

export const developmentPartnerFormSchema = z.object({
  name: z
    .string()
    .min(3, "Development Partner name must be at least 3 characters")
    .max(100, "Development Partner name must not exceed 100 characters"),

  type: z.enum([
    "government",
    "ngo",
    "private",
    "international",
    "academic",
    "community",
  ]),

  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional(),

  website: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),

  email: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),

  phone: z
    .string()
    .regex(
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
      "Please enter a valid phone number"
    )
    .optional()
    .or(z.literal("")),

  address: z
    .string()
    .max(200, "Address must not exceed 200 characters")
    .optional(),

  logoUrl: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
});

export type DevelopmentPartnerFormData = z.infer<typeof developmentPartnerFormSchema>;
