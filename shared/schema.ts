import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  email: varchar("email", { length: 150 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("USER"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  lastLogin: timestamp("last_login", { mode: "date" }),
  lastActivity: timestamp("last_activity", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  lastLogin: true,
  lastActivity: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const communitySessions = pgTable("community_sessions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  time: text("time").notNull(),
  displayTime: text("display_time").notNull(),
  meetingLink: text("meeting_link").notNull(),
  participants: integer("participants").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertCommunitySessionSchema = createInsertSchema(communitySessions).omit({
  id: true,
});

export type InsertCommunitySession = z.infer<typeof insertCommunitySessionSchema>;
export type CommunitySession = typeof communitySessions.$inferSelect;

export const drmMessageSchema = z.object({
  id: z.string(),
  question: z.string(),
  userName: z.string().optional(),
  videoUrl: z.string(),
  subtitlesUrl: z.string().optional(),
  textResponse: z.string(),
  timestamp: z.number(),
});

export type DrmMessage = z.infer<typeof drmMessageSchema>;

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  categoryId: integer("category_id").notNull(),
  imageUrl: text("image_url").notNull(),
  content: text("content").notNull(),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  createdAt: true,
});

export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articles.$inferSelect;

export const processFolders = pgTable("process_folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
});

export const insertProcessFolderSchema = createInsertSchema(processFolders).omit({
  id: true,
});

export type InsertProcessFolder = z.infer<typeof insertProcessFolderSchema>;
export type ProcessFolder = typeof processFolders.$inferSelect;

export const processSubfolders = pgTable("process_subfolders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  folderId: integer("folder_id").notNull().references(() => processFolders.id, { onDelete: 'cascade' }),
  displayOrder: integer("display_order").notNull().default(0),
});

export const insertProcessSubfolderSchema = createInsertSchema(processSubfolders).omit({
  id: true,
});

export type InsertProcessSubfolder = z.infer<typeof insertProcessSubfolderSchema>;
export type ProcessSubfolder = typeof processSubfolders.$inferSelect;

export const processes = pgTable("processes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  subfolderId: integer("subfolder_id").references(() => processSubfolders.id, { onDelete: 'cascade' }),
  folderId: integer("folder_id").notNull().references(() => processFolders.id, { onDelete: 'cascade' }),
  videoUrl: text("video_url"),
  audioUrl: text("audio_url"),
  scriptUrl: text("script_url"),
  iconName: text("icon_name").notNull().default("Brain"),
  displayOrder: integer("display_order").notNull().default(0),
});

export const insertProcessSchema = createInsertSchema(processes).omit({
  id: true,
});

export type InsertProcess = z.infer<typeof insertProcessSchema>;
export type Process = typeof processes.$inferSelect;

export const spiritualBreaths = pgTable("spiritual_breaths", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  videoUrl: text("video_url"),
  audioUrl: text("audio_url"),
  displayOrder: integer("display_order").notNull().default(0),
});

export const insertSpiritualBreathSchema = createInsertSchema(spiritualBreaths).omit({
  id: true,
});

export type InsertSpiritualBreath = z.infer<typeof insertSpiritualBreathSchema>;
export type SpiritualBreath = typeof spiritualBreaths.$inferSelect;

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  thumbnail: text("thumbnail").notNull(),
  year: text("year").notNull(),
  type: text("type").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
});

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

export const courseSections = pgTable("course_sections", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  displayOrder: integer("display_order").notNull().default(0),
});

export const insertCourseSectionSchema = createInsertSchema(courseSections).omit({
  id: true,
});

export type InsertCourseSection = z.infer<typeof insertCourseSectionSchema>;
export type CourseSection = typeof courseSections.$inferSelect;

export const sectionVideos = pgTable("section_videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  duration: text("duration").notNull(),
  videoUrl: text("video_url").notNull(),
  sectionId: integer("section_id").notNull().references(() => courseSections.id, { onDelete: 'cascade' }),
  displayOrder: integer("display_order").notNull().default(0),
});

export const insertSectionVideoSchema = createInsertSchema(sectionVideos).omit({
  id: true,
});

export type InsertSectionVideo = z.infer<typeof insertSectionVideoSchema>;
export type SectionVideo = typeof sectionVideos.$inferSelect;

export const masterclasses = pgTable("masterclasses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  date: text("date").notNull(), // Display text like "14 Nov"
  time: text("time").notNull(), // Display text like "06:00 pm - 08:00 pm"
  startTime: text("start_time").notNull(), // Display time like "18:00" (kept for backward compatibility)
  endTime: text("end_time").notNull(), // Display time like "20:00" (kept for backward compatibility)
  scheduledStart: timestamp("scheduled_start", { mode: "date" }).notNull(), // Canonical start datetime
  scheduledEnd: timestamp("scheduled_end", { mode: "date" }).notNull(), // Canonical end datetime
  zoomLink: text("zoom_link").notNull(),
  thumbnail: text("thumbnail").notNull(),
  isLive: boolean("is_live").notNull().default(false),
  displayOrder: integer("display_order").notNull().default(0),
});

export const insertMasterclassSchema = createInsertSchema(masterclasses).omit({
  id: true,
}).extend({
  scheduledStart: z.coerce.date(),
  scheduledEnd: z.coerce.date(),
});

export type InsertMasterclass = z.infer<typeof insertMasterclassSchema>;
export type Masterclass = typeof masterclasses.$inferSelect;

export const workshopVideos = pgTable("workshop_videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  thumbnail: text("thumbnail").notNull(),
  uploadDate: text("upload_date").notNull(),
  videoUrl: text("video_url").notNull(),
  author: text("author").notNull().default("Dr. Meghana Dikshit"),
  description: text("description").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
});

export const insertWorkshopVideoSchema = createInsertSchema(workshopVideos).omit({
  id: true,
});

export type InsertWorkshopVideo = z.infer<typeof insertWorkshopVideoSchema>;
export type WorkshopVideo = typeof workshopVideos.$inferSelect;
