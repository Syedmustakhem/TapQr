import { createHmac, timingSafeEqual } from "node:crypto";

type ReviewVerificationPayload = {
  v: 1;
  purpose: "REVIEW";
  scanEventId: string;
  qrCodeId: string;
  issuedAt: number;
  expiresAt: number;
};

function secret(): string {
  const value = process.env.REVIEW_VERIFICATION_SECRET?.trim();

  if (!value || value.length < 32) {
    throw new Error(
      "REVIEW_VERIFICATION_SECRET must be configured with at least 32 characters."
    );
  }

  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret())
    .update(payload)
    .digest("base64url");
}

export function createReviewVerificationToken(input: {
  scanEventId: string;
  qrCodeId: string;
  ttlSeconds?: number;
}): string {
  const now = Math.floor(Date.now() / 1000);

  const ttl = Math.min(
    Math.max(Math.floor(input.ttlSeconds ?? 15 * 60), 60),
    30 * 60
  );

  const payload: ReviewVerificationPayload = {
    v: 1,
    purpose: "REVIEW",
    scanEventId: input.scanEventId,
    qrCodeId: input.qrCodeId,
    issuedAt: now,
    expiresAt: now + ttl,
  };

  const body = Buffer.from(JSON.stringify(payload), "utf8")
    .toString("base64url");

  return `${body}.${sign(body)}`;
}

export function verifyReviewVerificationToken(
  token: string
): ReviewVerificationPayload {
  const [body, providedSignature] = token.split(".");

  if (!body || !providedSignature) {
    throw new Error("Invalid review verification token.");
  }

  const expectedSignature = sign(body);

  const provided = Buffer.from(providedSignature);
  const expected = Buffer.from(expectedSignature);

  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  ) {
    throw new Error("Invalid review verification token.");
  }

  let payload: ReviewVerificationPayload;

  try {
    payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    ) as ReviewVerificationPayload;
  } catch {
    throw new Error("Invalid review verification token.");
  }

  if (
    payload.v !== 1 ||
    payload.purpose !== "REVIEW" ||
    !payload.scanEventId ||
    !payload.qrCodeId ||
    !Number.isInteger(payload.issuedAt) ||
    !Number.isInteger(payload.expiresAt)
  ) {
    throw new Error("Invalid review verification token.");
  }

  const now = Math.floor(Date.now() / 1000);

  if (
    payload.expiresAt <= now ||
    payload.issuedAt > now + 60
  ) {
    throw new Error("Review verification token has expired.");
  }

  return payload;
}
