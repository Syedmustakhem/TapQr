// src/api/appointmentsApi.ts
//
// Appointment Booking endpoints (Pro feature #4),
// mirroring the TapQR web dashboard
// (app/dashboard/appointments calls these exact paths
// against https://api.tapqr.shop/api).
//
// Uses the shared authenticated axios instance from
// authApi.ts (Bearer token + 401 refresh interceptors).
//
// NOTE: getBillingStatus() below is a deliberate local
// one-function getter (GET /billing/status) used to show
// the Pro badge. The full billingApi is owned by a
// teammate — this screen must not import it.

import api from "./authApi";

export type BookingMode =
  | "APPOINTMENT"
  | "TABLE"
  | "ORDER"
  | "TOKEN"
  | "EVENT"
  | "RENTAL";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED";

export type ServiceConfig = {
  id: string;
  name: string;
  durationMinutes: number;
  price?: number | null;
  staffMobile?: string | null;
};

export type EventConfig = {
  id: string;
  name: string;
  date: string;
  totalSeats: number;
  price?: number | null;
};

export type BookingItem = {
  id: string;
  name: string;
  quantity: number;
  price?: number | null;
};

export type Booking = {
  id: string;
  mode: string;
  serviceName: string;
  date: string;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  partySize?: number | null;
  tokenNumber?: number | null;
  items?: BookingItem[] | null;
  customerName: string;
  customerPhone: string;
  note?: string | null;
  status: BookingStatus;
};

export type AppointmentConfig = {
  appointmentBookingEnabled: boolean;
  appointmentBookingMode: BookingMode;
  appointmentServices: ServiceConfig[];
  appointmentEvents: EventConfig[];
  appointmentSlotMinutes: number;
  appointmentAdvanceDays: number;
  appointmentMaxPartySize: number;
  appointmentMaxTokensPerDay: number;
};

export type UpdateAppointmentConfigInput = {
  appointmentBookingEnabled: boolean;
  appointmentBookingMode: BookingMode;
  appointmentServices: ServiceConfig[];
  appointmentEvents: EventConfig[];
  appointmentSlotMinutes: number;
  appointmentAdvanceDays: number;
  appointmentMaxPartySize: number;
  appointmentMaxTokensPerDay: number;
};

export type BookingListParams = {
  /**
   * One of "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED".
   * Omit for the "upcoming" view and pass `from` instead
   * (web dashboard behaviour).
   */
  status?: string;
  /**
   * YYYY-MM-DD lower bound used by the "upcoming" filter.
   */
  from?: string;
};

type BookingsResponse = {
  success?: boolean;
  message?: string;
  data?: Booking[];
};

type ConfigResponse = {
  success?: boolean;
  message?: string;
  data?: AppointmentConfig;
};

type BillingStatusResponse = {
  success?: boolean;
  message?: string;
  data?: {
    plan?: {
      code?: string;
      name?: string;
    };
    [key: string]: unknown;
  };
};

/**
 * GET /appointments/businesses/:businessId/config —
 * load booking settings. Returns null when no config
 * record exists yet (the screen falls back to defaults).
 */
export async function getAppointmentConfig(
  businessId: string
): Promise<AppointmentConfig | null> {
  const res =
    await api.get<ConfigResponse>(
      `/appointments/businesses/${encodeURIComponent(
        businessId
      )}/config`
    );

  return res.data?.data ?? null;
}

/**
 * GET /appointments/businesses/:businessId?limit=100&status=&from=
 * — list bookings. Pass `status` for a concrete status
 * filter, or `from` (YYYY-MM-DD) for the "upcoming" view.
 */
export async function getBookings(
  businessId: string,
  params?: BookingListParams
): Promise<Booking[]> {
  const res =
    await api.get<BookingsResponse>(
      `/appointments/businesses/${encodeURIComponent(
        businessId
      )}`,
      {
        params: {
          limit: 100,
          ...(params?.status
            ? { status: params.status }
            : {}),
          ...(params?.from
            ? { from: params.from }
            : {}),
        },
      }
    );

  return res.data?.data ?? [];
}

/**
 * PATCH /appointments/businesses/:businessId/config —
 * save booking settings.
 */
export async function updateAppointmentConfig(
  businessId: string,
  input: UpdateAppointmentConfigInput
): Promise<AppointmentConfig> {
  const res =
    await api.patch<ConfigResponse>(
      `/appointments/businesses/${encodeURIComponent(
        businessId
      )}/config`,
      input
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to save booking settings."
    );
  }

  return res.data.data;
}

/**
 * PATCH /appointments/businesses/:businessId/:bookingId —
 * change a booking's status (the web dashboard sends
 * { status } for confirm/complete/cancel).
 */
export async function updateBookingStatus(
  businessId: string,
  bookingId: string,
  status: BookingStatus
): Promise<void> {
  await api.patch(
    `/appointments/businesses/${encodeURIComponent(
      businessId
    )}/${encodeURIComponent(bookingId)}`,
    { status }
  );
}

/**
 * GET /billing/status — minimal one-function getter used
 * by the Appointments screen to decide whether the
 * business is on a Pro plan (Pro badge / upsell hint).
 * Never lock the UI when this call fails — the screen
 * treats an unknown plan as "no badge", never "locked".
 */
export async function getBillingStatus(): Promise<
  string | null
> {
  const res =
    await api.get<BillingStatusResponse>(
      "/billing/status"
    );

  return (
    res.data?.data?.plan?.code ?? null
  );
}
