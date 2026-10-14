// src/api/billingApi.ts
//
// Billing endpoints, mirroring the TapQR web dashboard
// (app/dashboard/payments and components/billing/* call
// these exact paths against https://api.tapqr.shop/api).
//
// Uses the shared authenticated axios instance from
// authApi.ts (Bearer token + 401 refresh interceptors).

import api from "./authApi";

export type PlanCode =
  | "FREE"
  | "PRO_MONTHLY"
  | "PRO_YEARLY";

export type BillingPlan = {
  code: string;
  name: string;
  features?: string[];
};

export type BillingSubscription = {
  status: string;
  planCode: string;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
};

export type BillingLimits = {
  maxQrs: number;
  maxBusinesses: number;
  maxSeats: number;
};

export type BillingUsage = {
  qrCount: number;
  businessCount: number;
};

export type BillingPayment = {
  id: string;
  amountPaise: number;
  currency: string;
  status: string;
  createdAt: string;
};

export type BillingStatusData = {
  plan: BillingPlan;
  subscription: BillingSubscription | null;
  limits: BillingLimits;
  usage: BillingUsage;
  payments: BillingPayment[];
};

type BillingStatusResponse = {
  success?: boolean;
  message?: string;
  data?: BillingStatusData;
};

/**
 * GET /billing/status — current plan, subscription,
 * limits, usage and recent payments.
 */
export async function getBillingStatus(): Promise<BillingStatusData> {
  const res =
    await api.get<BillingStatusResponse>(
      "/billing/status"
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to load billing status."
    );
  }

  return res.data.data;
}

export type CheckoutData = {
  subscriptionId: string;
  keyId: string;
  planName: string;
  amountPaise: number;
  currency: string;
};

type CheckoutResponse = {
  success?: boolean;
  message?: string;
  data?: CheckoutData;
};

/**
 * POST /billing/checkout {planCode} — create a Razorpay
 * subscription checkout session.
 *
 * NOTE: kept for when the mobile checkout path is
 * decided (Razorpay React Native SDK). The payments
 * screen does not call this yet — see payments.tsx.
 */
export async function createCheckout(
  planCode: "PRO_MONTHLY" | "PRO_YEARLY"
): Promise<CheckoutData> {
  const res =
    await api.post<CheckoutResponse>(
      "/billing/checkout",
      { planCode }
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to start checkout."
    );
  }

  return res.data.data;
}

export type HistoryPayment = {
  id: string;
  amountPaise: number;
  currency: string;
  status: string;
  razorpayPaymentId: string | null;
  createdAt: string;
};

type BillingHistoryResponse = {
  success?: boolean;
  message?: string;
  data?: HistoryPayment[];
};

/**
 * GET /billing/history — past payments (invoices list).
 */
export async function getBillingHistory(): Promise<
  HistoryPayment[]
> {
  const res =
    await api.get<BillingHistoryResponse>(
      "/billing/history"
    );

  return res.data?.data ?? [];
}

export type InvoiceData = {
  invoiceId: string;
  url: string;
};

type InvoiceResponse = {
  success?: boolean;
  message?: string;
  data?: InvoiceData;
};

/**
 * GET /billing/invoices/:paymentId — GST invoice
 * download URL for a payment.
 */
export async function getInvoiceUrl(
  paymentId: string
): Promise<InvoiceData> {
  const res =
    await api.get<InvoiceResponse>(
      `/billing/invoices/${encodeURIComponent(
        paymentId
      )}`
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to load the invoice."
    );
  }

  return res.data.data;
}

export type CancelSubscriptionData = {
  status: string;
  currentPeriodEnd?: string | null;
};

type CancelSubscriptionResponse = {
  success?: boolean;
  message?: string;
  data?: CancelSubscriptionData;
};

/**
 * POST /billing/cancel — cancel the active Pro
 * subscription (stays active until the period end).
 */
export async function cancelSubscription(): Promise<CancelSubscriptionData> {
  const res =
    await api.post<CancelSubscriptionResponse>(
      "/billing/cancel"
    );

  return (
    res.data?.data ?? { status: "CANCELLED" }
  );
}

export type SavedPaymentMethod = {
  id: string;
  method: string | null;
  last4: string | null;
  network: string | null;
  cardName: string | null;
  bank: string | null;
  vpa: string | null;
};

type PaymentMethodsResponse = {
  success?: boolean;
  message?: string;
  data?: SavedPaymentMethod[];
};

/**
 * GET /billing/payment-methods — saved payment
 * methods (cards, UPI VPAs) on the account.
 */
export async function getPaymentMethods(): Promise<
  SavedPaymentMethod[]
> {
  const res =
    await api.get<PaymentMethodsResponse>(
      "/billing/payment-methods"
    );

  return res.data?.data ?? [];
}

export type SwitchPlanData = {
  planCode: string;
  planName: string;
  status: string;
};

type SwitchPlanResponse = {
  success?: boolean;
  message?: string;
  data?: SwitchPlanData;
};

/**
 * POST /billing/switch-plan {planCode} — switch between
 * Pro monthly and Pro yearly (prorated on the web
 * checkout path).
 */
export async function switchPlan(
  planCode: "PRO_MONTHLY" | "PRO_YEARLY"
): Promise<SwitchPlanData> {
  const res =
    await api.post<SwitchPlanResponse>(
      "/billing/switch-plan",
      { planCode }
    );

  if (!res.data?.data) {
    throw new Error(
      res.data?.message ??
        "Unable to switch plan."
    );
  }

  return res.data.data;
}

/**
 * Paise -> display rupees.
 *
 * 19900 -> "₹199"
 * 19950 -> "₹199.50"
 *
 * Mirrors the web dashboard's formatINR helper.
 */
export function formatINR(
  amountPaise: number
): string {
  const rupees = amountPaise / 100;

  return `₹${rupees.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  )}`;
}

/**
 * ISO date -> "12 Oct 2026".
 *
 * Mirrors the web dashboard's formatBillingDate helper.
 */
export function formatBillingDate(
  iso: string | null | undefined
): string {
  if (!iso) {
    return "—";
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}
