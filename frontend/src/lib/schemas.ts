import { z } from "zod";

/**
 * Every form validates through Zod, never through HTML attributes
 * (`frontend/rules.md`). `safeParse` is used rather than `parse` so the message can
 * be shown instead of thrown, and the payload types are derived with `z.infer` so
 * a schema change breaks the component at compile time.
 */

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(120, "Name must be at most 120 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  // Matches the API's own rule; the server is still the authority.
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
  role: z.enum(["passenger", "driver"], {
    message: "Choose whether you are riding or driving",
  }),
});

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;

/** First message from a failed parse, which is all a single-line banner shows. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Check the form and try again";
}