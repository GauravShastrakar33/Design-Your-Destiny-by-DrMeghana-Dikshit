import { Request, Response } from "express";
import { eventService, EventServiceError } from "../services/event.service";
import { insertEventSchema } from "@shared/schema";
import { logAudit } from "../utils/audit";

const handleServiceError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof EventServiceError) {
    return res.status(error.statusCode).json({ error: error.message });
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ error: fallbackMessage });
};

export const eventController = {
  // ===== ADMIN APIs =====

  getAllAdminEvents: async (req: Request, res: Response) => {
    try {
      const { status, month, year } = req.query;
      const filters: { status?: string; month?: number; year?: number } = {};

      if (status) filters.status = String(status);
      if (month) filters.month = parseInt(String(month));
      if (year) filters.year = parseInt(String(year));

      const events = await eventService.getAllAdminEvents(filters);
      res.json(events);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch events");
    }
  },

  getAdminUpcomingEvents: async (req: Request, res: Response) => {
    try {
      const events = await eventService.getAdminUpcomingEvents();
      res.json(events);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch upcoming events");
    }
  },

  getAdminLatestEvents: async (req: Request, res: Response) => {
    try {
      const events = await eventService.getAdminLatestEvents();
      res.json(events);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch latest events");
    }
  },

  getUploadUrl: async (req: Request, res: Response) => {
    try {
      const { filename, contentType } = req.query;
      const result = await eventService.getUploadUrl(String(filename), String(contentType));
      res.json(result);
    } catch (error) {
      handleServiceError(res, error, "Failed to generate upload URL");
    }
  },

  getAdminEventById: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const event = await eventService.getEventById(id);
      res.json(event);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch event");
    }
  },

  createEvent: async (req: Request, res: Response) => {
    try {
      const parsed = insertEventSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: "Validation failed", details: parsed.error.errors });
      }

      const event = await eventService.createEvent(parsed.data);

      if (req.user) {
        logAudit({
          req,
          userId: req.user.sub,
          userEmail: req.user.email,
          action: "CREATE",
          entityType: "EVENT",
          entityId: event.id,
          newValues: event,
        });
      }

      res.status(201).json(event);
    } catch (error) {
      handleServiceError(res, error, "Failed to create event");
    }
  },

  updateEvent: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      const updateData = { ...req.body };
      if (typeof updateData.startDatetime === "string") {
        updateData.startDatetime = new Date(updateData.startDatetime);
      }
      if (typeof updateData.endDatetime === "string") {
        updateData.endDatetime = new Date(updateData.endDatetime);
      }

      const existingEvent = await eventService.getEventById(id); // Only checking existance
      const event = await eventService.updateEvent(id, updateData);

      if (req.user && existingEvent) {
        logAudit({
          req,
          userId: req.user.sub,
          userEmail: req.user.email,
          action: "UPDATE",
          entityType: "EVENT",
          entityId: id,
          oldValues: existingEvent,
          newValues: event,
        });
      }

      res.json(event);
    } catch (error) {
      handleServiceError(res, error, "Failed to update event");
    }
  },

  regenerateReminders: async (req: Request, res: Response) => {
    try {
      const processedCount = await eventService.regenerateReminders();
      res.json({
        success: true,
        message: `Regenerated reminders for ${processedCount} events`,
      });
    } catch (error) {
      handleServiceError(res, error, "Failed to regenerate reminders");
    }
  },

  cancelEvent: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const oldValues = await eventService.getEventById(id).catch(() => null);
      
      const event = await eventService.cancelEvent(id);

      if (req.user && oldValues) {
        logAudit({
          req,
          userId: req.user.sub,
          userEmail: req.user.email,
          action: "DELETE",
          entityType: "EVENT",
          entityId: id,
          oldValues,
        });
      }

      res.json({ success: true, message: "Event cancelled" });
    } catch (error) {
      handleServiceError(res, error, "Failed to cancel event");
    }
  },

  skipRecording: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await eventService.skipRecording(id);
      res.json({ success: true, message: "Recording skipped" });
    } catch (error) {
      handleServiceError(res, error, "Failed to skip recording");
    }
  },

  addRecording: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { recordingUrl, recordingExpiryDate } = req.body;
      const event = await eventService.addRecording(id, { recordingUrl, recordingExpiryDate });
      res.json(event);
    } catch (error) {
      handleServiceError(res, error, "Failed to add recording");
    }
  },

  removeRecording: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await eventService.removeRecording(id);
      res.json({ success: true, message: "Recording removed" });
    } catch (error) {
      handleServiceError(res, error, "Failed to remove recording");
    }
  },

  // ===== PUBLIC APIs =====

  getPublicUpcomingEvents: async (req: Request, res: Response) => {
    try {
      const events = await eventService.getUpcomingEvents();
      res.json(events);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch upcoming events");
    }
  },

  getPublicLatestEvents: async (req: Request, res: Response) => {
    try {
      const events = await eventService.getLatestEvents();
      res.json(events);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch latest events");
    }
  },

  getPublicEventById: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const event = await eventService.getPublicEventById(id);
      res.json(event);
    } catch (error) {
      handleServiceError(res, error, "Failed to fetch event");
    }
  }
};
