import { AppError } from "../../cores/errors/AppError";
import { BillingRepository } from "./billing.repository";
import {
  createRazorpaySubscription,
  cancelRazorpaySubscription,
  updateRazorpaySubscriptionPlan,
  fetchRazorpayInvoices,
  fetchCustomerTokens,
  getKeyId,
} from "./razorpay.client";
import {
  getEffectivePlan,
  type EffectivePlan,
} from "./entitlements";
import {
  onSubscriptionActivated,
  onPaymentCaptured,
} from "../growth/growth.hooks";
import type { CheckoutInput } from "./billing.validation";

/*
 * ============================================================
 * BILLING SERVICE
 * ============================================================
 */

function razorpayPlanIdFor(
  planCode: string,
  plan: { razorpayPlanId?: string | null }
): string {
  const fromDb = plan.razorpayPlanId;

  if (fromDb) {
    return fromDb;
  }

  const fromEnv =
    planCode === "PRO_MONTHLY"
      ? process.env.RAZORPAY_PLAN_MONTHLY_ID
      : planCode === "PRO_YEARLY"
        ? process.env.RAZORPAY_PLAN_YEARLY_ID
        : undefined;

  if (!fromEnv) {
    throw new AppError(
      "Billing is not fully configured for this plan yet.",
      500,
      "BILLING_NOT_CONFIGURED"
    );
  }

  return fromEnv;
}

export class BillingService {
  private readonly repository =
    new BillingRepository();

  /*
   * Create a Razorpay subscription and a local PENDING record.
   * The frontend completes it with Checkout.js; the webhook
   * flips it to ACTIVE.
   */
  async createCheckout(
    userId: string,
    input: CheckoutInput
  ) {
    const plan =
      await this.repository.getPlan(
        input.planCode
      );

    if (!plan || !plan.isActive) {
      throw new AppError(
        "This plan is not available.",
        400,
        "PLAN_NOT_AVAILABLE"
      );
    }

    const existing =
      await this.repository.getActiveSubscription(
        userId
      );

    if (
      existing &&
      existing.planCode === input.planCode
    ) {
      throw new AppError(
        "You are already on this plan.",
        400,
        "ALREADY_SUBSCRIBED"
      );
    }

    const razorpayPlanId =
      razorpayPlanIdFor(
        input.planCode,
        plan
      );

    const totalCount =
      input.planCode === "PRO_YEARLY"
        ? 5
        : 12;

    const subscription =
      await createRazorpaySubscription(
        razorpayPlanId,
        userId,
        input.planCode,
        totalCount
      );

    await this.repository.createSubscription(
      {
        userId,
        planCode: input.planCode,
        razorpaySubscriptionId:
          subscription.id,
        razorpayCustomerId:
          subscription.customer_id ?? null,
      }
    );

    return {
      subscriptionId: subscription.id,
      keyId: getKeyId(),
      planName: plan.name,
      amountPaise: plan.pricePaise,
      currency: plan.currency,
    };
  }

  async getStatus(userId: string) {
    const plan: EffectivePlan =
      await getEffectivePlan(userId);

    const subscription =
      await this.repository.getLatestSubscription(
        userId
      );

    const [qrCount, businessCount, payments] =
      await Promise.all([
        this.repository.countQRCodes(
          userId
        ),
        this.repository.countBusinesses(
          userId
        ),
        this.repository.getPayments(
          userId,
          10
        ),
      ]);

    return {
      plan: {
        code: plan.code,
        name: plan.name,
        features: plan.features,
      },
      subscription: subscription
        ? {
            status: subscription.status,
            planCode:
              subscription.planCode,
            currentPeriodEnd:
              subscription.currentPeriodEnd,
            cancelAtPeriodEnd:
              subscription.cancelAtPeriodEnd,
          }
        : null,
      limits: {
        maxQrs: plan.maxQrs,
        maxBusinesses: plan.maxBusinesses,
        maxSeats: plan.maxSeats,
      },
      usage: {
        qrCount,
        businessCount,
      },
      payments: payments.map((p) => ({
        id: p.id,
        amountPaise: p.amountPaise,
        currency: p.currency,
        status: p.status,
        createdAt: p.createdAt,
      })),
    };
  }

