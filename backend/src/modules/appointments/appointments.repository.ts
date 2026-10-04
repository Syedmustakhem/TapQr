import {
  Prisma,
  AppointmentStatus,
} from "@prisma/client";
import { prisma } from "../../config/prisma";
import type {
  BookingMode,
  CreateAppointmentInput,
} from "./appointments.types";

const appointmentSelect = {
  id: true,
  businessId: true,
  mode: true,
  serviceId: true,
  serviceName: true,
  date: true,
  endDate: true,
  startTime: true,
  endTime: true,
  partySize: true,
  tokenNumber: true,
  items: true,
  customerName: true,
  customerPhone: true,
  note: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AppointmentSelect;

export class AppointmentsRepository {
  /* ------------------------------------------------------------ */
  /* Business + profile                                            */
  /* ------------------------------------------------------------ */

  async findBusinessWithProfile(
    businessId: string
  ) {
    return prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        ownerId: true,
        status: true,
        deletedAt: true,
        profile: {
          select: {
            appointmentBookingEnabled: true,
            appointmentBookingMode: true,
            appointmentServices: true,
            appointmentEvents: true,
            appointmentSlotMinutes: true,
            appointmentAdvanceDays: true,
            appointmentMaxPartySize: true,
            appointmentMaxTokensPerDay: true,
            openingHours: true,
          },
        },
      },
    });
  }

  async updateConfig(
    businessId: string,
    data: {
      appointmentBookingEnabled?: boolean;
      appointmentBookingMode?: string;
      appointmentServices?: Prisma.InputJsonValue;
      appointmentEvents?: Prisma.InputJsonValue;
      appointmentSlotMinutes?: number | null;
      appointmentAdvanceDays?: number | null;
      appointmentMaxPartySize?: number | null;
      appointmentMaxTokensPerDay?: number | null;
    }
  ) {
    return prisma.businessProfile.update({
      where: { businessId },
      data,
      select: {
        appointmentBookingEnabled: true,
        appointmentBookingMode: true,
        appointmentServices: true,
        appointmentEvents: true,
        appointmentSlotMinutes: true,
        appointmentAdvanceDays: true,
        appointmentMaxPartySize: true,
        appointmentMaxTokensPerDay: true,
      },
    });
  }

  /* ------------------------------------------------------------ */
  /* Appointments                                                  */
  /* ------------------------------------------------------------ */

  async createAppointment(
    input: CreateAppointmentInput
  ) {
    return prisma.appointment.create({
      data: {
        businessId: input.businessId,
        mode: input.mode,
        serviceId: input.serviceId,
        serviceName: input.serviceName,
        date: new Date(
          `${input.date}T00:00:00.000Z`
        ),
        endDate: input.endDate
          ? new Date(
              `${input.endDate}T00:00:00.000Z`
            )
          : undefined,
        startTime: input.startTime,
        endTime: input.endTime,
        partySize: input.partySize,
        tokenNumber: input.tokenNumber,
        items:
          input.items as unknown as Prisma.InputJsonValue,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        note: input.note,
        status: AppointmentStatus.PENDING,
      },
      select: appointmentSelect,
    });
  }

  async findConflictingBooking(
    businessId: string,
    date: Date,
    startTime: string,
    endTime: string
  ) {
    return prisma.appointment.findFirst({
      where: {
        businessId,
        date,
        status: {
          in: [
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
          ],
        },
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
      select: { id: true },
    });
  }

  async countTokensForDate(
    businessId: string,
    date: Date
  ): Promise<number> {
    return prisma.appointment.count({
      where: {
        businessId,
        mode: "TOKEN",
        date,
        status: {
          not: AppointmentStatus.CANCELLED,
        },
      },
    });
  }

  async countSeatsForEvent(
    businessId: string,
    serviceId: string,
    date: Date
  ): Promise<number> {
    const rows =
      await prisma.appointment.findMany({
        where: {
          businessId,
          mode: "EVENT",
          serviceId,
          date,
          status: {
            in: [
              AppointmentStatus.PENDING,
              AppointmentStatus.CONFIRMED,
            ],
          },
        },
        select: { partySize: true },
      });

    return rows.reduce(
      (sum, r) =>
        sum + (r.partySize ?? 1),
      0
    );
  }

  async listAppointments(
    businessId: string,
    opts: {
      from?: Date;
      to?: Date;
      status?: AppointmentStatus;
      mode?: string;
      limit: number;
    }
  ) {
    return prisma.appointment.findMany({
      where: {
        businessId,
        ...(opts.from || opts.to
          ? {
              date: {
                ...(opts.from
                  ? { gte: opts.from }
                  : {}),
                ...(opts.to
                  ? { lte: opts.to }
                  : {}),
              },
            }
          : {}),
        ...(opts.status
          ? { status: opts.status }
          : {}),
        ...(opts.mode
          ? { mode: opts.mode }
          : {}),
      },
      orderBy: [
        { date: "asc" },
        { startTime: "asc" },
      ],
      take: opts.limit,
      select: appointmentSelect,
    });
  }

  async updateStatus(
    appointmentId: string,
    businessId: string,
    status: AppointmentStatus
  ) {
    return prisma.appointment.update({
      where: {
        id: appointmentId,
        businessId,
      },
      data: { status },
      select: appointmentSelect,
    });
  }

  async findById(
    appointmentId: string,
    businessId: string
  ) {
    return prisma.appointment.findUnique({
      where: {
        id: appointmentId,
        businessId,
      },
      select: appointmentSelect,
    });
  }
}
