import express from "express";
import helmet from "helmet";
import cors from "cors";

import authRoutes from "./modules/auth/auth.routes";
import businessRoutes from "./modules/business/business.routes";

import { logger } from "./cores/middleware/logger";
import { errorHandler } from "./cores/middleware/errorHandler";

const app = express();

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:8081",
    ],
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

// Global Error Handler (Always Last)
app.use(errorHandler);

export default app;