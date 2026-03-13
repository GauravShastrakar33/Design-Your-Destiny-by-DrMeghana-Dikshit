import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerDomainRoutes } from "./routes/index";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  registerDomainRoutes(app);

  return createServer(app);
}
