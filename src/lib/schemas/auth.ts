import { z } from "zod";

/**
 * Access levels for registration
 * - public: Registered User - instant access, no approval needed
 * - partner: Data Contributor - requires admin approval
 * - administrator: Org Representative - requires admin approval + org verification
 */
export const AccessLevel = {
  PUBLIC: 'public',
  PARTNER: 'partner',
  ADMINISTRATOR: 'administrator',
} as const;

export type AccessLevel = typeof AccessLevel[keyof typeof AccessLevel];

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    phone: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^(\+234|0)[789]\d{9}$/.test(val.replace(/\s/g, "")),
        "Enter a valid Nigerian phone number"
      ),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[a-z]/, "Include at least one lowercase letter")
      .regex(/\d/, "Include at least one number"),
    confirmPassword: z.string(),
    lga: z.string().optional(),
    ward: z.string().optional(),
    reason: z.string().max(500, "Must be under 500 characters").optional(),
    terms: z.literal(true, { message: "You must accept the terms" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[a-z]/, "Include at least one lowercase letter")
      .regex(/\d/, "Include at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  subject: z.string().min(3, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  bio: z.string().max(500).optional(),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().optional(),
  organization: z.string().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[a-z]/, "Include at least one lowercase letter")
      .regex(/\d/, "Include at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const uploadStep1Schema = z.object({
  title: z.string().min(3, "Title is required").max(100, "Max 100 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  categoryId: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).optional(),
});

export const uploadStep2Schema = z
  .object({
    lgas: z.array(z.string()).min(1, "Select at least one LGA"),
    temporalCoverageStart: z.string().min(1, "Start date is required"),
    temporalCoverageEnd: z.string().min(1, "End date is required"),
    diseaseIndicators: z.array(z.string()).optional(),
  })
  .refine(
    (data) =>
      !data.temporalCoverageStart ||
      !data.temporalCoverageEnd ||
      new Date(data.temporalCoverageStart) <= new Date(data.temporalCoverageEnd),
    { message: "Start date must be before end date", path: ["temporalCoverageEnd"] }
  );

export const uploadStep4Schema = z.object({
  license: z.string().min(1, "License is required"),
});

export const uploadStep5Schema = z.object({
  visibility: z.enum(["public", "restricted", "private"]),
});