  async cancelSubscription(
    userId: string
  ) {
    const subscription =
      await this.repository.getActiveSubscription(
        userId
      );

    if (!subscription) {
      throw new AppError(
        "No active subscription found.",
        404,
        "NO_ACTIVE_SUBSCRIPTION"
      );
    }

    if (subscription.razorpaySubscriptionId) {
      await cancelRazorpaySubscription(
        subscription.razorpaySubscriptionId
      );
    }

    await this.repository.updateSubscriptionStatus(
      subscription.id,
      { cancelAtPeriodEnd: true }
    );

    return {
      status: "CANCELLED_AT_PERIOD_END",
      currentPeriodEnd:
        subscription.currentPeriodEnd,
    };
  }

  /*
   * Full billing history for the "Billing history" table.
   */
  async getHistory(userId: string) {
    const payments =
      await this.repository.getPayments(
        userId,
        50
      );

    return payments.map((p) => ({
      id: p.id,
      amountPaise: p.amountPaise,
      currency: p.currency,
      status: p.status,
      razorpayPaymentId:
        p.razorpayPaymentId,
      createdAt: p.createdAt,
    }));
  }

  /*
   * GST invoice link for a payment.
   * Returns Razorpay's hosted invoice URL (short_url).
   */
  async getInvoiceUrl(
    userId: string,
    paymentId: string
  ) {
    const payments =
      await this.repository.getPayments(
        userId,
        50
      );

    const payment = payments.find(
      (p) => p.id === paymentId
    );

    if (!payment) {
      throw new AppError(
        "Payment not found.",
        404,
        "PAYMENT_NOT_FOUND"
      );
    }

    if (!payment.razorpayPaymentId) {
      throw new AppError(
        "No invoice is available for this payment yet.",
        404,
        "INVOICE_NOT_AVAILABLE"
      );
    }

    const invoices =
      await fetchRazorpayInvoices(
        payment.razorpayPaymentId
      );

    const invoice = invoices[0];

    if (!invoice?.short_url) {
      throw new AppError(
        "The invoice is still being generated. Try again in a few minutes.",
        404,
        "INVOICE_NOT_READY"
      );
    }

    return {
      invoiceId: invoice.id,
      url: invoice.short_url,
    };
  }

  /*
   * Saved payment methods (cards/UPI tokens) on the
   * Razorpay customer attached to the active subscription.
   */
  async getPaymentMethods(
    userId: string
  ) {
    const subscription =
      await this.repository.getActiveSubscription(
        userId
      );

    if (
      !subscription?.razorpayCustomerId
    ) {
      return [];
    }

    const tokens =
      await fetchCustomerTokens(
        subscription.razorpayCustomerId
      );

    return tokens.map((t) => ({
      id: t.id,
      method: t.method,
      last4: t.card?.last4 ?? null,
      network: t.card?.network ?? null,
      cardName: t.card?.name ?? null,
      bank: t.bank ?? null,
      vpa: t.vpa ?? null,
    }));
  }

  /*
   * Switch between PRO_MONTHLY and PRO_YEARLY.
   * Razorpay prorates the change immediately
   * ("schedule_change_at: now").
   */
  async switchPlan(
    userId: string,
    targetPlanCode: string
  ) {
    if (
      targetPlanCode !== "PRO_MONTHLY" &&
      targetPlanCode !== "PRO_YEARLY"
    ) {
      throw new AppError(
        "Invalid plan.",
        400,
        "INVALID_PLAN"
      );
    }

    const subscription =
      await this.repository.getActiveSubscription(
        userId
      );

    if (!subscription) {
      throw new AppError(
        "No active subscription found.",
        404,
        "NO_ACTIVE_SUBSCRIPTION"
      );
    }

    if (
      subscription.planCode ===
      targetPlanCode
    ) {
      throw new AppError(
        "You are already on this plan.",
        400,
        "ALREADY_SUBSCRIBED"
      );
    }

    if (
      !subscription.razorpaySubscriptionId
    ) {
      throw new AppError(
        "This subscription cannot be switched.",
        400,
        "SWITCH_NOT_SUPPORTED"
      );
    }

    const plan =
      await this.repository.getPlan(
        targetPlanCode
      );

    if (!plan || !plan.isActive) {
      throw new AppError(
        "This plan is not available.",
        400,
        "PLAN_NOT_AVAILABLE"
      );
    }

    const razorpayPlanId =
      razorpayPlanIdFor(
        targetPlanCode,
        plan
      );

    const updated =
      await updateRazorpaySubscriptionPlan(
        subscription.razorpaySubscriptionId,
        razorpayPlanId
      );

    await this.repository.updateSubscriptionStatus(
      subscription.id,
      {
        planCode: targetPlanCode,
        currentPeriodStart: updated.current_start
          ? new Date(
              updated.current_start * 1000
            )
          : null,
        currentPeriodEnd: updated.current_end
          ? new Date(
              updated.current_end * 1000
            )
          : null,
      }
    );

    return {
      planCode: targetPlanCode,
      planName: plan.name,
      status: updated.status ?? "active",
    };
  }

