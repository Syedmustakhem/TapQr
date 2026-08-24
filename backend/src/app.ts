import express from "express";
import helmet from "helmet";
import cors from "cors";

import authRoutes from "./modules/auth/auth.routes";
import businessRoutes from "./modules/business/business.routes";
<<<<<<< HEAD
import qrCodeRoutes from "./modules/qrcode/qrcode.routes";
=======
import redirectRoutes from "./modules/qrcode/redirect.routes";
>>>>>>> c8ecb89 (feat(analtics))
import { logger } from "./cores/middleware/logger";
import { errorHandler } from "./cores/middleware/errorHandler";
  import staffRoutes from "./modules/staff/routes/staff.routes";
const app = express();

app.use(helmet());

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "TapQR API is running",
  });
});

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

app.use(logger);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/businesses", businessRoutes);
<<<<<<< Updated upstream
<<<<<<< HEAD
app.use("/api/staff", staffRoutes);
app.use("/api/qrcodes", qrCodeRoutes);
=======
app.use("/", redirectRoutes);
>>>>>>> c8ecb89 (feat(analtics))
// Global Error Handler (Always Last)
=======

>>>>>>> Stashed changes
app.use(errorHandler);

export default app;