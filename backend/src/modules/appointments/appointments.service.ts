import {
  AppointmentStatus,
  Prisma,
} from "@prisma/client";
import { AppointmentsRepository } from "./appointments.repository";
import type {
  AppointmentEventConfig,
  AppointmentServiceConfig,
  AppointmentSlot,
  BookingItem,
  BookingMode,
  CreateAppointmentInput,
} from "./appointments.types";
import { AppError } from "../../cores/errors/AppError";
import { sendNotificationWhatsApp } from "../notifications/providers/whatsapp.provider";

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

type DayHours = {
  open: string;
  close: string;
} | null;

function toMinutes(time: string): number {
  const [h, m] = time
    .split(":")
    .map(Number);
  return h * 60 + m;
}

function toTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(
    m
  ).padStart(2, "0")}`;
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseServices(
  raw: unknown
): AppointmentServiceConfig[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (s): s is AppointmentServiceConfig =>
        !!s &&
        typeof s === "object" &&
        typeof (s as any).id ===
          "string" &&
        typeof (s as any).name ===
          "string" &&
        typeof (s as any)
          .durationMinutes === "number"
    )
    .map((s) => ({
      id: s.id,
      name: s.name,
      durationMinutes:
        s.durationMinutes,
      price:
        typeof s.price === "number"
          ? s.price
          : null,
    }));
}

function parseEvents(
  raw: unknown
): AppointmentEventConfig[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (e): e is AppointmentEventConfig =>
        !!e &&
        typeof e === "object" &&
        typeof (e as any).id ===
          "string" &&
        typeof (e as any).name ===
          "string" &&
        typeof (e as any).date ===
          "string" &&
        typeof (e as any).totalSeats ===
          "number"
    )
    .map((e) => ({
      id: e.id,
      name: e.name,
      date: e.date,
      totalSeats: e.totalSeats,
      price:
        typeof e.price === "number"
          ? e.price
          : null,
    }));
}

function parseOpeningHours(
  raw: unknown
): Record<string, DayHours> {
  if (!raw || typeof raw !== "object")
    return {};
  return raw as Record<
    string,
    DayHours
  >;
}

type BusinessWithProfile =
  NonNullable<
    Awaited<
      ReturnType<
        AppointmentsRepository["findBusinessWithProfile"]
      >
    >
  >;

export class AppointmentsService {
  private readonly repository =
    new AppointmentsRepository();

  /* ------------------------------------------------------------ */
  /* Config (owner)                                                */
  /* ------------------------------------------------------------ */

  async updateConfig(
    userId: string,
    businessId: string,
    input: {
      appointmentBookingEnabled?: boolean;
      appointmentBookingMode?: string;
      appointmentServices?: AppointmentServiceConfig[];
      appointmentEvents?: AppointmentEventConfig[];
      appointmentSlotMinutes?:
        | number
        | null;
      appointmentAdvanceDays?:
        | number
        | null;
      appointmentMaxPartySize?:
        | number
        | null;
      appointmentMaxTokensPerDay?:
        | number
        | null;
    }
  ) {
    const business =
      await this.repository.findBusinessWithProfile(
        businessId
      );

    this.assertOwner(
      business,
      userId
    );

    const mode =
      input.appointmentBookingMode ??
      business?.profile
        ?.appointmentBookingMode ??
      "APPOINTMENT";

    // Mode-specific requirements when enabling.
    if (
      input.appointmentBookingEnabled ===
      true
    ) {
      const services =
        input.appointmentServices ??
        parseServices(
          business?.profile
            ?.appointmentServices
        );
      const events =
        input.appointmentEvents ??
        parseEvents(
          business?.profile
            ?.appointmentEvents
        );

      if (
        (mode === "APPOINTMENT" ||
          mode === "TOKEN" ||
          mode === "RENTAL") &&
        services.length === 0
      ) {
        throw new AppError(
          "Add at least one service/item before enabling.",
          400,
          "NO_SERVICES_CONFIGURED"
        );
      }

      if (
        mode === "EVENT" &&
        events.length === 0
      ) {
        throw new AppError(
          "Add at least one event before enabling.",
          400,
          "NO_EVENTS_CONFIGURED"
        );
      }
    }

    const data: Parameters<
      AppointmentsRepository["updateConfig"]
    >[1] = {};

    if (
      typeof input.appointmentBookingEnabled ===
      "boolean"
    )
      data.appointmentBookingEnabled =
        input.appointmentBookingEnabled;
    if (input.appointmentBookingMode)
      data.appointmentBookingMode =
        input.appointmentBookingMode;
    if (input.appointmentServices)
      data.appointmentServices =
        input.appointmentServices as unknown as Prisma.InputJsonValue;
    if (input.appointmentEvents)
      data.appointmentEvents =
        input.appointmentEvents as unknown as Prisma.InputJsonValue;
    if (
      input.appointmentSlotMinutes !==
      undefined
    )
      data.appointmentSlotMinutes =
        input.appointmentSlotMinutes;
    if (
      input.appointmentAdvanceDays !==
      undefined
    )
      data.appointmentAdvanceDays =
        input.appointmentAdvanceDays;
    if (
      input.appointmentMaxPartySize !==
      undefined
    )
      data.appointmentMaxPartySize =
        input.appointmentMaxPartySize;
    if (
      input.appointmentMaxTokensPerDay !==
      undefined
    )
      data.appointmentMaxTokensPerDay =
        input.appointmentMaxTokensPerDay;

    return this.repository.updateConfig(
      businessId,
      data
    );
  }

  async getConfig(
    userId: string,
    businessId: string
  ) {
    const business =
      await this.repository.findBusinessWithProfile(
        businessId
      );

    this.assertOwner(
      business,
      userId
    );

    const profile = business?.profile;

    return {
      appointmentBookingEnabled:
        profile?.appointmentBookingEnabled ??
        false,
      appointmentBookingMode:
        (profile?.appointmentBookingMode as BookingMode) ??
        "APPOINTMENT",
      appointmentServices:
        parseServices(
          profile?.appointmentServices
        ),
      appointmentEvents: parseEvents(
        profile?.appointmentEvents
      ),
      appointmentSlotMinutes:
        profile?.appointmentSlotMinutes ??
        30,
      appointmentAdvanceDays:
        profile?.appointmentAdvanceDays ??
        14,
      appointmentMaxPartySize:
        profile?.appointmentMaxPartySize ??
        12,
      appointmentMaxTokensPerDay:
        profile?.appointmentMaxTokensPerDay ??
        100,
    };
  }

  /* ------------------------------------------------------------ */
  /* Public: available slots (APPOINTMENT / TABLE)                 */
  /* ------------------------------------------------------------ */

  async getAvailableSlots(
    businessId: string,
    dateStr: string,
    serviceId?: string
  ): Promise<{
    date: string;
    slots: AppointmentSlot[];
    service: AppointmentServiceConfig | null;
  }> {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        dateStr
      )
    ) {
      throw new AppError(
        "Date must be YYYY-MM-DD.",
        400,
        "INVALID_DATE"
      );
    }

    const business =
      await this.getBookableBusiness(
        businessId
      );

    const services = parseServices(
      business.profile?.appointmentServices
    );

    const service = serviceId
      ? services.find(
          (s) => s.id === serviceId
        ) ?? null
      : services[0] ?? null;

    if (serviceId && !service) {
      throw new AppError(
        "Service not found.",
        404,
        "SERVICE_NOT_FOUND"
      );
    }

    const slotMinutes =
      business.profile
        ?.appointmentSlotMinutes ?? 30;
    const durationMinutes =
      service?.durationMinutes ??
      slotMinutes;

    const openingHours =
      parseOpeningHours(
        business.profile?.openingHours
      );

    const date = new Date(
      `${dateStr}T00:00:00.000Z`
    );
    const dayKey =
      DAY_KEYS[date.getUTCDay()];
    const hours: DayHours =
      openingHours[dayKey] ?? null;

    if (!hours) {
      return {
        date: dateStr,
        slots: [],
        service,
      };
    }

    const openMin = toMinutes(
      hours.open
    );
    const closeMin = toMinutes(
      hours.close
    );

    const dayStart = new Date(
      `${dateStr}T00:00:00.000Z`
    );

    const existing =
      await this.repository.listAppointments(
        businessId,
        {
          from: dayStart,
          to: dayStart,
          limit: 500,
        }
      );

    const booked = existing.filter(
      (a) =>
        (a.mode === "APPOINTMENT" ||
          a.mode === "TABLE") &&
        (a.status ===
          AppointmentStatus.PENDING ||
          a.status ===
            AppointmentStatus.CONFIRMED)
    );

    const slots: AppointmentSlot[] =
      [];
    const now = new Date();

    for (
      let start = openMin;
      start + durationMinutes <=
      closeMin;
      start += slotMinutes
    ) {
      const end =
        start + durationMinutes;
      const startTime =
        toTime(start);
      const endTime = toTime(end);

      const slotDateTime = new Date(
        `${dateStr}T${startTime}:00.000Z`
      );
      if (slotDateTime <= now) {
        continue;
      }

      const overlaps = booked.some(
        (b) =>
          (b.startTime ?? "") <
            endTime &&
          (b.endTime ?? "") > startTime
      );

      slots.push({
        startTime,
        endTime,
        available: !overlaps,
      });
    }

    return {
      date: dateStr,
      slots,
      service,
    };
  }

  /* ------------------------------------------------------------ */
  /* Public: event seats left (EVENT)                              */
  /* ------------------------------------------------------------ */

  async getEventAvailability(
    businessId: string
  ) {
    const business =
      await this.getBookableBusiness(
        businessId
      );

    const events = parseEvents(
      business.profile?.appointmentEvents
    );

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const out = [];
    for (const e of events) {
      const eventDate = new Date(
        `${e.date}T00:00:00.000Z`
      );
      if (eventDate < today) continue;

      const taken =
        await this.repository.countSeatsForEvent(
          businessId,
          e.id,
          eventDate
        );

      out.push({
        ...e,
        seatsLeft: Math.max(
          0,
          e.totalSeats - taken
        ),
      });
    }

    return out;
  }

  /* ------------------------------------------------------------ */
  /* Public: create booking (all modes)                            */
  /* ------------------------------------------------------------ */

  async createBooking(
    businessId: string,
    body: {
      serviceId?: string;
      date?: string;
      endDate?: string;
      startTime?: string;
      partySize?: number;
      items?: BookingItem[];
      customerName: string;
      customerPhone: string;
      note?: string;
    }
  ) {
    const business =
      await this.getBookableBusiness(
        businessId
      );

    const mode = (business.profile
      ?.appointmentBookingMode ??
      "APPOINTMENT") as BookingMode;

    let result;

    switch (mode) {
      case "APPOINTMENT":
        result =
          await this.createAppointmentBooking(
            business,
            body
          );
        break;
      case "TABLE":
        result =
          await this.createTableBooking(
            business,
            body
          );
        break;
      case "ORDER":
        result =
          await this.createOrderBooking(
            business,
            body
          );
        break;
      case "TOKEN":
        result =
          await this.createTokenBooking(
            business,
            body
          );
        break;
      case "EVENT":
        result =
          await this.createEventBooking(
            business,
            body
          );
        break;
      case "RENTAL":
        result =
          await this.createRentalBooking(
            business,
            body
          );
        break;
      default:
        throw new AppError(
          "Unknown booking mode.",
          500,
          "UNKNOWN_MODE"
        );
    }

    // Fire-and-forget: route the booking alert to the
    // service's staff mobile when one is configured.
    void this.notifyBookingStaff(
      business,
      body.serviceId,
      body
    ).catch(() => {
      /* alerts must never break a booking */
    });

    return result;
  }

  /*
   * ------------------------------------------------------------
   * Booking staff alerts (per-service mobile)
   * ------------------------------------------------------------
   *
   * When the booked service has a staffMobile, the new-booking
   * alert goes to that number on WhatsApp. Otherwise no alert
   * is sent (the owner sees bookings on the dashboard).
   *
   * Uses WHATSAPP_BOOKING_TEMPLATE_NAME when set, else the
   * default notification template.
   */
  private async notifyBookingStaff(
    business: BusinessWithProfile,
    serviceId: string | undefined,
    body: {
      serviceId?: string;
      date?: string;
      startTime?: string;
      partySize?: number;
      customerName: string;
      customerPhone: string;
      note?: string;
    }
  ): Promise<void> {
    if (!serviceId) return;

    const services =
      (business.profile
        ?.appointmentServices as
        | AppointmentServiceConfig[]
        | null
        | undefined) ?? [];

    const service = services.find(
      (s) => s.id === serviceId
    );

    const staffMobile =
  service?.staffMobile?.trim();

if (!staffMobile) return;

const when =
  body.date &&
  body.startTime
    ? `${body.date} at ${body.startTime}`
    : body.date ?? "soon";

const message =
  `New booking for ${service?.name ?? "a service"}: ` +
  `${body.customerName} (${body.customerPhone}) — ${when}.` +
  (body.note
    ? ` Note: ${body.note}`
    : "");

    await sendNotificationWhatsApp({
      toPhoneE164: staffMobile,
      recipientName:
        service?.name ?? "there",
      message,
      templateName:
        process.env
          .WHATSAPP_BOOKING_TEMPLATE_NAME?.trim() ||
        undefined,
    });
  }

  /* ---------------- APPOINTMENT ---------------- */

  private async createAppointmentBooking(
    business: BusinessWithProfile,
    body: {
      serviceId?: string;
      date?: string;
      startTime?: string;
      customerName: string;
      customerPhone: string;
      note?: string;
    }
  ) {
    if (!body.date || !body.startTime) {
      throw new AppError(
        "Date and time are required.",
        400,
        "MISSING_SLOT"
      );
    }

    const services = parseServices(
      business.profile?.appointmentServices
    );
    const service = body.serviceId
      ? services.find(
          (s) => s.id === body.serviceId
        )
      : services[0];

    if (body.serviceId && !service) {
      throw new AppError(
        "Service not found.",
        404,
        "SERVICE_NOT_FOUND"
      );
    }

    const serviceName =
      service?.name ?? "Appointment";
    const durationMinutes =
      service?.durationMinutes ??
      business.profile
        ?.appointmentSlotMinutes ??
      30;

    const bookingDate = this.assertBookableDate(
      business,
      body.date
    );
    const hours = this.assertOpenDay(
      business,
      bookingDate
    );

    const startMin = toMinutes(
      body.startTime
    );
    const endMin =
      startMin + durationMinutes;
    const endTime = toTime(endMin);

    if (
      startMin < toMinutes(hours.open) ||
      endMin > toMinutes(hours.close)
    ) {
      throw new AppError(
        "Selected time is outside opening hours.",
        400,
        "OUTSIDE_HOURS"
      );
    }

    this.assertSlotInFuture(
      body.date!,
      body.startTime
    );

    const conflict =
      await this.repository.findConflictingBooking(
        business.id,
        bookingDate,
        body.startTime,
        endTime
      );

    if (conflict) {
      throw new AppError(
        "That slot was just taken. Please pick another.",
        409,
        "SLOT_TAKEN"
      );
    }

    const input: CreateAppointmentInput =
      {
        businessId: business.id,
        mode: "APPOINTMENT",
        serviceId: service?.id,
        serviceName,
        date: body.date!,
        startTime: body.startTime,
        endTime,
        customerName:
          body.customerName,
        customerPhone:
          body.customerPhone,
        note: body.note,
      };

    return this.repository.createAppointment(
      input
    );
  }

  /* ---------------- TABLE ---------------- */

  private async createTableBooking(
    business: BusinessWithProfile,
    body: {
      date?: string;
      startTime?: string;
      partySize?: number;
      items?: BookingItem[];
      customerName: string;
      customerPhone: string;
      note?: string;
    }
  ) {
    if (!body.date || !body.startTime) {
      throw new AppError(
        "Date and time are required.",
        400,
        "MISSING_SLOT"
      );
    }

    const maxParty =
      business.profile
        ?.appointmentMaxPartySize ?? 12;
    const partySize = Math.min(
      Math.max(body.partySize ?? 2, 1),
      maxParty
    );

    const bookingDate = this.assertBookableDate(
      business,
      body.date
    );
    const hours = this.assertOpenDay(
      business,
      bookingDate
    );

    // Tables are held for 2 hours by default.
    const startMin = toMinutes(
      body.startTime
    );
    const endMin = startMin + 120;
    const endTime = toTime(endMin);

    if (
      startMin < toMinutes(hours.open) ||
      endMin > toMinutes(hours.close)
    ) {
      throw new AppError(
        "Selected time is outside opening hours.",
        400,
        "OUTSIDE_HOURS"
      );
    }

    this.assertSlotInFuture(
      body.date!,
      body.startTime
    );

    const conflict =
      await this.repository.findConflictingBooking(
        business.id,
        bookingDate,
        body.startTime,
        endTime
      );

    if (conflict) {
      throw new AppError(
        "That time was just taken. Please pick another.",
        409,
        "SLOT_TAKEN"
      );
    }

    const input: CreateAppointmentInput =
      {
        businessId: business.id,
        mode: "TABLE",
        serviceName: `Table for ${partySize}`,
        date: body.date!,
        startTime: body.startTime,
        endTime,
        partySize,
        items: body.items,
        customerName:
          body.customerName,
        customerPhone:
          body.customerPhone,
        note: body.note,
      };

    return this.repository.createAppointment(
      input
    );
  }

  /* ---------------- ORDER ---------------- */

  private async createOrderBooking(
    business: BusinessWithProfile,
    body: {
      items?: BookingItem[];
      customerName: string;
      customerPhone: string;
      note?: string;
    }
  ) {
    if (
      !body.items ||
      body.items.length === 0
    ) {
      throw new AppError(
        "Add at least one item to order.",
        400,
        "EMPTY_ORDER"
      );
    }

    const today = new Date();
    const dateKey = toDateKey(today);

    const input: CreateAppointmentInput =
      {
        businessId: business.id,
        mode: "ORDER",
        serviceName: `Order (${body.items.length} items)`,
        date: dateKey,
        items: body.items,
        customerName:
          body.customerName,
        customerPhone:
          body.customerPhone,
        note: body.note,
      };

    return this.repository.createAppointment(
      input
    );
  }

  /* ---------------- TOKEN ---------------- */

  private async createTokenBooking(
    business: BusinessWithProfile,
    body: {
      serviceId?: string;
      customerName: string;
      customerPhone: string;
      note?: string;
    }
  ) {
    const services = parseServices(
      business.profile?.appointmentServices
    );
    const service = body.serviceId
      ? services.find(
          (s) => s.id === body.serviceId
        )
      : services[0];

    if (body.serviceId && !service) {
      throw new AppError(
        "Service not found.",
        404,
        "SERVICE_NOT_FOUND"
      );
    }

    const maxTokens =
      business.profile
        ?.appointmentMaxTokensPerDay ??
      100;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const count =
      await this.repository.countTokensForDate(
        business.id,
        today
      );

    if (count >= maxTokens) {
      throw new AppError(
        "Tokens are full for today. Please try tomorrow.",
        409,
        "TOKENS_FULL"
      );
    }

    const input: CreateAppointmentInput =
      {
        businessId: business.id,
        mode: "TOKEN",
        serviceId: service?.id,
        serviceName:
          service?.name ?? "Token",
        date: toDateKey(today),
        tokenNumber: count + 1,
        customerName:
          body.customerName,
        customerPhone:
          body.customerPhone,
        note: body.note,
      };

    return this.repository.createAppointment(
      input
    );
  }

  /* ---------------- EVENT ---------------- */

  private async createEventBooking(
    business: BusinessWithProfile,
    body: {
      serviceId?: string;
      partySize?: number;
      customerName: string;
      customerPhone: string;
      note?: string;
    }
  ) {
    if (!body.serviceId) {
      throw new AppError(
        "Event is required.",
        400,
        "MISSING_EVENT"
      );
    }

    const events = parseEvents(
      business.profile?.appointmentEvents
    );
    const event = events.find(
      (e) => e.id === body.serviceId
    );

    if (!event) {
      throw new AppError(
        "Event not found.",
        404,
        "EVENT_NOT_FOUND"
      );
    }

    const eventDate = new Date(
      `${event.date}T00:00:00.000Z`
    );
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (eventDate < today) {
      throw new AppError(
        "This event has already passed.",
        400,
        "EVENT_PASSED"
      );
    }

    const seats = Math.min(
      Math.max(body.partySize ?? 1, 1),
      20
    );

    const taken =
      await this.repository.countSeatsForEvent(
        business.id,
        event.id,
        eventDate
      );

    if (
      taken + seats >
      event.totalSeats
    ) {
      throw new AppError(
        `Only ${
          event.totalSeats - taken
        } seats left for this event.`,
        409,
        "SEATS_FULL"
      );
    }

    const input: CreateAppointmentInput =
      {
        businessId: business.id,
        mode: "EVENT",
        serviceId: event.id,
        serviceName: event.name,
        date: event.date,
        partySize: seats,
        customerName:
          body.customerName,
        customerPhone:
          body.customerPhone,
        note: body.note,
      };

    return this.repository.createAppointment(
      input
    );
  }

  /* ---------------- RENTAL ---------------- */

  private async createRentalBooking(
    business: BusinessWithProfile,
    body: {
      serviceId?: string;
      date?: string;
      endDate?: string;
      customerName: string;
      customerPhone: string;
      note?: string;
    }
  ) {
    if (!body.date || !body.endDate) {
      throw new AppError(
        "Start and end dates are required.",
        400,
        "MISSING_DATES"
      );
    }

    const services = parseServices(
      business.profile?.appointmentServices
    );
    const item = body.serviceId
      ? services.find(
          (s) => s.id === body.serviceId
        )
      : services[0];

    if (body.serviceId && !item) {
      throw new AppError(
        "Item not found.",
        404,
        "ITEM_NOT_FOUND"
      );
    }

    const start = new Date(
      `${body.date}T00:00:00.000Z`
    );
    const end = new Date(
      `${body.endDate}T00:00:00.000Z`
    );
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (start < today) {
      throw new AppError(
        "Start date cannot be in the past.",
        400,
        "DATE_IN_PAST"
      );
    }

    if (end <= start) {
      throw new AppError(
        "End date must be after start date.",
        400,
        "INVALID_RANGE"
      );
    }

    const days =
      Math.round(
        (end.getTime() -
          start.getTime()) /
          86400000
      ) + 1;

    if (days > 90) {
      throw new AppError(
        "Rental period cannot exceed 90 days.",
        400,
        "RANGE_TOO_LONG"
      );
    }

    const input: CreateAppointmentInput =
      {
        businessId: business.id,
        mode: "RENTAL",
        serviceId: item?.id,
        serviceName:
          item?.name ?? "Rental",
        date: body.date!,
        endDate: body.endDate!,
        customerName:
          body.customerName,
        customerPhone:
          body.customerPhone,
        note: body.note,
      };

    return this.repository.createAppointment(
      input
    );
  }

  /* ------------------------------------------------------------ */
  /* Owner: list + status                                          */
  /* ------------------------------------------------------------ */

  async listAppointments(
    userId: string,
    businessId: string,
    query: {
      from?: string;
      to?: string;
      status?: AppointmentStatus;
      mode?: string;
      limit?: string;
    }
  ) {
    const business =
      await this.repository.findBusinessWithProfile(
        businessId
      );

    this.assertOwner(
      business,
      userId
    );

    const limit = Math.min(
      Math.max(
        parseInt(
          query.limit ?? "50",
          10
        ) || 50,
        1
      ),
      200
    );

    return this.repository.listAppointments(
      businessId,
      {
        from: query.from
          ? new Date(
              `${query.from}T00:00:00.000Z`
            )
          : undefined,
        to: query.to
          ? new Date(
              `${query.to}T00:00:00.000Z`
            )
          : undefined,
        status: query.status,
        mode: query.mode,
        limit,
      }
    );
  }

  async updateStatus(
    userId: string,
    businessId: string,
    appointmentId: string,
    status: AppointmentStatus
  ) {
    const business =
      await this.repository.findBusinessWithProfile(
        businessId
      );

    this.assertOwner(
      business,
      userId
    );

    const existing =
      await this.repository.findById(
        appointmentId,
        businessId
      );

    if (!existing) {
      throw new AppError(
        "Appointment not found.",
        404,
        "APPOINTMENT_NOT_FOUND"
      );
    }

    return this.repository.updateStatus(
      appointmentId,
      businessId,
      status
    );
  }

  /* ------------------------------------------------------------ */
  /* Helpers                                                       */
  /* ------------------------------------------------------------ */

  private async getBookableBusiness(
    businessId: string
  ): Promise<BusinessWithProfile> {
    const business =
      await this.repository.findBusinessWithProfile(
        businessId
      );

    if (
      !business ||
      business.deletedAt ||
      !business.profile
        ?.appointmentBookingEnabled
    ) {
      throw new AppError(
        "Booking is not available.",
        404,
        "BOOKING_NOT_AVAILABLE"
      );
    }

    return business as BusinessWithProfile;
  }

  private assertBookableDate(
    business: BusinessWithProfile,
    dateStr: string
  ): Date {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const bookingDate = new Date(
      `${dateStr}T00:00:00.000Z`
    );

    if (bookingDate < today) {
      throw new AppError(
        "Cannot book in the past.",
        400,
        "DATE_IN_PAST"
      );
    }

    const advanceDays =
      business.profile
        ?.appointmentAdvanceDays ?? 14;
    const maxDate = new Date(today);
    maxDate.setUTCDate(
      maxDate.getUTCDate() +
        advanceDays
    );

    if (bookingDate > maxDate) {
      throw new AppError(
        `Bookings are only open ${advanceDays} days ahead.`,
        400,
        "DATE_TOO_FAR"
      );
    }

    return bookingDate;
  }

  private assertOpenDay(
    business: BusinessWithProfile,
    bookingDate: Date
  ): NonNullable<DayHours> {
  const dayKey =
    DAY_KEYS[bookingDate.getUTCDay()];

    const openingHours =
      parseOpeningHours(
        business.profile?.openingHours
      );
    const hours: DayHours =
      openingHours[dayKey] ?? null;

    if (!hours) {
      throw new AppError(
        "Closed on the selected day.",
        400,
        "CLOSED_DAY"
      );
    }

    return hours;
  }

  private assertSlotInFuture(
    dateStr: string,
    startTime: string
  ) {
    const slotDateTime = new Date(
      `${dateStr}T${startTime}:00.000Z`
    );
    if (slotDateTime <= new Date()) {
      throw new AppError(
        "That slot has already passed.",
        400,
        "SLOT_PASSED"
      );
    }
  }

  private assertOwner(
    business: {
      ownerId: string;
      deletedAt: Date | null;
    } | null,
    userId: string
  ) {
    if (!business || business.deletedAt) {
      throw new AppError(
        "Business not found.",
        404,
        "BUSINESS_NOT_FOUND"
      );
    }

    if (
      business.ownerId !== userId
    ) {
      throw new AppError(
        "You do not have access to this business.",
        403,
        "BUSINESS_ACCESS_DENIED"
      );
    }
  }
}