  /*
   * Webhook event router.
   * Only transitions status when it actually changes
   * (naturally idempotent against Razorpay retries).
   */
  async handleWebhookEvent(event: {
    event: string;
    payload?: any;
  }) {
    const name = event.event;
    const subscriptionEntity =
      event.payload?.subscription?.entity;
    const paymentEntity =
      event.payload?.payment?.entity;
    const entity =
      subscriptionEntity ?? paymentEntity;

    if (!entity) {
      return { handled: false };
    }

    if (name.startsWith("subscription.")) {
      return this.handleSubscriptionEvent(
        name,
        entity,
        paymentEntity
      );
    }

    if (name === "payment.failed") {
      const userId =
        entity.notes?.tapqr_user_id;

      if (typeof userId === "string" && userId) {
        await this.repository.recordPayment({
          userId,
          razorpayPaymentId: entity.id,
          razorpayOrderId:
            entity.order_id ?? null,
          amountPaise: entity.amount ?? 0,
          currency:
            entity.currency ?? "INR",
          status: "failed",
        });
      }
      return { handled: true };
    }

    return { handled: false };
  }

  private async handleSubscriptionEvent(
    name: string,
    entity: any,
    paymentEntity?: any
  ) {
    const subscription =
      await this.repository.findSubscriptionByRazorpayId(
        entity.id
      );

    if (!subscription) {
      return { handled: false };
    }

    const toUnix = (
      v: number | null | undefined
    ) =>
      typeof v === "number"
        ? new Date(v * 1000)
        : null;

    switch (name) {
      case "subscription.activated":
      case "subscription.charged":
      case "subscription.resumed": {
        if (
          subscription.status !== "ACTIVE"
        ) {
          await this.repository.updateSubscriptionStatus(
            subscription.id,
            {
              status: "ACTIVE",
              currentPeriodStart: toUnix(
                entity.current_start
              ),
              currentPeriodEnd: toUnix(
                entity.current_end ??
                  entity.charge_at
              ),
              cancelAtPeriodEnd: false,
            }
          );
        }

        if (name === "subscription.charged") {
          await this.repository
            .recordPayment({
              userId: subscription.userId,
              subscriptionId:
                subscription.id,
              razorpayPaymentId:
                paymentEntity?.id ??
                entity.payment_id ??
                null,
              amountPaise:
                paymentEntity?.amount ??
                entity.amount_paid ??
                entity.amount_due ??
                0,
              currency:
                paymentEntity?.currency ??
                entity.currency ??
                "INR",
              status: "captured",
            })
            .catch(() => undefined);

          // Referral payout trigger: ONLY the referee's
          // first captured payment can qualify a reward.
          // Fire-and-forget — never fail the webhook.
          onPaymentCaptured(
            subscription.userId
          ).catch(() => undefined);
        }

        // Trial conversion: a subscription turning ACTIVE
        // marks any ACTIVE trial as CONVERTED.
        // Fire-and-forget — never fail the webhook.
        onSubscriptionActivated(
          subscription.userId
        ).catch(() => undefined);

        return { handled: true };
      }

      case "subscription.halted": {
        if (
          subscription.status !== "HALTED"
        ) {
          await this.repository.updateSubscriptionStatus(
            subscription.id,
            { status: "HALTED" }
          );
        }
        return { handled: true };
      }

      case "subscription.cancelled": {
        if (
          subscription.status !==
          "CANCELLED"
        ) {
          await this.repository.updateSubscriptionStatus(
            subscription.id,
            {
              status: "CANCELLED",
              currentPeriodEnd: toUnix(
                entity.current_end ??
                  entity.ended_at
              ),
            }
          );
        }
        return { handled: true };
      }

      case "subscription.completed":
      case "subscription.expired": {
        if (
          subscription.status !== "EXPIRED"
        ) {
          await this.repository.updateSubscriptionStatus(
            subscription.id,
            { status: "EXPIRED" }
          );
        }
        return { handled: true };
      }

      default:
        return { handled: false };
    }
  }
}
