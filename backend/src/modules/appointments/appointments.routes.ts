import { Router } from "express";
import { AppointmentsController } from "./appointments.controller";
import { authenticate } from "../auth/auth.middleware";
import { validate } from "../../cores/middleware/validate";
import { authLimiter } from "../../cores/middleware/rateLimiter";
import {
  updateAppointmentConfigSchema,
  createAppointmentSchema,
  updateAppointmentStatusSchema,
} from "./appointments.validation";

const router = Router();

const controller =
  new AppointmentsController();

/* ------------------------------------------------------------------ */
/* Public (scanners) — no auth                                         */
/* Query params (date, serviceId) are validated in the service.         */
/* ------------------------------------------------------------------ */

router.get(
  "/public/businesses/:businessId/slots",
  authLimiter,
  controller.getSlots
);

router.get(
  "/public/businesses/:businessId/events",
  authLimiter,
  controller.getEvents
);

router.post(
  "/public/businesses/:businessId/bookings",
  authLimiter,
  validate(createAppointmentSchema),
  controller.createBooking
);

/* ------------------------------------------------------------------ */
/* Owner — authenticated                                               */
/* ------------------------------------------------------------------ */

router.get(
  "/businesses/:businessId/config",
  authenticate,
  controller.getConfig
);

router.patch(
  "/businesses/:businessId/config",
  authenticate,
  validate(
    updateAppointmentConfigSchema
  ),
  controller.updateConfig
);

router.get(
  "/businesses/:businessId",
  authenticate,
  controller.listAppointments
);

router.patch(
  "/businesses/:businessId/:appointmentId",
  authenticate,
  validate(
    updateAppointmentStatusSchema
  ),
  controller.updateStatus
);

export default router;
