import express from "express";
import helmet from "helmet";
import cors from "cors";

import behavioralAnalyticsRoutes from "./modules/analytics/behavioral-analytics.routes";
import qrRulesRoutes from "./modules/qrrules/qr-rules.routes";
import authRoutes from "./modules/auth/auth.routes";
import businessRoutes from "./modules/business/business.routes";
import qrJourneyAnalyticsRoutes from "./modules/analytics/qr-journey-analytics.routes";
import qrCodeRoutes from "./modules/qrcode/qrcode.routes";
import qrCodePublicRoutes from "./modules/qrcode/qrcode.public.routes";
import redirectRoutes from "./modules/qrcode/redirect.routes";
import qrConversionRoutes from "./modules/qrcode/qr-conversion.routes";
import advancedAnalyticsRoutes from "./modules/analytics/analytics-advanced.routes";
import staffRoutes from "./modules/staff/routes/staff.routes";
import visitorAnalyticsRoutes from "./modules/analytics/analytics-visitors.routes";

import variantRoutes from "./modules/catalog/variant.routes";
import catalogRoutes from "./modules/catalog/catalog.routes";
import categoryRoutes from "./modules/catalog/category.routes";
import itemRoutes from "./modules/catalog/item.routes";
import optionGroupRoutes from "./modules/catalog/option-group.routes";
import optionRoutes from "./modules/catalog/option.routes";

import campaignRoutes from "./modules/campaign/campaign.routes";

import { logger } from "./cores/middleware/logger";
import { errorHandler } from "./cores/middleware/errorHandler";

import whatsappRoutes from "./modules/whatsapp/whatsapp.routes";
import whatsappWebhookRoutes from "./modules/whatsapp/webhook/webhook.routes";

import analyticsRoutes from "./modules/analytics/analytics.routes";

import {
  startNotificationWorker,
} from "./modules/notifications/notification.worker";

import reviewsRoutes from "./modules/reviews/routes/reviews.routes";
import notificationRoutes from "./modules/notifications/notifications.routes";

import qrExperimentsRoutes from "./modules/qr-experiments/qr-experiments.routes";

const app = express();

app.set("trust proxy", 1);

/*
|--------------------------------------------------------------------------
| NOTIFICATION WORKER
|--------------------------------------------------------------------------
|
| Processes pending email / WhatsApp notification deliveries
| and retries failed deliveries with exponential backoff.
|
*/

startNotificationWorker();

/*
|--------------------------------------------------------------------------
| SECURITY
|--------------------------------------------------------------------------
*/

app.use(helmet());

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| The frontend sends:
|
|   Authorization
|   X-Business-Id
|
| Therefore X-Business-Id MUST be allowed here.
|
*/

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:8081",

  "https://tapqr.shop",
  "https://www.tapqr.shop",
];

app.use(
  cors({
    origin: allowedOrigins,

    credentials: true,

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Business-Id",
      "x-tapqr-visitor-key",
    ],

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
  })
);

/*
|--------------------------------------------------------------------------
| LOGGER
|--------------------------------------------------------------------------
*/

app.use(logger);

/*
|--------------------------------------------------------------------------
| BODY PARSER
|--------------------------------------------------------------------------
*/

app.use(express.json());

/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "TapQR API is running",
  });
});

/*
|--------------------------------------------------------------------------
| AUTHENTICATION
|--------------------------------------------------------------------------
*/

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/analytics",
  advancedAnalyticsRoutes
);

app.use(
  "/api/notifications",
  notificationRoutes
);

/*
|--------------------------------------------------------------------------
| BUSINESS MANAGEMENT
|--------------------------------------------------------------------------
*/

app.use(
  "/api/businesses",
  businessRoutes
);

app.use(
  "/api/campaign",
  campaignRoutes
);

/*
|--------------------------------------------------------------------------
| CATALOG OPTION GROUPS
|--------------------------------------------------------------------------
*/

app.use(
  "/api/catalogs",
  optionGroupRoutes
);

/*
|--------------------------------------------------------------------------
| WHATSAPP WEBHOOK
|--------------------------------------------------------------------------
|
| PUBLIC META WEBHOOK
|
| GET  /api/whatsapp/webhook
| POST /api/whatsapp/webhook
|
| IMPORTANT:
| This is mounted ONLY ONCE.
|
*/

app.use(
  "/api/whatsapp/webhook",
  whatsappWebhookRoutes
);

