import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, serial, timestamp, date, numeric, unique } from "drizzle-orm/pg-core";
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

export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull(),
});

export const insertProgramSchema = createInsertSchema(programs).omit({
  id: true,
});

export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type Program = typeof programs.$inferSelect;

export const userPrograms = pgTable("user_programs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  programId: integer("program_id").notNull().references(() => programs.id, { onDelete: 'cascade' }),
});

export const insertUserProgramSchema = createInsertSchema(userPrograms).omit({
  id: true,
});

export type InsertUserProgram = z.infer<typeof insertUserProgramSchema>;
export type UserProgram = typeof userPrograms.$inferSelect;

export type UserWithPrograms = User & { programs: string[] };

// CMS Tables
export const cmsCourses = pgTable("cms_courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  programId: integer("program_id").references(() => programs.id, { onDelete: 'set null' }),
  description: text("description"),
  thumbnailKey: text("thumbnail_key"),
  isPublished: boolean("is_published").notNull().default(false),
  createdByAdminId: integer("created_by_admin_id").references(() => users.id),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const insertCmsCourseSchema = createInsertSchema(cmsCourses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCmsCourse = z.infer<typeof insertCmsCourseSchema>;
export type CmsCourse = typeof cmsCourses.$inferSelect;

export const cmsModules = pgTable("cms_modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => cmsCourses.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const insertCmsModuleSchema = createInsertSchema(cmsModules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCmsModule = z.infer<typeof insertCmsModuleSchema>;
export type CmsModule = typeof cmsModules.$inferSelect;

export const cmsModuleFolders = pgTable("cms_module_folders", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull().references(() => cmsModules.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const insertCmsModuleFolderSchema = createInsertSchema(cmsModuleFolders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCmsModuleFolder = z.infer<typeof insertCmsModuleFolderSchema>;
export type CmsModuleFolder = typeof cmsModuleFolders.$inferSelect;

export const cmsLessons = pgTable("cms_lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull().references(() => cmsModules.id, { onDelete: 'cascade' }),
  folderId: integer("folder_id").references(() => cmsModuleFolders.id, { onDelete: 'set null' }),
  title: text("title").notNull(),
  description: text("description"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const insertCmsLessonSchema = createInsertSchema(cmsLessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCmsLesson = z.infer<typeof insertCmsLessonSchema>;
export type CmsLesson = typeof cmsLessons.$inferSelect;

export const lessonFileTypeEnum = ["video", "audio", "script"] as const;
export type LessonFileType = typeof lessonFileTypeEnum[number];

export const cmsLessonFiles = pgTable("cms_lesson_files", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => cmsLessons.id, { onDelete: 'cascade' }),
  fileType: text("file_type").notNull(), // 'video', 'audio', 'script'
  r2Key: text("r2_key").notNull(),
  publicUrl: text("public_url"),
  sizeMb: integer("size_mb"),
  durationSec: integer("duration_sec"),
  extractedText: text("extracted_text"), // For PDF/script files - stores extracted text content
  scriptHtml: text("script_html"), // For PDF/script files - stores formatted HTML content
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const insertCmsLessonFileSchema = createInsertSchema(cmsLessonFiles).omit({
  id: true,
  createdAt: true,
});

export type InsertCmsLessonFile = z.infer<typeof insertCmsLessonFileSchema>;
export type CmsLessonFile = typeof cmsLessonFiles.$inferSelect;

// Frontend Feature Mapping Tables
export const frontendFeatures = pgTable("frontend_features", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  displayName: text("display_name").notNull(),
  displayMode: text("display_mode").notNull(), // 'modules' | 'lessons' | 'courses'
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const insertFrontendFeatureSchema = createInsertSchema(frontendFeatures).omit({
  id: true,
  createdAt: true,
});

export type InsertFrontendFeature = z.infer<typeof insertFrontendFeatureSchema>;
export type FrontendFeature = typeof frontendFeatures.$inferSelect;

export const featureCourseMap = pgTable("feature_course_map", {
  id: serial("id").primaryKey(),
  featureId: integer("feature_id").notNull().references(() => frontendFeatures.id, { onDelete: 'cascade' }),
  courseId: integer("course_id").notNull().references(() => cmsCourses.id, { onDelete: 'cascade' }),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const insertFeatureCourseMapSchema = createInsertSchema(featureCourseMap).omit({
  id: true,
  createdAt: true,
});

export type InsertFeatureCourseMap = z.infer<typeof insertFeatureCourseMapSchema>;
export type FeatureCourseMap = typeof featureCourseMap.$inferSelect;

// Money Calendar Table
export const moneyEntries = pgTable("money_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  entryDate: date("entry_date", { mode: "string" }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
}, (table) => ({
  uniqueUserDate: unique("unique_user_date").on(table.userId, table.entryDate),
}));

export const insertMoneyEntrySchema = createInsertSchema(moneyEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMoneyEntry = z.infer<typeof insertMoneyEntrySchema>;
export type MoneyEntry = typeof moneyEntries.$inferSelect;

// User Playlists Tables
export const playlists = pgTable("playlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const insertPlaylistSchema = createInsertSchema(playlists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type Playlist = typeof playlists.$inferSelect;

export const playlistItems = pgTable("playlist_items", {
  id: serial("id").primaryKey(),
  playlistId: integer("playlist_id").notNull().references(() => playlists.id, { onDelete: 'cascade' }),
  lessonId: integer("lesson_id").notNull().references(() => cmsLessons.id, { onDelete: 'cascade' }),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
}, (table) => ({
  uniquePlaylistLesson: unique("unique_playlist_lesson").on(table.playlistId, table.lessonId),
}));

export const insertPlaylistItemSchema = createInsertSchema(playlistItems).omit({
  id: true,
  createdAt: true,
});

export type InsertPlaylistItem = z.infer<typeof insertPlaylistItemSchema>;
export type PlaylistItem = typeof playlistItems.$inferSelect;

// Session Banners Table
export const sessionBanners = pgTable("session_banners", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 20 }).notNull(), // "session" | "advertisement"
  thumbnailKey: text("thumbnail_key"),
  videoKey: text("video_key"),
  posterKey: text("poster_key"),
  ctaText: text("cta_text"),
  ctaLink: text("cta_link"),
  startAt: timestamp("start_at", { mode: "date" }).notNull(),
  endAt: timestamp("end_at", { mode: "date" }).notNull(),
  liveEnabled: boolean("live_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const insertSessionBannerSchema = createInsertSchema(sessionBanners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSessionBanner = z.infer<typeof insertSessionBannerSchema>;
export type SessionBanner = typeof sessionBanners.$inferSelect;

// User Streaks Table - tracks daily app activity for streak calculation
export const userStreaks = pgTable("user_streaks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  activityDate: varchar("activity_date", { length: 10 }).notNull(), // YYYY-MM-DD format
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
}, (table) => ({
  uniqueUserActivityDate: unique("unique_user_activity_date").on(table.userId, table.activityDate),
}));

export const insertUserStreakSchema = createInsertSchema(userStreaks).omit({
  id: true,
  createdAt: true,
});

export type InsertUserStreak = z.infer<typeof insertUserStreakSchema>;
export type UserStreak = typeof userStreaks.$inferSelect;

// Activity Logs Table - tracks user practice activity for AI Insights
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  lessonId: integer("lesson_id").notNull(),
  lessonName: varchar("lesson_name", { length: 255 }).notNull(),
  featureType: varchar("feature_type", { length: 50 }).notNull(), // 'PROCESS' | 'BREATH' | 'CHECKLIST'
  activityDate: varchar("activity_date", { length: 10 }).notNull(), // YYYY-MM-DD format
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
}, (table) => ({
  uniqueUserLessonFeatureDate: unique("unique_user_lesson_feature_date").on(
    table.userId, 
    table.lessonId, 
    table.featureType, 
    table.activityDate
  ),
}));

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

export const featureTypeEnum = ["PROCESS", "BREATH", "CHECKLIST"] as const;
export type FeatureType = typeof featureTypeEnum[number];
