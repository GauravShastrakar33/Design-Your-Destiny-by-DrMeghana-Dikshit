import { Request, Response } from "express";
import { sessionService } from "../services/session.service";
import { insertCommunitySessionSchema } from "@shared/schema";
import { z } from "zod";

export const sessionController = {
  // Public: Get active community sessions
  async getActiveSessions(req: Request, res: Response) {
    try {
      const sessions = await sessionService.getActiveSessions();
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  },

  // Admin: Get all sessions (including inactive)
  async getAllSessions(req: Request, res: Response) {
    try {
      const sessions = await sessionService.getAllSessions();
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching admin sessions:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  },

  // Admin: Create session
  async createSession(req: Request, res: Response) {
    try {
      const validatedData = insertCommunitySessionSchema.parse(req.body);
      const session = await sessionService.createSession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error creating session:", error);
        res.status(500).json({ error: "Failed to create session" });
      }
    }
  },

  // Admin: Update session
  async updateSession(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCommunitySessionSchema.partial().parse(req.body);
      const session = await sessionService.updateSession(id, validatedData);

      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error updating session:", error);
        res.status(500).json({ error: "Failed to update session" });
      }
    }
  },

  // Admin: Delete session
  async deleteSession(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const success = await sessionService.deleteSession(id);

      if (!success) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting session:", error);
      res.status(500).json({ error: "Failed to delete session" });
    }
  },
};