/*
|--------------------------------------------------------------------------
| PUBLIC QR CONVERSION
|--------------------------------------------------------------------------
*/

app.use(
  "/api/qrcodes/public",
  qrConversionRoutes
);

/*
|--------------------------------------------------------------------------
| CATALOG OPTIONS
|--------------------------------------------------------------------------
*/

app.use(
  "/api/catalogs",
  optionRoutes
);

/*
|--------------------------------------------------------------------------
| VISITOR ANALYTICS
|--------------------------------------------------------------------------
*/

app.use(
  "/api/analytics",
  visitorAnalyticsRoutes
);

/*
|--------------------------------------------------------------------------
| REVIEWS
|--------------------------------------------------------------------------
*/

app.use(
  "/api/reviews",
  reviewsRoutes
);

/*
|--------------------------------------------------------------------------
| STAFF MANAGEMENT
|--------------------------------------------------------------------------
*/

app.use(
  "/api/staff",
  staffRoutes
);

/*
|--------------------------------------------------------------------------
| BEHAVIORAL ANALYTICS
|--------------------------------------------------------------------------
*/

app.use(
  "/api/analytics",
  behavioralAnalyticsRoutes
);

/*
|--------------------------------------------------------------------------
| ANALYTICS
|--------------------------------------------------------------------------
*/

app.use(
  "/api/analytics",
  analyticsRoutes
);

app.use(
  "/api/analytics",
  qrJourneyAnalyticsRoutes
);

/*
|--------------------------------------------------------------------------
| CATALOG MANAGEMENT
|--------------------------------------------------------------------------
|
| Catalog
|   └── Categories
|         └── Items
|               └── Variants
|               └── Options
|
*/

app.use(
  "/api/catalogs",
  catalogRoutes
);

app.use(
  "/api/catalogs",
  categoryRoutes
);

app.use(
  "/api/catalogs",
  itemRoutes
);

app.use(
  "/api/catalogs",
  variantRoutes
);

/*
|--------------------------------------------------------------------------
| WHATSAPP SUPPORT
|--------------------------------------------------------------------------
|
| Authenticated WhatsApp support APIs:
|
| GET    /api/whatsapp/conversations
| GET    /api/whatsapp/conversations/:id
| GET    /api/whatsapp/conversations/:id/messages
| POST   /api/whatsapp/conversations/:id/messages
| PATCH  /api/whatsapp/conversations/:id/status
| POST   /api/whatsapp/conversations/:id/assign
| DELETE /api/whatsapp/conversations/:id/assign
| PATCH  /api/whatsapp/conversations/:id/handling-mode
|
*/

app.use(
  "/api/whatsapp",
  whatsappRoutes
);

/*
|--------------------------------------------------------------------------
| PUBLIC QR GUEST EXPERIENCE
|--------------------------------------------------------------------------
|
| No authentication.
|
| GET  /api/qrcodes/public/:shortCode
| POST /api/qrcodes/public/:shortCode/scan
|
| IMPORTANT:
| Mounted before authenticated QR routes.
|
*/

app.use(
  "/api/qrcodes/public",
  qrCodePublicRoutes
);

/*
|--------------------------------------------------------------------------
| QR EXPERIMENTS
|--------------------------------------------------------------------------
*/

app.use(
  "/api/qr-experiments",
  qrExperimentsRoutes
);

/*
|--------------------------------------------------------------------------
| QR RULES
|--------------------------------------------------------------------------
*/

app.use(
  "/api/qr-rules",
  qrRulesRoutes
);

/*
|--------------------------------------------------------------------------
| AUTHENTICATED QR MANAGEMENT
|--------------------------------------------------------------------------
|
| POST   /api/qrcodes
| GET    /api/qrcodes/business/:businessId
| GET    /api/qrcodes/:id
| PUT    /api/qrcodes/:id
| DELETE /api/qrcodes/:id
|
*/

app.use(
  "/api/qrcodes",
  qrCodeRoutes
);

/*
|--------------------------------------------------------------------------
| PUBLIC QR REDIRECT
|--------------------------------------------------------------------------
|
| GET /r/:shortCode
|
*/

app.use(
  "/",
  redirectRoutes
);

/*
|--------------------------------------------------------------------------
| GLOBAL ERROR HANDLER
|--------------------------------------------------------------------------
|
| MUST REMAIN LAST.
|
*/

app.use(errorHandler);

export default app;