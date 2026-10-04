import { z } from "zod";
import { AppointmentStatus } from "@prisma/client";
import { BOOKING_MODES } from "./appointments.types";

/* ------------------------------------------------------------------ */
/* Service / event config (JSON on BusinessProfile)                    */
/* ------------------------------------------------------------------ */

const timeSchema = z
  .string()
  .regex(
    /^([01]\d|2[0-3]):[0-5]\d$/,
    "Time must be HH:mm"
  );

const dateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must be YYYY-MM-DD"
  );

export const appointmentServiceSchema =
  z.object({
    id: z
      .string()
      .trim()
      .min(1)
      .max(64),

    name: z
      .string()
      .trim()
      .min(1, "Service name is required")
      .max(80),

    durationMinutes: z
      .number()
      .int()
      .min(5)
      .max(480),

    price: z
      .number()
      .min(0)
      .nullable()
      .optional(),
  });

export const appointmentEventSchema =
  z.object({
    id: z
      .string()
      .trim()
      .min(1)
      .max(64),

    name: z
      .string()
      .trim()
      .min(1, "Event name is required")
      .max(80),

    date: dateSchema,

    totalSeats: z
      .number()
      .int()
      .min(1)
      .max(10000),

    price: z
      .number()
      .min(0)
      .nullable()
      .optional(),
  });

export const bookingItemSchema =
  z.object({
    id: z
      .string()
      .trim()
      .min(1)
      .max(64),

    name: z
      .string()
      .trim()
      .min(1)
      .max(120),

    quantity: z
      .number()
      .int()
      .min(1)
      .max(999),

    price: z
      .number()
      .min(0)
      .nullable()
      .optional(),
  });

const bookingModeSchema = z.enum(
  BOOKING_MODES as [
    string,
    ...string[]
  ]
);

/* ------------------------------------------------------------------ */
/* Business config update (dashboard) — PATCH body                      */
/* ------------------------------------------------------------------ */

export const updateAppointmentConfigSchema =
  z
    .object({
      appointmentBookingEnabled:
        z.boolean().optional(),

      appointmentBookingMode:
        bookingModeSchema.optional(),

      appointmentServices: z
        .array(appointmentServiceSchema)
        .max(30)
        .optional(),

      appointmentEvents: z
        .array(appointmentEventSchema)
        .max(30)
        .optional(),

      appointmentSlotMinutes: z
        .number()
        .int()
        .min(5)
        .max(240)
        .nullable()
        .optional(),

      appointmentAdvanceDays: z
        .number()
        .int()
        .min(1)
        .max(90)
        .nullable()
        .optional(),

      appointmentMaxPartySize: z
        .number()
        .int()
        .min(1)
        .max(100)
        .nullable()
        .optional(),

      appointmentMaxTokensPerDay: z
        .number()
        .int()
        .min(1)
        .max(1000)
        .nullable()
        .optional(),
    })
    .strict()
    .refine(
      (data) =>
        Object.keys(data).length > 0,
      {
        message: "Nothing to update.",
      }
    );

/* ------------------------------------------------------------------ */
/* Public: create booking — POST body                                   */
/* ------------------------------------------------------------------ */

const phoneSchema = z
  .string()
  .trim()
  .min(6, "Phone number looks too short")
  .max(20, "Phone number looks too long")
  .regex(
    /^[+\d][\d\s\-()]{5,19}$/,
    "Invalid phone number"
  );

export const createAppointmentSchema =
  z.object({
    serviceId: z
      .string()
      .trim()
      .min(1)
      .max(64)
      .optional(),

    // APPOINTMENT / TABLE / EVENT
    date: dateSchema.optional(),

    // RENTAL
    endDate: dateSchema.optional(),

    // APPOINTMENT / TABLE
    startTime: timeSchema.optional(),

    // TABLE / EVENT
    partySize: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional(),

    // ORDER / TABLE (food)
    items: z
      .array(bookingItemSchema)
      .max(50)
      .optional(),

    customerName: z
      .string()
      .trim()
      .min(2, "Name is required")
      .max(80),

    customerPhone: phoneSchema,

    note: z
      .string()
      .trim()
      .max(500)
      .optional(),
  });

/* ------------------------------------------------------------------ */
/* Owner: status update — PATCH body                                    */
/* ------------------------------------------------------------------ */

export const updateAppointmentStatusSchema =
  z.object({
    status: z.nativeEnum(
      AppointmentStatus
    ),
  });

export type UpdateAppointmentConfigInput =
  z.infer<
    typeof updateAppointmentConfigSchema
  >;

export type CreateAppointmentBody = z.infer<
  typeof createAppointmentSchema
>;
