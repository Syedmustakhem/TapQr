import {
  markTrialConverted,
} from "./trial.service";
import { onCapturedPayment } from "./referral.service";

/*
 * ============================================================
 * GROWTH HOOKS
 * ============================================================
 *
 * Called from the billing webhook handler. Kept in this
 * module so billing.service.ts stays a thin caller —
 * all growth rules live beside the growth services.
 *
 * Every hook is defensive: a growth-hook failure must
 * NEVER fail a billing webhook (Razorpay would retry
 * forever). Callers wrap these in .catch(() => undefined).
 */

export async function onSubscriptionActivated(
  userId: string
): Promise<void> {
  await markTrialConverted(userId);
}

export async function onPaymentCaptured(
  userId: string
): Promise<void> {
  await onCapturedPayment(userId);
}
