import {
  Request,
  Response,
  NextFunction,
} from "express";
import { AuthRequest } from "../auth/auth.types";
import { BillingService } from "./billing.service";
import { verifyWebhookSignature } from "./razorpay.client";
import type {
  CheckoutInput,
  SwitchPlanInput,
} from "./billing.validation";

/*
 * ============================================================
 * BILLING CONTROLLER
 * ============================================================
 */

export class BillingController {
  private readonly service =
    new BillingService();

  createCheckout = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result =
        await this.service.createCheckout(
          req.user!.id,
          req.body as CheckoutInput
        );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getStatus = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result =
        await this.service.getStatus(
          req.user!.id
        );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  cancelSubscription = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result =
        await this.service.cancelSubscription(
          req.user!.id
        );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getHistory = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result =
        await this.service.getHistory(
          req.user!.id
        );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getInvoice = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const raw = req.params.paymentId;
      const paymentId = (
        Array.isArray(raw) ? raw[0] : raw
      ) ?? "";

      const result =
        await this.service.getInvoiceUrl(
          req.user!.id,
          paymentId
        );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getPaymentMethods = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result =
        await this.service.getPaymentMethods(
          req.user!.id
        );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  switchPlan = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result =
        await this.service.switchPlan(
          req.user!.id,
          (req.body as SwitchPlanInput)
            .planCode
        );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /*
   * Razorpay webhook.
   *
   * This route is registered with express.raw() (see app.ts),
   * so req.body is the RAW Buffer — required for signature
   * verification. Never JSON-parse before verifying.
   */
  webhook = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const rawBody = req.body as Buffer;
      const signature = req.get(
        "x-razorpay-signature"
      );

      if (
        !Buffer.isBuffer(rawBody) ||
        !verifyWebhookSignature(
          rawBody,
          signature
        )
      ) {
        res.status(401).json({
          success: false,
          message: "Invalid signature",
        });
        return;
      }

      const event = JSON.parse(
        rawBody.toString("utf8")
      );

      await this.service.handleWebhookEvent(
        event
      );

      res.status(200).json({
        success: true,
        received: true,
      });
    } catch (error) {
      // Always 200 for Razorpay retries to stop,
      // but log the failure for investigation.
      console.error(
        "[Billing] Webhook handling failed:",
        error
      );
      res.status(200).json({
        success: false,
        received: true,
      });
    }
  };
}
