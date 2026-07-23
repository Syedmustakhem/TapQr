import express from "express";
import authRoutes from "./modules/auth/auth.routes";
import { errorHandler } from "./cores/middleware/errorHandler";
import helmet from "helmet";
import cors from "cors";
const app = express();

app.use(express.json());
app.use(errorHandler);
app.use("/api/auth", authRoutes);
app.use(helmet());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:8081"
    ],
    credentials: true,
  })
);
app.use(logger);
export default app;