import {
  NextFunction,
  Request,
  Response,
} from "express";
import { AuthRequest } from "../auth/auth.types";
import { ResponseHandler } from "../../cores/responses/ResponseHandler";
import { AppError } from "../../cores/errors/AppError";
import { AppointmentStatus } from "@prisma/client";
import { AppointmentsService } from "./appointments.service";
import { assertCanUseAppointmentBooking } from "../billing/entitlements";
import type {
  AppointmentEventConfig,
  AppointmentServiceConfig,
  BookingMode,
} from "./appointments.types";
import { BOOKING_MODES } from "./appointments.types";

const VALID_STATUSES = new Set(
  Object.values(AppointmentStatus)
);

const VALID_MODES = new Set<string>(
  BOOKING_MODES
);

function serialize(
  a: Record<string, any>
) {
  return {
    ...a,
    date:
      a.date instanceof Date
        ? a.date
            .toISOString()
            .slice(0, 10)
        : a.date,
    endDate:
      a.endDate instanceof Date
        ? a.endDate
            .toISOString()
            .slice(0, 10)
        : a.endDate ?? null,
  };
}

export class AppointmentsController {
  private readonly service =
    new AppointmentsService();

  private requireUserId(
    req: AuthRequest
  ) {
    if (!req.user?.id) {
      throw new AppError(
        "Authentication required.",
        401,
        "UNAUTHORIZED"
      );
    }
    return req.user.id;
  }

  /* ------------------------------------------------------------ */
  /* Owner: config                                                 */
  /* ------------------------------------------------------------ */

  updateConfig = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId =
        this.requireUserId(req);

      await assertCanUseAppointmentBooking(
        userId
      );

      const businessId = String(
        req.params.businessId ?? ""
      ).trim();

      const body = req.body ?? {};

      if (
        body.appointmentBookingMode &&
        !VALID_MODES.has(
          body.appointmentBookingMode
        )
      ) {
        throw new AppError(
          "Invalid booking mode.",
          400,
          "INVALID_MODE"
        );
      }

      const result =
        await this.service.updateConfig(
          userId,
          businessId,
          {
            appointmentBookingEnabled:
              body.appointmentBookingEnabled,
            appointmentBookingMode:
              body.appointmentBookingMode as
                | BookingMode
                | undefined,
            appointmentServices:
              body.appointmentServices as
                | AppointmentServiceConfig[]
                | undefined,
            appointmentEvents:
              body.appointmentEvents as
                | AppointmentEventConfig[]
                | undefined,
            appointmentSlotMinutes:
              body.appointmentSlotMinutes,
            appointmentAdvanceDays:
              body.appointmentAdvanceDays,
            appointmentMaxPartySize:
              body.appointmentMaxPartySize,
            appointmentMaxTokensPerDay:
              body.appointmentMaxTokensPerDay,
          }
        );

      return ResponseHandler.success(
        res,
        "Booking settings updated.",
        result
      );
    } catch (error) {
      next(error);
    }
  };

  getConfig = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId =
        this.requireUserId(req);

      const businessId = String(
        req.params.businessId ?? ""
      ).trim();

      const result =
        await this.service.getConfig(
          userId,
          businessId
        );

      return ResponseHandler.success(
        res,
        "Booking settings retrieved.",
        result
      );
    } catch (error) {
      next(error);
    }
  };

  /* ------------------------------------------------------------ */
  /* Owner: bookings                                               */
  /* ------------------------------------------------------------ */

  listAppointments = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId =
        this.requireUserId(req);

      const businessId = String(
        req.params.businessId ?? ""
      ).trim();

      const rawStatus =
        typeof req.query.status ===
        "string"
          ? req.query.status
          : undefined;

      const rawMode =
        typeof req.query.mode ===
        "string"
          ? req.query.mode
          : undefined;

      const result =
        await this.service.listAppointments(
          userId,
          businessId,
          {
            from:
              typeof req.query.from ===
              "string"
                ? req.query.from
                : undefined,
            to:
              typeof req.query.to ===
              "string"
                ? req.query.to
                : undefined,
            status:
              rawStatus &&
              VALID_STATUSES.has(
                rawStatus as AppointmentStatus
              )
                ? (rawStatus as AppointmentStatus)
                : undefined,
            mode:
              rawMode &&
              VALID_MODES.has(rawMode)
                ? rawMode
                : undefined,
            limit:
              typeof req.query.limit ===
              "string"
                ? req.query.limit
                : undefined,
          }
        );

      return ResponseHandler.success(
        res,
        "Bookings retrieved.",
        result.map(serialize)
      );
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId =
        this.requireUserId(req);

      const businessId = String(
        req.params.businessId ?? ""
      ).trim();
      const appointmentId = String(
        req.params.appointmentId ?? ""
      ).trim();

      const result =
        await this.service.updateStatus(
          userId,
          businessId,
          appointmentId,
          req.body?.status
        );

      return ResponseHandler.success(
        res,
        "Booking updated.",
        serialize(
          result as unknown as Record<
            string,
            any
          >
        )
      );
    } catch (error) {
      next(error);
    }
  };

  /* ------------------------------------------------------------ */
  /* Public (no auth)                                              */
  /* ------------------------------------------------------------ */

  getSlots = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const businessId = String(
        req.params.businessId ?? ""
      ).trim();

      const date = String(
        req.query.date ?? ""
      ).trim();

      const serviceId =
        typeof req.query.serviceId ===
        "string"
          ? req.query.serviceId.trim() ||
            undefined
          : undefined;

      const result =
        await this.service.getAvailableSlots(
          businessId,
          date,
          serviceId
        );

      return ResponseHandler.success(
        res,
        "Slots retrieved.",
        result
      );
    } catch (error) {
      next(error);
    }
  };

  getEvents = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const businessId = String(
        req.params.businessId ?? ""
      ).trim();

      const result =
        await this.service.getEventAvailability(
          businessId
        );

      return ResponseHandler.success(
        res,
        "Events retrieved.",
        result
      );
    } catch (error) {
      next(error);
    }
  };

  createBooking = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const businessId = String(
        req.params.businessId ?? ""
      ).trim();

      const body = req.body ?? {};

      const result =
        await this.service.createBooking(
          businessId,
          {
            serviceId:
              body.serviceId,
            date: body.date,
            endDate: body.endDate,
            startTime:
              body.startTime,
            partySize:
              typeof body.partySize ===
              "number"
                ? body.partySize
                : undefined,
            items: body.items,
            customerName:
              body.customerName,
            customerPhone:
              body.customerPhone,
            note: body.note,
          }
        );

      return ResponseHandler.created(
        res,
        "Booking received.",
        serialize(
          result as unknown as Record<
            string,
            any
          >
        )
      );
    } catch (error) {
      next(error);
    }
  };
}
