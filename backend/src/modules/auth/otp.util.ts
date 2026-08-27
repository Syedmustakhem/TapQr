import crypto from "crypto";
import bcrypt from "bcrypt";

export function generateOtp(length = 6): string {
  const max = 10 ** length;
  return String(crypto.randomInt(0, max)).padStart(length, "0");
}

export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

export async function compareOtp(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhone(rawPhone: string): string {
  const trimmed = rawPhone.trim().replace(/[\s().-]/g, "");
  if (!trimmed.startsWith("+")) {
    throw new Error("Phone number must be in E.164 format, e.g. +14155551234");
  }
  return trimmed;
}