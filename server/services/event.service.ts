import { eventRepository } from "../repositories/event.repository";
import { getSignedGetUrl, getSignedPutUrl } from "../r2Upload";
import { createEventReminders } from "../jobs/notificationCron";
import { InsertEvent, Event } from "@shared/schema";

export class EventServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "EventServiceError";
  }
}

const withSignedUrl = async (event: Event) => {
  let thumbnailSignedUrl: string | null = null;
  if (event.thumbnailUrl) {
    const signedResult = await getSignedGetUrl(event.thumbnailUrl);
    if (signedResult.success && signedResult.url) {
      thumbnailSignedUrl = signedResult.url;
    }
  }

  // Derive LIVE status
  const now = new Date();
  const isLive = event.startDatetime <= now && now <= event.endDatetime;

  return { ...event, thumbnailSignedUrl, isLive };
};

export const eventService = {
  // ===== ADMIN APIs =====

  async getAllAdminEvents(filters?: { status?: string; month?: number; year?: number }) {
    const events = await eventRepository.getAllEvents(filters);
    return await Promise.all(events.map(withSignedUrl));
  },

  async getAdminUpcomingEvents() {
    const events = await eventRepository.getAllEvents({ status: "UPCOMING" });
    return await Promise.all(events.map(withSignedUrl));
  },

  async getAdminLatestEvents() {
    const allCompleted = await eventRepository.getAllEvents({ status: "COMPLETED" });
    const latestEvents = allCompleted.filter(
      (event) => event.showRecording === true || event.recordingUrl === null
    );
    return await Promise.all(latestEvents.map(withSignedUrl));
  },

  async getUploadUrl(filename: string, contentType: string) {
    if (!filename || !contentType) {
      throw new EventServiceError("filename and contentType are required", 400);
    }
    const key = `events/${Date.now()}-${filename}`;
    const result = await getSignedPutUrl(key, contentType);

    if (!result.success) {
      throw new EventServiceError(result.error || "Failed to generate upload URL", 500);
    }
    return { key: result.key, signedUrl: result.uploadUrl };
  },

  async getEventById(id: number) {
    const event = await eventRepository.getEventById(id);
    if (!event) {
      throw new EventServiceError("Event not found", 404);
    }
    return await withSignedUrl(event);
  },

  async createEvent(eventData: InsertEvent) {
    const event = await eventRepository.createEvent(eventData);

    try {
      if (event.status === "UPCOMING") {
        await createEventReminders(event);
      }
    } catch (notifError) {
      console.error("Error creating event reminders:", notifError);
    }

    return event;
  },

  async updateEvent(id: number, updateData: Partial<InsertEvent>) {
    const existing = await eventRepository.getEventById(id);
    if (!existing) {
      throw new EventServiceError("Event not found", 404);
    }

    const event = await eventRepository.updateEvent(id, updateData);
    if (!event) {
      throw new EventServiceError("Failed to update event", 500);
    }

    // Regenerate notifications if status changed/datetime changed
    try {
      await eventRepository.deleteNotificationsByEventId(id);
      if (event.status === "UPCOMING") {
        await createEventReminders(event);
      }
    } catch (err) {
      console.error("Error updating event notifications:", err);
    }

    return event;
  },

  async regenerateReminders() {
    const upcomingEvents = await eventRepository.getAllEvents({ status: "UPCOMING" });
    let processedCount = 0;

    for (const event of upcomingEvents) {
      await eventRepository.deleteNotificationsByEventId(event.id);
      await createEventReminders(event);
      processedCount++;
    }

    return processedCount;
  },

  async cancelEvent(id: number) {
    const event = await eventRepository.cancelEvent(id);
    if (!event) {
      throw new EventServiceError("Event not found", 404);
    }

    try {
      await eventRepository.deleteNotificationsByEventId(id);
    } catch (notifError) {
      console.error("Error deleting event reminders:", notifError);
    }

    return event;
  },

  async skipRecording(id: number) {
    const event = await eventRepository.updateEvent(id, {
      showRecording: false,
      recordingSkipped: true,
      recordingUrl: null,
      recordingPasscode: null,
      // @ts-ignore - Drizzle typed
      recordingExpiryDate: null, 
    });

    if (!event) {
      throw new EventServiceError("Event not found", 404);
    }

    return event;
  },

  async addRecording(id: number, data: { recordingUrl: string; recordingExpiryDate: string }) {
    if (!data.recordingUrl || !data.recordingExpiryDate) {
      throw new EventServiceError("recordingUrl and recordingExpiryDate are required", 400);
    }

    const event = await eventRepository.updateEvent(id, {
      recordingUrl: data.recordingUrl,
      recordingPasscode: null,
      recordingExpiryDate: data.recordingExpiryDate,
      showRecording: true,
      recordingSkipped: false,
    });

    if (!event) {
      throw new EventServiceError("Event not found", 404);
    }

    return event;
  },

  async removeRecording(id: number) {
    const existing = await eventRepository.getEventById(id);
    if (!existing) {
      throw new EventServiceError("Event not found", 404);
    }

    const event = await eventRepository.updateEvent(id, {
      showRecording: false,
      recordingSkipped: false,
      recordingUrl: null,
      recordingPasscode: null,
      // @ts-ignore
      recordingExpiryDate: null,
    });

    if (!event) {
      throw new EventServiceError("Failed to remove recording", 500);
    }

    return event;
  },

  // ===== PUBLIC APIs =====

  async getUpcomingEvents() {
    const events = await eventRepository.getUpcomingEvents();
    return await Promise.all(events.map(withSignedUrl));
  },

  async getLatestEvents() {
    const events = await eventRepository.getLatestEvents();
    return await Promise.all(events.map(withSignedUrl));
  },

  async getPublicEventById(id: number) {
    const event = await eventRepository.getEventById(id);
    
    if (!event || event.status === "CANCELLED") {
      throw new EventServiceError("Event not found", 404);
    }

    return await withSignedUrl(event);
  }
};
