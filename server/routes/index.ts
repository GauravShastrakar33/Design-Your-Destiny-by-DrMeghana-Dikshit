import { Express } from "express";
import authRoutes from "./auth.routes";
import trackingRoutes from "./tracking.routes";
import userRoutes from "./user.routes";
import beliefRoutes from "./belief.routes";
import badgeRoutes from "./badge.routes";
import eventRoutes from "./event.routes";
import courseRoutes from "./course.routes";

export function registerDomainRoutes(app: Express) {
  app.use("/", authRoutes);
  app.use("/", trackingRoutes);
  app.use("/", userRoutes);
  app.use("/", beliefRoutes);
  app.use("/", badgeRoutes);
  app.use("/", eventRoutes);
  app.use("/api", courseRoutes);
}
