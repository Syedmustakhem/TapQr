import { AppointmentStatus } from "@prisma/client";

/*
 * Booking modes — one engine, six business types.
 *
 * APPOINTMENT: hospital / clinic / salon — service + time slot.
 * TABLE:       restaurant — date + time + party size + food pre-order.
 * ORDER:       shopkeeper — product cart + pickup details.
 * TOKEN:       clinic / office — queue token for today, no slot.
 * EVENT:       workshop / class — event + seats.
 * RENTAL:      cars / equipment — item + date range.
 */
export type BookingMode =
  | "APPOINTMENT"
  | "TABLE"
  | "ORDER"
  | "TOKEN"
  | "EVENT"
  | "RENTAL";

export const BOOKING_MODES: BookingMode[] =
  [
    "APPOINTMENT",
    "TABLE",
    "ORDER",
    "TOKEN",
    "EVENT",
    "RENTAL",
  ];

/*
 * A bookable service as stored in
 * BusinessProfile.appointmentServices (JSON).
 * Used by APPOINTMENT (services), TOKEN (departments/counters),
 * RENTAL (rentable items, price = per day).
 */
export type AppointmentServiceConfig = {
  id: string;
  name: string;
  durationMinutes: number;
  price?: number | null;
  /**
   * Staff mobile (E.164) for booking alerts.
   * When set, new bookings for this service notify
   * this number on WhatsApp instead of the owner.
   */
  staffMobile?: string | null;
};

/*
 * An event as stored in BusinessProfile.appointmentEvents (JSON).
 * Used by EVENT mode.
 */
export type AppointmentEventConfig = {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  totalSeats: number;
  price?: number | null;
};

/*
 * A line item: ORDER mode (products) or TABLE mode (food pre-order).
 */
export type BookingItem = {
  id: string;
  name: string;
  quantity: number;
  price?: number | null;
};

export type AppointmentSlot = {
  startTime: string;
  endTime: string;
  available: boolean;
};

export type CreateAppointmentInput = {
  businessId: string;
  mode: BookingMode;
  serviceId?: string;
  serviceName: string;
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  partySize?: number;
  tokenNumber?: number;
  items?: BookingItem[];
  customerName: string;
  customerPhone: string;
  note?: string;
};

export type UpdateAppointmentStatusInput = {
  status: AppointmentStatus;
};

export { AppointmentStatus };
