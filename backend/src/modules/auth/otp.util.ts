import crypto from "crypto";
import bcrypt from "bcrypt";

/**
 * Generate a cryptographically secure numeric OTP.
 */
export function generateOtp(
  length = 6
): string {
  if (
    !Number.isInteger(length) ||
    length < 4 ||
    length > 8
  ) {
    throw new Error(
      "OTP length must be between 4 and 8 digits"
    );
  }

  const max =
    10 ** length;

  return String(
    crypto.randomInt(0, max)
  ).padStart(length, "0");
}

/**
 * Hash OTP before storing it.
 */
export async function hashOtp(
  otp: string
): Promise<string> {
  return bcrypt.hash(
    otp,
    10
  );
}

/**
 * Compare supplied OTP against stored hash.
 */
export async function compareOtp(
  otp: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(
    otp,
    hash
  );
}

/**
 * Normalize email.
 */
export function normalizeEmail(
  email: string
): string {
  return email
    .trim()
    .toLowerCase();
}

/**
 * Normalize international phone number.
 *
 * Accepts E.164 format:
 *
 * +14155552671
 * +919985478967
 * +447911123456
 * +971501234567
 *
 * The backend does NOT assume India.
 */
export function normalizePhone(
  rawPhone: string
): string {
  const phone =
    rawPhone
      .trim()
      .replace(
        /[\s().-]/g,
        ""
      );

  /**
   * E.164:
   *
   * + followed by 7-15 digits
   */
  if (
    !/^\+[1-9]\d{6,14}$/.test(
      phone
    )
  ) {
    throw new Error(
      "Phone number must be in international E.164 format, e.g. +14155552671"
    );
  }

  return phone;
}