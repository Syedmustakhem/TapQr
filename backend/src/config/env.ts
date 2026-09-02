export const env = {
  PORT: process.env.PORT || "5000",

  DATABASE_URL:
    process.env.DATABASE_URL!,

  JWT_SECRET:
    process.env.JWT_SECRET!,

  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET!,

  JWT_EXPIRES_IN:
    process.env.JWT_EXPIRES_IN || "15m",

  JWT_REFRESH_EXPIRES_IN:
    process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  REVIEW_VERIFICATION_SECRET:
    process.env.REVIEW_VERIFICATION_SECRET!,

  // Google
  GOOGLE_CLIENT_ID_WEB:
    process.env.GOOGLE_CLIENT_ID_WEB!,

  GOOGLE_CLIENT_ID_ANDROID:
    process.env.GOOGLE_CLIENT_ID_ANDROID!,

  // WhatsApp Cloud API
  WHATSAPP_ACCESS_TOKEN:
    process.env.WHATSAPP_ACCESS_TOKEN!,

  WHATSAPP_PHONE_NUMBER_ID:
    process.env.WHATSAPP_PHONE_NUMBER_ID!,

  WHATSAPP_OTP_TEMPLATE_NAME:
    process.env.WHATSAPP_OTP_TEMPLATE_NAME!,

  WHATSAPP_OTP_TEMPLATE_LANG:
    process.env.WHATSAPP_OTP_TEMPLATE_LANG ||
    "en",

  WHATSAPP_API_VERSION:
    process.env.WHATSAPP_API_VERSION ||
    "v19.0",

  WHATSAPP_WEBHOOK_VERIFY_TOKEN:
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN!,

  // Email / Resend
  EMAIL_API_KEY:
    process.env.EMAIL_API_KEY!,

  EMAIL_FROM:
    process.env.EMAIL_FROM ||
    "noreply@tapqr.shop",

  RESEND_TEMPLATE_ID:
    process.env.RESEND_TEMPLATE_ID!,
};