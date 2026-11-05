import { z } from "zod";

export const passwordValidation = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character.",
  );

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email("Invalid email format."),
    password: passwordValidation,
    phone: z.string().optional().nullable(),
  }),
});

/**
 * Phase 12: Login uses basic presence validation only.
 * Users with legacy weak passwords must still be able to log in.
 * Strong validation is enforced only on registration and password reset.
 */
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format."),
    password: z.string().min(1, "Password is required."),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format."),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Token is required."),
    password: passwordValidation,
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Token is required."),
  }),
});
