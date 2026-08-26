import express from "express";
import helmet from "helmet";
import cors from "cors";

import authRoutes from "./modules/auth/auth.routes";
import businessRoutes from "./modules/business/business.routes";
import qrCodeRoutes from "./modules/qrcode/qrcode.routes";
import redirectRoutes from "./modules/qrcode/redirect.routes";
import staffRoutes from "./modules/staff/routes/staff.routes";

import { logger } from "./cores/middleware/logger";
import { errorHandler } from "./cores/middleware/errorHandler";

const app = express();

// Security
app.use(helmet());

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "TapQR API is running",
  });
});

// CORS
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:8081",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Logger
app.use(logger);

// Body Parser
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/qrcodes", qrCodeRoutes);

// Public QR redirect/scanning route
app.use("/", redirectRoutes);

// Global Error Handler — Always Last
app.use(errorHandler);

export default app;