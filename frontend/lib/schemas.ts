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

/**
 * The ride request form (FR-P2.1).
 *
 * Both zones are required strings, not an enum of known codes: the list comes from
 * `GET /zones` at runtime, and a schema that hardcoded today's eight zones would
 * reject a perfectly valid journey the moment a ninth zone is seeded. The server
 * revalidates everything regardless - this exists to fail fast and say why.
 *
 * `seatsRequested` is bounded at 3 because that is the only Tesla in the brief. The
 * bound lives here as well as on the server so the stepper cannot produce a request
 * the API would reject.
 */
export const rideRequestSchema = z
  .object({
    pickupZoneCode: z.string().min(1, "Choose where you are starting from"),
    destinationZoneCode: z.string().min(1, "Choose where you are going"),
    seatsRequested: z
      .number({ message: "Choose how many seats you need" })
      .int("Seats must be a whole number")
      .min(1, "At least one seat")
      .max(3, "A Tesla carries at most 3 passengers"),
  })
  .refine((data) => data.pickupZoneCode !== data.destinationZoneCode, {
    message: "Pickup and destination must be different",
    path: ["destinationZoneCode"],
  });

/**
 * The Tesla registration form (FR-D3.1, US-D2).
 *
 * The plate is only length-checked here. The API owns the real shape of a
 * Bangladeshi registration and normalises case and spacing itself, so a regex in
 * the browser would either duplicate that rule or be looser and reject plates the
 * server accepts. Failing fast on an empty box is the whole job here.
 *
 * `capacity` is bounded 1-3 to match the server. Unlike the API, which treats it as
 * optional and defaults to the 3-seater Bullet, the form always sends a value
 * because choosing the seats is the one decision this screen actually asks for.
 */
export const teslaRegistrationSchema = z.object({
  plate: z
    .string()
    .min(1, "Plate is required")
    .max(20, "Plate cannot exceed 20 characters"),
  capacity: z
    .number({ message: "Choose how many passengers your Tesla seats" })
    .int("Seats must be a whole number")
    .min(1, "At least one seat")
    .max(3, "A Tesla carries at most 3 passengers"),
});

export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RideRequestData = z.infer<typeof rideRequestSchema>;
export type TeslaRegistrationData = z.infer<typeof teslaRegistrationSchema>;

/** First message from a failed parse, which is all a single-line banner shows. */
export const firstIssue = (error: z.ZodError): string =>
  error.issues[0]?.message ?? "Check the form and try again";