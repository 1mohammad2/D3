import { z } from "zod";

// ✅ as const يجعل TypeScript يعرف النوع الدقيق للمصفوفة
const GENDERS = ["MALE", "FEMALE"] as const;
const SKILL_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "SETTER"] as const;

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(50, "Full name too long"),

    nickname: z.string().max(20).optional(),

    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),

    phone: z
      .string()
      .min(8, "Invalid phone number")
      .max(15, "Invalid phone number")
      .optional(),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),

    confirmPassword: z.string().min(1, "Please confirm your password"),

    // ✅ Fix for Zod v4: no second argument — simplest and most compatible
    gender: z.enum(GENDERS),
    skillLevel: z.enum(SKILL_LEVELS),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;