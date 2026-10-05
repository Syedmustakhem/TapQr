import crypto from "crypto";

/*
 * ============================================================
 * RAZORPAY API CLIENT (dependency-free, uses fetch)
 * ============================================================
 *
 * Docs: https://razorpay.com/docs/api/
 *
 * Required env vars:
 *   RAZORPAY_KEY_ID
 *   RAZORPAY_KEY_SECRET
 *   RAZORPAY_WEBHOOK_SECRET
 */

const API_BASE = "https://api.razorpay.com/v1";

function credentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret =
    process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
    );
  }

  return { keyId, keySecret };
}

async function razorpayRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
  } = {}
): Promise<T> {
  const { keyId, keySecret } =
    credentials();

  const auth = Buffer.from(
    `${keyId}:${keySecret}`
  ).toString("base64");

  const response = await fetch(
    `${API_BASE}${path}`,
    {
      method: options.method ?? "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body:
        options.body !== undefined
          ? JSON.stringify(options.body)
          : undefined,
    }
  );

  const payload = (await response.json().catch(
    () => ({})
  )) as any;

  if (!response.ok) {
    const message =
      payload?.error?.description ||
      payload?.error?.code ||
      `Razorpay API error (${response.status})`;
    throw new Error(message);
  }

  return payload as T;
}

export interface RazorpaySubscription {
  id: string;
  plan_id: string;
  customer_id?: string | null;
  status?: string | null;
  current_start?: number | null;
  current_end?: number | null;
  charge_at?: number | null;
}

/*
 * Create a Razorpay subscription for a dashboard plan.
 * total_count: 12 for monthly (1 year of cycles), 5 for yearly.
 */
export async function createRazorpaySubscription(
  razorpayPlanId: string,
  userId: string,
  planCode: string,
  totalCount: number
): Promise<RazorpaySubscription> {
  return razorpayRequest<RazorpaySubscription>(
    "/subscriptions",
    {
      method: "POST",
      body: {
        plan_id: razorpayPlanId,
        quantity: 1,
        total_count: totalCount,
        customer_notify: 1,
        notes: {
          tapqr_user_id: userId,
          tapqr_plan_code: planCode,
        },
      },
    }
  );
}

/*
 * Cancel at the end of the current billing cycle
 * (customer keeps Pro until the period ends).
 */
export async function cancelRazorpaySubscription(
  razorpaySubscriptionId: string
): Promise<void> {
  await razorpayRequest(
    `/subscriptions/${encodeURIComponent(
      razorpaySubscriptionId
    )}/cancel`,
    {
      method: "POST",
      body: {
        cancel_at_cycle_end: 1,
      },
    }
  );
}

export interface RazorpayInvoice {
  id: string;
  payment_id?: string | null;
  short_url?: string | null;
  status?: string | null;
}

export interface RazorpayToken {
  id: string;
  method?: string | null;
  card?: {
    last4?: string | null;
    network?: string | null;
    name?: string | null;
  } | null;
  bank?: string | null;
  vpa?: string | null;
}

/*
 * Update a live subscription to a different plan
 * (monthly <-> yearly). Razorpay prorates the change —
 * the customer is charged or credited the difference
 * on the next cycle.
 */
export async function updateRazorpaySubscriptionPlan(
  razorpaySubscriptionId: string,
  newPlanId: string
): Promise<RazorpaySubscription> {
  return razorpayRequest<RazorpaySubscription>(
    `/subscriptions/${encodeURIComponent(
      razorpaySubscriptionId
    )}`,
    {
      method: "PATCH",
      body: {
        plan_id: newPlanId,
        schedule_change_at: "now",
      },
    }
  );
}

/*
 * Invoices Razorpay generated for a captured payment.
 * short_url is the shareable GST invoice link.
 */
export async function fetchRazorpayInvoices(
  razorpayPaymentId: string
): Promise<RazorpayInvoice[]> {
  const payload =
    await razorpayRequest<{
      items?: RazorpayInvoice[];
    }>(
      `/invoices?payment_id=${encodeURIComponent(
        razorpayPaymentId
      )}`
    );

  return payload.items ?? [];
}

/*
 * Saved payment methods (tokens) on a Razorpay customer.
 */
export async function fetchCustomerTokens(
  razorpayCustomerId: string
): Promise<RazorpayToken[]> {
  const payload =
    await razorpayRequest<{
      items?: RazorpayToken[];
    }>(
      `/customers/${encodeURIComponent(
        razorpayCustomerId
      )}/tokens`
    );

  return payload.items ?? [];
}

export function getKeyId(): string {
  return credentials().keyId;
}

/*
 * Verify the webhook signature.
 * Must run against the RAW request body (Buffer), before JSON parsing.
 */
export function verifyWebhookSignature(
  rawBody: Buffer,
  signature: string | undefined
): boolean {
  const secret =
    process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret || !signature) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (
    expected.length !== signature.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}
