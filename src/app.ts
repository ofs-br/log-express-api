import express from "express";
import "express-async-errors";
import cors from "cors";
import { routes } from "./routes";
import { errorHandling } from "./middlewares/error-handling";
import { env } from "./env";

const app = express();

app.set("trust proxy", 1);

const corsOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins.includes("*") ? "*" : corsOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(routes);
app.use(errorHandling);

export { app };
