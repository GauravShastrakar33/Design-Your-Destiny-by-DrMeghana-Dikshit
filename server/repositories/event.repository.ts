import { db } from "../db";
import { 
  events as eventsTable, 
  notifications as notificationsTable,
  type Event, 
  type InsertEvent 
} from "@shared/schema";
import { eq, desc, and, lte, or, sql, isNull, asc, gte } from "drizzle-orm";

export class EventRepository {
  private async autoCompleteEvents(): Promise<void> {
    const now = new Date();
    await db
      .update(eventsTable)
      .set({ status: "COMPLETED" })
      .where(
        and(
          eq(eventsTable.status, "UPCOMING"),
          lte(eventsTable.endDatetime, now)
        )
      );
  }

  async getAllEvents(filters?: { status?: string; month?: number; year?: number }): Promise<Event[]> {
    await this.autoCompleteEvents();

    let conditions = [];

    if (filters?.status) {
      conditions.push(eq(eventsTable.status, filters.status));
    }

    if (filters?.month && filters?.year) {
      // Month (1-12). Create date range for the month
      const startDate = new Date(filters.year, filters.month - 1, 1);
      const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59);
      
      conditions.push(
        and(
          gte(eventsTable.startDatetime, startDate),
          lte(eventsTable.startDatetime, endDate)
        )
      );
    }

    return await db.query.events.findMany({
      where: conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : and(...conditions)) : undefined,
      orderBy: [desc(eventsTable.startDatetime)],
    });
  }

  async getEventById(id: number): Promise<Event | undefined> {
    return await db.query.events.findFirst({
      where: (events, { eq }) => eq(events.id, id),
    });
  }

  async getUpcomingEvents(): Promise<Event[]> {
    await this.autoCompleteEvents();
    
    return await db.query.events.findMany({
      where: (events, { eq }) => eq(events.status, "UPCOMING"),
      orderBy: [asc(eventsTable.startDatetime)],
    });
  }

  async getLatestEvents(): Promise<Event[]> {
    await this.autoCompleteEvents();

    return await db.query.events.findMany({
      where: (events, { eq, and, or }) => 
        and(
          eq(events.status, "COMPLETED"),
          eq(events.showRecording, true),
          eq(events.recordingSkipped, false)
        ),
      orderBy: [desc(eventsTable.startDatetime)],
      limit: 5,
    });
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db
      .insert(eventsTable)
      .values(event)
      .returning();
    return newEvent;
  }

  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const [updated] = await db
      .update(eventsTable)
      .set(event)
      .where(eq(eventsTable.id, id))
      .returning();
    return updated;
  }

  async cancelEvent(id: number): Promise<Event | undefined> {
    const [updated] = await db
      .update(eventsTable)
      .set({ status: "CANCELLED" })
      .where(eq(eventsTable.id, id))
      .returning();
    return updated;
  }

  async deleteNotificationsByEventId(eventId: number): Promise<void> {
    await db.delete(notificationsTable)
      .where(eq(notificationsTable.relatedEventId, eventId));
  }
}

export const eventRepository = new EventRepository();
