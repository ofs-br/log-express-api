import { Router } from "express";

const healthRoutes = Router();

healthRoutes.get("/", (_request, response) => {
  return response.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export { healthRoutes };
