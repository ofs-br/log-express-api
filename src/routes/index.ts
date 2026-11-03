import { Router } from "express";
import { userRoutes } from "./users-routes";
import { sessionsRoutes } from "./sessions-route";
import { deliveryRoutes } from "./deliveries-routes";
import { deliveryLogsRoutes } from "./delivery-logs-rotes";
import { healthRoutes } from "./health-routes";

const routes = Router();
routes.use("/health", healthRoutes);
routes.use("/users", userRoutes);
routes.use("/sessions", sessionsRoutes);
routes.use("/deliveries", deliveryRoutes);
routes.use("/delivery-logs", deliveryLogsRoutes);
export { routes };
