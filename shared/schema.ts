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
