import express from "express";
import helmet from "helmet";
import cors from "cors";

import authRoutes from "./modules/auth/auth.routes";
import businessRoutes from "./modules/business/business.routes";
import qrCodeRoutes from "./modules/qrcode/qrcode.routes";
import qrCodePublicRoutes from "./modules/qrcode/qrcode.public.routes";
import redirectRoutes from "./modules/qrcode/redirect.routes";
import staffRoutes from "./modules/staff/routes/staff.routes";
import variantRoutes from "./modules/catalog/variant.routes";
import catalogRoutes from "./modules/catalog/catalog.routes";
import categoryRoutes from "./modules/catalog/category.routes";
import itemRoutes from "./modules/catalog/item.routes";
import optionGroupRoutes from "./modules/catalog/option-group.routes";
import optionRoutes from "./modules/catalog/option.routes";
import { logger } from "./cores/middleware/logger";
import { errorHandler } from "./cores/middleware/errorHandler";
import whatsappWebhookRoutes from "./modules/whatsapp/webhook/webhook.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";

import reviewsRoutes from "./modules/reviews/routes/reviews.routes";

const app = express();
app.set("trust proxy", 1);
/**
 * Security
 */
app.use(helmet());

/**
 * CORS
 */
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:8081",
  "https://tapqr.shop",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

/**
 * Logger
 */
app.use(logger);

/**
 * Body parser
 */
app.use(express.json());

/**
 * Health check
 */
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "TapQR API is running",
  });
});

/**
 * Authentication
 */
app.use("/api/auth", authRoutes);

/**
 * Business management
 */
app.use("/api/businesses", businessRoutes);
app.use(
  "/api/catalogs",
  optionGroupRoutes
);

app.use(
  "/api/catalogs",
  optionRoutes
);

app.use(
  "/api/reviews",
  reviewsRoutes
);
/**
 * Staff management
 */
app.use("/api/staff", staffRoutes);

app.use(
  "/api/analytics",
  analyticsRoutes
);
/**
 * Catalog management
 *
 * Catalog
 *   └── Categories
 *         └── Items
 *               └── Variants
 *               └── Options
 */
app.use("/api/catalogs", catalogRoutes);

app.use("/api/catalogs", categoryRoutes);

app.use("/api/catalogs", itemRoutes);
app.use(
  "/api/catalogs",
  variantRoutes
);
/**
 * PUBLIC QR GUEST EXPERIENCE
 *
 * No authentication.
 *
 * GET  /api/qrcodes/public/:shortCode
 * POST /api/qrcodes/public/:shortCode/scan
 *
 * IMPORTANT:
 * Mounted before authenticated QR routes.
 */
app.use(
  "/api/qrcodes/public",
  qrCodePublicRoutes
);

/**
 * AUTHENTICATED QR MANAGEMENT
 *
 * POST   /api/qrcodes
 * GET    /api/qrcodes/business/:businessId
 * GET    /api/qrcodes/:id
 * PUT    /api/qrcodes/:id
 * DELETE /api/qrcodes/:id
 */
app.use(
  "/api/qrcodes",
  qrCodeRoutes
);

/**
 * Public QR redirect
 *
 * GET /r/:shortCode
 */
app.use(
  "/",
  redirectRoutes
);


app.use(
  "/api/whatsapp/webhook",
  whatsappWebhookRoutes
);
/**
 * Global error handler
 *
 * MUST remain last.
 */
app.use(errorHandler);

export default app;