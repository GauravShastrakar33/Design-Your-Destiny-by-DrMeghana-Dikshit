var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  activityLogs: () => activityLogs,
  articles: () => articles,
  badgeKeyEnum: () => badgeKeyEnum,
  categories: () => categories,
  cmsCourses: () => cmsCourses,
  cmsLessonFiles: () => cmsLessonFiles,
  cmsLessons: () => cmsLessons,
  cmsModuleFolders: () => cmsModuleFolders,
  cmsModules: () => cmsModules,
  communitySessions: () => communitySessions,
  dailyQuotes: () => dailyQuotes,
  deviceTokens: () => deviceTokens,
  drmMessageSchema: () => drmMessageSchema,
  drmQuestionStatusEnum: () => drmQuestionStatusEnum,
  drmQuestions: () => drmQuestions,
  eventStatusEnum: () => eventStatusEnum,
  events: () => events,
  featureCourseMap: () => featureCourseMap,
  featureTypeEnum: () => featureTypeEnum,
  frontendFeatures: () => frontendFeatures,
  insertActivityLogSchema: () => insertActivityLogSchema,
  insertArticleSchema: () => insertArticleSchema,
  insertCategorySchema: () => insertCategorySchema,
  insertCmsCourseSchema: () => insertCmsCourseSchema,
  insertCmsLessonFileSchema: () => insertCmsLessonFileSchema,
  insertCmsLessonSchema: () => insertCmsLessonSchema,
  insertCmsModuleFolderSchema: () => insertCmsModuleFolderSchema,
  insertCmsModuleSchema: () => insertCmsModuleSchema,
  insertCommunitySessionSchema: () => insertCommunitySessionSchema,
  insertDailyQuoteSchema: () => insertDailyQuoteSchema,
  insertDeviceTokenSchema: () => insertDeviceTokenSchema,
  insertDrmQuestionSchema: () => insertDrmQuestionSchema,
  insertEventSchema: () => insertEventSchema,
  insertFeatureCourseMapSchema: () => insertFeatureCourseMapSchema,
  insertFrontendFeatureSchema: () => insertFrontendFeatureSchema,
  insertMoneyEntrySchema: () => insertMoneyEntrySchema,
  insertNotificationLogSchema: () => insertNotificationLogSchema,
  insertNotificationSchema: () => insertNotificationSchema,
  insertPlaylistItemSchema: () => insertPlaylistItemSchema,
  insertPlaylistSchema: () => insertPlaylistSchema,
  insertPohActionSchema: () => insertPohActionSchema,
  insertPohDailyRatingSchema: () => insertPohDailyRatingSchema,
  insertPohMilestoneSchema: () => insertPohMilestoneSchema,
  insertProgramSchema: () => insertProgramSchema,
  insertProjectOfHeartSchema: () => insertProjectOfHeartSchema,
  insertRewiringBeliefSchema: () => insertRewiringBeliefSchema,
  insertSessionBannerSchema: () => insertSessionBannerSchema,
  insertUserBadgeSchema: () => insertUserBadgeSchema,
  insertUserProgramSchema: () => insertUserProgramSchema,
  insertUserSchema: () => insertUserSchema,
  insertUserStreakSchema: () => insertUserStreakSchema,
  insertUserWellnessProfileSchema: () => insertUserWellnessProfileSchema,
  lessonFileTypeEnum: () => lessonFileTypeEnum,
  moneyEntries: () => moneyEntries,
  notificationLogStatusEnum: () => notificationLogStatusEnum,
  notificationLogs: () => notificationLogs,
  notificationTypeEnum: () => notificationTypeEnum,
  notifications: () => notifications,
  playlistItems: () => playlistItems,
  playlists: () => playlists,
  pohActions: () => pohActions,
  pohCategoryEnum: () => pohCategoryEnum,
  pohDailyRatings: () => pohDailyRatings,
  pohMilestones: () => pohMilestones,
  pohStatusEnum: () => pohStatusEnum,
  programs: () => programs,
  projectOfHearts: () => projectOfHearts,
  rewiringBeliefs: () => rewiringBeliefs,
  sessionBanners: () => sessionBanners,
  userBadges: () => userBadges,
  userPrograms: () => userPrograms,
  userStreaks: () => userStreaks,
  userWellnessProfiles: () => userWellnessProfiles,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, serial, timestamp, date, numeric, unique, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users, insertUserSchema, communitySessions, insertCommunitySessionSchema, drmMessageSchema, categories, insertCategorySchema, articles, insertArticleSchema, programs, insertProgramSchema, userPrograms, insertUserProgramSchema, cmsCourses, insertCmsCourseSchema, cmsModules, insertCmsModuleSchema, cmsModuleFolders, insertCmsModuleFolderSchema, cmsLessons, insertCmsLessonSchema, lessonFileTypeEnum, cmsLessonFiles, insertCmsLessonFileSchema, frontendFeatures, insertFrontendFeatureSchema, featureCourseMap, insertFeatureCourseMapSchema, moneyEntries, insertMoneyEntrySchema, playlists, insertPlaylistSchema, playlistItems, insertPlaylistItemSchema, sessionBanners, insertSessionBannerSchema, userStreaks, insertUserStreakSchema, activityLogs, insertActivityLogSchema, featureTypeEnum, dailyQuotes, insertDailyQuoteSchema, rewiringBeliefs, insertRewiringBeliefSchema, userWellnessProfiles, insertUserWellnessProfileSchema, eventStatusEnum, events, insertEventSchema, notificationTypeEnum, notificationLogStatusEnum, notifications, insertNotificationSchema, notificationLogs, insertNotificationLogSchema, pohCategoryEnum, pohStatusEnum, projectOfHearts, insertProjectOfHeartSchema, pohDailyRatings, insertPohDailyRatingSchema, pohActions, insertPohActionSchema, pohMilestones, insertPohMilestoneSchema, deviceTokens, insertDeviceTokenSchema, userBadges, badgeKeyEnum, insertUserBadgeSchema, drmQuestionStatusEnum, drmQuestions, insertDrmQuestionSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    users = pgTable("users", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 150 }).notNull(),
      email: varchar("email", { length: 150 }).notNull().unique(),
      phone: varchar("phone", { length: 20 }),
      passwordHash: varchar("password_hash", { length: 255 }).notNull(),
      role: varchar("role", { length: 20 }).notNull().default("USER"),
      status: varchar("status", { length: 20 }).notNull().default("active"),
      lastLogin: timestamp("last_login", { mode: "date" }),
      lastActivity: timestamp("last_activity", { mode: "date" }),
      createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
    });
    insertUserSchema = createInsertSchema(users).omit({
      id: true,
      lastLogin: true,
      lastActivity: true,
      createdAt: true
    });
    communitySessions = pgTable("community_sessions", {
      id: serial("id").primaryKey(),
      title: text("title").notNull(),
      time: text("time").notNull(),
      displayTime: text("display_time").notNull(),
      meetingLink: text("meeting_link").notNull(),
      participants: integer("participants").notNull().default(0),
      isActive: boolean("is_active").notNull().default(true)
    });
    insertCommunitySessionSchema = createInsertSchema(communitySessions).omit({
      id: true
    });
    drmMessageSchema = z.object({
      id: z.string(),
      question: z.string(),
      userName: z.string().optional(),
      videoUrl: z.string(),
      subtitlesUrl: z.string().optional(),
      textResponse: z.string(),
      timestamp: z.number()
    });
    categories = pgTable("categories", {
      id: serial("id").primaryKey(),
      name: text("name").notNull().unique()
    });
    insertCategorySchema = createInsertSchema(categories).omit({
      id: true
    });
    articles = pgTable("articles", {
      id: serial("id").primaryKey(),
      title: text("title").notNull(),
      categoryId: integer("category_id").notNull(),
      imageUrl: text("image_url").notNull(),
      content: text("content").notNull(),
      isPublished: boolean("is_published").notNull().default(false),
      createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
    });
    insertArticleSchema = createInsertSchema(articles).omit({
      id: true,
      createdAt: true
    });
    programs = pgTable("programs", {
      id: serial("id").primaryKey(),
      code: varchar("code", { length: 10 }).notNull().unique(),
      name: varchar("name", { length: 150 }).notNull(),
      level: integer("level").notNull(),
      isActive: boolean("is_active").notNull().default(true),
      deletedAt: timestamp("deleted_at", { mode: "date" }),
      createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
      updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
    });
    insertProgramSchema = createInsertSchema(programs).omit({
      id: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true
    });
    userPrograms = pgTable("user_programs", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      programId: integer("program_id").notNull().references(() => programs.id, { onDelete: "cascade" })
    });
    insertUserProgramSchema = createInsertSchema(userPrograms).omit({
      id: true
    });
    cmsCourses = pgTable("cms_courses", {
      id: serial("id").primaryKey(),
      title: text("title").notNull(),
      programId: integer("program_id").references(() => programs.id, { onDelete: "set null" }),
      description: text("description"),
      thumbnailKey: text("thumbnail_key"),
      isPublished: boolean("is_published").notNull().default(false),
      createdByAdminId: integer("created_by_admin_id").references(() => users.id),
      position: integer("position").notNull().default(0),
      createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
      updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
    });
    insertCmsCourseSchema = createInsertSchema(cmsCourses).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    cmsModules = pgTable("cms_modules", {
      id: serial("id").primaryKey(),
      courseId: integer("course_id").notNull().references(() => cmsCourses.id, { onDelete: "cascade" }),
      title: text("title").notNull(),
      position: integer("position").notNull().default(0),
      createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
      updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
    });
    insertCmsModuleSchema = createInsertSchema(cmsModules).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    cmsModuleFolders = pgTable("cms_module_folders", {
      id: serial("id").primaryKey(),
      moduleId: integer("module_id").notNull().references(() => cmsModules.id, { onDelete: "cascade" }),
      title: text("title").notNull(),
      position: integer("position").notNull().default(0),
      createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
      updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
    });
    insertCmsModuleFolderSchema = createInsertSchema(cmsModuleFolders).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    cmsLessons = pgTable("cms_lessons", {
      id: serial("id").primaryKey(),
      moduleId: integer("module_id").notNull().references(() => cmsModules.id, { onDelete: "cascade" }),
      folderId: integer("folder_id").references(() => cmsModuleFolders.id, { onDelete: "set null" }),
      title: text("title").notNull(),
      description: text("description"),
      position: integer("position").notNull().default(0),
      createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
      updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
    });
    insertCmsLessonSchema = createInsertSchema(cmsLessons).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    lessonFileTypeEnum = ["video", "audio", "script"];
    cmsLessonFiles = pgTable("cms_lesson_files", {
      id: serial("id").primaryKey(),
      lessonId: integer("lesson_id").notNull().references(() => cmsLessons.id, { onDelete: "cascade" }),
      fileType: text("file_type").notNull(),
      // 'video', 'audio', 'script'
      r2Key: text("r2_key").notNull(),
      publicUrl: text("public_url"),
      sizeMb: integer("size_mb"),
      durationSec: integer("duration_sec"),
      extractedText: text("extracted_text"),
      // For PDF/script files - stores extracted text content
      scriptHtml: text("script_html"),
      // For PDF/script files - stores formatted HTML content
      position: integer("position").notNull().default(0),
      createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
    });
    insertCmsLessonFileSchema = createInsertSchema(cmsLessonFiles).omit({
      id: true,
      createdAt: true
    });
    frontendFeatures = pgTable("frontend_features", {
      id: serial("id").primaryKey(),
      code: text("code").notNull().unique(),
      displayName: text("display_name").notNull(),
      displayMode: text("display_mode").notNull(),
      // 'modules' | 'lessons' | 'courses'
      createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
    });
    insertFrontendFeatureSchema = createInsertSchema(frontendFeatures).omit({
      id: true,
      createdAt: true
    });
    featureCourseMap = pgTable("feature_course_map", {
      id: serial("id").primaryKey(),
      featureId: integer("feature_id").notNull().references(() => frontendFeatures.id, { onDelete: "cascade" }),
      courseId: integer("course_id").notNull().references(() => cmsCourses.id, { onDelete: "cascade" }),
      position: integer("position").notNull().default(0),
      createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
    });
    insertFeatureCourseMapSchema = createInsertSchema(featureCourseMap).omit({
      id: true,
      createdAt: true
    });
    moneyEntries = pgTable("money_entries", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      entryDate: date("entry_date", { mode: "string" }).notNull(),
      amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"),
      createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
      updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
    }, (table) => ({
      uniqueUserDate: unique("unique_user_date").on(table.userId, table.entryDate)
    }));
    insertMoneyEntrySchema = createInsertSchema(moneyEntries).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    playlists = pgTable("playlists", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      title: text("title").notNull(),
      createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
      updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
    });
    insertPlaylistSchema = createInsertSchema(playlists).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    playlistItems = pgTable("playlist_items", {
      id: serial("id").primaryKey(),
      playlistId: integer("playlist_id").notNull().references(() => playlists.id, { onDelete: "cascade" }),
      lessonId: integer("lesson_id").notNull().references(() => cmsLessons.id, { onDelete: "cascade" }),
      position: integer("position").notNull().default(0),
      createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
    }, (table) => ({
      uniquePlaylistLesson: unique("unique_playlist_lesson").on(table.playlistId, table.lessonId)
    }));
    insertPlaylistItemSchema = createInsertSchema(playlistItems).omit({
      id: true,
      createdAt: true
    });
    sessionBanners = pgTable("session_banners", {
      id: serial("id").primaryKey(),
      type: varchar("type", { length: 20 }).notNull(),
      // "session" | "advertisement"
      thumbnailKey: text("thumbnail_key"),
      videoKey: text("video_key"),
      posterKey: text("poster_key"),
      ctaText: text("cta_text"),
      ctaLink: text("cta_link"),
      startAt: timestamp("start_at", { mode: "date" }).notNull(),
      endAt: timestamp("end_at", { mode: "date" }).notNull(),
      liveEnabled: boolean("live_enabled").notNull().default(false),
      liveStartAt: timestamp("live_start_at", { mode: "date" }),
      liveEndAt: timestamp("live_end_at", { mode: "date" }),
      createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
      updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
    });
    insertSessionBannerSchema = createInsertSchema(sessionBanners).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    userStreaks = pgTable("user_streaks", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      activityDate: varchar("activity_date", { length: 10 }).notNull(),
      // YYYY-MM-DD format
      createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
    }, (table) => ({
      uniqueUserActivityDate: unique("unique_user_activity_date").on(table.userId, table.activityDate)
    }));
    insertUserStreakSchema = createInsertSchema(userStreaks).omit({
      id: true,
      createdAt: true
    });
    activityLogs = pgTable("activity_logs", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      lessonId: integer("lesson_id").notNull(),
      lessonName: varchar("lesson_name", { length: 255 }).notNull(),
      featureType: varchar("feature_type", { length: 50 }).notNull(),
      // 'PROCESS' | 'BREATH' | 'CHECKLIST'
      activityDate: varchar("activity_date", { length: 10 }).notNull(),
      // YYYY-MM-DD format
      createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
    }, (table) => ({
      uniqueUserLessonFeatureDate: unique("unique_user_lesson_feature_date").on(
        table.userId,
        table.lessonId,
        table.featureType,
        table.activityDate
      )
    }));
    insertActivityLogSchema = createInsertSchema(activityLogs).omit({
      id: true,
      createdAt: true
    });
    featureTypeEnum = ["PROCESS", "BREATH", "CHECKLIST"];
    dailyQuotes = pgTable("daily_quotes", {
      id: serial("id").primaryKey(),
      quoteText: text("quote_text").notNull(),
      author: text("author"),
      isActive: boolean("is_active").notNull().default(true),
      displayOrder: integer("display_order").notNull(),
      lastShownDate: varchar("last_shown_date", { length: 10 }),
      // YYYY-MM-DD format
      createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
      updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
    });
    insertDailyQuoteSchema = createInsertSchema(dailyQuotes).omit({
      id: true,
      lastShownDate: true,
      createdAt: true,
      updatedAt: true
    });
    rewiringBeliefs = pgTable("rewiring_beliefs", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      limitingBelief: text("limiting_belief").notNull(),
      upliftingBelief: text("uplifting_belief").notNull(),
      createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
      updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
    });
    insertRewiringBeliefSchema = createInsertSchema(rewiringBeliefs).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    userWellnessProfiles = pgTable("user_wellness_profiles", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
      karmicAffirmation: text("karmic_affirmation"),
      prescription: jsonb("prescription"),
      createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
      updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
    });
    insertUserWellnessProfileSchema = createInsertSchema(userWellnessProfiles).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    eventStatusEnum = z.enum(["DRAFT", "UPCOMING", "COMPLETED", "CANCELLED"]);
    events = pgTable("events", {
      id: serial("id").primaryKey(),
      title: text("title").notNull(),
      description: text("description"),
      coachName: varchar("coach_name", { length: 150 }),
      thumbnailUrl: text("thumbnail_url"),
      startDatetime: timestamp("start_datetime", { mode: "date" }).notNull(),
      endDatetime: timestamp("end_datetime", { mode: "date" }).notNull(),
      joinUrl: text("join_url"),
      recordingUrl: text("recording_url"),
      recordingPasscode: varchar("recording_passcode", { length: 50 }),
      showRecording: boolean("show_recording").notNull().default(false),
      recordingSkipped: boolean("recording_skipped").notNull().default(false),
      recordingExpiryDate: date("recording_expiry_date", { mode: "string" }),
      requiredProgramCode: varchar("required_program_code", { length: 10 }).notNull().default("USB"),
      requiredProgramLevel: integer("required_program_level").notNull().default(1),
      status: varchar("status", { length: 20 }).notNull().default("DRAFT"),
      createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
      updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
    });
    insertEventSchema = createInsertSchema(events).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      startDatetime: z.coerce.date(),
      endDatetime: z.coerce.date(),
      // recordingExpiryDate is mode: "string" in DB, so keep as string (YYYY-MM-DD format)
      recordingExpiryDate: z.string().nullable().optional()
    });
    notificationTypeEnum = z.enum(["system", "event_reminder", "admin_test", "drm_answer"]);
    notificationLogStatusEnum = z.enum(["sent", "failed"]);
    notifications = pgTable("notifications", {
      id: serial("id").primaryKey(),
      title: text("title").notNull(),
      body: text("body").notNull(),
      type: varchar("type", { length: 20 }).notNull().default("system"),
      scheduledAt: timestamp("scheduled_at", { mode: "date" }).notNull(),
      requiredProgramCode: varchar("required_program_code", { length: 10 }).notNull(),
      requiredProgramLevel: integer("required_program_level").notNull(),
      relatedEventId: integer("related_event_id").references(() => events.id, { onDelete: "cascade" }),
      sent: boolean("sent").notNull().default(false),
      sentAt: timestamp("sent_at", { mode: "date" }),
      createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
    });
    insertNotificationSchema = createInsertSchema(notifications).omit({
      id: true,
      sent: true,
      sentAt: true,
      createdAt: true
    }).extend({
      scheduledAt: z.coerce.date()
    });
    notificationLogs = pgTable("notification_logs", {
      id: serial("id").primaryKey(),
      notificationId: integer("notification_id").notNull().references(() => notifications.id, { onDelete: "cascade" }),
      userId: integer("user_id").notNull(),
      deviceToken: text("device_token").notNull(),
      status: varchar("status", { length: 20 }).notNull(),
      error: text("error"),
      createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
    });
    insertNotificationLogSchema = createInsertSchema(notificationLogs).omit({
      id: true,
      createdAt: true
    });
    pohCategoryEnum = z.enum(["career", "health", "relationships", "wealth"]);
    pohStatusEnum = z.enum(["active", "next", "horizon", "completed", "closed_early"]);
    projectOfHearts = pgTable("project_of_hearts", {
      id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
      userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      title: text("title").notNull(),
      why: text("why").notNull(),
      category: varchar("category", { length: 32 }).notNull(),
      status: varchar("status", { length: 20 }).notNull(),
      startedAt: date("started_at", { mode: "string" }),
      endedAt: date("ended_at", { mode: "string" }),
      closingReflection: text("closing_reflection"),
      visionImages: text("vision_images").array().default([]),
      createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
      updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
    });
    insertProjectOfHeartSchema = createInsertSchema(projectOfHearts).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      title: z.string().min(1).max(120),
      why: z.string().min(1).max(500),
      category: pohCategoryEnum,
      status: pohStatusEnum
    });
    pohDailyRatings = pgTable("poh_daily_ratings", {
      id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
      userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      pohId: varchar("poh_id", { length: 36 }).notNull().references(() => projectOfHearts.id, { onDelete: "cascade" }),
      localDate: date("local_date", { mode: "string" }).notNull(),
      rating: integer("rating").notNull(),
      createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
    }, (table) => [
      unique("one_rating_per_day").on(table.userId, table.localDate)
    ]);
    insertPohDailyRatingSchema = createInsertSchema(pohDailyRatings).omit({
      id: true,
      createdAt: true
    }).extend({
      rating: z.number().int().min(0).max(10)
    });
    pohActions = pgTable("poh_actions", {
      id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
      pohId: varchar("poh_id", { length: 36 }).notNull().references(() => projectOfHearts.id, { onDelete: "cascade" }),
      text: text("text").notNull(),
      orderIndex: integer("order_index").notNull(),
      createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
      updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
    });
    insertPohActionSchema = createInsertSchema(pohActions).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    pohMilestones = pgTable("poh_milestones", {
      id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
      pohId: varchar("poh_id", { length: 36 }).notNull().references(() => projectOfHearts.id, { onDelete: "cascade" }),
      text: text("text").notNull(),
      achieved: boolean("achieved").notNull().default(false),
      achievedAt: date("achieved_at", { mode: "string" }),
      orderIndex: integer("order_index").notNull(),
      createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
    });
    insertPohMilestoneSchema = createInsertSchema(pohMilestones).omit({
      id: true,
      achieved: true,
      achievedAt: true,
      createdAt: true
    }).extend({
      text: z.string().min(1).max(200)
    });
    deviceTokens = pgTable("device_tokens", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      token: text("token").notNull().unique(),
      platform: varchar("platform", { length: 10 }).notNull().default("web"),
      createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
    });
    insertDeviceTokenSchema = createInsertSchema(deviceTokens).omit({
      id: true,
      createdAt: true
    });
    userBadges = pgTable("user_badges", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      badgeKey: varchar("badge_key", { length: 50 }).notNull(),
      earnedAt: timestamp("earned_at", { mode: "date" }).notNull().defaultNow(),
      metadata: jsonb("metadata"),
      notified: boolean("notified").notNull().default(false)
    }, (table) => ({
      uniqueUserBadge: unique("unique_user_badge").on(table.userId, table.badgeKey)
    }));
    badgeKeyEnum = z.enum([
      // Core streak badges
      "day_zero",
      "spark",
      "pulse",
      "anchor",
      "aligned",
      "disciplined",
      "unstoppable",
      "integrated",
      "titan",
      // Meta badges
      "resilient",
      "relentless",
      // Admin badges
      "ambassador",
      "hall_of_fame"
    ]);
    insertUserBadgeSchema = createInsertSchema(userBadges).omit({
      id: true,
      earnedAt: true
    }).extend({
      badgeKey: badgeKeyEnum
    });
    drmQuestionStatusEnum = z.enum(["PENDING", "ANSWERED"]);
    drmQuestions = pgTable("drm_questions", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      questionText: varchar("question_text", { length: 240 }).notNull(),
      askedAt: timestamp("asked_at", { mode: "date" }).notNull().defaultNow(),
      monthYear: varchar("month_year", { length: 7 }).notNull(),
      status: varchar("status", { length: 20 }).notNull().default("PENDING"),
      audioR2Key: text("audio_r2_key"),
      answeredAt: timestamp("answered_at", { mode: "date" })
    }, (table) => ({
      uniqueUserMonth: unique("unique_user_month_question").on(table.userId, table.monthYear)
    }));
    insertDrmQuestionSchema = createInsertSchema(drmQuestions).omit({
      id: true,
      askedAt: true,
      status: true,
      audioR2Key: true,
      answeredAt: true
    }).extend({
      questionText: z.string().min(1).max(240)
    });
  }
});

// server/db.ts
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
var pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    neonConfig.webSocketConstructor = ws;
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool, { schema: schema_exports });
  }
});

// server/storage.ts
import { eq, ilike, and, or, inArray, sql as sql2, count, asc, desc } from "drizzle-orm";
var DbStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    init_db();
    DbStorage = class {
      async getUser(id) {
        const user = await db.query.users.findFirst({
          where: (users2, { eq: eq3 }) => eq3(users2.id, parseInt(id))
        });
        return user;
      }
      async getUserByUsername(username) {
        const user = await db.query.users.findFirst({
          where: (users2, { eq: eq3 }) => eq3(users2.email, username)
        });
        return user;
      }
      async getUserByEmail(email) {
        const user = await db.query.users.findFirst({
          where: (users2, { eq: eq3 }) => eq3(users2.email, email)
        });
        return user;
      }
      async getUserById(id) {
        const user = await db.query.users.findFirst({
          where: (users2, { eq: eq3 }) => eq3(users2.id, id)
        });
        return user;
      }
      async createUser(insertUser) {
        const [user] = await db.insert(users).values(insertUser).returning();
        return user;
      }
      async updateUserLastLogin(id) {
        await db.update(users).set({ lastLogin: /* @__PURE__ */ new Date() }).where(eq(users.id, id));
      }
      async updateUserPassword(id, hashedPassword) {
        await db.update(users).set({ passwordHash: hashedPassword }).where(eq(users.id, id));
      }
      async updateUserName(id, name) {
        const [user] = await db.update(users).set({ name }).where(eq(users.id, id)).returning();
        return user;
      }
      async getAllCommunitySessions() {
        return await db.query.communitySessions.findMany({
          orderBy: (sessions, { asc: asc3 }) => [asc3(sessions.time)]
        });
      }
      async getCommunitySession(id) {
        return await db.query.communitySessions.findFirst({
          where: (sessions, { eq: eq3 }) => eq3(sessions.id, id)
        });
      }
      async createCommunitySession(session) {
        const [newSession] = await db.insert(communitySessions).values(session).returning();
        return newSession;
      }
      async updateCommunitySession(id, session) {
        const [updated] = await db.update(communitySessions).set(session).where(eq(communitySessions.id, id)).returning();
        return updated;
      }
      async deleteCommunitySession(id) {
        const result = await db.delete(communitySessions).where(eq(communitySessions.id, id)).returning();
        return result.length > 0;
      }
      async getAllCategories() {
        return await db.query.categories.findMany({
          orderBy: (categories2, { asc: asc3 }) => [asc3(categories2.name)]
        });
      }
      async getCategory(id) {
        return await db.query.categories.findFirst({
          where: (categories2, { eq: eq3 }) => eq3(categories2.id, id)
        });
      }
      async createCategory(category) {
        const [newCategory] = await db.insert(categories).values(category).returning();
        return newCategory;
      }
      async getAllArticles() {
        return await db.query.articles.findMany({
          orderBy: (articles2, { desc: desc3 }) => [desc3(articles2.createdAt)]
        });
      }
      async getPublishedArticles() {
        return await db.query.articles.findMany({
          where: (articles2, { eq: eq3 }) => eq3(articles2.isPublished, true),
          orderBy: (articles2, { desc: desc3 }) => [desc3(articles2.createdAt)]
        });
      }
      async getArticle(id) {
        return await db.query.articles.findFirst({
          where: (articles2, { eq: eq3 }) => eq3(articles2.id, id)
        });
      }
      async createArticle(article) {
        const [newArticle] = await db.insert(articles).values(article).returning();
        return newArticle;
      }
      async updateArticle(id, article) {
        const [updated] = await db.update(articles).set(article).where(eq(articles.id, id)).returning();
        return updated;
      }
      async deleteArticle(id) {
        const result = await db.delete(articles).where(eq(articles.id, id)).returning();
        return result.length > 0;
      }
      async getAllPrograms() {
        return await db.query.programs.findMany({
          orderBy: (programs2, { asc: asc3 }) => [asc3(programs2.code)]
        });
      }
      async getProgramByCode(code) {
        return await db.query.programs.findFirst({
          where: (programs2, { eq: eq3 }) => eq3(programs2.code, code)
        });
      }
      async getProgramById(id) {
        return await db.query.programs.findFirst({
          where: (programs2, { eq: eq3 }) => eq3(programs2.id, id)
        });
      }
      async createProgram(program) {
        const [newProgram] = await db.insert(programs).values(program).returning();
        return newProgram;
      }
      async getUserPrograms(userId) {
        const userProgramLinks = await db.select().from(userPrograms).where(eq(userPrograms.userId, userId));
        if (userProgramLinks.length === 0) return [];
        const programIds = userProgramLinks.map((up) => up.programId);
        const programs2 = await db.select().from(programs).where(inArray(programs.id, programIds));
        return programs2.map((p) => p.code);
      }
      async assignUserProgram(userId, programId) {
        await db.insert(userPrograms).values({ userId, programId });
      }
      async clearUserPrograms(userId) {
        await db.delete(userPrograms).where(eq(userPrograms.userId, userId));
      }
      async getStudents(params) {
        const { search = "", programCode = "ALL", page = 1, limit = 20 } = params;
        const offset = (page - 1) * limit;
        let userIdsFilter = null;
        if (programCode && programCode !== "ALL") {
          const program = await this.getProgramByCode(programCode);
          if (program) {
            const userProgramLinks = await db.select().from(userPrograms).where(eq(userPrograms.programId, program.id));
            userIdsFilter = userProgramLinks.map((up) => up.userId);
            if (userIdsFilter.length === 0) {
              return { data: [], pagination: { total: 0, page: 1, pages: 1 } };
            }
          }
        }
        const conditions = [eq(users.role, "USER")];
        if (search) {
          conditions.push(
            or(
              ilike(users.name, `%${search}%`),
              ilike(users.email, `%${search}%`)
            )
          );
        }
        if (userIdsFilter) {
          conditions.push(inArray(users.id, userIdsFilter));
        }
        const totalResult = await db.select({ count: count() }).from(users).where(and(...conditions));
        const total = totalResult[0]?.count || 0;
        const students = await db.select().from(users).where(and(...conditions)).orderBy(users.createdAt).limit(limit).offset(offset);
        const studentsWithPrograms = await Promise.all(
          students.map(async (student) => {
            const programs2 = await this.getUserPrograms(student.id);
            return { ...student, programs: programs2 };
          })
        );
        return {
          data: studentsWithPrograms,
          pagination: {
            total,
            page,
            pages: Math.ceil(total / limit) || 1
          }
        };
      }
      async getStudentById(id) {
        const student = await db.query.users.findFirst({
          where: (users2, { eq: eq3, and: and3 }) => and3(eq3(users2.id, id), eq3(users2.role, "USER"))
        });
        if (!student) return void 0;
        const programs2 = await this.getUserPrograms(id);
        return { ...student, programs: programs2 };
      }
      async createStudent(student, programCode) {
        const [newStudent] = await db.insert(users).values({
          ...student,
          role: "USER",
          status: student.status || "active"
        }).returning();
        if (programCode) {
          const program = await this.getProgramByCode(programCode);
          if (program) {
            await this.assignUserProgram(newStudent.id, program.id);
          }
        }
        return newStudent;
      }
      async updateStudent(id, student, programCode) {
        const [updated] = await db.update(users).set(student).where(eq(users.id, id)).returning();
        if (programCode) {
          await this.clearUserPrograms(id);
          const program = await this.getProgramByCode(programCode);
          if (program) {
            await this.assignUserProgram(id, program.id);
          }
        }
        return updated;
      }
      async updateStudentStatus(id, status) {
        const [updated] = await db.update(users).set({ status }).where(eq(users.id, id)).returning();
        return updated;
      }
      async deleteStudent(id) {
        await this.clearUserPrograms(id);
        const result = await db.delete(users).where(eq(users.id, id)).returning();
        return result.length > 0;
      }
      // ===== ADMIN MANAGEMENT =====
      async getAdmins(params) {
        const { search = "", page = 1, limit = 20 } = params;
        const offset = (page - 1) * limit;
        const conditions = [
          or(
            eq(users.role, "SUPER_ADMIN"),
            eq(users.role, "COACH")
          )
        ];
        if (search) {
          conditions.push(
            or(
              ilike(users.name, `%${search}%`),
              ilike(users.email, `%${search}%`)
            )
          );
        }
        const totalResult = await db.select({ count: count() }).from(users).where(and(...conditions));
        const total = totalResult[0]?.count || 0;
        const admins = await db.select().from(users).where(and(...conditions)).orderBy(users.createdAt).limit(limit).offset(offset);
        return {
          data: admins,
          pagination: {
            total,
            page,
            pages: Math.ceil(total / limit) || 1
          }
        };
      }
      async getAdminById(id) {
        return await db.query.users.findFirst({
          where: (users2, { eq: eq3, and: and3, or: or3 }) => and3(
            eq3(users2.id, id),
            or3(eq3(users2.role, "SUPER_ADMIN"), eq3(users2.role, "COACH"))
          )
        });
      }
      async createAdmin(admin2) {
        const [newAdmin] = await db.insert(users).values({
          ...admin2,
          status: admin2.status || "active"
        }).returning();
        return newAdmin;
      }
      async updateAdmin(id, admin2) {
        const [updated] = await db.update(users).set(admin2).where(eq(users.id, id)).returning();
        return updated;
      }
      async updateAdminStatus(id, status) {
        const [updated] = await db.update(users).set({ status }).where(eq(users.id, id)).returning();
        return updated;
      }
      async deleteAdmin(id) {
        const result = await db.delete(users).where(eq(users.id, id)).returning();
        return result.length > 0;
      }
      // ===== FRONTEND FEATURE MAPPING =====
      async getAllFrontendFeatures() {
        return await db.select().from(frontendFeatures).orderBy(asc(frontendFeatures.id));
      }
      async getFrontendFeatureByCode(code) {
        const result = await db.select().from(frontendFeatures).where(eq(frontendFeatures.code, code));
        return result[0];
      }
      async getFeatureCourseMappings(featureId) {
        const mappings = await db.select().from(featureCourseMap).where(eq(featureCourseMap.featureId, featureId)).orderBy(asc(featureCourseMap.position));
        const result = await Promise.all(mappings.map(async (mapping) => {
          const courseResult = await db.select({ id: cmsCourses.id, title: cmsCourses.title }).from(cmsCourses).where(eq(cmsCourses.id, mapping.courseId));
          return {
            ...mapping,
            course: courseResult[0] || { id: mapping.courseId, title: "Unknown Course" }
          };
        }));
        return result;
      }
      async createFeatureCourseMapping(mapping) {
        const [newMapping] = await db.insert(featureCourseMap).values(mapping).returning();
        return newMapping;
      }
      async deleteFeatureCourseMapping(featureId, courseId) {
        const result = await db.delete(featureCourseMap).where(and(eq(featureCourseMap.featureId, featureId), eq(featureCourseMap.courseId, courseId))).returning();
        return result.length > 0;
      }
      async clearFeatureCourseMappings(featureId) {
        await db.delete(featureCourseMap).where(eq(featureCourseMap.featureId, featureId));
      }
      async reorderFeatureCourseMappings(featureId, courseIds) {
        for (let i = 0; i < courseIds.length; i++) {
          await db.update(featureCourseMap).set({ position: i }).where(and(eq(featureCourseMap.featureId, featureId), eq(featureCourseMap.courseId, courseIds[i])));
        }
      }
      async getModulesForCourse(courseId) {
        return await db.select().from(cmsModules).where(eq(cmsModules.courseId, courseId)).orderBy(asc(cmsModules.position));
      }
      async getLessonsForCourse(courseId) {
        const modules = await db.select().from(cmsModules).where(eq(cmsModules.courseId, courseId));
        const moduleIds = modules.map((m) => m.id);
        if (moduleIds.length === 0) return [];
        return await db.select().from(cmsLessons).where(inArray(cmsLessons.moduleId, moduleIds)).orderBy(asc(cmsLessons.position));
      }
      // Money Calendar Methods
      async upsertMoneyEntry(userId, entryDate, amount) {
        const [entry] = await db.insert(moneyEntries).values({
          userId,
          entryDate,
          amount
        }).onConflictDoUpdate({
          target: [moneyEntries.userId, moneyEntries.entryDate],
          set: {
            amount,
            updatedAt: /* @__PURE__ */ new Date()
          }
        }).returning();
        return entry;
      }
      async getMoneyEntriesForMonth(userId, year, month) {
        const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
        const entries = await db.select().from(moneyEntries).where(
          and(
            eq(moneyEntries.userId, userId),
            sql2`${moneyEntries.entryDate} >= ${startDate}::date`,
            sql2`${moneyEntries.entryDate} <= ${endDate}::date`
          )
        );
        const days = {};
        let total = 0;
        let highest = 0;
        for (const entry of entries) {
          const amount = parseFloat(entry.amount);
          days[entry.entryDate] = amount;
          total += amount;
          if (amount > highest) highest = amount;
        }
        const entryCount = entries.length;
        const average = entryCount > 0 ? total / entryCount : 0;
        return {
          days,
          summary: {
            total: Math.round(total * 100) / 100,
            highest: Math.round(highest * 100) / 100,
            average: Math.round(average * 100) / 100
          }
        };
      }
      // Playlist Methods
      async getUserPlaylists(userId) {
        return await db.select().from(playlists).where(eq(playlists.userId, userId)).orderBy(desc(playlists.createdAt));
      }
      async getPlaylistById(id) {
        const [playlist] = await db.select().from(playlists).where(eq(playlists.id, id));
        return playlist;
      }
      async createPlaylist(playlist) {
        const [newPlaylist] = await db.insert(playlists).values(playlist).returning();
        return newPlaylist;
      }
      async updatePlaylist(id, title) {
        const [updated] = await db.update(playlists).set({ title, updatedAt: /* @__PURE__ */ new Date() }).where(eq(playlists.id, id)).returning();
        return updated;
      }
      async deletePlaylist(id) {
        const result = await db.delete(playlists).where(eq(playlists.id, id)).returning();
        return result.length > 0;
      }
      async getPlaylistItems(playlistId) {
        const items = await db.select().from(playlistItems).where(eq(playlistItems.playlistId, playlistId)).orderBy(asc(playlistItems.position));
        const result = await Promise.all(items.map(async (item) => {
          const [lesson] = await db.select({ id: cmsLessons.id, title: cmsLessons.title, description: cmsLessons.description }).from(cmsLessons).where(eq(cmsLessons.id, item.lessonId));
          return {
            ...item,
            lesson: lesson || { id: item.lessonId, title: "Unknown Lesson", description: null }
          };
        }));
        return result;
      }
      async setPlaylistItems(playlistId, lessonIds) {
        await db.delete(playlistItems).where(eq(playlistItems.playlistId, playlistId));
        if (lessonIds.length === 0) return [];
        const items = lessonIds.map((lessonId, index) => ({
          playlistId,
          lessonId,
          position: index
        }));
        return await db.insert(playlistItems).values(items).returning();
      }
      async reorderPlaylistItems(playlistId, orderedItemIds) {
        for (let i = 0; i < orderedItemIds.length; i++) {
          await db.update(playlistItems).set({ position: i }).where(and(eq(playlistItems.playlistId, playlistId), eq(playlistItems.id, orderedItemIds[i])));
        }
      }
      async deletePlaylistItem(playlistId, itemId) {
        const result = await db.delete(playlistItems).where(and(eq(playlistItems.playlistId, playlistId), eq(playlistItems.id, itemId))).returning();
        return result.length > 0;
      }
      async getPlaylistSourceData(courseId) {
        const [course] = await db.select().from(cmsCourses).where(eq(cmsCourses.id, courseId));
        if (!course) return null;
        const modules = await db.select().from(cmsModules).where(eq(cmsModules.courseId, courseId)).orderBy(asc(cmsModules.position));
        const modulesWithLessons = await Promise.all(modules.map(async (module) => {
          const lessons = await db.select().from(cmsLessons).where(eq(cmsLessons.moduleId, module.id)).orderBy(asc(cmsLessons.position));
          const lessonsWithAudio = await Promise.all(lessons.map(async (lesson) => {
            const audioFiles = await db.select().from(cmsLessonFiles).where(and(eq(cmsLessonFiles.lessonId, lesson.id), eq(cmsLessonFiles.fileType, "audio"))).orderBy(asc(cmsLessonFiles.position));
            if (audioFiles.length === 0) return null;
            return {
              ...lesson,
              audioFiles
            };
          }));
          const filteredLessons = lessonsWithAudio.filter((l) => l !== null);
          if (filteredLessons.length === 0) return null;
          return {
            ...module,
            lessons: filteredLessons
          };
        }));
        return {
          course,
          modules: modulesWithLessons.filter((m) => m !== null)
        };
      }
      async isLessonInMappedCourse(lessonId, featureCode) {
        const feature = await this.getFrontendFeatureByCode(featureCode);
        if (!feature) return false;
        const mappings = await this.getFeatureCourseMappings(feature.id);
        if (mappings.length === 0) return false;
        const courseId = mappings[0].courseId;
        const modules = await db.select().from(cmsModules).where(eq(cmsModules.courseId, courseId));
        const moduleIds = modules.map((m) => m.id);
        if (moduleIds.length === 0) return false;
        const [lesson] = await db.select().from(cmsLessons).where(and(eq(cmsLessons.id, lessonId), inArray(cmsLessons.moduleId, moduleIds)));
        return !!lesson;
      }
      async doesLessonHaveAudio(lessonId) {
        const audioFiles = await db.select().from(cmsLessonFiles).where(and(eq(cmsLessonFiles.lessonId, lessonId), eq(cmsLessonFiles.fileType, "audio")));
        return audioFiles.length > 0;
      }
      // ===== SESSION BANNERS =====
      async getAllSessionBanners() {
        return await db.select().from(sessionBanners).orderBy(desc(sessionBanners.startAt));
      }
      async getSessionBannerById(id) {
        const [banner] = await db.select().from(sessionBanners).where(eq(sessionBanners.id, id));
        return banner;
      }
      async createSessionBanner(banner) {
        const [newBanner] = await db.insert(sessionBanners).values(banner).returning();
        return newBanner;
      }
      async updateSessionBanner(id, banner) {
        const [updated] = await db.update(sessionBanners).set({ ...banner, updatedAt: /* @__PURE__ */ new Date() }).where(eq(sessionBanners.id, id)).returning();
        return updated;
      }
      async deleteSessionBanner(id) {
        const result = await db.delete(sessionBanners).where(eq(sessionBanners.id, id)).returning();
        return result.length > 0;
      }
      async getActiveBanner() {
        const now = /* @__PURE__ */ new Date();
        const [active] = await db.select().from(sessionBanners).where(
          and(
            sql2`${sessionBanners.startAt} <= ${now}`,
            sql2`${sessionBanners.endAt} > ${now}`
          )
        ).orderBy(desc(sessionBanners.startAt)).limit(1);
        return active;
      }
      async getNextScheduledBanner() {
        const now = /* @__PURE__ */ new Date();
        const [scheduled] = await db.select().from(sessionBanners).where(sql2`${sessionBanners.startAt} > ${now}`).orderBy(asc(sessionBanners.startAt)).limit(1);
        return scheduled;
      }
      async getLastExpiredBanner() {
        const now = /* @__PURE__ */ new Date();
        const [expired] = await db.select().from(sessionBanners).where(sql2`${sessionBanners.endAt} <= ${now}`).orderBy(desc(sessionBanners.endAt)).limit(1);
        return expired;
      }
      // ===== USER STREAKS =====
      async markUserActivityDate(userId, activityDate) {
        const [existing] = await db.select().from(userStreaks).where(and(eq(userStreaks.userId, userId), eq(userStreaks.activityDate, activityDate)));
        if (existing) {
          return existing;
        }
        const [newStreak] = await db.insert(userStreaks).values({ userId, activityDate }).returning();
        return newStreak;
      }
      async getUserStreakDates(userId, dates) {
        if (dates.length === 0) return [];
        const records = await db.select({ activityDate: userStreaks.activityDate }).from(userStreaks).where(and(
          eq(userStreaks.userId, userId),
          inArray(userStreaks.activityDate, dates)
        ));
        return records.map((r) => r.activityDate);
      }
      async getConsistencyMonth(userId, year, month) {
        const daysInMonth = new Date(year, month, 0).getDate();
        const allDates = [];
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          allDates.push(dateStr);
        }
        const activeDates = await this.getUserStreakDates(userId, allDates);
        const activeDateSet = new Set(activeDates);
        return allDates.map((date2) => ({
          date: date2,
          active: activeDateSet.has(date2)
        }));
      }
      async getConsistencyRange(userId) {
        const [earliest] = await db.select({ activityDate: userStreaks.activityDate }).from(userStreaks).where(eq(userStreaks.userId, userId)).orderBy(asc(userStreaks.activityDate)).limit(1);
        const startMonth = earliest ? earliest.activityDate.slice(0, 7) : null;
        return { startMonth, currentMonth: "current" };
      }
      async getCurrentStreak(userId, todayDate) {
        const allRecords = await db.select({ activityDate: userStreaks.activityDate }).from(userStreaks).where(eq(userStreaks.userId, userId)).orderBy(desc(userStreaks.activityDate));
        if (allRecords.length === 0) return 0;
        const activeDates = new Set(allRecords.map((r) => r.activityDate));
        let streak = 0;
        let checkDate = /* @__PURE__ */ new Date(todayDate + "T12:00:00");
        if (!activeDates.has(todayDate)) {
          checkDate.setDate(checkDate.getDate() - 1);
        }
        while (true) {
          const dateStr = checkDate.toISOString().split("T")[0];
          if (activeDates.has(dateStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
        return streak;
      }
      // ===== ACTIVITY LOGS (AI INSIGHTS) =====
      async logActivity(userId, lessonId, lessonName, featureType, activityDate) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(activityDate)) {
          activityDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        }
        const serverDate = /* @__PURE__ */ new Date();
        const inputDate = /* @__PURE__ */ new Date(activityDate + "T12:00:00");
        const diffDays = Math.abs((serverDate.getTime() - inputDate.getTime()) / (1e3 * 60 * 60 * 24));
        if (diffDays > 1) {
          activityDate = serverDate.toISOString().split("T")[0];
        }
        const [existing] = await db.select().from(activityLogs).where(and(
          eq(activityLogs.userId, userId),
          eq(activityLogs.lessonId, lessonId),
          eq(activityLogs.featureType, featureType),
          eq(activityLogs.activityDate, activityDate)
        ));
        if (existing) {
          return { logged: false, activity: existing };
        }
        const [newLog] = await db.insert(activityLogs).values({ userId, lessonId, lessonName, featureType, activityDate }).returning();
        return { logged: true, activity: newLog };
      }
      async getMonthlyStats(userId, month) {
        const monthRegex = /^\d{4}-\d{2}$/;
        if (!monthRegex.test(month)) {
          month = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
        }
        const now = /* @__PURE__ */ new Date();
        const inputDate = /* @__PURE__ */ new Date(month + "-01");
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        if (inputDate < sixMonthsAgo) {
          month = sixMonthsAgo.toISOString().slice(0, 7);
        }
        const startDate = month + "-01";
        const endDate = month + "-31";
        const activities = await db.select({
          lessonId: activityLogs.lessonId,
          lessonName: activityLogs.lessonName,
          featureType: activityLogs.featureType,
          count: count(activityLogs.id)
        }).from(activityLogs).where(and(
          eq(activityLogs.userId, userId),
          sql2`${activityLogs.activityDate} >= ${startDate}`,
          sql2`${activityLogs.activityDate} <= ${endDate}`
        )).groupBy(activityLogs.lessonId, activityLogs.lessonName, activityLogs.featureType);
        const result = {
          PROCESS: [],
          PLAYLIST: [],
          maxCount: 0
        };
        for (const activity of activities) {
          const item = {
            lessonId: activity.lessonId,
            lessonName: activity.lessonName,
            count: Number(activity.count)
          };
          if (item.count > result.maxCount) {
            result.maxCount = item.count;
          }
          if (activity.featureType === "PROCESS") {
            result.PROCESS.push(item);
          } else if (activity.featureType === "PLAYLIST") {
            result.PLAYLIST.push(item);
          }
        }
        result.PROCESS.sort((a, b) => b.count - a.count);
        result.PLAYLIST.sort((a, b) => b.count - a.count);
        return result;
      }
      // ===== REWIRING BELIEFS =====
      async getRewiringBeliefsByUserId(userId) {
        const beliefs = await db.select().from(rewiringBeliefs).where(eq(rewiringBeliefs.userId, userId)).orderBy(desc(rewiringBeliefs.createdAt));
        return beliefs;
      }
      async getRewiringBeliefById(id) {
        const [belief] = await db.select().from(rewiringBeliefs).where(eq(rewiringBeliefs.id, id));
        return belief;
      }
      async createRewiringBelief(belief) {
        const [newBelief] = await db.insert(rewiringBeliefs).values(belief).returning();
        return newBelief;
      }
      async updateRewiringBelief(id, userId, updates) {
        const [updated] = await db.update(rewiringBeliefs).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(rewiringBeliefs.id, id), eq(rewiringBeliefs.userId, userId))).returning();
        return updated;
      }
      async deleteRewiringBelief(id, userId) {
        const result = await db.delete(rewiringBeliefs).where(and(eq(rewiringBeliefs.id, id), eq(rewiringBeliefs.userId, userId))).returning();
        return result.length > 0;
      }
      // ===== USER WELLNESS PROFILES =====
      async getWellnessProfileByUserId(userId) {
        const [profile] = await db.select().from(userWellnessProfiles).where(eq(userWellnessProfiles.userId, userId));
        return profile;
      }
      async upsertWellnessProfile(userId, data) {
        const existing = await this.getWellnessProfileByUserId(userId);
        if (existing) {
          const [updated] = await db.update(userWellnessProfiles).set({
            karmicAffirmation: data.karmicAffirmation,
            prescription: data.prescription,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq(userWellnessProfiles.userId, userId)).returning();
          return updated;
        } else {
          const [created] = await db.insert(userWellnessProfiles).values({
            userId,
            karmicAffirmation: data.karmicAffirmation,
            prescription: data.prescription
          }).returning();
          return created;
        }
      }
      // ===== EVENTS =====
      // Auto-transition UPCOMING events to COMPLETED when endDatetime has passed
      async autoCompleteEvents() {
        const now = /* @__PURE__ */ new Date();
        await db.update(events).set({ status: "COMPLETED", updatedAt: now }).where(
          and(
            eq(events.status, "UPCOMING"),
            sql2`${events.endDatetime} < ${now}`
          )
        );
      }
      async getAllEvents(filters) {
        await this.autoCompleteEvents();
        const conditions = [];
        if (filters?.status) {
          conditions.push(eq(events.status, filters.status));
        }
        if (filters?.month && filters?.year) {
          const startOfMonth = new Date(filters.year, filters.month - 1, 1);
          const endOfMonth = new Date(filters.year, filters.month, 0, 23, 59, 59);
          conditions.push(
            and(
              sql2`${events.startDatetime} >= ${startOfMonth}`,
              sql2`${events.startDatetime} <= ${endOfMonth}`
            )
          );
        } else if (filters?.year) {
          const startOfYear = new Date(filters.year, 0, 1);
          const endOfYear = new Date(filters.year, 11, 31, 23, 59, 59);
          conditions.push(
            and(
              sql2`${events.startDatetime} >= ${startOfYear}`,
              sql2`${events.startDatetime} <= ${endOfYear}`
            )
          );
        }
        const events2 = await db.select().from(events).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(desc(events.startDatetime));
        return events2;
      }
      async getEventById(id) {
        const [event] = await db.select().from(events).where(eq(events.id, id));
        return event;
      }
      async getUpcomingEvents() {
        const now = /* @__PURE__ */ new Date();
        const events2 = await db.select().from(events).where(
          and(
            eq(events.status, "UPCOMING"),
            sql2`${events.endDatetime} >= ${now}`
          )
        ).orderBy(asc(events.startDatetime));
        return events2;
      }
      async getLatestEvents() {
        await this.autoCompleteEvents();
        const now = /* @__PURE__ */ new Date();
        const todayStr = now.toISOString().split("T")[0];
        const events2 = await db.select().from(events).where(
          and(
            eq(events.status, "COMPLETED"),
            eq(events.showRecording, true),
            or(
              sql2`${events.recordingExpiryDate} IS NULL`,
              sql2`${events.recordingExpiryDate} >= ${todayStr}`
            )
          )
        ).orderBy(desc(events.startDatetime));
        return events2;
      }
      async createEvent(event) {
        const [newEvent] = await db.insert(events).values(event).returning();
        return newEvent;
      }
      async updateEvent(id, event) {
        const [updated] = await db.update(events).set({ ...event, updatedAt: /* @__PURE__ */ new Date() }).where(eq(events.id, id)).returning();
        return updated;
      }
      async cancelEvent(id) {
        const [cancelled] = await db.update(events).set({ status: "CANCELLED", updatedAt: /* @__PURE__ */ new Date() }).where(eq(events.id, id)).returning();
        return cancelled;
      }
      // ===== POH (Project of Heart) Methods =====
      async getUserPOHs(userId) {
        return db.select().from(projectOfHearts).where(eq(projectOfHearts.userId, userId)).orderBy(asc(projectOfHearts.createdAt));
      }
      async getPOHById(pohId) {
        const [poh] = await db.select().from(projectOfHearts).where(eq(projectOfHearts.id, pohId));
        return poh;
      }
      async createPOH(data) {
        const [newPOH] = await db.insert(projectOfHearts).values({
          userId: data.userId,
          title: data.title,
          why: data.why,
          category: data.category,
          status: data.status,
          startedAt: data.startedAt
        }).returning();
        return newPOH;
      }
      async updatePOH(pohId, updates) {
        const [updated] = await db.update(projectOfHearts).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(projectOfHearts.id, pohId)).returning();
        return updated;
      }
      async completePOH(pohId, data) {
        await db.update(projectOfHearts).set({
          status: data.status,
          endedAt: data.endedAt,
          closingReflection: data.closingReflection,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(projectOfHearts.id, pohId));
      }
      async promotePOHs(userId, today) {
        const userPOHs = await this.getUserPOHs(userId);
        const nextPOH = userPOHs.find((p) => p.status === "next");
        const horizonPOH = userPOHs.find((p) => p.status === "horizon");
        if (nextPOH) {
          await db.update(projectOfHearts).set({ status: "active", startedAt: today, updatedAt: /* @__PURE__ */ new Date() }).where(eq(projectOfHearts.id, nextPOH.id));
        }
        if (horizonPOH) {
          await db.update(projectOfHearts).set({ status: "next", updatedAt: /* @__PURE__ */ new Date() }).where(eq(projectOfHearts.id, horizonPOH.id));
        }
      }
      async getPOHHistory(userId) {
        return db.select().from(projectOfHearts).where(
          and(
            eq(projectOfHearts.userId, userId),
            or(
              eq(projectOfHearts.status, "completed"),
              eq(projectOfHearts.status, "closed_early")
            )
          )
        ).orderBy(desc(projectOfHearts.endedAt));
      }
      // POH Milestone methods
      async getPOHMilestones(pohId) {
        return db.select().from(pohMilestones).where(eq(pohMilestones.pohId, pohId)).orderBy(asc(pohMilestones.orderIndex));
      }
      async getPOHMilestoneById(milestoneId) {
        const [milestone] = await db.select().from(pohMilestones).where(eq(pohMilestones.id, milestoneId));
        return milestone;
      }
      async createPOHMilestone(data) {
        const [milestone] = await db.insert(pohMilestones).values(data).returning();
        return milestone;
      }
      async updatePOHMilestone(milestoneId, updates) {
        const [updated] = await db.update(pohMilestones).set(updates).where(eq(pohMilestones.id, milestoneId)).returning();
        return updated;
      }
      async achievePOHMilestone(milestoneId, achievedAt) {
        const [updated] = await db.update(pohMilestones).set({ achieved: true, achievedAt }).where(eq(pohMilestones.id, milestoneId)).returning();
        return updated;
      }
      // POH Action methods
      async getPOHActions(pohId) {
        return db.select().from(pohActions).where(eq(pohActions.pohId, pohId)).orderBy(asc(pohActions.orderIndex));
      }
      async replacePOHActions(pohId, actions) {
        await db.delete(pohActions).where(eq(pohActions.pohId, pohId));
        if (actions.length > 0) {
          await db.insert(pohActions).values(actions.map((text2, index) => ({
            pohId,
            text: text2,
            orderIndex: index
          })));
        }
      }
      // POH Rating methods
      async getPOHRatingByDate(userId, localDate) {
        const [rating] = await db.select().from(pohDailyRatings).where(
          and(
            eq(pohDailyRatings.userId, userId),
            eq(pohDailyRatings.localDate, localDate)
          )
        );
        return rating;
      }
      async createPOHRating(data) {
        const [rating] = await db.insert(pohDailyRatings).values(data).returning();
        return rating;
      }
      async updatePOHRating(ratingId, rating) {
        const [updated] = await db.update(pohDailyRatings).set({ rating }).where(eq(pohDailyRatings.id, ratingId)).returning();
        return updated;
      }
      // ===== NOTIFICATIONS =====
      async createNotification(notification) {
        const [newNotification] = await db.insert(notifications).values(notification).returning();
        return newNotification;
      }
      async createNotifications(notifications2) {
        if (notifications2.length === 0) return [];
        const result = await db.insert(notifications).values(notifications2).returning();
        return result;
      }
      async getNotificationsByEventId(eventId) {
        return db.select().from(notifications).where(eq(notifications.relatedEventId, eventId));
      }
      async deleteNotificationsByEventId(eventId) {
        await db.delete(notifications).where(eq(notifications.relatedEventId, eventId));
      }
      async getPendingNotifications() {
        const now = /* @__PURE__ */ new Date();
        return db.select().from(notifications).where(
          and(
            sql2`${notifications.scheduledAt} <= ${now}`,
            eq(notifications.sent, false)
          )
        ).orderBy(asc(notifications.scheduledAt));
      }
      async getNotificationById(id) {
        const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
        return notification;
      }
      async markNotificationSent(id) {
        await db.update(notifications).set({ sent: true, sentAt: /* @__PURE__ */ new Date() }).where(eq(notifications.id, id));
      }
      // ===== NOTIFICATION LOGS =====
      async createNotificationLog(log2) {
        const [newLog] = await db.insert(notificationLogs).values(log2).returning();
        return newLog;
      }
      async createNotificationLogs(logs) {
        if (logs.length === 0) return [];
        const result = await db.insert(notificationLogs).values(logs).returning();
        return result;
      }
      async getNotificationLogsByNotificationId(notificationId) {
        return db.select().from(notificationLogs).where(eq(notificationLogs.notificationId, notificationId));
      }
      async hasNotificationBeenSent(notificationId) {
        const [result] = await db.select({ count: count() }).from(notificationLogs).where(eq(notificationLogs.notificationId, notificationId));
        return (result?.count ?? 0) > 0;
      }
      // ===== DEVICE TOKENS (for notifications) =====
      async getDeviceTokensByUserIds(userIds) {
        if (userIds.length === 0) return [];
        return db.select({ userId: deviceTokens.userId, token: deviceTokens.token }).from(deviceTokens).where(inArray(deviceTokens.userId, userIds));
      }
      async deleteDeviceToken(token) {
        await db.delete(deviceTokens).where(eq(deviceTokens.token, token));
      }
      // ===== ELIGIBLE USERS FOR NOTIFICATIONS (by program code + level) =====
      async getEligibleUserIdsForNotification(programCode, programLevel) {
        const result = await db.select({ userId: userPrograms.userId }).from(userPrograms).innerJoin(programs, eq(userPrograms.programId, programs.id)).where(
          and(
            eq(programs.code, programCode),
            sql2`${programs.level} >= ${programLevel}`,
            eq(programs.isActive, true)
          )
        );
        return result.map((r) => r.userId);
      }
      // ===== USER BADGES =====
      async getUserBadges(userId) {
        return db.select().from(userBadges).where(eq(userBadges.userId, userId)).orderBy(desc(userBadges.earnedAt));
      }
      async getUserBadgeKeys(userId) {
        const badges = await db.select({ badgeKey: userBadges.badgeKey }).from(userBadges).where(eq(userBadges.userId, userId));
        return badges.map((b) => b.badgeKey);
      }
      async awardBadge(userId, badgeKey, metadata) {
        try {
          const [badge] = await db.insert(userBadges).values({ userId, badgeKey, metadata: metadata || null }).onConflictDoNothing().returning();
          return badge || null;
        } catch {
          return null;
        }
      }
      async hasBadge(userId, badgeKey) {
        const [result] = await db.select({ count: count() }).from(userBadges).where(and(
          eq(userBadges.userId, userId),
          eq(userBadges.badgeKey, badgeKey)
        ));
        return (result?.count ?? 0) > 0;
      }
      async getAllStreakHistory(userId) {
        const records = await db.select({ activityDate: userStreaks.activityDate }).from(userStreaks).where(eq(userStreaks.userId, userId)).orderBy(asc(userStreaks.activityDate));
        return records.map((r) => r.activityDate);
      }
      async getBadgeMetadata(userId, badgeKey) {
        const [badge] = await db.select({ metadata: userBadges.metadata }).from(userBadges).where(and(
          eq(userBadges.userId, userId),
          eq(userBadges.badgeKey, badgeKey)
        ));
        return badge?.metadata;
      }
      async updateBadgeMetadata(userId, badgeKey, metadata) {
        await db.update(userBadges).set({ metadata }).where(and(
          eq(userBadges.userId, userId),
          eq(userBadges.badgeKey, badgeKey)
        ));
      }
      async getUnnotifiedBadgeKeys(userId) {
        const badges = await db.select({ badgeKey: userBadges.badgeKey }).from(userBadges).where(and(
          eq(userBadges.userId, userId),
          eq(userBadges.notified, false)
        ));
        return badges.map((b) => b.badgeKey);
      }
      async markBadgesAsNotified(userId, badgeKeys) {
        if (badgeKeys.length === 0) return;
        await db.update(userBadges).set({ notified: true }).where(and(
          eq(userBadges.userId, userId),
          inArray(userBadges.badgeKey, badgeKeys)
        ));
      }
      // ===== USER IN-APP NOTIFICATIONS =====
      async getUserNotifications(userId) {
        const results = await db.select({
          id: notifications.id,
          title: notifications.title,
          body: notifications.body,
          type: notifications.type,
          relatedEventId: notifications.relatedEventId,
          createdAt: notificationLogs.createdAt
        }).from(notificationLogs).innerJoin(
          notifications,
          eq(notificationLogs.notificationId, notifications.id)
        ).where(
          and(
            eq(notificationLogs.userId, userId),
            // Include both sent and delivered statuses
            sql2`${notificationLogs.status} IN ('sent', 'delivered')`
          )
        ).orderBy(desc(notificationLogs.createdAt));
        const seen = /* @__PURE__ */ new Set();
        return results.filter((r) => {
          if (seen.has(r.id)) return false;
          seen.add(r.id);
          return true;
        }).map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString()
        }));
      }
      // ===== DR. M QUESTIONS =====
      async getDrmQuestionByUserMonth(userId, monthYear) {
        const [question] = await db.select().from(drmQuestions).where(
          and(
            eq(drmQuestions.userId, userId),
            eq(drmQuestions.monthYear, monthYear)
          )
        );
        return question;
      }
      async createDrmQuestion(data) {
        const [question] = await db.insert(drmQuestions).values({
          userId: data.userId,
          questionText: data.questionText,
          monthYear: data.monthYear
        }).returning();
        return question;
      }
      async getUserDrmQuestions(userId) {
        return db.select().from(drmQuestions).where(eq(drmQuestions.userId, userId)).orderBy(desc(drmQuestions.askedAt));
      }
      async getDrmQuestionById(id) {
        const [question] = await db.select().from(drmQuestions).where(eq(drmQuestions.id, id));
        return question;
      }
      async getAllDrmQuestions() {
        const results = await db.select({
          id: drmQuestions.id,
          userId: drmQuestions.userId,
          questionText: drmQuestions.questionText,
          askedAt: drmQuestions.askedAt,
          monthYear: drmQuestions.monthYear,
          status: drmQuestions.status,
          audioR2Key: drmQuestions.audioR2Key,
          answeredAt: drmQuestions.answeredAt,
          userName: users.name
        }).from(drmQuestions).innerJoin(users, eq(drmQuestions.userId, users.id)).orderBy(desc(drmQuestions.askedAt));
        return results;
      }
      async updateDrmQuestionAnswer(id, audioR2Key) {
        const [updated] = await db.update(drmQuestions).set({
          status: "ANSWERED",
          audioR2Key,
          answeredAt: /* @__PURE__ */ new Date()
        }).where(eq(drmQuestions.id, id)).returning();
        return updated;
      }
    };
    storage = new DbStorage();
  }
});

// server/services/badgeService.ts
var badgeService_exports = {};
__export(badgeService_exports, {
  awardAdminBadge: () => awardAdminBadge,
  evaluateBadges: () => evaluateBadges
});
function analyzeStreakHistory(dates) {
  if (dates.length === 0) return { cycles: [], currentStreak: 0, hadBreak: false };
  const sortedDates = [...dates].sort();
  const cycles = [];
  let currentCycleStart = sortedDates[0];
  let currentCycleLength = 1;
  let hadBreak = false;
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = /* @__PURE__ */ new Date(sortedDates[i - 1] + "T12:00:00");
    const currDate = /* @__PURE__ */ new Date(sortedDates[i] + "T12:00:00");
    const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1e3 * 60 * 60 * 24));
    if (diffDays === 1) {
      currentCycleLength++;
    } else {
      cycles.push({
        start: currentCycleStart,
        end: sortedDates[i - 1],
        length: currentCycleLength
      });
      hadBreak = true;
      currentCycleStart = sortedDates[i];
      currentCycleLength = 1;
    }
  }
  cycles.push({
    start: currentCycleStart,
    end: sortedDates[sortedDates.length - 1],
    length: currentCycleLength
  });
  const currentStreak = cycles.length > 0 ? cycles[cycles.length - 1].length : 0;
  return { cycles, currentStreak, hadBreak };
}
async function evaluateBadges(userId, todayDate) {
  const earnedBadgeKeys = await storage.getUserBadgeKeys(userId);
  const earnedSet = new Set(earnedBadgeKeys);
  const currentStreak = await storage.getCurrentStreak(userId, todayDate);
  if (!earnedSet.has("day_zero")) {
    await storage.awardBadge(userId, "day_zero");
  }
  for (const { key, threshold } of CORE_BADGE_THRESHOLDS) {
    if (!earnedSet.has(key) && currentStreak >= threshold) {
      await storage.awardBadge(userId, key);
    }
  }
  const allDates = await storage.getAllStreakHistory(userId);
  const { cycles, hadBreak } = analyzeStreakHistory(allDates);
  if (!earnedSet.has("resilient") && hadBreak) {
    const hasStreakAfterBreak = cycles.length >= 2;
    if (hasStreakAfterBreak) {
      const lastCycle = cycles[cycles.length - 1];
      if (lastCycle.length >= 14) {
        await storage.awardBadge(userId, "resilient");
      }
    }
  }
  if (!earnedSet.has("relentless")) {
    const completedThirtyDayStreaks = cycles.filter((c) => c.length >= 30).length;
    let metadata = await storage.getBadgeMetadata(userId, "relentless_progress");
    if (!metadata) {
      metadata = { count: 0 };
    }
    if (completedThirtyDayStreaks >= 3) {
      await storage.awardBadge(userId, "relentless", { cyclesCompleted: completedThirtyDayStreaks });
    }
  }
  const unnotifiedBadges = await storage.getUnnotifiedBadgeKeys(userId);
  if (unnotifiedBadges.length > 0) {
    await storage.markBadgesAsNotified(userId, unnotifiedBadges);
  }
  return unnotifiedBadges;
}
async function awardAdminBadge(userId, badgeKey) {
  const hasBadge = await storage.hasBadge(userId, badgeKey);
  if (hasBadge) {
    return { success: false, alreadyEarned: true };
  }
  const awarded = await storage.awardBadge(userId, badgeKey);
  return { success: !!awarded, alreadyEarned: false };
}
var CORE_BADGE_THRESHOLDS;
var init_badgeService = __esm({
  "server/services/badgeService.ts"() {
    "use strict";
    init_storage();
    CORE_BADGE_THRESHOLDS = [
      { key: "spark", threshold: 3 },
      { key: "pulse", threshold: 7 },
      { key: "anchor", threshold: 30 },
      { key: "aligned", threshold: 90 },
      { key: "disciplined", threshold: 100 },
      { key: "unstoppable", threshold: 365 },
      { key: "integrated", threshold: 1e3 },
      { key: "titan", threshold: 3e3 }
    ];
  }
});

// server/index.ts
import express2 from "express";
import path4 from "path";
import fs3 from "fs";

// server/routes.ts
init_storage();
init_schema();
import { createServer } from "http";

// server/lib/firebaseAdmin.ts
import admin from "firebase-admin";
var fcmInstance = null;
function initializeFirebaseAdmin() {
  if (admin.apps.length === 0) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountJson) {
      console.warn(
        "FIREBASE_SERVICE_ACCOUNT not set. Push notifications will be disabled."
      );
      return null;
    }
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      console.log(
        "\u{1F525} Firebase Admin initialized for:",
        serviceAccount.project_id
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      fcmInstance = admin.messaging();
      console.log("Firebase Admin SDK initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Firebase Admin:", error);
      return null;
    }
  } else {
    fcmInstance = admin.messaging();
  }
  return fcmInstance;
}
function getFCM() {
  if (!fcmInstance) {
    return initializeFirebaseAdmin();
  }
  return fcmInstance;
}
async function sendPushNotification(tokens, title, body, data) {
  const fcm = getFCM();
  if (!fcm) {
    console.error("FCM not initialized");
    return {
      successCount: 0,
      failureCount: tokens.length,
      failedTokens: tokens
    };
  }
  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0, failedTokens: [] };
  }
  const message = {
    tokens,
    notification: { title, body },
    data,
    webpush: {
      notification: {
        title,
        body,
        icon: "/icon-192.png"
      },
      data
      // Include data payload for service worker access
    }
  };
  try {
    const response = await fcm.sendEachForMulticast(message);
    const failedTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        failedTokens.push(tokens[idx]);
        console.error(`Failed to send to token ${idx}:`, resp.error);
      }
    });
    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      failedTokens
    };
  } catch (error) {
    console.error("Error sending multicast notification:", error);
    return {
      successCount: 0,
      failureCount: tokens.length,
      failedTokens: tokens
    };
  }
}

// server/routes.ts
import { z as z2 } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// server/r2Upload.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
var r2Config = {
  accountId: process.env.R2_ACCOUNT_ID,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  bucketName: process.env.R2_BUCKET_NAME,
  publicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
  signedUrlTtl: parseInt(process.env.SIGNED_URL_TTL_SEC || "1800", 10)
};
function checkR2Credentials() {
  if (!r2Config.accountId) {
    return { valid: false, error: "R2_ACCOUNT_ID is not configured" };
  }
  if (!r2Config.accessKeyId) {
    return { valid: false, error: "R2_ACCESS_KEY_ID is not configured" };
  }
  if (!r2Config.secretAccessKey) {
    return { valid: false, error: "R2_SECRET_ACCESS_KEY is not configured" };
  }
  if (!r2Config.bucketName) {
    return { valid: false, error: "R2_BUCKET_NAME is not configured" };
  }
  return { valid: true };
}
var r2Client = null;
function getR2Client() {
  const credCheck = checkR2Credentials();
  if (!credCheck.valid) {
    throw new Error(credCheck.error);
  }
  if (!r2Client) {
    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${r2Config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey
      }
    });
  }
  return r2Client;
}
function generateCourseThumnailKey(programCode, courseId) {
  return `programs/${programCode}/courses/${courseId}/thumbnail/course.png`;
}
function generateLessonFileKey(programCode, courseId, moduleId, lessonId, fileType) {
  const extension = fileType === "video" ? "mp4" : fileType === "audio" ? "mp3" : "pdf";
  return `programs/${programCode}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/${fileType}/lesson.${extension}`;
}
async function getSignedPutUrl(key, contentType, ttlSeconds) {
  try {
    const credCheck = checkR2Credentials();
    if (!credCheck.valid) {
      return { success: false, error: credCheck.error };
    }
    const client = getR2Client();
    const ttl = ttlSeconds || r2Config.signedUrlTtl;
    const command = new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
      ContentType: contentType
    });
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: ttl });
    const publicUrl = r2Config.publicBaseUrl ? `${r2Config.publicBaseUrl}/${key}` : `https://${r2Config.accountId}.r2.cloudflarestorage.com/${r2Config.bucketName}/${key}`;
    return {
      success: true,
      uploadUrl,
      key,
      publicUrl
    };
  } catch (error) {
    console.error("R2 signed PUT URL error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}
async function getSignedGetUrl(key, ttlSeconds) {
  try {
    const credCheck = checkR2Credentials();
    if (!credCheck.valid) {
      return { success: false, error: credCheck.error };
    }
    const client = getR2Client();
    const ttl = ttlSeconds || r2Config.signedUrlTtl;
    const command = new GetObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key
    });
    const url = await getSignedUrl(client, command, { expiresIn: ttl });
    return {
      success: true,
      url
    };
  } catch (error) {
    console.error("R2 signed GET URL error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}
async function deleteR2Object(key) {
  try {
    const credCheck = checkR2Credentials();
    if (!credCheck.valid) {
      return { success: false, error: credCheck.error };
    }
    const client = getR2Client();
    const command = new DeleteObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key
    });
    await client.send(command);
    return { success: true };
  } catch (error) {
    console.error("R2 delete error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}
async function downloadR2Object(key) {
  try {
    const credCheck = checkR2Credentials();
    if (!credCheck.valid) {
      return { success: false, error: credCheck.error };
    }
    const client = getR2Client();
    const command = new GetObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key
    });
    const response = await client.send(command);
    if (!response.Body) {
      return { success: false, error: "No body in response" };
    }
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const data = Buffer.concat(chunks);
    return { success: true, data };
  } catch (error) {
    console.error("R2 download error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}
async function uploadBufferToR2(buffer, key, contentType) {
  try {
    const credCheck = checkR2Credentials();
    if (!credCheck.valid) {
      return { success: false, error: credCheck.error };
    }
    const client = getR2Client();
    const command = new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType
    });
    await client.send(command);
    const publicUrl = r2Config.publicBaseUrl ? `${r2Config.publicBaseUrl}/${key}` : `https://${r2Config.accountId}.r2.cloudflarestorage.com/${r2Config.bucketName}/${key}`;
    return {
      success: true,
      url: publicUrl,
      key
    };
  } catch (error) {
    console.error("R2 upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

// server/routes.ts
init_db();
import PDFParser from "pdf2json";
import { eq as eq2, asc as asc2, and as and2, or as or2, sql as sql3, count as count2, countDistinct, gte, desc as desc2, lt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt2 from "jsonwebtoken";

// server/middleware/auth.ts
import jwt from "jsonwebtoken";
function authenticateJWT(req, res, next) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const token = header.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Invalid token format" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// server/routes.ts
async function extractTextWithPdf2json(buffer) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);
    pdfParser.on("pdfParser_dataError", (errData) => {
      reject(errData.parserError);
    });
    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      const pages = pdfData.Pages || [];
      const lines = [];
      pages.forEach((page) => {
        const textsByY = /* @__PURE__ */ new Map();
        (page.Texts || []).forEach((textItem) => {
          const y = Math.round(textItem.y * 10);
          const text2 = textItem.R?.map((r) => {
            try {
              return decodeURIComponent(r.T);
            } catch {
              return r.T || "";
            }
          }).join("") || "";
          if (text2.trim()) {
            if (!textsByY.has(y)) {
              textsByY.set(y, []);
            }
            textsByY.get(y).push(text2);
          }
        });
        const sortedYs = Array.from(textsByY.keys()).sort((a, b) => a - b);
        sortedYs.forEach((y) => {
          const lineText = textsByY.get(y).join(" ").trim();
          if (lineText) {
            lines.push(lineText);
          }
        });
        lines.push("");
      });
      resolve(lines.join("\n"));
    });
    pdfParser.parseBuffer(buffer);
  });
}
var ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
var JWT_SECRET = process.env.JWT_SECRET;
function convertTextToFormattedHtml(text2) {
  const norm = text2.replace(/\r\n/g, "\n").replace(/\u00A0/g, " ").trim();
  const lines = norm.split("\n").map((l) => l.trim());
  const html = [];
  let currentParagraph = [];
  let currentListType = null;
  let listItems = [];
  const headerKeywords = [
    "intention",
    "affirmation",
    "tapping",
    "forgiveness",
    "release",
    "breathing",
    "meditation",
    "visualization",
    "notes",
    "summary",
    "overview",
    "step",
    "part",
    "exercise",
    "practice",
    "dyd",
    "usm"
  ];
  function isHeader(line) {
    const t = line.trim();
    if (!t) return false;
    if (/^--\s*\d+\s*(of|\/)\s*\d+\s*--$/i.test(t)) return false;
    const words = t.split(/\s+/);
    if (t.length > 35 || words.length > 3) return false;
    if (/,/.test(t)) return false;
    if (/[.!?;]$/.test(t)) return false;
    if (/\b(say|the|your|my|and|or|is|are|was|were|on|in|at|to|for|with|from)\b/i.test(
      t
    )) {
      return false;
    }
    const lower = t.toLowerCase().replace(/[^a-z\s]/g, "").trim();
    if (headerKeywords.includes(lower)) return true;
    if (headerKeywords.find(
      (k) => lower.startsWith(k) && /^\w+\s*\([^)]+\)$/.test(t)
    ))
      return true;
    if (words.length <= 2 && t.length < 25 && /^[A-Z]/.test(t)) return true;
    return false;
  }
  function flushList() {
    if (listItems.length > 0 && currentListType) {
      const tag = currentListType;
      html.push(
        `<${tag} class="${tag === "ul" ? "list-disc" : "list-decimal"} list-inside space-y-1 my-4">`
      );
      listItems.forEach((item) => html.push(`<li class="ml-4">${item}</li>`));
      html.push(`</${tag}>`);
      listItems = [];
      currentListType = null;
    }
  }
  function flushParagraph() {
    flushList();
    if (currentParagraph.length > 0) {
      const content = currentParagraph.join(" ").trim();
      if (content) {
        html.push(`<p class="my-4 leading-relaxed">${content}</p>`);
      }
      currentParagraph = [];
    }
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^--\s*\d+\s*(of|\/)\s*\d+\s*--$/i.test(line)) continue;
    if (!line) {
      flushParagraph();
      continue;
    }
    if (isHeader(line)) {
      flushParagraph();
      const headerText = line.replace(/[,:]$/, "").trim();
      html.push(
        `<h3 class="mt-6 mb-3 text-lg font-semibold text-primary">${headerText}</h3>`
      );
      continue;
    }
    if (/^[-•*]\s+/.test(line)) {
      flushParagraph();
      if (currentListType !== "ul") {
        flushList();
        currentListType = "ul";
      }
      listItems.push(line.replace(/^[-•*]\s+/, ""));
      continue;
    }
    if (/^\d+\s*[.)]\s+/.test(line)) {
      flushParagraph();
      if (currentListType !== "ol") {
        flushList();
        currentListType = "ol";
      }
      listItems.push(line.replace(/^\d+\s*[.)]\s+/, ""));
      continue;
    }
    flushList();
    currentParagraph.push(line);
  }
  flushParagraph();
  return html.join("\n");
}
var articlesDir = path.join(process.cwd(), "public", "articles");
if (!fs.existsSync(articlesDir)) {
  fs.mkdirSync(articlesDir, { recursive: true });
}
var articleImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, articlesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
var uploadArticleImage = multer({
  storage: articleImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});
var requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader === `Bearer ${ADMIN_PASSWORD}`) {
    next();
    return;
  }
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt2.verify(token, JWT_SECRET);
      if (["SUPER_ADMIN", "COACH"].includes(decoded.role)) {
        req.user = decoded;
        next();
        return;
      }
    } catch (error) {
    }
  }
  res.status(401).json({ error: "Unauthorized" });
};
var requireSuperAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt2.verify(token, JWT_SECRET);
      if (decoded.role === "SUPER_ADMIN") {
        req.user = decoded;
        next();
        return;
      }
    } catch (error) {
    }
  }
  res.status(403).json({ error: "Super Admin access required" });
};
async function registerRoutes(app2) {
  app2.get("/api/sessions", async (req, res) => {
    try {
      const sessions = await storage.getAllCommunitySessions();
      const activeSessions = sessions.filter((s) => s.isActive);
      res.json(activeSessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });
  app2.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      if (password === ADMIN_PASSWORD) {
        res.json({ success: true });
      } else {
        res.status(401).json({ error: "Invalid password" });
      }
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  app2.post("/admin/v1/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      if (!["SUPER_ADMIN", "COACH"].includes(user.role)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      if (user.status !== "active") {
        return res.status(403).json({ message: "Account is blocked" });
      }
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      await storage.updateUserLastLogin(user.id);
      const token = jwt2.sign(
        { sub: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "30d" }
      );
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error("Error during admin login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  app2.post("/api/v1/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      if (user.role === "SUPER_ADMIN") {
        return res.status(403).json({ message: "Super Admin must use admin login" });
      }
      if (user.status !== "active") {
        return res.status(403).json({ message: "Account is blocked" });
      }
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      await storage.updateUserLastLogin(user.id);
      const token = jwt2.sign(
        { sub: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "30d" }
      );
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error("Error during user login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  app2.get("/api/v1/me", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const user = await storage.getUserById(req.user.sub);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });
  app2.post("/api/v1/streak/mark-today", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { date: date2 } = req.body;
      if (!date2 || !/^\d{4}-\d{2}-\d{2}$/.test(date2)) {
        return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
      }
      await storage.markUserActivityDate(req.user.sub, date2);
      res.json({ success: true, date: date2 });
    } catch (error) {
      console.error("Error marking streak:", error);
      res.status(500).json({ error: "Failed to mark activity" });
    }
  });
  app2.get("/api/v1/streak/last-7-days", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const baseDate = req.query.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const dates = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split("T")[0]);
      }
      const activeDates = await storage.getUserStreakDates(req.user.sub, dates);
      const activeDateSet = new Set(activeDates);
      const result = dates.map((date2) => ({
        date: date2,
        active: activeDateSet.has(date2)
      }));
      res.json(result);
    } catch (error) {
      console.error("Error fetching streak:", error);
      res.status(500).json({ error: "Failed to fetch streak data" });
    }
  });
  app2.get("/api/v1/consistency/month", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const yearParam = req.query.year;
      const monthParam = req.query.month;
      if (!yearParam || !monthParam) {
        return res.status(400).json({ error: "year and month query parameters are required" });
      }
      const year = parseInt(yearParam, 10);
      const month = parseInt(monthParam, 10);
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ error: "Invalid year or month" });
      }
      const days = await storage.getConsistencyMonth(req.user.sub, year, month);
      res.json({ year, month, days });
    } catch (error) {
      console.error("Error fetching consistency month:", error);
      res.status(500).json({ error: "Failed to fetch consistency data" });
    }
  });
  app2.get("/api/v1/consistency/range", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const todayDate = req.query.today;
      if (!todayDate || !/^\d{4}-\d{2}-\d{2}$/.test(todayDate)) {
        return res.status(400).json({ error: "today query parameter required (YYYY-MM-DD)" });
      }
      const currentMonth = todayDate.slice(0, 7);
      const rangeData = await storage.getConsistencyRange(req.user.sub);
      const currentStreak = await storage.getCurrentStreak(req.user.sub, todayDate);
      res.json({
        startMonth: rangeData.startMonth,
        currentMonth,
        currentStreak
      });
    } catch (error) {
      console.error("Error fetching consistency range:", error);
      res.status(500).json({ error: "Failed to fetch consistency range" });
    }
  });
  app2.get("/api/v1/badges", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const badges = await storage.getUserBadges(req.user.sub);
      res.json({ badges });
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ error: "Failed to fetch badges" });
    }
  });
  app2.post("/api/v1/badges/evaluate", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { evaluateBadges: evaluateBadges2 } = await Promise.resolve().then(() => (init_badgeService(), badgeService_exports));
      const todayDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const newlyAwardedBadges = await evaluateBadges2(req.user.sub, todayDate);
      res.json({
        newBadges: newlyAwardedBadges,
        hasNewBadges: newlyAwardedBadges.length > 0
      });
    } catch (error) {
      console.error("Error evaluating badges:", error);
      res.status(500).json({ error: "Failed to evaluate badges" });
    }
  });
  app2.post("/api/v1/activity/log", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { lessonId, lessonName, featureType, activityDate } = req.body;
      if (!lessonId || typeof lessonId !== "number") {
        return res.status(400).json({ error: "lessonId is required and must be a number" });
      }
      if (!lessonName || typeof lessonName !== "string") {
        return res.status(400).json({ error: "lessonName is required" });
      }
      if (!featureType || !["PROCESS", "PLAYLIST"].includes(featureType)) {
        return res.status(400).json({ error: "featureType must be PROCESS or PLAYLIST" });
      }
      const dateToUse = activityDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const result = await storage.logActivity(
        req.user.sub,
        lessonId,
        lessonName,
        featureType,
        dateToUse
      );
      res.json({ success: true, logged: result.logged });
    } catch (error) {
      console.error("Error logging activity:", error);
      res.status(500).json({ error: "Failed to log activity" });
    }
  });
  app2.get("/api/v1/activity/monthly-stats", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const month = req.query.month || (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
      console.log(`[monthly-stats] Fetching stats for userId=${req.user.sub}, month=${month}`);
      const stats = await storage.getMonthlyStats(req.user.sub, month);
      console.log(`[monthly-stats] Results: PROCESS=${stats.PROCESS.length}, PLAYLIST=${stats.PLAYLIST.length}`);
      res.set("Cache-Control", "no-store");
      res.json(stats);
    } catch (error) {
      console.error("Error fetching monthly stats:", error);
      res.status(500).json({ error: "Failed to fetch monthly stats" });
    }
  });
  app2.get("/api/v1/rewiring-beliefs", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const beliefs = await storage.getRewiringBeliefsByUserId(req.user.sub);
      res.json(beliefs);
    } catch (error) {
      console.error("Error fetching rewiring beliefs:", error);
      res.status(500).json({ error: "Failed to fetch beliefs" });
    }
  });
  app2.post("/api/v1/rewiring-beliefs", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { limitingBelief, upliftingBelief } = req.body;
      if (!limitingBelief || typeof limitingBelief !== "string" || !limitingBelief.trim()) {
        return res.status(400).json({ error: "Limiting belief is required" });
      }
      if (!upliftingBelief || typeof upliftingBelief !== "string" || !upliftingBelief.trim()) {
        return res.status(400).json({ error: "Uplifting belief is required" });
      }
      const belief = await storage.createRewiringBelief({
        userId: req.user.sub,
        limitingBelief: limitingBelief.trim(),
        upliftingBelief: upliftingBelief.trim()
      });
      res.status(201).json(belief);
    } catch (error) {
      console.error("Error creating rewiring belief:", error);
      res.status(500).json({ error: "Failed to create belief" });
    }
  });
  app2.put("/api/v1/rewiring-beliefs/:id", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid belief ID" });
      }
      const { limitingBelief, upliftingBelief } = req.body;
      const updates = {};
      if (limitingBelief !== void 0) {
        if (typeof limitingBelief !== "string" || !limitingBelief.trim()) {
          return res.status(400).json({ error: "Limiting belief cannot be empty" });
        }
        updates.limitingBelief = limitingBelief.trim();
      }
      if (upliftingBelief !== void 0) {
        if (typeof upliftingBelief !== "string" || !upliftingBelief.trim()) {
          return res.status(400).json({ error: "Uplifting belief cannot be empty" });
        }
        updates.upliftingBelief = upliftingBelief.trim();
      }
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No updates provided" });
      }
      const updated = await storage.updateRewiringBelief(id, req.user.sub, updates);
      if (!updated) {
        return res.status(404).json({ error: "Belief not found or not authorized" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating rewiring belief:", error);
      res.status(500).json({ error: "Failed to update belief" });
    }
  });
  app2.delete("/api/v1/rewiring-beliefs/:id", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid belief ID" });
      }
      const success = await storage.deleteRewiringBelief(id, req.user.sub);
      if (!success) {
        return res.status(404).json({ error: "Belief not found or not authorized" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting rewiring belief:", error);
      res.status(500).json({ error: "Failed to delete belief" });
    }
  });
  app2.get("/api/admin/sessions", requireAdmin, async (req, res) => {
    try {
      const sessions = await storage.getAllCommunitySessions();
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching admin sessions:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });
  app2.post("/api/admin/sessions", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertCommunitySessionSchema.parse(req.body);
      const session = await storage.createCommunitySession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error creating session:", error);
        res.status(500).json({ error: "Failed to create session" });
      }
    }
  });
  app2.put("/api/admin/sessions/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCommunitySessionSchema.partial().parse(req.body);
      const session = await storage.updateCommunitySession(id, validatedData);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      res.json(session);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error updating session:", error);
        res.status(500).json({ error: "Failed to update session" });
      }
    }
  });
  app2.delete("/api/admin/sessions/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCommunitySession(id);
      if (!success) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting session:", error);
      res.status(500).json({ error: "Failed to delete session" });
    }
  });
  app2.get("/admin/v1/dashboard", requireAdmin, async (req, res) => {
    try {
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split("T")[0];
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const sevenDaysLater = new Date(today);
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      const twentyFourHoursAgo = /* @__PURE__ */ new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      const [
        totalUsersResult,
        activeTodayResult,
        practisedTodayResult,
        badgesEarnedTodayResult
      ] = await Promise.all([
        // Total registered users
        db.select({ count: count2() }).from(users).where(eq2(users.role, "USER")),
        // Users active today (lastActivity = today)
        db.select({ count: count2() }).from(users).where(and2(eq2(users.role, "USER"), gte(users.lastActivity, today))),
        // Users who practiced today (PROCESS or PLAYLIST feature types)
        db.select({ count: countDistinct(activityLogs.userId) }).from(activityLogs).where(and2(
          eq2(activityLogs.activityDate, todayStr),
          or2(
            eq2(activityLogs.featureType, "PROCESS"),
            eq2(activityLogs.featureType, "PLAYLIST")
          )
        )),
        // Badges earned today
        db.select({ count: count2() }).from(userBadges).where(gte(userBadges.earnedAt, today))
      ]);
      const [eventsToday, upcomingEvents] = await Promise.all([
        // Events happening today
        db.select().from(events).where(and2(
          gte(events.startDatetime, today),
          lt(events.startDatetime, tomorrow)
        )).orderBy(asc2(events.startDatetime)),
        // Events in next 7 days (excluding today)
        db.select().from(events).where(and2(
          gte(events.startDatetime, tomorrow),
          lt(events.startDatetime, sevenDaysLater)
        )).orderBy(asc2(events.startDatetime))
      ]);
      const [failedNotificationsResult, usersWithDeviceTokens, totalUserCount] = await Promise.all([
        // Failed notifications in last 24 hours
        db.select({ count: count2() }).from(notificationLogs).where(and2(
          eq2(notificationLogs.status, "failed"),
          gte(notificationLogs.createdAt, twentyFourHoursAgo)
        )),
        // Count of unique users with device tokens
        db.select({ count: countDistinct(deviceTokens.userId) }).from(deviceTokens),
        // Total users
        db.select({ count: count2() }).from(users).where(eq2(users.role, "USER"))
      ]);
      const usersWithNotificationsDisabled = (totalUserCount[0]?.count ?? 0) - (usersWithDeviceTokens[0]?.count ?? 0);
      const [communityPracticesResult] = await Promise.all([
        db.select({ count: count2() }).from(communitySessions)
      ]);
      const [totalCoursesResult, publishedCoursesResult, lastUpdatedCourseResult] = await Promise.all([
        // Total courses
        db.select({ count: count2() }).from(cmsCourses),
        // Published courses
        db.select({ count: count2() }).from(cmsCourses).where(eq2(cmsCourses.isPublished, true)),
        // Last updated course
        db.select({
          id: cmsCourses.id,
          title: cmsCourses.title,
          updatedAt: cmsCourses.updatedAt
        }).from(cmsCourses).orderBy(desc2(cmsCourses.updatedAt)).limit(1)
      ]);
      const getEventStatus = (event) => {
        const now = /* @__PURE__ */ new Date();
        if (now < event.startDatetime) return "upcoming";
        if (now >= event.startDatetime && now <= event.endDatetime) return "live";
        return "completed";
      };
      res.json({
        kpis: {
          totalUsers: totalUsersResult[0]?.count ?? 0,
          activeToday: activeTodayResult[0]?.count ?? 0,
          practisedToday: practisedTodayResult[0]?.count ?? 0,
          badgesEarnedToday: badgesEarnedTodayResult[0]?.count ?? 0
        },
        events: {
          today: eventsToday.map((e) => ({
            id: e.id,
            title: e.title,
            startDatetime: e.startDatetime,
            endDatetime: e.endDatetime,
            status: getEventStatus(e)
          })),
          upcoming: upcomingEvents.map((e) => ({
            id: e.id,
            title: e.title,
            startDatetime: e.startDatetime,
            endDatetime: e.endDatetime,
            status: getEventStatus(e)
          }))
        },
        notifications: {
          failedLast24h: failedNotificationsResult[0]?.count ?? 0,
          usersDisabled: usersWithNotificationsDisabled
        },
        communityPractices: {
          total: communityPracticesResult[0]?.count ?? 0
        },
        cmsHealth: {
          totalCourses: totalCoursesResult[0]?.count ?? 0,
          publishedCourses: publishedCoursesResult[0]?.count ?? 0,
          lastUpdatedCourse: lastUpdatedCourseResult[0] ? {
            title: lastUpdatedCourseResult[0].title,
            updatedAt: lastUpdatedCourseResult[0].updatedAt
          } : null
        }
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });
  app2.get("/admin/v1/students", requireAdmin, async (req, res) => {
    try {
      const search = req.query.search;
      const program = req.query.program;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const result = await storage.getStudents({
        search,
        programCode: program,
        page,
        limit
      });
      res.json(result);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });
  app2.get("/admin/v1/students/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const student = await storage.getStudentById(id);
      if (!student) {
        res.status(404).json({ error: "Student not found" });
        return;
      }
      res.json(student);
    } catch (error) {
      console.error("Error fetching student:", error);
      res.status(500).json({ error: "Failed to fetch student" });
    }
  });
  app2.post("/admin/v1/students", requireAdmin, async (req, res) => {
    try {
      const { name, email, phone, password, programCode } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
      }
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }
      const passwordHash = await bcrypt.hash(password || "User@123", 10);
      const student = await storage.createStudent(
        {
          name,
          email,
          phone: phone || null,
          passwordHash,
          role: "USER",
          status: "active"
        },
        programCode
      );
      res.status(201).json({ message: "Student added", userId: student.id });
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(500).json({ error: "Failed to create student" });
    }
  });
  app2.put("/admin/v1/students/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, email, phone, status, programCode } = req.body;
      const student = await storage.updateStudent(
        id,
        { name, email, phone, status },
        programCode
      );
      if (!student) {
        res.status(404).json({ error: "Student not found" });
        return;
      }
      res.json({ message: "Student updated" });
    } catch (error) {
      console.error("Error updating student:", error);
      res.status(500).json({ error: "Failed to update student" });
    }
  });
  app2.patch("/admin/v1/students/:id/status", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      if (!["active", "blocked"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const student = await storage.updateStudentStatus(id, status);
      if (!student) {
        res.status(404).json({ error: "Student not found" });
        return;
      }
      res.json({ message: "Status updated" });
    } catch (error) {
      console.error("Error updating student status:", error);
      res.status(500).json({ error: "Failed to update status" });
    }
  });
  app2.delete("/admin/v1/students/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteStudent(id);
      if (!success) {
        res.status(404).json({ error: "Student not found" });
        return;
      }
      res.json({ message: "Student deleted" });
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ error: "Failed to delete student" });
    }
  });
  app2.get("/admin/v1/students/:id/badges", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const badges = await storage.getUserBadges(id);
      res.json({ badges });
    } catch (error) {
      console.error("Error fetching student badges:", error);
      res.status(500).json({ error: "Failed to fetch badges" });
    }
  });
  app2.post("/admin/v1/students/:id/badges", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { badgeKey } = req.body;
      if (!badgeKey || !["ambassador", "hall_of_fame"].includes(badgeKey)) {
        return res.status(400).json({ error: "badgeKey must be 'ambassador' or 'hall_of_fame'" });
      }
      const student = await storage.getStudentById(id);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      const { awardAdminBadge: awardAdminBadge2 } = await Promise.resolve().then(() => (init_badgeService(), badgeService_exports));
      const result = await awardAdminBadge2(id, badgeKey);
      if (result.alreadyEarned) {
        return res.status(409).json({ error: "Badge already earned" });
      }
      if (!result.success) {
        return res.status(500).json({ error: "Failed to award badge" });
      }
      res.json({ message: "Badge awarded successfully", badgeKey });
    } catch (error) {
      console.error("Error granting badge:", error);
      res.status(500).json({ error: "Failed to grant badge" });
    }
  });
  app2.get("/api/admin/students/sample-csv", requireAdmin, (req, res) => {
    const sampleCSV = `full_name,email,phone
John Doe,john.doe@example.com,+1234567890
Jane Smith,jane.smith@example.com,
Bob Wilson,bob.wilson@example.com,+9876543210`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=student_upload_sample.csv");
    res.send(sampleCSV);
  });
  const uploadCSV = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    // 5MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
        cb(null, true);
      } else {
        cb(new Error("Only CSV files are allowed"));
      }
    }
  });
  app2.post("/api/admin/students/bulk-upload", requireAdmin, uploadCSV.single("file"), async (req, res) => {
    try {
      const { parse } = await import("csv-parse/sync");
      if (!req.file) {
        return res.status(400).json({ error: "CSV file is required" });
      }
      const programId = req.body.programId;
      if (!programId) {
        return res.status(400).json({ error: "Program is required" });
      }
      const program = await storage.getProgramById(parseInt(programId));
      if (!program) {
        return res.status(400).json({ error: "Invalid program selected" });
      }
      const csvContent = req.file.buffer.toString("utf-8");
      let records;
      try {
        records = parse(csvContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          relax_column_count: true
        });
      } catch (parseError) {
        return res.status(400).json({ error: "Invalid CSV format. Please check file structure." });
      }
      if (records.length > 1e3) {
        return res.status(400).json({ error: "Maximum 1000 rows allowed per upload" });
      }
      const errors = [];
      let created = 0;
      const defaultPassword = "User@123";
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const rowNumber = i + 2;
        const fullName = (row.full_name || row.name || "").trim();
        if (!fullName) {
          errors.push({ row: rowNumber, reason: "Missing full_name" });
          continue;
        }
        const email = (row.email || "").trim().toLowerCase();
        if (!email) {
          errors.push({ row: rowNumber, reason: "Missing email" });
          continue;
        }
        if (!emailRegex.test(email)) {
          errors.push({ row: rowNumber, reason: "Invalid email format" });
          continue;
        }
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          errors.push({ row: rowNumber, reason: "Email already exists" });
          continue;
        }
        const phone = (row.phone || "").trim() || null;
        try {
          await storage.createStudent(
            {
              name: fullName,
              email,
              phone,
              passwordHash,
              role: "USER",
              status: "active"
            },
            program.code
            // Always use program from modal, not CSV
          );
          created++;
        } catch (createError) {
          errors.push({ row: rowNumber, reason: createError.message || "Failed to create student" });
        }
      }
      res.json({
        totalRows: records.length,
        created,
        skipped: errors.length,
        errors
      });
    } catch (error) {
      console.error("Error in bulk upload:", error);
      res.status(500).json({ error: "Failed to process bulk upload" });
    }
  });
  app2.get("/admin/v1/programs", requireAdmin, async (req, res) => {
    try {
      const programs2 = await storage.getAllPrograms();
      res.json(programs2);
    } catch (error) {
      console.error("Error fetching programs:", error);
      res.status(500).json({ error: "Failed to fetch programs" });
    }
  });
  app2.get("/admin/v1/admins", requireAdmin, async (req, res) => {
    try {
      const search = req.query.search;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const result = await storage.getAdmins({ search, page, limit });
      res.json(result);
    } catch (error) {
      console.error("Error fetching admins:", error);
      res.status(500).json({ error: "Failed to fetch admins" });
    }
  });
  app2.get("/admin/v1/admins/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const admin2 = await storage.getAdminById(id);
      if (!admin2) {
        res.status(404).json({ error: "Admin not found" });
        return;
      }
      res.json(admin2);
    } catch (error) {
      console.error("Error fetching admin:", error);
      res.status(500).json({ error: "Failed to fetch admin" });
    }
  });
  app2.post("/admin/v1/admins", requireSuperAdmin, async (req, res) => {
    try {
      const { name, email, phone, password, role, status } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
      }
      if (!["SUPER_ADMIN", "COACH"].includes(role)) {
        return res.status(400).json({ error: "Role must be SUPER_ADMIN or COACH" });
      }
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }
      const passwordHash = await bcrypt.hash(password || "Admin@123", 10);
      const admin2 = await storage.createAdmin({
        name,
        email,
        phone: phone || null,
        passwordHash,
        role,
        status: status || "active"
      });
      res.status(201).json({ message: "Admin created", adminId: admin2.id });
    } catch (error) {
      console.error("Error creating admin:", error);
      res.status(500).json({ error: "Failed to create admin" });
    }
  });
  app2.put("/admin/v1/admins/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, email, role, status } = req.body;
      if (role && !["SUPER_ADMIN", "COACH"].includes(role)) {
        return res.status(400).json({ error: "Role must be SUPER_ADMIN or COACH" });
      }
      const admin2 = await storage.updateAdmin(id, {
        name,
        email,
        role,
        status
      });
      if (!admin2) {
        res.status(404).json({ error: "Admin not found" });
        return;
      }
      res.json({ message: "Admin updated" });
    } catch (error) {
      console.error("Error updating admin:", error);
      res.status(500).json({ error: "Failed to update admin" });
    }
  });
  app2.patch(
    "/admin/v1/admins/:id/status",
    requireSuperAdmin,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const { status } = req.body;
        if (!["active", "blocked"].includes(status)) {
          return res.status(400).json({ error: "Invalid status" });
        }
        if (req.user && req.user.sub === id) {
          return res.status(400).json({ error: "Cannot change your own status" });
        }
        const admin2 = await storage.updateAdminStatus(id, status);
        if (!admin2) {
          res.status(404).json({ error: "Admin not found" });
          return;
        }
        res.json({ message: "Status updated" });
      } catch (error) {
        console.error("Error updating admin status:", error);
        res.status(500).json({ error: "Failed to update status" });
      }
    }
  );
  app2.delete("/admin/v1/admins/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (req.user && req.user.sub === id) {
        return res.status(400).json({ error: "Cannot delete yourself" });
      }
      const success = await storage.deleteAdmin(id);
      if (!success) {
        res.status(404).json({ error: "Admin not found" });
        return;
      }
      res.json({ message: "Admin deleted" });
    } catch (error) {
      console.error("Error deleting admin:", error);
      res.status(500).json({ error: "Failed to delete admin" });
    }
  });
  app2.get("/api/categories", async (req, res) => {
    try {
      const categories2 = await storage.getAllCategories();
      res.json(categories2);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });
  app2.post("/api/admin/categories", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error creating category:", error);
        res.status(500).json({ error: "Failed to create category" });
      }
    }
  });
  app2.get("/api/articles", async (req, res) => {
    try {
      const articles2 = await storage.getPublishedArticles();
      res.json(articles2);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });
  app2.get("/api/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const article = await storage.getArticle(id);
      if (!article || !article.isPublished) {
        res.status(404).json({ error: "Article not found" });
        return;
      }
      res.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });
  app2.get("/api/admin/articles", requireAdmin, async (req, res) => {
    try {
      const articles2 = await storage.getAllArticles();
      res.json(articles2);
    } catch (error) {
      console.error("Error fetching admin articles:", error);
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });
  app2.post("/api/admin/articles", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertArticleSchema.parse(req.body);
      const article = await storage.createArticle(validatedData);
      res.status(201).json(article);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error creating article:", error);
        res.status(500).json({ error: "Failed to create article" });
      }
    }
  });
  app2.put("/api/admin/articles/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertArticleSchema.partial().parse(req.body);
      const article = await storage.updateArticle(id, validatedData);
      if (!article) {
        res.status(404).json({ error: "Article not found" });
        return;
      }
      res.json(article);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error updating article:", error);
        res.status(500).json({ error: "Failed to update article" });
      }
    }
  });
  app2.delete("/api/admin/articles/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteArticle(id);
      if (!success) {
        res.status(404).json({ error: "Article not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting article:", error);
      res.status(500).json({ error: "Failed to delete article" });
    }
  });
  app2.post(
    "/api/admin/upload/article-image",
    requireAdmin,
    uploadArticleImage.single("image"),
    (req, res) => {
      try {
        if (!req.file) {
          res.status(400).json({ error: "No file uploaded" });
          return;
        }
        const imageUrl = `/articles/${req.file.filename}`;
        res.json({ imageUrl });
      } catch (error) {
        console.error("Error uploading image:", error);
        res.status(500).json({ error: "Failed to upload image" });
      }
    }
  );
  app2.get("/api/admin/v1/programs", requireAdmin, async (req, res) => {
    try {
      const allPrograms = await db.select().from(programs).orderBy(asc2(programs.name));
      res.json(allPrograms);
    } catch (error) {
      console.error("Error fetching programs:", error);
      res.status(500).json({ error: "Failed to fetch programs" });
    }
  });
  app2.post("/api/admin/v1/programs", requireAdmin, async (req, res) => {
    try {
      const { code, name } = req.body;
      if (!code || !name) {
        res.status(400).json({ error: "Code and name are required" });
        return;
      }
      const [newProgram] = await db.insert(programs).values({
        code: String(code).toUpperCase(),
        name: String(name)
      }).returning();
      res.status(201).json(newProgram);
    } catch (error) {
      console.error("Error creating program:", error);
      if (error.code === "23505") {
        res.status(409).json({ error: "A program with this code already exists" });
        return;
      }
      res.status(500).json({ error: "Failed to create program" });
    }
  });
  app2.put("/api/admin/v1/programs/:id", requireAdmin, async (req, res) => {
    try {
      const programId = parseInt(req.params.id);
      const { code, name } = req.body;
      const [updated] = await db.update(programs).set({
        ...code && { code: String(code).toUpperCase() },
        ...name && { name: String(name) }
      }).where(eq2(programs.id, programId)).returning();
      if (!updated) {
        res.status(404).json({ error: "Program not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating program:", error);
      if (error.code === "23505") {
        res.status(409).json({ error: "A program with this code already exists" });
        return;
      }
      res.status(500).json({ error: "Failed to update program" });
    }
  });
  app2.delete("/api/admin/v1/programs/:id", requireAdmin, async (req, res) => {
    try {
      const programId = parseInt(req.params.id);
      const linkedCourses = await db.select({ id: cmsCourses.id }).from(cmsCourses).where(eq2(cmsCourses.programId, programId));
      if (linkedCourses.length > 0) {
        res.status(400).json({
          error: "Cannot delete program",
          message: `This program is linked to ${linkedCourses.length} course(s). Please reassign or delete those courses first.`
        });
        return;
      }
      const [deleted] = await db.delete(programs).where(eq2(programs.id, programId)).returning();
      if (!deleted) {
        res.status(404).json({ error: "Program not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting program:", error);
      res.status(500).json({ error: "Failed to delete program" });
    }
  });
  app2.get("/api/admin/v1/cms/courses", requireAdmin, async (req, res) => {
    try {
      const { search, programId, sortOrder = "asc" } = req.query;
      const courses = await db.select().from(cmsCourses).orderBy(
        sortOrder === "desc" ? sql3`position DESC` : asc2(cmsCourses.position)
      );
      let filteredCourses = courses;
      if (search) {
        const searchLower = String(search).toLowerCase();
        filteredCourses = filteredCourses.filter(
          (c) => c.title.toLowerCase().includes(searchLower)
        );
      }
      if (programId) {
        const pid = parseInt(String(programId));
        filteredCourses = filteredCourses.filter((c) => c.programId === pid);
      }
      const coursesWithSignedUrls = await Promise.all(
        filteredCourses.map(async (course) => {
          let thumbnailSignedUrl = null;
          if (course.thumbnailKey) {
            const signedResult = await getSignedGetUrl(course.thumbnailKey);
            if (signedResult.success && signedResult.url) {
              thumbnailSignedUrl = signedResult.url;
            }
          }
          return { ...course, thumbnailSignedUrl };
        })
      );
      res.json(coursesWithSignedUrls);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });
  app2.get("/api/admin/v1/cms/courses/:id", requireAdmin, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const [course] = await db.select().from(cmsCourses).where(eq2(cmsCourses.id, courseId));
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      let programCode = null;
      if (course.programId) {
        const [program] = await db.select({ code: programs.code }).from(programs).where(eq2(programs.id, course.programId));
        programCode = program?.code || null;
      }
      let thumbnailSignedUrl = null;
      if (course.thumbnailKey) {
        const signedResult = await getSignedGetUrl(course.thumbnailKey);
        if (signedResult.success && signedResult.url) {
          thumbnailSignedUrl = signedResult.url;
        }
      }
      const modules = await db.select().from(cmsModules).where(eq2(cmsModules.courseId, courseId)).orderBy(asc2(cmsModules.position));
      const modulesWithContent = await Promise.all(
        modules.map(async (module) => {
          const folders = await db.select().from(cmsModuleFolders).where(eq2(cmsModuleFolders.moduleId, module.id)).orderBy(asc2(cmsModuleFolders.position));
          const lessons = await db.select().from(cmsLessons).where(eq2(cmsLessons.moduleId, module.id)).orderBy(asc2(cmsLessons.position));
          const lessonsWithFiles = await Promise.all(
            lessons.map(async (lesson) => {
              const files = await db.select().from(cmsLessonFiles).where(eq2(cmsLessonFiles.lessonId, lesson.id)).orderBy(asc2(cmsLessonFiles.position));
              return { ...lesson, files };
            })
          );
          return { ...module, folders, lessons: lessonsWithFiles };
        })
      );
      res.json({ ...course, programCode, thumbnailSignedUrl, modules: modulesWithContent });
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });
  app2.post("/api/admin/v1/cms/courses", requireAdmin, async (req, res) => {
    try {
      const parsed = insertCmsCourseSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid course data", details: parsed.error.errors });
        return;
      }
      const [maxPos] = await db.select({ max: sql3`COALESCE(MAX(position), 0)` }).from(cmsCourses);
      const position = (maxPos?.max || 0) + 1;
      const adminId = req.user?.sub || null;
      const [course] = await db.insert(cmsCourses).values({
        ...parsed.data,
        position,
        createdByAdminId: adminId
      }).returning();
      res.status(201).json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ error: "Failed to create course" });
    }
  });
  app2.put("/api/admin/v1/cms/courses/:id", requireAdmin, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const [existing] = await db.select().from(cmsCourses).where(eq2(cmsCourses.id, courseId));
      if (!existing) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      const [updated] = await db.update(cmsCourses).set({ ...req.body, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(cmsCourses.id, courseId)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ error: "Failed to update course" });
    }
  });
  app2.delete(
    "/api/admin/v1/cms/courses/:id",
    requireAdmin,
    async (req, res) => {
      try {
        const courseId = parseInt(req.params.id);
        await db.delete(cmsCourses).where(eq2(cmsCourses.id, courseId));
        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting course:", error);
        res.status(500).json({ error: "Failed to delete course" });
      }
    }
  );
  app2.patch(
    "/api/admin/v1/cms/courses/:id/publish",
    requireAdmin,
    async (req, res) => {
      try {
        const courseId = parseInt(req.params.id);
        const { isPublished } = req.body;
        if (typeof isPublished !== "boolean") {
          res.status(400).json({ error: "isPublished must be a boolean" });
          return;
        }
        const [updated] = await db.update(cmsCourses).set({ isPublished, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(cmsCourses.id, courseId)).returning();
        if (!updated) {
          res.status(404).json({ error: "Course not found" });
          return;
        }
        res.json(updated);
      } catch (error) {
        console.error("Error toggling course publish:", error);
        res.status(500).json({ error: "Failed to toggle course publish" });
      }
    }
  );
  app2.patch(
    "/api/admin/v1/cms/courses/reorder",
    requireAdmin,
    async (req, res) => {
      try {
        const { items } = req.body;
        if (!Array.isArray(items)) {
          res.status(400).json({ error: "Invalid reorder data" });
          return;
        }
        await Promise.all(
          items.map(
            (item) => db.update(cmsCourses).set({ position: item.position, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(cmsCourses.id, item.id))
          )
        );
        res.json({ success: true });
      } catch (error) {
        console.error("Error reordering courses:", error);
        res.status(500).json({ error: "Failed to reorder courses" });
      }
    }
  );
  app2.get("/api/admin/v1/cms/modules", requireAdmin, async (req, res) => {
    try {
      const courseId = parseInt(req.query.courseId);
      if (!courseId) {
        res.status(400).json({ error: "courseId is required" });
        return;
      }
      const modules = await db.select().from(cmsModules).where(eq2(cmsModules.courseId, courseId)).orderBy(asc2(cmsModules.position));
      res.json(modules);
    } catch (error) {
      console.error("Error fetching modules:", error);
      res.status(500).json({ error: "Failed to fetch modules" });
    }
  });
  app2.get(
    "/api/admin/v1/cms/courses/:courseId/modules",
    requireAdmin,
    async (req, res) => {
      try {
        const courseId = parseInt(req.params.courseId);
        if (!courseId || isNaN(courseId)) {
          res.status(400).json({ error: "Valid courseId is required" });
          return;
        }
        const modules = await db.select().from(cmsModules).where(eq2(cmsModules.courseId, courseId)).orderBy(asc2(cmsModules.position));
        res.json(modules);
      } catch (error) {
        console.error("Error fetching modules for course:", error);
        res.status(500).json({ error: "Failed to fetch modules" });
      }
    }
  );
  app2.post("/api/admin/v1/cms/modules", requireAdmin, async (req, res) => {
    try {
      const parsed = insertCmsModuleSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid module data", details: parsed.error.errors });
        return;
      }
      const [maxPos] = await db.select({ max: sql3`COALESCE(MAX(position), 0)` }).from(cmsModules).where(eq2(cmsModules.courseId, parsed.data.courseId));
      const position = (maxPos?.max || 0) + 1;
      const [module] = await db.insert(cmsModules).values({
        ...parsed.data,
        position
      }).returning();
      res.status(201).json(module);
    } catch (error) {
      console.error("Error creating module:", error);
      res.status(500).json({ error: "Failed to create module" });
    }
  });
  app2.put("/api/admin/v1/cms/modules/:id", requireAdmin, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const [updated] = await db.update(cmsModules).set({ ...req.body, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(cmsModules.id, moduleId)).returning();
      if (!updated) {
        res.status(404).json({ error: "Module not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating module:", error);
      res.status(500).json({ error: "Failed to update module" });
    }
  });
  app2.delete(
    "/api/admin/v1/cms/modules/:id",
    requireAdmin,
    async (req, res) => {
      try {
        const moduleId = parseInt(req.params.id);
        await db.delete(cmsModules).where(eq2(cmsModules.id, moduleId));
        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting module:", error);
        res.status(500).json({ error: "Failed to delete module" });
      }
    }
  );
  app2.patch(
    "/api/admin/v1/cms/modules/reorder",
    requireAdmin,
    async (req, res) => {
      try {
        const { items } = req.body;
        await Promise.all(
          items.map(
            (item) => db.update(cmsModules).set({ position: item.position, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(cmsModules.id, item.id))
          )
        );
        res.json({ success: true });
      } catch (error) {
        console.error("Error reordering modules:", error);
        res.status(500).json({ error: "Failed to reorder modules" });
      }
    }
  );
  app2.get("/api/admin/v1/cms/folders", requireAdmin, async (req, res) => {
    try {
      const moduleId = parseInt(req.query.moduleId);
      if (!moduleId) {
        res.status(400).json({ error: "moduleId is required" });
        return;
      }
      const folders = await db.select().from(cmsModuleFolders).where(eq2(cmsModuleFolders.moduleId, moduleId)).orderBy(asc2(cmsModuleFolders.position));
      res.json(folders);
    } catch (error) {
      console.error("Error fetching folders:", error);
      res.status(500).json({ error: "Failed to fetch folders" });
    }
  });
  app2.post("/api/admin/v1/cms/folders", requireAdmin, async (req, res) => {
    try {
      const parsed = insertCmsModuleFolderSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid folder data", details: parsed.error.errors });
        return;
      }
      const [maxPos] = await db.select({ max: sql3`COALESCE(MAX(position), 0)` }).from(cmsModuleFolders).where(eq2(cmsModuleFolders.moduleId, parsed.data.moduleId));
      const position = (maxPos?.max || 0) + 1;
      const [folder] = await db.insert(cmsModuleFolders).values({
        ...parsed.data,
        position
      }).returning();
      res.status(201).json(folder);
    } catch (error) {
      console.error("Error creating folder:", error);
      res.status(500).json({ error: "Failed to create folder" });
    }
  });
  app2.put("/api/admin/v1/cms/folders/:id", requireAdmin, async (req, res) => {
    try {
      const folderId = parseInt(req.params.id);
      const [updated] = await db.update(cmsModuleFolders).set({ ...req.body, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(cmsModuleFolders.id, folderId)).returning();
      if (!updated) {
        res.status(404).json({ error: "Folder not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating folder:", error);
      res.status(500).json({ error: "Failed to update folder" });
    }
  });
  app2.delete(
    "/api/admin/v1/cms/folders/:id",
    requireAdmin,
    async (req, res) => {
      try {
        const folderId = parseInt(req.params.id);
        await db.delete(cmsModuleFolders).where(eq2(cmsModuleFolders.id, folderId));
        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting folder:", error);
        res.status(500).json({ error: "Failed to delete folder" });
      }
    }
  );
  app2.patch(
    "/api/admin/v1/cms/folders/reorder",
    requireAdmin,
    async (req, res) => {
      try {
        const { items } = req.body;
        await Promise.all(
          items.map(
            (item) => db.update(cmsModuleFolders).set({ position: item.position, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(cmsModuleFolders.id, item.id))
          )
        );
        res.json({ success: true });
      } catch (error) {
        console.error("Error reordering folders:", error);
        res.status(500).json({ error: "Failed to reorder folders" });
      }
    }
  );
  app2.get("/api/admin/v1/cms/lessons", requireAdmin, async (req, res) => {
    try {
      const moduleId = parseInt(req.query.moduleId);
      const folderId = req.query.folderId ? parseInt(req.query.folderId) : null;
      if (!moduleId) {
        res.status(400).json({ error: "moduleId is required" });
        return;
      }
      let query = db.select().from(cmsLessons).where(eq2(cmsLessons.moduleId, moduleId));
      const lessons = await query.orderBy(asc2(cmsLessons.position));
      const filteredLessons = folderId !== null ? lessons.filter((l) => l.folderId === folderId) : lessons;
      res.json(filteredLessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });
  app2.get("/api/admin/v1/cms/lessons/:id", requireAdmin, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const [lesson] = await db.select().from(cmsLessons).where(eq2(cmsLessons.id, lessonId));
      if (!lesson) {
        res.status(404).json({ error: "Lesson not found" });
        return;
      }
      const files = await db.select().from(cmsLessonFiles).where(eq2(cmsLessonFiles.lessonId, lessonId)).orderBy(asc2(cmsLessonFiles.position));
      res.json({ ...lesson, files });
    } catch (error) {
      console.error("Error fetching lesson:", error);
      res.status(500).json({ error: "Failed to fetch lesson" });
    }
  });
  app2.post("/api/admin/v1/cms/lessons", requireAdmin, async (req, res) => {
    try {
      const parsed = insertCmsLessonSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid lesson data", details: parsed.error.errors });
        return;
      }
      const [maxPos] = await db.select({ max: sql3`COALESCE(MAX(position), 0)` }).from(cmsLessons).where(eq2(cmsLessons.moduleId, parsed.data.moduleId));
      const position = (maxPos?.max || 0) + 1;
      const [lesson] = await db.insert(cmsLessons).values({
        ...parsed.data,
        position
      }).returning();
      res.status(201).json(lesson);
    } catch (error) {
      console.error("Error creating lesson:", error);
      res.status(500).json({ error: "Failed to create lesson" });
    }
  });
  app2.put("/api/admin/v1/cms/lessons/:id", requireAdmin, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const [updated] = await db.update(cmsLessons).set({ ...req.body, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(cmsLessons.id, lessonId)).returning();
      if (!updated) {
        res.status(404).json({ error: "Lesson not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating lesson:", error);
      res.status(500).json({ error: "Failed to update lesson" });
    }
  });
  app2.delete(
    "/api/admin/v1/cms/lessons/:id",
    requireAdmin,
    async (req, res) => {
      try {
        const lessonId = parseInt(req.params.id);
        const files = await db.select().from(cmsLessonFiles).where(eq2(cmsLessonFiles.lessonId, lessonId));
        for (const file of files) {
          await deleteR2Object(file.r2Key);
        }
        await db.delete(cmsLessons).where(eq2(cmsLessons.id, lessonId));
        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting lesson:", error);
        res.status(500).json({ error: "Failed to delete lesson" });
      }
    }
  );
  app2.patch(
    "/api/admin/v1/cms/lessons/reorder",
    requireAdmin,
    async (req, res) => {
      try {
        const { items } = req.body;
        await Promise.all(
          items.map(
            (item) => db.update(cmsLessons).set({ position: item.position, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(cmsLessons.id, item.id))
          )
        );
        res.json({ success: true });
      } catch (error) {
        console.error("Error reordering lessons:", error);
        res.status(500).json({ error: "Failed to reorder lessons" });
      }
    }
  );
  app2.get("/api/admin/v1/cms/files", requireAdmin, async (req, res) => {
    try {
      const lessonId = parseInt(req.query.lessonId);
      if (!lessonId) {
        res.status(400).json({ error: "lessonId is required" });
        return;
      }
      const files = await db.select().from(cmsLessonFiles).where(eq2(cmsLessonFiles.lessonId, lessonId)).orderBy(asc2(cmsLessonFiles.position));
      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ error: "Failed to fetch files" });
    }
  });
  app2.post(
    "/api/admin/v1/cms/files/get-upload-url",
    requireAdmin,
    async (req, res) => {
      try {
        const {
          filename,
          contentType,
          lessonId,
          fileType,
          courseId,
          moduleId,
          programCode,
          uploadType
        } = req.body;
        if (!filename || !contentType) {
          res.status(400).json({ error: "filename and contentType are required" });
          return;
        }
        const credCheck = checkR2Credentials();
        if (!credCheck.valid) {
          res.status(503).json({
            error: "R2 credentials not configured",
            details: credCheck.error,
            message: "Please configure R2 credentials to upload files"
          });
          return;
        }
        let key;
        if (uploadType === "thumbnail" && courseId && programCode) {
          key = generateCourseThumnailKey(programCode, courseId);
        } else if (lessonId && fileType && programCode && courseId && moduleId) {
          key = generateLessonFileKey(programCode, courseId, moduleId, lessonId, fileType);
        } else {
          res.status(400).json({ error: "Invalid upload parameters. For thumbnails: programCode, courseId required. For lesson files: programCode, courseId, moduleId, lessonId, fileType required." });
          return;
        }
        const result = await getSignedPutUrl(key, contentType);
        if (!result.success) {
          res.status(500).json({ error: result.error });
          return;
        }
        const getResult = await getSignedGetUrl(key);
        const signedUrl = getResult.success ? getResult.url : null;
        res.json({
          uploadUrl: result.uploadUrl,
          key: result.key,
          signedUrl
          // Use signed URL instead of public URL
        });
      } catch (error) {
        console.error("Error getting upload URL:", error);
        res.status(500).json({ error: "Failed to get upload URL" });
      }
    }
  );
  app2.post(
    "/api/admin/v1/cms/files/confirm",
    requireAdmin,
    async (req, res) => {
      try {
        const parsed = insertCmsLessonFileSchema.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({ error: "Invalid file data", details: parsed.error.errors });
          return;
        }
        const [maxPos] = await db.select({ max: sql3`COALESCE(MAX(position), 0)` }).from(cmsLessonFiles).where(eq2(cmsLessonFiles.lessonId, parsed.data.lessonId));
        const position = (maxPos?.max || 0) + 1;
        let extractedText = null;
        let scriptHtml = null;
        if (parsed.data.fileType === "script" && parsed.data.r2Key) {
          try {
            console.log("Converting PDF to HTML:", parsed.data.r2Key);
            const downloadResult = await downloadR2Object(parsed.data.r2Key);
            if (downloadResult.success && downloadResult.data) {
              extractedText = await extractTextWithPdf2json(
                downloadResult.data
              );
              if (extractedText) {
                scriptHtml = convertTextToFormattedHtml(extractedText);
                console.log(
                  "PDF converted to HTML, length:",
                  scriptHtml?.length || 0
                );
              }
            } else {
              console.error(
                "Failed to download PDF for conversion:",
                downloadResult.error
              );
            }
          } catch (pdfError) {
            console.error("Error converting PDF to HTML:", pdfError);
          }
        }
        const [file] = await db.insert(cmsLessonFiles).values({
          ...parsed.data,
          position,
          extractedText,
          scriptHtml
        }).returning();
        res.status(201).json(file);
      } catch (error) {
        console.error("Error confirming file upload:", error);
        res.status(500).json({ error: "Failed to confirm file upload" });
      }
    }
  );
  app2.delete("/api/admin/v1/cms/files/:id", requireAdmin, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const [file] = await db.select().from(cmsLessonFiles).where(eq2(cmsLessonFiles.id, fileId));
      if (file) {
        await deleteR2Object(file.r2Key);
      }
      await db.delete(cmsLessonFiles).where(eq2(cmsLessonFiles.id, fileId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ error: "Failed to delete file" });
    }
  });
  app2.get(
    "/api/admin/v1/cms/files/:id/signed-url",
    requireAdmin,
    async (req, res) => {
      try {
        const fileId = parseInt(req.params.id);
        const [file] = await db.select().from(cmsLessonFiles).where(eq2(cmsLessonFiles.id, fileId));
        if (!file) {
          res.status(404).json({ error: "File not found" });
          return;
        }
        const result = await getSignedGetUrl(file.r2Key);
        if (!result.success) {
          res.status(500).json({ error: result.error });
          return;
        }
        res.json({ url: result.url });
      } catch (error) {
        console.error("Error getting signed URL:", error);
        res.status(500).json({ error: "Failed to get signed URL" });
      }
    }
  );
  app2.get(
    "/admin/v1/frontend-mapping/features",
    requireAdmin,
    async (req, res) => {
      try {
        const features = await storage.getAllFrontendFeatures();
        res.json(features);
      } catch (error) {
        console.error("Error fetching frontend features:", error);
        res.status(500).json({ error: "Failed to fetch features" });
      }
    }
  );
  app2.get(
    "/admin/v1/frontend-mapping/features/:code/courses",
    requireAdmin,
    async (req, res) => {
      try {
        const { code } = req.params;
        const feature = await storage.getFrontendFeatureByCode(code);
        if (!feature) {
          return res.status(404).json({ error: "Feature not found" });
        }
        const mappings = await storage.getFeatureCourseMappings(feature.id);
        res.json({ feature, mappings });
      } catch (error) {
        console.error("Error fetching feature course mappings:", error);
        res.status(500).json({ error: "Failed to fetch mappings" });
      }
    }
  );
  app2.post(
    "/admin/v1/frontend-mapping/features/:code/courses",
    requireAdmin,
    async (req, res) => {
      try {
        const { code } = req.params;
        const { courseId } = req.body;
        if (!courseId) {
          return res.status(400).json({ error: "courseId is required" });
        }
        const feature = await storage.getFrontendFeatureByCode(code);
        if (!feature) {
          return res.status(404).json({ error: "Feature not found" });
        }
        if (["DYD", "USM", "BREATH", "PLAYLIST"].includes(code)) {
          await storage.clearFeatureCourseMappings(feature.id);
        }
        if (code === "ABUNDANCE") {
          const existingMappings = await storage.getFeatureCourseMappings(
            feature.id
          );
          if (existingMappings.some((m) => m.courseId === courseId)) {
            return res.status(400).json({ error: "Course already mapped" });
          }
        }
        let position = 0;
        if (code === "ABUNDANCE") {
          const existingMappings = await storage.getFeatureCourseMappings(
            feature.id
          );
          position = existingMappings.length > 0 ? Math.max(...existingMappings.map((m) => m.position)) + 1 : 0;
        }
        const mapping = await storage.createFeatureCourseMapping({
          featureId: feature.id,
          courseId,
          position
        });
        res.status(201).json(mapping);
      } catch (error) {
        console.error("Error creating feature course mapping:", error);
        res.status(500).json({ error: "Failed to create mapping" });
      }
    }
  );
  app2.delete(
    "/admin/v1/frontend-mapping/features/:code/courses/:courseId",
    requireAdmin,
    async (req, res) => {
      try {
        const { code, courseId } = req.params;
        const feature = await storage.getFrontendFeatureByCode(code);
        if (!feature) {
          return res.status(404).json({ error: "Feature not found" });
        }
        const success = await storage.deleteFeatureCourseMapping(
          feature.id,
          parseInt(courseId)
        );
        if (!success) {
          return res.status(404).json({ error: "Mapping not found" });
        }
        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting feature course mapping:", error);
        res.status(500).json({ error: "Failed to delete mapping" });
      }
    }
  );
  app2.patch(
    "/admin/v1/frontend-mapping/features/:code/courses/reorder",
    requireAdmin,
    async (req, res) => {
      try {
        const { code } = req.params;
        const { courseIds } = req.body;
        const allowedCodes = ["ABUNDANCE", "MASTERCLASS"];
        if (!allowedCodes.includes(code)) {
          return res.status(400).json({ error: "Reorder only allowed for ABUNDANCE and MASTERCLASS features" });
        }
        if (!Array.isArray(courseIds)) {
          return res.status(400).json({ error: "courseIds must be an array" });
        }
        const feature = await storage.getFrontendFeatureByCode(code);
        if (!feature) {
          return res.status(404).json({ error: "Feature not found" });
        }
        await storage.reorderFeatureCourseMappings(feature.id, courseIds);
        res.json({ success: true });
      } catch (error) {
        console.error("Error reordering feature course mappings:", error);
        res.status(500).json({ error: "Failed to reorder" });
      }
    }
  );
  app2.get("/api/public/v1/features/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const feature = await storage.getFrontendFeatureByCode(code);
      if (!feature) {
        return res.status(404).json({ error: "Feature not found" });
      }
      const mappings = await storage.getFeatureCourseMappings(feature.id);
      if (feature.displayMode === "modules") {
        if (mappings.length === 0) {
          return res.json({ feature, course: null, modules: [] });
        }
        const courseId = mappings[0].courseId;
        const [course] = await db.select().from(cmsCourses).where(eq2(cmsCourses.id, courseId));
        const modules = await storage.getModulesForCourse(courseId);
        return res.json({ feature, course, modules });
      }
      if (feature.displayMode === "lessons") {
        if (mappings.length === 0) {
          return res.json({ feature, course: null, lessons: [] });
        }
        const courseId = mappings[0].courseId;
        const [course] = await db.select().from(cmsCourses).where(eq2(cmsCourses.id, courseId));
        const lessons = await storage.getLessonsForCourse(courseId);
        return res.json({ feature, course, lessons });
      }
      if (feature.displayMode === "courses") {
        const builtIns = code === "ABUNDANCE" ? [
          {
            id: "builtin-money-calendar",
            title: "Money Calendar",
            isBuiltIn: true
          },
          {
            id: "builtin-rewiring-belief",
            title: "Rewiring Belief",
            isBuiltIn: true
          }
        ] : [];
        const mappedCourses = await Promise.all(
          mappings.map(async (m) => {
            const [course] = await db.select().from(cmsCourses).where(eq2(cmsCourses.id, m.courseId));
            return {
              id: course.id,
              title: course.title,
              description: course.description,
              thumbnailKey: course.thumbnailKey,
              position: m.position,
              isBuiltIn: false
            };
          })
        );
        return res.json({ feature, builtIns, courses: mappedCourses });
      }
      res.json({ feature, mappings });
    } catch (error) {
      console.error("Error fetching public feature:", error);
      res.status(500).json({ error: "Failed to fetch feature" });
    }
  });
  app2.get("/api/public/v1/modules/:id", async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const [module] = await db.select().from(cmsModules).where(eq2(cmsModules.id, moduleId));
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      const lessons = await db.select().from(cmsLessons).where(eq2(cmsLessons.moduleId, moduleId)).orderBy(asc2(cmsLessons.position));
      res.json({ module, lessons });
    } catch (error) {
      console.error("Error fetching module:", error);
      res.status(500).json({ error: "Failed to fetch module" });
    }
  });
  app2.get("/api/public/v1/lessons/:id", async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const [lesson] = await db.select().from(cmsLessons).where(eq2(cmsLessons.id, lessonId));
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      const files = await db.select().from(cmsLessonFiles).where(eq2(cmsLessonFiles.lessonId, lessonId)).orderBy(asc2(cmsLessonFiles.position));
      const filesWithUrls = await Promise.all(
        files.map(async (file) => {
          let signedUrl = null;
          if (file.r2Key) {
            try {
              const result = await getSignedGetUrl(file.r2Key, 3600);
              if (typeof result === "string") {
                signedUrl = result;
              } else if (result && typeof result === "object" && "url" in result) {
                signedUrl = result.url;
              }
            } catch (e) {
              console.error("Error generating signed URL:", e);
            }
          }
          return { ...file, signedUrl };
        })
      );
      res.json({ lesson, files: filesWithUrls });
    } catch (error) {
      console.error("Error fetching lesson:", error);
      res.status(500).json({ error: "Failed to fetch lesson" });
    }
  });
  app2.get("/api/public/v1/courses/:id", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const [course] = await db.select().from(cmsCourses).where(eq2(cmsCourses.id, courseId));
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      const modules = await storage.getModulesForCourse(courseId);
      let thumbnailUrl = null;
      if (course.thumbnailKey) {
        try {
          thumbnailUrl = await getSignedGetUrl(course.thumbnailKey, 3600);
        } catch (e) {
          console.error("Error generating thumbnail URL:", e);
        }
      }
      res.json({ course: { ...course, thumbnailUrl }, modules });
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });
  app2.get("/api/public/v1/search", async (req, res) => {
    try {
      const query = (req.query.q || "").trim().toLowerCase();
      if (!query) {
        return res.json({ results: [] });
      }
      const allowedFeatures = ["DYD", "USM", "BREATH", "ABUNDANCE"];
      const results = [];
      const features = await storage.getAllFrontendFeatures();
      for (const feature of features) {
        if (!allowedFeatures.includes(feature.code)) continue;
        const mappings = await storage.getFeatureCourseMappings(feature.id);
        if (mappings.length === 0) continue;
        if (feature.displayMode === "modules") {
          for (const mapping of mappings) {
            const courseId = mapping.courseId;
            const modules = await storage.getModulesForCourse(courseId);
            for (const module of modules) {
              if (module.title.toLowerCase().includes(query)) {
                results.push({
                  type: "module",
                  feature: feature.code,
                  id: module.id,
                  title: module.title,
                  navigate_to: `/processes/module/${module.id}`
                });
              }
              const lessons = await db.select().from(cmsLessons).where(eq2(cmsLessons.moduleId, module.id)).orderBy(asc2(cmsLessons.position));
              for (const lesson of lessons) {
                if (lesson.title.toLowerCase().includes(query)) {
                  results.push({
                    type: "lesson",
                    feature: feature.code,
                    id: lesson.id,
                    title: lesson.title,
                    module_id: lesson.moduleId,
                    navigate_to: `/processes/lesson/${lesson.id}`
                  });
                }
              }
            }
          }
        } else if (feature.displayMode === "lessons") {
          for (const mapping of mappings) {
            const courseId = mapping.courseId;
            const lessons = await storage.getLessonsForCourse(courseId);
            for (const lesson of lessons) {
              if (lesson.title.toLowerCase().includes(query)) {
                results.push({
                  type: "lesson",
                  feature: feature.code,
                  id: lesson.id,
                  title: lesson.title,
                  navigate_to: `/spiritual-breaths/lesson/${lesson.id}`
                });
              }
            }
          }
        } else if (feature.displayMode === "courses") {
          for (const mapping of mappings) {
            const [course] = await db.select().from(cmsCourses).where(eq2(cmsCourses.id, mapping.courseId));
            if (course && course.title.toLowerCase().includes(query)) {
              results.push({
                type: "course",
                feature: feature.code,
                id: course.id,
                title: course.title,
                navigate_to: `/abundance-mastery/course/${course.id}`
              });
            }
          }
        }
      }
      res.json({ results });
    } catch (error) {
      console.error("Error searching:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });
  app2.post(
    "/api/v1/money-calendar/entry",
    authenticateJWT,
    async (req, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ error: "Not authenticated" });
        }
        const { date: date2, amount } = req.body;
        if (!date2 || typeof date2 !== "string") {
          return res.status(400).json({ error: "Date is required in YYYY-MM-DD format" });
        }
        if (amount === void 0 || amount === null || typeof amount !== "number") {
          return res.status(400).json({ error: "Amount is required as a number" });
        }
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date2)) {
          return res.status(400).json({ error: "Date must be in YYYY-MM-DD format" });
        }
        const entry = await storage.upsertMoneyEntry(
          req.user.sub,
          date2,
          amount.toString()
        );
        res.json({
          id: entry.id,
          date: entry.entryDate,
          amount: parseFloat(entry.amount),
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt
        });
      } catch (error) {
        console.error("Error saving money entry:", error);
        res.status(500).json({ error: "Failed to save money entry" });
      }
    }
  );
  app2.get("/api/v1/money-calendar", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { month } = req.query;
      if (!month || typeof month !== "string") {
        return res.status(400).json({ error: "Month is required in YYYY-MM format" });
      }
      const monthRegex = /^\d{4}-\d{2}$/;
      if (!monthRegex.test(month)) {
        return res.status(400).json({ error: "Month must be in YYYY-MM format" });
      }
      const [yearStr, monthStr] = month.split("-");
      const year = parseInt(yearStr, 10);
      const monthNum = parseInt(monthStr, 10);
      if (monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ error: "Invalid month value" });
      }
      const data = await storage.getMoneyEntriesForMonth(
        req.user.sub,
        year,
        monthNum
      );
      res.json(data);
    } catch (error) {
      console.error("Error fetching money calendar:", error);
      res.status(500).json({ error: "Failed to fetch money calendar" });
    }
  });
  app2.get(
    "/api/public/v1/playlist/source",
    authenticateJWT,
    async (req, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ error: "Not authenticated" });
        }
        const feature = await storage.getFrontendFeatureByCode("PLAYLIST");
        if (!feature) {
          return res.status(404).json({ error: "PLAYLIST feature not configured" });
        }
        const mappings = await storage.getFeatureCourseMappings(feature.id);
        if (mappings.length === 0) {
          return res.json({ course: null, modules: [] });
        }
        const courseId = mappings[0].courseId;
        const data = await storage.getPlaylistSourceData(courseId);
        if (!data) {
          return res.json({ course: null, modules: [] });
        }
        const modulesWithSignedUrls = await Promise.all(
          data.modules.map(async (module) => ({
            ...module,
            lessons: await Promise.all(
              module.lessons.map(async (lesson) => ({
                ...lesson,
                audioFiles: await Promise.all(
                  lesson.audioFiles.map(async (file) => {
                    let signedUrl = null;
                    if (file.r2Key) {
                      try {
                        signedUrl = await getSignedGetUrl(file.r2Key, 3600);
                      } catch (e) {
                        console.error("Error generating signed URL:", e);
                      }
                    }
                    return { ...file, signedUrl };
                  })
                )
              }))
            )
          }))
        );
        res.json({ course: data.course, modules: modulesWithSignedUrls });
      } catch (error) {
        console.error("Error fetching playlist source:", error);
        res.status(500).json({ error: "Failed to fetch playlist source" });
      }
    }
  );
  app2.get("/api/public/v1/playlists", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const playlists2 = await storage.getUserPlaylists(req.user.sub);
      res.json(playlists2);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      res.status(500).json({ error: "Failed to fetch playlists" });
    }
  });
  app2.post("/api/public/v1/playlists", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { title } = req.body;
      if (!title || typeof title !== "string" || title.trim() === "") {
        return res.status(400).json({ error: "Title is required" });
      }
      const playlist = await storage.createPlaylist({
        userId: req.user.sub,
        title: title.trim()
      });
      res.status(201).json(playlist);
    } catch (error) {
      console.error("Error creating playlist:", error);
      res.status(500).json({ error: "Failed to create playlist" });
    }
  });
  app2.get("/api/public/v1/playlists/:id", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const playlistId = parseInt(req.params.id);
      const playlist = await storage.getPlaylistById(playlistId);
      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }
      if (playlist.userId !== req.user.sub) {
        return res.status(403).json({ error: "Access denied" });
      }
      const items = await storage.getPlaylistItems(playlistId);
      const itemsWithAudio = await Promise.all(
        items.map(async (item) => {
          const audioFiles = await db.select().from(cmsLessonFiles).where(
            and2(
              eq2(cmsLessonFiles.lessonId, item.lessonId),
              eq2(cmsLessonFiles.fileType, "audio")
            )
          ).orderBy(asc2(cmsLessonFiles.position));
          const audioFilesWithUrls = await Promise.all(
            audioFiles.map(async (file) => {
              let signedUrl = null;
              if (file.r2Key) {
                try {
                  const result = await getSignedGetUrl(file.r2Key, 3600);
                  if (result.success && result.url) {
                    signedUrl = result.url;
                  }
                } catch (e) {
                  console.error("Error generating signed URL:", e);
                }
              }
              return { ...file, signedUrl };
            })
          );
          return { ...item, audioFiles: audioFilesWithUrls };
        })
      );
      res.json({ playlist, items: itemsWithAudio });
    } catch (error) {
      console.error("Error fetching playlist:", error);
      res.status(500).json({ error: "Failed to fetch playlist" });
    }
  });
  app2.patch(
    "/api/public/v1/playlists/:id",
    authenticateJWT,
    async (req, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ error: "Not authenticated" });
        }
        const playlistId = parseInt(req.params.id);
        const playlist = await storage.getPlaylistById(playlistId);
        if (!playlist) {
          return res.status(404).json({ error: "Playlist not found" });
        }
        if (playlist.userId !== req.user.sub) {
          return res.status(403).json({ error: "Access denied" });
        }
        const { title } = req.body;
        if (!title || typeof title !== "string" || title.trim() === "") {
          return res.status(400).json({ error: "Title is required" });
        }
        const updated = await storage.updatePlaylist(playlistId, title.trim());
        res.json(updated);
      } catch (error) {
        console.error("Error updating playlist:", error);
        res.status(500).json({ error: "Failed to update playlist" });
      }
    }
  );
  app2.delete(
    "/api/public/v1/playlists/:id",
    authenticateJWT,
    async (req, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ error: "Not authenticated" });
        }
        const playlistId = parseInt(req.params.id);
        const playlist = await storage.getPlaylistById(playlistId);
        if (!playlist) {
          return res.status(404).json({ error: "Playlist not found" });
        }
        if (playlist.userId !== req.user.sub) {
          return res.status(403).json({ error: "Access denied" });
        }
        await storage.deletePlaylist(playlistId);
        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting playlist:", error);
        res.status(500).json({ error: "Failed to delete playlist" });
      }
    }
  );
  app2.post(
    "/api/public/v1/playlists/:id/items",
    authenticateJWT,
    async (req, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ error: "Not authenticated" });
        }
        const playlistId = parseInt(req.params.id);
        const playlist = await storage.getPlaylistById(playlistId);
        if (!playlist) {
          return res.status(404).json({ error: "Playlist not found" });
        }
        if (playlist.userId !== req.user.sub) {
          return res.status(403).json({ error: "Access denied" });
        }
        const { lessonIds } = req.body;
        if (!Array.isArray(lessonIds)) {
          return res.status(400).json({ error: "lessonIds must be an array" });
        }
        for (const lessonId of lessonIds) {
          const inMappedCourse = await storage.isLessonInMappedCourse(
            lessonId,
            "PLAYLIST"
          );
          if (!inMappedCourse) {
            return res.status(400).json({
              error: `Lesson ${lessonId} is not in the mapped playlist course`
            });
          }
          const hasAudio = await storage.doesLessonHaveAudio(lessonId);
          if (!hasAudio) {
            return res.status(400).json({ error: `Lesson ${lessonId} has no audio files` });
          }
        }
        const items = await storage.setPlaylistItems(playlistId, lessonIds);
        res.json(items);
      } catch (error) {
        console.error("Error setting playlist items:", error);
        res.status(500).json({ error: "Failed to set playlist items" });
      }
    }
  );
  app2.patch(
    "/api/public/v1/playlists/:id/items/reorder",
    authenticateJWT,
    async (req, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ error: "Not authenticated" });
        }
        const playlistId = parseInt(req.params.id);
        const playlist = await storage.getPlaylistById(playlistId);
        if (!playlist) {
          return res.status(404).json({ error: "Playlist not found" });
        }
        if (playlist.userId !== req.user.sub) {
          return res.status(403).json({ error: "Access denied" });
        }
        const { orderedItemIds } = req.body;
        if (!Array.isArray(orderedItemIds)) {
          return res.status(400).json({ error: "orderedItemIds must be an array" });
        }
        await storage.reorderPlaylistItems(playlistId, orderedItemIds);
        res.json({ success: true });
      } catch (error) {
        console.error("Error reordering playlist items:", error);
        res.status(500).json({ error: "Failed to reorder playlist items" });
      }
    }
  );
  app2.delete(
    "/api/public/v1/playlists/:id/items/:itemId",
    authenticateJWT,
    async (req, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ error: "Not authenticated" });
        }
        const playlistId = parseInt(req.params.id);
        const itemId = parseInt(req.params.itemId);
        const playlist = await storage.getPlaylistById(playlistId);
        if (!playlist) {
          return res.status(404).json({ error: "Playlist not found" });
        }
        if (playlist.userId !== req.user.sub) {
          return res.status(403).json({ error: "Access denied" });
        }
        const success = await storage.deletePlaylistItem(playlistId, itemId);
        if (!success) {
          return res.status(404).json({ error: "Item not found" });
        }
        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting playlist item:", error);
        res.status(500).json({ error: "Failed to delete playlist item" });
      }
    }
  );
  app2.get("/api/admin/v1/session-banners", requireAdmin, async (req, res) => {
    try {
      const banners = await storage.getAllSessionBanners();
      res.json(banners);
    } catch (error) {
      console.error("Error fetching session banners:", error);
      res.status(500).json({ error: "Failed to fetch session banners" });
    }
  });
  app2.get("/api/admin/v1/session-banners/upload-url", requireAdmin, async (req, res) => {
    try {
      const { filename, contentType } = req.query;
      if (!filename || !contentType) {
        return res.status(400).json({ error: "filename and contentType are required" });
      }
      const key = `session-banners/${Date.now()}-${filename}`;
      const result = await getSignedPutUrl(key, contentType);
      if (!result.success) {
        console.error("R2 upload URL error:", result.error);
        return res.status(500).json({ error: result.error || "Failed to generate upload URL" });
      }
      res.json({ key: result.key, signedUrl: result.uploadUrl });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });
  app2.get("/api/admin/v1/session-banners/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const banner = await storage.getSessionBannerById(id);
      if (!banner) {
        return res.status(404).json({ error: "Banner not found" });
      }
      res.json(banner);
    } catch (error) {
      console.error("Error fetching session banner:", error);
      res.status(500).json({ error: "Failed to fetch session banner" });
    }
  });
  app2.post("/api/admin/v1/session-banners", requireAdmin, async (req, res) => {
    try {
      const { type, thumbnailKey, videoKey, posterKey, ctaText, ctaLink, startAt, endAt, liveEnabled, liveStartAt, liveEndAt } = req.body;
      if (!type || !startAt || !endAt) {
        return res.status(400).json({ error: "type, startAt, and endAt are required" });
      }
      const banner = await storage.createSessionBanner({
        type,
        thumbnailKey: thumbnailKey || null,
        videoKey: videoKey || null,
        posterKey: posterKey || null,
        ctaText: ctaText || null,
        ctaLink: ctaLink || null,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        liveEnabled: liveEnabled || false,
        liveStartAt: liveStartAt ? new Date(liveStartAt) : null,
        liveEndAt: liveEndAt ? new Date(liveEndAt) : null
      });
      res.status(201).json(banner);
    } catch (error) {
      console.error("Error creating session banner:", error);
      res.status(500).json({ error: "Failed to create session banner" });
    }
  });
  app2.put("/api/admin/v1/session-banners/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { type, thumbnailKey, videoKey, posterKey, ctaText, ctaLink, startAt, endAt, liveEnabled, liveStartAt, liveEndAt } = req.body;
      const updateData = {};
      if (type !== void 0) updateData.type = type;
      if (thumbnailKey !== void 0) updateData.thumbnailKey = thumbnailKey;
      if (videoKey !== void 0) updateData.videoKey = videoKey;
      if (posterKey !== void 0) updateData.posterKey = posterKey;
      if (ctaText !== void 0) updateData.ctaText = ctaText;
      if (ctaLink !== void 0) updateData.ctaLink = ctaLink;
      if (startAt !== void 0) updateData.startAt = new Date(startAt);
      if (endAt !== void 0) updateData.endAt = new Date(endAt);
      if (liveEnabled !== void 0) updateData.liveEnabled = liveEnabled;
      if (liveStartAt !== void 0) updateData.liveStartAt = liveStartAt ? new Date(liveStartAt) : null;
      if (liveEndAt !== void 0) updateData.liveEndAt = liveEndAt ? new Date(liveEndAt) : null;
      const banner = await storage.updateSessionBanner(id, updateData);
      if (!banner) {
        return res.status(404).json({ error: "Banner not found" });
      }
      res.json(banner);
    } catch (error) {
      console.error("Error updating session banner:", error);
      res.status(500).json({ error: "Failed to update session banner" });
    }
  });
  app2.delete("/api/admin/v1/session-banners/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSessionBanner(id);
      if (!success) {
        return res.status(404).json({ error: "Banner not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting session banner:", error);
      res.status(500).json({ error: "Failed to delete session banner" });
    }
  });
  app2.post("/api/admin/v1/session-banners/:id/duplicate", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const original = await storage.getSessionBannerById(id);
      if (!original) {
        return res.status(404).json({ error: "Banner not found" });
      }
      const duplicate = await storage.createSessionBanner({
        type: original.type,
        thumbnailKey: original.thumbnailKey,
        videoKey: original.videoKey,
        posterKey: original.posterKey,
        ctaText: original.ctaText,
        ctaLink: original.ctaLink,
        startAt: original.startAt,
        endAt: original.endAt,
        liveEnabled: original.liveEnabled,
        liveStartAt: original.liveStartAt,
        liveEndAt: original.liveEndAt
      });
      res.status(201).json(duplicate);
    } catch (error) {
      console.error("Error duplicating session banner:", error);
      res.status(500).json({ error: "Failed to duplicate session banner" });
    }
  });
  app2.get("/api/public/v1/session-banner", async (req, res) => {
    try {
      let banner = await storage.getActiveBanner();
      let status = "active";
      if (!banner) {
        banner = await storage.getNextScheduledBanner();
        status = "scheduled";
      }
      if (!banner) {
        banner = await storage.getLastExpiredBanner();
        status = "expired";
      }
      if (!banner) {
        return res.json({ banner: null, status: "none" });
      }
      let thumbnailUrl = null;
      let videoUrl = null;
      let posterUrl = null;
      if (banner.thumbnailKey) {
        const result = await getSignedGetUrl(banner.thumbnailKey);
        thumbnailUrl = result.success ? result.url : null;
      }
      if (banner.videoKey) {
        const result = await getSignedGetUrl(banner.videoKey);
        videoUrl = result.success ? result.url : null;
      }
      if (banner.posterKey) {
        const result = await getSignedGetUrl(banner.posterKey);
        posterUrl = result.success ? result.url : null;
      }
      const now = /* @__PURE__ */ new Date();
      const isLive = banner.type === "session" && banner.liveEnabled && status === "active" && banner.liveStartAt && banner.liveEndAt && now >= new Date(banner.liveStartAt) && now < new Date(banner.liveEndAt);
      res.json({
        banner: {
          ...banner,
          thumbnailUrl,
          videoUrl,
          posterUrl
        },
        status,
        isLive
      });
    } catch (error) {
      console.error("Error fetching public session banner:", error);
      res.status(500).json({ error: "Failed to fetch session banner" });
    }
  });
  app2.get("/api/quotes/today", async (req, res) => {
    try {
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const [todayQuote] = await db.select().from(dailyQuotes).where(and2(eq2(dailyQuotes.isActive, true), eq2(dailyQuotes.lastShownDate, today)));
      if (todayQuote) {
        return res.json({
          quote: todayQuote.quoteText,
          author: todayQuote.author || null
        });
      }
      const activeQuotes = await db.select().from(dailyQuotes).where(eq2(dailyQuotes.isActive, true)).orderBy(
        sql3`CASE WHEN ${dailyQuotes.lastShownDate} IS NULL THEN 0 ELSE 1 END`,
        sql3`${dailyQuotes.lastShownDate} NULLS FIRST`,
        asc2(dailyQuotes.displayOrder)
      );
      if (activeQuotes.length === 0) {
        return res.json({ quote: null, author: null });
      }
      const selectedQuote = activeQuotes[0];
      await db.update(dailyQuotes).set({ lastShownDate: today, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(dailyQuotes.id, selectedQuote.id));
      res.json({
        quote: selectedQuote.quoteText,
        author: selectedQuote.author || null
      });
    } catch (error) {
      console.error("Error fetching today's quote:", error);
      res.status(500).json({ error: "Failed to fetch quote" });
    }
  });
  app2.get("/api/admin/quotes", requireAdmin, async (req, res) => {
    try {
      const quotes = await db.select().from(dailyQuotes).orderBy(asc2(dailyQuotes.displayOrder));
      res.json(quotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ error: "Failed to fetch quotes" });
    }
  });
  app2.post("/api/admin/quotes", requireAdmin, async (req, res) => {
    try {
      const parsed = insertDailyQuoteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Validation failed", details: parsed.error.errors });
      }
      const [newQuote] = await db.insert(dailyQuotes).values(parsed.data).returning();
      res.status(201).json(newQuote);
    } catch (error) {
      console.error("Error creating quote:", error);
      res.status(500).json({ error: "Failed to create quote" });
    }
  });
  app2.put("/api/admin/quotes/:id", requireAdmin, async (req, res) => {
    try {
      const quoteId = parseInt(req.params.id);
      const { quoteText, author, displayOrder, isActive } = req.body;
      const [updated] = await db.update(dailyQuotes).set({
        ...quoteText !== void 0 && { quoteText },
        ...author !== void 0 && { author },
        ...displayOrder !== void 0 && { displayOrder },
        ...isActive !== void 0 && { isActive },
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq2(dailyQuotes.id, quoteId)).returning();
      if (!updated) {
        return res.status(404).json({ error: "Quote not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating quote:", error);
      res.status(500).json({ error: "Failed to update quote" });
    }
  });
  app2.delete("/api/admin/quotes/:id", requireAdmin, async (req, res) => {
    try {
      const quoteId = parseInt(req.params.id);
      const [updated] = await db.update(dailyQuotes).set({ isActive: false, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(dailyQuotes.id, quoteId)).returning();
      if (!updated) {
        return res.status(404).json({ error: "Quote not found" });
      }
      res.json({ success: true, message: "Quote deactivated" });
    } catch (error) {
      console.error("Error deleting quote:", error);
      res.status(500).json({ error: "Failed to delete quote" });
    }
  });
  app2.get("/admin/v1/users/:userId/wellness-profile", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      const profile = await storage.getWellnessProfileByUserId(userId);
      res.json(profile || { userId, karmicAffirmation: null, prescription: null });
    } catch (error) {
      console.error("Error fetching wellness profile:", error);
      res.status(500).json({ error: "Failed to fetch wellness profile" });
    }
  });
  app2.post("/admin/v1/users/:userId/wellness-profile", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { karmicAffirmation, prescription } = req.body;
      const profile = await storage.upsertWellnessProfile(userId, {
        karmicAffirmation: karmicAffirmation ?? null,
        prescription: prescription ?? null
      });
      res.json(profile);
    } catch (error) {
      console.error("Error saving wellness profile:", error);
      res.status(500).json({ error: "Failed to save wellness profile" });
    }
  });
  app2.get("/api/v1/me/wellness-profile", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const profile = await storage.getWellnessProfileByUserId(req.user.sub);
      res.json(profile || { karmicAffirmation: null, prescription: null });
    } catch (error) {
      console.error("Error fetching user wellness profile:", error);
      res.status(500).json({ error: "Failed to fetch wellness profile" });
    }
  });
  app2.post("/api/v1/me/change-password", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current and new password are required" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters" });
      }
      const user = await storage.getUserById(req.user.sub);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const bcrypt2 = await import("bcryptjs");
      const isValidPassword = await bcrypt2.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      const hashedPassword = await bcrypt2.hash(newPassword, 10);
      await storage.updateUserPassword(req.user.sub, hashedPassword);
      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });
  app2.put("/api/v1/me/name", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { name } = req.body;
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ error: "Name is required" });
      }
      const user = await storage.updateUserName(req.user.sub, name.trim());
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true, name: user.name });
    } catch (error) {
      console.error("Error updating user name:", error);
      res.status(500).json({ error: "Failed to update name" });
    }
  });
  app2.get("/api/admin/v1/events", requireAdmin, async (req, res) => {
    try {
      const { status, month, year } = req.query;
      const filters = {};
      if (status) filters.status = String(status);
      if (month) filters.month = parseInt(String(month));
      if (year) filters.year = parseInt(String(year));
      const events2 = await storage.getAllEvents(filters);
      const eventsWithSignedUrls = await Promise.all(
        events2.map(async (event) => {
          let thumbnailSignedUrl = null;
          if (event.thumbnailUrl) {
            const signedResult = await getSignedGetUrl(event.thumbnailUrl);
            if (signedResult.success && signedResult.url) {
              thumbnailSignedUrl = signedResult.url;
            }
          }
          return { ...event, thumbnailSignedUrl };
        })
      );
      res.json(eventsWithSignedUrls);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });
  app2.get("/api/admin/v1/events/upcoming", requireAdmin, async (req, res) => {
    try {
      const events2 = await storage.getAllEvents({ status: "UPCOMING" });
      const eventsWithSignedUrls = await Promise.all(
        events2.map(async (event) => {
          let thumbnailSignedUrl = null;
          if (event.thumbnailUrl) {
            const signedResult = await getSignedGetUrl(event.thumbnailUrl);
            if (signedResult.success && signedResult.url) {
              thumbnailSignedUrl = signedResult.url;
            }
          }
          return { ...event, thumbnailSignedUrl };
        })
      );
      res.json(eventsWithSignedUrls);
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
      res.status(500).json({ error: "Failed to fetch upcoming events" });
    }
  });
  app2.get("/api/admin/v1/events/latest", requireAdmin, async (req, res) => {
    try {
      const allCompleted = await storage.getAllEvents({ status: "COMPLETED" });
      const latestEvents = allCompleted.filter(
        (event) => event.showRecording === true || event.recordingUrl === null
      );
      const eventsWithSignedUrls = await Promise.all(
        latestEvents.map(async (event) => {
          let thumbnailSignedUrl = null;
          if (event.thumbnailUrl) {
            const signedResult = await getSignedGetUrl(event.thumbnailUrl);
            if (signedResult.success && signedResult.url) {
              thumbnailSignedUrl = signedResult.url;
            }
          }
          return { ...event, thumbnailSignedUrl };
        })
      );
      res.json(eventsWithSignedUrls);
    } catch (error) {
      console.error("Error fetching latest events:", error);
      res.status(500).json({ error: "Failed to fetch latest events" });
    }
  });
  app2.get("/api/admin/v1/events/upload-url", requireAdmin, async (req, res) => {
    try {
      const { filename, contentType } = req.query;
      if (!filename || !contentType) {
        return res.status(400).json({ error: "filename and contentType are required" });
      }
      const key = `events/${Date.now()}-${filename}`;
      const result = await getSignedPutUrl(key, contentType);
      if (!result.success) {
        console.error("R2 upload URL error:", result.error);
        return res.status(500).json({ error: result.error || "Failed to generate upload URL" });
      }
      res.json({ key: result.key, signedUrl: result.uploadUrl });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });
  app2.get("/api/admin/v1/events/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getEventById(id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      let thumbnailSignedUrl = null;
      if (event.thumbnailUrl) {
        const signedResult = await getSignedGetUrl(event.thumbnailUrl);
        if (signedResult.success && signedResult.url) {
          thumbnailSignedUrl = signedResult.url;
        }
      }
      res.json({ ...event, thumbnailSignedUrl });
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });
  async function createEventReminders(event) {
    if (event.status !== "UPCOMING") return;
    const startTime = new Date(event.startDatetime);
    const now = /* @__PURE__ */ new Date();
    const timeStr = startTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    const notifications2 = [];
    const reminder24h = new Date(startTime.getTime() - 24 * 60 * 60 * 1e3);
    if (reminder24h > now) {
      notifications2.push({
        title: `${event.title} Tomorrow`,
        body: `Your ${event.title} starts tomorrow at ${timeStr}.`,
        type: "event_reminder",
        scheduledAt: reminder24h,
        requiredProgramCode: event.requiredProgramCode,
        requiredProgramLevel: event.requiredProgramLevel,
        relatedEventId: event.id
      });
    }
    const reminder15m = new Date(startTime.getTime() - 15 * 60 * 1e3);
    if (reminder15m > now) {
      notifications2.push({
        title: `Starting Soon`,
        body: `${event.title} starts in 15 minutes.`,
        type: "event_reminder",
        scheduledAt: reminder15m,
        requiredProgramCode: event.requiredProgramCode,
        requiredProgramLevel: event.requiredProgramLevel,
        relatedEventId: event.id
      });
    }
    if (notifications2.length > 0) {
      await storage.createNotifications(notifications2);
      console.log(`Created ${notifications2.length} reminder(s) for event ${event.id}: ${event.title}`);
    }
  }
  app2.post("/api/admin/v1/events", requireAdmin, async (req, res) => {
    try {
      const parsed = insertEventSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Validation failed", details: parsed.error.errors });
      }
      const event = await storage.createEvent(parsed.data);
      try {
        await createEventReminders(event);
      } catch (notifError) {
        console.error("Error creating event reminders:", notifError);
      }
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });
  app2.put("/api/admin/v1/events/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = { ...req.body };
      if (updateData.startDatetime && typeof updateData.startDatetime === "string") {
        updateData.startDatetime = new Date(updateData.startDatetime);
      }
      if (updateData.endDatetime && typeof updateData.endDatetime === "string") {
        updateData.endDatetime = new Date(updateData.endDatetime);
      }
      if (updateData.recordingExpiryDate && typeof updateData.recordingExpiryDate === "string") {
        updateData.recordingExpiryDate = updateData.recordingExpiryDate;
      }
      const event = await storage.updateEvent(id, updateData);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      try {
        await storage.deleteNotificationsByEventId(id);
        await createEventReminders(event);
      } catch (notifError) {
        console.error("Error updating event reminders:", notifError);
      }
      res.json(event);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });
  app2.delete("/api/admin/v1/events/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.cancelEvent(id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      try {
        await storage.deleteNotificationsByEventId(id);
      } catch (notifError) {
        console.error("Error deleting event reminders:", notifError);
      }
      res.json({ success: true, message: "Event cancelled" });
    } catch (error) {
      console.error("Error cancelling event:", error);
      res.status(500).json({ error: "Failed to cancel event" });
    }
  });
  app2.post("/api/admin/v1/events/:id/skip-recording", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.updateEvent(id, {
        showRecording: false,
        recordingSkipped: true,
        recordingUrl: null,
        recordingPasscode: null,
        recordingExpiryDate: null
      });
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json({ success: true, message: "Recording skipped" });
    } catch (error) {
      console.error("Error skipping recording:", error);
      res.status(500).json({ error: "Failed to skip recording" });
    }
  });
  app2.post("/api/admin/v1/events/:id/add-recording", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { recordingUrl, recordingPasscode, recordingExpiryDate } = req.body;
      if (!recordingUrl || !recordingPasscode || !recordingExpiryDate) {
        return res.status(400).json({ error: "recordingUrl, recordingPasscode, and recordingExpiryDate are required" });
      }
      const event = await storage.updateEvent(id, {
        recordingUrl,
        recordingPasscode,
        recordingExpiryDate,
        showRecording: true,
        recordingSkipped: false
      });
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error adding recording:", error);
      res.status(500).json({ error: "Failed to add recording" });
    }
  });
  app2.get("/api/events/upcoming", async (req, res) => {
    try {
      const events2 = await storage.getUpcomingEvents();
      const eventsWithSignedUrls = await Promise.all(
        events2.map(async (event) => {
          let thumbnailSignedUrl = null;
          if (event.thumbnailUrl) {
            const signedResult = await getSignedGetUrl(event.thumbnailUrl);
            if (signedResult.success && signedResult.url) {
              thumbnailSignedUrl = signedResult.url;
            }
          }
          const now = /* @__PURE__ */ new Date();
          const isLive = event.startDatetime <= now && now <= event.endDatetime;
          return { ...event, thumbnailSignedUrl, isLive };
        })
      );
      res.json(eventsWithSignedUrls);
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
      res.status(500).json({ error: "Failed to fetch upcoming events" });
    }
  });
  app2.get("/api/events/latest", async (req, res) => {
    try {
      const events2 = await storage.getLatestEvents();
      const eventsWithSignedUrls = await Promise.all(
        events2.map(async (event) => {
          let thumbnailSignedUrl = null;
          if (event.thumbnailUrl) {
            const signedResult = await getSignedGetUrl(event.thumbnailUrl);
            if (signedResult.success && signedResult.url) {
              thumbnailSignedUrl = signedResult.url;
            }
          }
          return { ...event, thumbnailSignedUrl };
        })
      );
      res.json(eventsWithSignedUrls);
    } catch (error) {
      console.error("Error fetching latest events:", error);
      res.status(500).json({ error: "Failed to fetch latest events" });
    }
  });
  app2.get("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getEventById(id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      if (event.status === "CANCELLED") {
        return res.status(404).json({ error: "Event not found" });
      }
      let thumbnailSignedUrl = null;
      if (event.thumbnailUrl) {
        const signedResult = await getSignedGetUrl(event.thumbnailUrl);
        if (signedResult.success && signedResult.url) {
          thumbnailSignedUrl = signedResult.url;
        }
      }
      const now = /* @__PURE__ */ new Date();
      const isLive = event.startDatetime <= now && now <= event.endDatetime;
      res.json({ ...event, thumbnailSignedUrl, isLive });
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });
  app2.get("/api/poh/current", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const userId = req.user.sub;
      const userPOHs = await storage.getUserPOHs(userId);
      const activePOH = userPOHs.find((p) => p.status === "active");
      const nextPOH = userPOHs.find((p) => p.status === "next");
      const horizonPOH = userPOHs.find((p) => p.status === "horizon");
      let activeResponse = null;
      if (activePOH) {
        const milestones = await storage.getPOHMilestones(activePOH.id);
        const actions = await storage.getPOHActions(activePOH.id);
        const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const todayRating = await storage.getPOHRatingByDate(userId, today);
        const visionImages = activePOH.visionImages || [];
        const signedVisionImages = [];
        for (const img of visionImages) {
          if (img && img !== "NULL") {
            try {
              let key;
              if (img.includes(".r2.cloudflarestorage.com/")) {
                key = img.split(".r2.cloudflarestorage.com/")[1];
              } else if (img.startsWith("http")) {
                const url = new URL(img);
                key = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;
              } else {
                key = img;
              }
              const signedResult = await getSignedGetUrl(key, 3600);
              signedVisionImages.push(signedResult.success ? signedResult.url : null);
            } catch (err) {
              console.error("Error generating signed URL for vision image:", err);
              signedVisionImages.push(null);
            }
          } else {
            signedVisionImages.push(null);
          }
        }
        activeResponse = {
          id: activePOH.id,
          title: activePOH.title,
          why: activePOH.why,
          category: activePOH.category,
          started_at: activePOH.startedAt,
          vision_images: signedVisionImages,
          milestones: milestones.map((m) => ({
            id: m.id,
            text: m.text,
            achieved: m.achieved,
            achieved_at: m.achievedAt,
            order_index: m.orderIndex
          })),
          actions: actions.map((a) => ({
            id: a.id,
            text: a.text,
            order: a.orderIndex
          })),
          today_rating: todayRating ? todayRating.rating : null
        };
      }
      let nextResponse = null;
      if (nextPOH) {
        nextResponse = {
          id: nextPOH.id,
          title: nextPOH.title,
          why: nextPOH.why,
          category: nextPOH.category,
          milestones: [],
          actions: []
        };
      }
      let horizonResponse = null;
      if (horizonPOH) {
        horizonResponse = {
          id: horizonPOH.id,
          title: horizonPOH.title,
          why: horizonPOH.why,
          category: horizonPOH.category,
          milestones: [],
          actions: []
        };
      }
      res.json({
        active: activeResponse,
        next: nextResponse,
        horizon: horizonResponse
      });
    } catch (error) {
      console.error("Error fetching current POH:", error);
      res.status(500).json({ error: "Failed to fetch POH state" });
    }
  });
  app2.post("/api/poh", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const userId = req.user.sub;
      const { title, why, category } = req.body;
      if (!title || title.length > 120) {
        return res.status(400).json({ error: "Title is required and must be <= 120 characters" });
      }
      if (!why || why.length > 500) {
        return res.status(400).json({ error: "Why is required and must be <= 500 characters" });
      }
      if (!pohCategoryEnum.safeParse(category).success) {
        return res.status(400).json({ error: "Invalid category. Must be: career, health, relationships, or wealth" });
      }
      const userPOHs = await storage.getUserPOHs(userId);
      const hasActive = userPOHs.some((p) => p.status === "active");
      const hasNext = userPOHs.some((p) => p.status === "next");
      const hasHorizon = userPOHs.some((p) => p.status === "horizon");
      let status;
      let startedAt = null;
      if (!hasActive) {
        status = "active";
        startedAt = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      } else if (!hasNext) {
        status = "next";
      } else if (!hasHorizon) {
        status = "horizon";
      } else {
        return res.status(400).json({
          error: "Cannot create more POHs. You already have active, next, and horizon projects."
        });
      }
      const newPOH = await storage.createPOH({
        userId,
        title,
        why,
        category,
        status,
        startedAt
      });
      res.status(201).json(newPOH);
    } catch (error) {
      console.error("Error creating POH:", error);
      res.status(500).json({ error: "Failed to create POH" });
    }
  });
  app2.put("/api/poh/:id", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const userId = req.user.sub;
      const pohId = req.params.id;
      const { title, why, category } = req.body;
      const poh = await storage.getPOHById(pohId);
      if (!poh || poh.userId !== userId) {
        return res.status(404).json({ error: "POH not found" });
      }
      const updates = {};
      if (title !== void 0) {
        if (title.length > 120) {
          return res.status(400).json({ error: "Title must be <= 120 characters" });
        }
        updates.title = title;
      }
      if (why !== void 0) {
        if (poh.status !== "active") {
          return res.status(403).json({ error: "Only active POH can update 'why' field" });
        }
        if (why.length > 500) {
          return res.status(400).json({ error: "Why must be <= 500 characters" });
        }
        updates.why = why;
      }
      if (category !== void 0) {
        if (!pohCategoryEnum.safeParse(category).success) {
          return res.status(400).json({ error: "Invalid category" });
        }
        updates.category = category;
      }
      const updatedPOH = await storage.updatePOH(pohId, updates);
      res.json(updatedPOH);
    } catch (error) {
      console.error("Error updating POH:", error);
      res.status(500).json({ error: "Failed to update POH" });
    }
  });
  app2.post("/api/poh/:id/milestones", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const userId = req.user.sub;
      const pohId = req.params.id;
      const { text: text2 } = req.body;
      const poh = await storage.getPOHById(pohId);
      if (!poh || poh.userId !== userId) {
        return res.status(404).json({ error: "POH not found" });
      }
      if (poh.status !== "active") {
        return res.status(403).json({ error: "Can only add milestones to active POH" });
      }
      if (!text2 || text2.length > 200) {
        return res.status(400).json({ error: "Milestone text is required and must be <= 200 characters" });
      }
      const existingMilestones = await storage.getPOHMilestones(pohId);
      if (existingMilestones.length >= 5) {
        return res.status(400).json({ error: "Maximum 5 milestones per POH" });
      }
      const milestone = await storage.createPOHMilestone({
        pohId,
        text: text2,
        orderIndex: existingMilestones.length
      });
      res.status(201).json(milestone);
    } catch (error) {
      console.error("Error creating milestone:", error);
      res.status(500).json({ error: "Failed to create milestone" });
    }
  });
  app2.post("/api/poh/milestone/:id/achieve", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const userId = req.user.sub;
      const milestoneId = req.params.id;
      const milestone = await storage.getPOHMilestoneById(milestoneId);
      if (!milestone) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      const poh = await storage.getPOHById(milestone.pohId);
      if (!poh || poh.userId !== userId) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      if (poh.status !== "active") {
        return res.status(403).json({ error: "Can only achieve milestones on active POH" });
      }
      if (milestone.achieved) {
        return res.status(400).json({ error: "Milestone already achieved" });
      }
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const updatedMilestone = await storage.achievePOHMilestone(milestoneId, today);
      res.json(updatedMilestone);
    } catch (error) {
      console.error("Error achieving milestone:", error);
      res.status(500).json({ error: "Failed to achieve milestone" });
    }
  });
  app2.put("/api/poh/milestone/:id", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const userId = req.user.sub;
      const milestoneId = req.params.id;
      const { text: text2 } = req.body;
      const milestone = await storage.getPOHMilestoneById(milestoneId);
      if (!milestone) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      const poh = await storage.getPOHById(milestone.pohId);
      if (!poh || poh.userId !== userId) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      if (poh.status !== "active") {
        return res.status(403).json({
          error: "POH_NOT_ACTIVE",
          message: "Can only edit milestones on active POH"
        });
      }
      if (milestone.achieved) {
        return res.status(403).json({
          error: "MILESTONE_LOCKED",
          message: "Achieved milestones cannot be edited."
        });
      }
      if (!text2 || text2.length > 200) {
        return res.status(400).json({ error: "Milestone text must be <= 200 characters" });
      }
      const updatedMilestone = await storage.updatePOHMilestone(milestoneId, { text: text2 });
      res.json(updatedMilestone);
    } catch (error) {
      console.error("Error updating milestone:", error);
      res.status(500).json({ error: "Failed to update milestone" });
    }
  });
  app2.put("/api/poh/:id/actions", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const userId = req.user.sub;
      const pohId = req.params.id;
      const { actions } = req.body;
      const poh = await storage.getPOHById(pohId);
      if (!poh || poh.userId !== userId) {
        return res.status(404).json({ error: "POH not found" });
      }
      if (poh.status !== "active") {
        return res.status(403).json({ error: "Can only update actions on active POH" });
      }
      if (!Array.isArray(actions) || actions.length > 3) {
        return res.status(400).json({ error: "Actions must be an array with max 3 items" });
      }
      for (const action of actions) {
        if (typeof action !== "string" || action.length === 0) {
          return res.status(400).json({ error: "Each action must be a non-empty string" });
        }
      }
      await storage.replacePOHActions(pohId, actions);
      const updatedActions = await storage.getPOHActions(pohId);
      res.json(updatedActions);
    } catch (error) {
      console.error("Error updating actions:", error);
      res.status(500).json({ error: "Failed to update actions" });
    }
  });
  app2.post("/api/poh/rate", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const userId = req.user.sub;
      const { poh_id, rating, local_date } = req.body;
      const poh = await storage.getPOHById(poh_id);
      if (!poh || poh.userId !== userId) {
        return res.status(404).json({ error: "POH not found" });
      }
      if (poh.status !== "active") {
        return res.status(403).json({ error: "Can only rate active POH" });
      }
      if (typeof rating !== "number" || rating < 0 || rating > 10) {
        return res.status(400).json({ error: "Rating must be between 0 and 10" });
      }
      if (!local_date || !/^\d{4}-\d{2}-\d{2}$/.test(local_date)) {
        return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
      }
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      if (local_date !== today) {
        return res.status(403).json({
          error: "RATING_DATE_LOCKED",
          message: "Can only submit or update rating for today"
        });
      }
      const existingRating = await storage.getPOHRatingByDate(userId, local_date);
      let result;
      if (existingRating) {
        result = await storage.updatePOHRating(existingRating.id, rating);
      } else {
        result = await storage.createPOHRating({
          userId,
          pohId: poh_id,
          localDate: local_date,
          rating
        });
      }
      res.json(result);
    } catch (error) {
      console.error("Error saving rating:", error);
      res.status(500).json({ error: "Failed to save rating" });
    }
  });
  app2.post("/api/poh/:id/complete", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const userId = req.user.sub;
      const pohId = req.params.id;
      const { closing_reflection } = req.body;
      const poh = await storage.getPOHById(pohId);
      if (!poh || poh.userId !== userId) {
        return res.status(404).json({ error: "POH not found" });
      }
      if (poh.status !== "active") {
        return res.status(403).json({ error: "Can only complete active POH" });
      }
      if (!closing_reflection || closing_reflection.length < 20) {
        return res.status(400).json({ error: "Closing reflection is required (minimum 20 characters)" });
      }
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      await storage.completePOH(pohId, {
        status: "completed",
        endedAt: today,
        closingReflection: closing_reflection
      });
      await storage.promotePOHs(userId, today);
      res.json({ success: true, message: "POH completed successfully" });
    } catch (error) {
      console.error("Error completing POH:", error);
      res.status(500).json({ error: "Failed to complete POH" });
    }
  });
  app2.post("/api/poh/:id/close", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const userId = req.user.sub;
      const pohId = req.params.id;
      const { closing_reflection } = req.body;
      const poh = await storage.getPOHById(pohId);
      if (!poh || poh.userId !== userId) {
        return res.status(404).json({ error: "POH not found" });
      }
      if (poh.status !== "active") {
        return res.status(403).json({ error: "Can only close active POH" });
      }
      if (!closing_reflection || closing_reflection.length < 20) {
        return res.status(400).json({ error: "Closing reflection is required (minimum 20 characters)" });
      }
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      await storage.completePOH(pohId, {
        status: "closed_early",
        endedAt: today,
        closingReflection: closing_reflection
      });
      await storage.promotePOHs(userId, today);
      res.json({ success: true, message: "POH closed early" });
    } catch (error) {
      console.error("Error closing POH:", error);
      res.status(500).json({ error: "Failed to close POH" });
    }
  });
  app2.get("/api/poh/history", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const userId = req.user.sub;
      const historyPOHs = await storage.getPOHHistory(userId);
      const historyWithMilestones = await Promise.all(
        historyPOHs.map(async (poh) => {
          const milestones = await storage.getPOHMilestones(poh.id);
          const achievedMilestones = milestones.filter((m) => m.achieved).map((m) => m.text);
          return {
            id: poh.id,
            title: poh.title,
            category: poh.category,
            status: poh.status,
            started_at: poh.startedAt,
            ended_at: poh.endedAt,
            closing_reflection: poh.closingReflection,
            milestones: achievedMilestones
          };
        })
      );
      res.json(historyWithMilestones);
    } catch (error) {
      console.error("Error fetching POH history:", error);
      res.status(500).json({ error: "Failed to fetch POH history" });
    }
  });
  const uploadPOHVision = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    // 5MB limit
    fileFilter: (req, file, cb) => {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("INVALID_IMAGE"));
      }
    }
  });
  app2.post("/api/poh/:id/vision", authenticateJWT, uploadPOHVision.single("image"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const userId = req.user.sub;
      const pohId = req.params.id;
      const indexStr = req.body.index;
      const index = parseInt(indexStr, 10);
      if (isNaN(index) || index < 0 || index > 2) {
        return res.status(400).json({
          error: "INVALID_INDEX",
          message: "Index must be 0, 1, or 2"
        });
      }
      const poh = await storage.getPOHById(pohId);
      if (!poh || poh.userId !== userId) {
        return res.status(404).json({ error: "POH not found" });
      }
      if (poh.status !== "active") {
        return res.status(403).json({
          error: "VISION_UPLOAD_NOT_ALLOWED",
          message: "Can only upload vision images to active POH"
        });
      }
      if (!req.file) {
        return res.status(400).json({
          error: "INVALID_IMAGE",
          message: "No image file provided"
        });
      }
      const extMap = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp"
      };
      const ext = extMap[req.file.mimetype] || "jpg";
      const key = `poh-visions/${userId}/${pohId}/vision-${index}.${ext}`;
      const uploadResult = await uploadBufferToR2(req.file.buffer, key, req.file.mimetype);
      if (!uploadResult.success) {
        console.error("R2 upload failed:", uploadResult.error);
        return res.status(500).json({ error: "Failed to upload image" });
      }
      const currentImages = poh.visionImages || [];
      const newImages = [...currentImages];
      while (newImages.length < 3) {
        newImages.push(null);
      }
      newImages[index] = uploadResult.url;
      await storage.updatePOH(pohId, { visionImages: newImages });
      res.json({
        success: true,
        vision_images: newImages,
        uploaded_index: index
      });
    } catch (error) {
      console.error("Error uploading vision image:", error);
      if (error.message === "INVALID_IMAGE") {
        return res.status(400).json({
          error: "INVALID_IMAGE",
          message: "Only JPEG, PNG, and WebP images are allowed"
        });
      }
      res.status(500).json({ error: "Failed to upload vision image" });
    }
  });
  app2.get("/api/v1/notifications", authenticateJWT, async (req, res) => {
    try {
      const userId = req.user.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const notifications2 = await storage.getUserNotifications(userId);
      res.json(notifications2);
    } catch (error) {
      console.error("Error fetching user notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });
  app2.post("/api/v1/notifications/register-device", authenticateJWT, async (req, res) => {
    try {
      const userId = req.user.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { token } = req.body;
      if (!token || typeof token !== "string") {
        return res.status(400).json({ error: "Token is required" });
      }
      const existingToken = await db.select().from(deviceTokens).where(eq2(deviceTokens.token, token)).limit(1);
      if (existingToken.length > 0) {
        if (existingToken[0].userId !== userId) {
          await db.update(deviceTokens).set({ userId }).where(eq2(deviceTokens.token, token));
        }
        return res.json({ success: true, message: "Token already registered" });
      }
      await db.delete(deviceTokens).where(eq2(deviceTokens.userId, userId));
      await db.insert(deviceTokens).values({
        userId,
        token,
        platform: "web"
      });
      res.json({ success: true, message: "Device registered successfully" });
    } catch (error) {
      console.error("Error registering device token:", error);
      res.status(500).json({ error: "Failed to register device" });
    }
  });
  app2.delete("/api/v1/notifications/unregister-device", authenticateJWT, async (req, res) => {
    try {
      const userId = req.user.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { token } = req.body;
      if (token) {
        await db.delete(deviceTokens).where(and2(eq2(deviceTokens.userId, userId), eq2(deviceTokens.token, token)));
      } else {
        await db.delete(deviceTokens).where(eq2(deviceTokens.userId, userId));
      }
      res.json({ success: true, message: "Device unregistered" });
    } catch (error) {
      console.error("Error unregistering device token:", error);
      res.status(500).json({ error: "Failed to unregister device" });
    }
  });
  app2.get("/api/v1/notifications/status", authenticateJWT, async (req, res) => {
    try {
      const userId = req.user.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const tokens = await db.select().from(deviceTokens).where(eq2(deviceTokens.userId, userId)).limit(1);
      res.json({ enabled: tokens.length > 0 });
    } catch (error) {
      console.error("Error getting notification status:", error);
      res.status(500).json({ error: "Failed to get notification status" });
    }
  });
  app2.get("/admin/api/notifications/stats", requireAdmin, async (req, res) => {
    try {
      const allTokens = await db.select().from(deviceTokens);
      const uniqueUserIds = new Set(allTokens.map((t) => t.userId));
      res.json({
        totalDevices: allTokens.length,
        uniqueUsers: uniqueUserIds.size
      });
    } catch (error) {
      console.error("Error getting notification stats:", error);
      res.status(500).json({ error: "Failed to get stats" });
    }
  });
  app2.post("/admin/api/notifications/test", requireAdmin, async (req, res) => {
    try {
      const { title, body } = req.body;
      if (!title || !body) {
        return res.status(400).json({ error: "Title and body are required" });
      }
      const allTokens = await db.select({ token: deviceTokens.token, userId: deviceTokens.userId }).from(deviceTokens);
      if (allTokens.length === 0) {
        return res.json({
          success: true,
          message: "No devices registered",
          successCount: 0,
          failureCount: 0
        });
      }
      const [notification] = await db.insert(notifications).values({
        title,
        body,
        type: "admin_test",
        scheduledAt: /* @__PURE__ */ new Date(),
        sent: true,
        requiredProgramCode: "",
        requiredProgramLevel: 0
      }).returning();
      const tokens = allTokens.map((t) => t.token);
      const result = await sendPushNotification(tokens, title, body);
      if (allTokens.length > 0 && notification) {
        const notificationLogRecords = allTokens.map((t) => ({
          notificationId: notification.id,
          userId: t.userId,
          deviceToken: t.token,
          status: "sent"
        }));
        await db.insert(notificationLogs).values(notificationLogRecords);
      }
      if (result.failedTokens.length > 0) {
        for (const failedToken of result.failedTokens) {
          await db.delete(deviceTokens).where(eq2(deviceTokens.token, failedToken));
        }
      }
      res.json({
        success: true,
        message: `Notification sent`,
        successCount: result.successCount,
        failureCount: result.failureCount,
        tokensCleanedUp: result.failedTokens.length
      });
    } catch (error) {
      console.error("Error sending test notification:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });
  app2.get("/api/v1/drm/questions", authenticateJWT, async (req, res) => {
    try {
      const userId = req.user.sub;
      const questions = await storage.getUserDrmQuestions(userId);
      const now = /* @__PURE__ */ new Date();
      const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const hasSubmittedThisMonth = questions.some((q) => q.monthYear === currentMonthYear);
      res.json({
        questions,
        currentMonthYear,
        hasSubmittedThisMonth
      });
    } catch (error) {
      console.error("Error fetching DrM questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });
  app2.get("/api/v1/drm/questions/:id", authenticateJWT, async (req, res) => {
    try {
      const userId = req.user.sub;
      const questionId = parseInt(req.params.id);
      const question = await storage.getDrmQuestionById(questionId);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      if (question.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      let audioUrl = null;
      if (question.audioR2Key) {
        console.log("DrM audio R2 key:", question.audioR2Key);
        const result = await getSignedGetUrl(question.audioR2Key);
        console.log("DrM signed URL result:", result.success, result.url ? "URL generated" : "No URL", result.error || "");
        if (result.success && result.url) {
          audioUrl = result.url;
        }
      }
      res.json({
        ...question,
        audioUrl
      });
    } catch (error) {
      console.error("Error fetching DrM question:", error);
      res.status(500).json({ error: "Failed to fetch question" });
    }
  });
  app2.post("/api/v1/drm/questions", authenticateJWT, async (req, res) => {
    try {
      const userId = req.user.sub;
      const { questionText } = req.body;
      if (!questionText || typeof questionText !== "string") {
        return res.status(400).json({ error: "Question text is required" });
      }
      if (questionText.length > 240) {
        return res.status(400).json({ error: "Question exceeds 240 character limit" });
      }
      if (questionText.trim().length === 0) {
        return res.status(400).json({ error: "Question cannot be empty" });
      }
      const now = /* @__PURE__ */ new Date();
      const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const existingQuestion = await storage.getDrmQuestionByUserMonth(userId, monthYear);
      if (existingQuestion) {
        return res.status(409).json({ error: "You have already submitted a question this month" });
      }
      const question = await storage.createDrmQuestion({
        userId,
        questionText: questionText.trim(),
        monthYear
      });
      res.status(201).json({
        success: true,
        message: "Your question has been sent. Dr. M will respond soon.",
        question
      });
    } catch (error) {
      console.error("Error submitting DrM question:", error);
      res.status(500).json({ error: "Failed to submit question" });
    }
  });
  app2.get("/admin/api/drm/questions", requireAdmin, async (req, res) => {
    try {
      const questions = await storage.getAllDrmQuestions();
      res.json(questions);
    } catch (error) {
      console.error("Error fetching DrM questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });
  app2.get("/admin/api/drm/questions/:id", requireAdmin, async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const question = await storage.getDrmQuestionById(questionId);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      const user = await storage.getUserById(question.userId);
      let audioUrl = null;
      if (question.audioR2Key) {
        const result = await getSignedGetUrl(question.audioR2Key);
        if (result.success && result.url) {
          audioUrl = result.url;
        }
      }
      res.json({
        ...question,
        userName: user?.name || "Unknown",
        audioUrl
      });
    } catch (error) {
      console.error("Error fetching DrM question:", error);
      res.status(500).json({ error: "Failed to fetch question" });
    }
  });
  app2.post("/admin/api/drm/questions/:id/answer", requireAdmin, async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const { mimeType } = req.body;
      const question = await storage.getDrmQuestionById(questionId);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      let extension = "webm";
      const contentType = mimeType || "audio/webm";
      if (contentType.includes("mp4") || contentType.includes("m4a")) {
        extension = "mp4";
      } else if (contentType.includes("ogg")) {
        extension = "ogg";
      }
      const audioKey = `drm-audio/questions/${questionId}/answer.${extension}`;
      const result = await getSignedPutUrl(audioKey, contentType);
      if (!result.success) {
        return res.status(500).json({ error: result.error || "Failed to generate upload URL" });
      }
      res.json({
        uploadUrl: result.uploadUrl,
        audioKey
      });
    } catch (error) {
      console.error("Error generating audio upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });
  app2.post("/admin/api/drm/questions/:id/confirm-answer", requireAdmin, async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const { audioKey } = req.body;
      if (!audioKey) {
        return res.status(400).json({ error: "Audio key is required" });
      }
      const question = await storage.getDrmQuestionById(questionId);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      const updatedQuestion = await storage.updateDrmQuestionAnswer(questionId, audioKey);
      if (!updatedQuestion) {
        return res.status(500).json({ error: "Failed to update question" });
      }
      const [notification] = await db.insert(notifications).values({
        title: "Dr. M has answered your question \u{1F3A7}",
        body: "Your personal voice response is ready to listen.",
        type: "drm_answer",
        scheduledAt: /* @__PURE__ */ new Date(),
        sent: true,
        requiredProgramCode: "",
        requiredProgramLevel: 0
      }).returning();
      const userTokens = await storage.getDeviceTokensByUserIds([question.userId]);
      if (userTokens.length > 0) {
        const tokens = userTokens.map((t) => t.token);
        const result = await sendPushNotification(
          tokens,
          "Dr. M has answered your question \u{1F3A7}",
          "Your personal voice response is ready to listen.",
          { questionId: questionId.toString(), deepLink: `/dr-m/questions/${questionId}` }
        );
        const notificationLogRecords = userTokens.map((t) => ({
          notificationId: notification.id,
          userId: t.userId,
          deviceToken: t.token,
          status: result.successCount > 0 ? "sent" : "failed"
        }));
        await db.insert(notificationLogs).values(notificationLogRecords);
      } else {
        await db.insert(notificationLogs).values({
          notificationId: notification.id,
          userId: question.userId,
          deviceToken: "in-app-only",
          status: "sent"
        });
      }
      console.log(`DrM answer submitted for question ${questionId}, notification sent to user ${question.userId}`);
      const audioUrl = await getSignedGetUrl(audioKey);
      res.json({
        success: true,
        message: "Answer submitted and user notified",
        question: updatedQuestion,
        audioUrl
      });
    } catch (error) {
      console.error("Error confirming DrM answer:", error);
      res.status(500).json({ error: "Failed to confirm answer" });
    }
  });
  app2.get("/admin/api/poh/usage", requireAdmin, async (req, res) => {
    try {
      const totalUsersResult = await db.select({ count: count2() }).from(users);
      const totalUsers = Number(totalUsersResult[0]?.count) || 0;
      const usersWithPohResult = await db.select({
        count: countDistinct(projectOfHearts.userId)
      }).from(projectOfHearts);
      const usersWithPoh = Number(usersWithPohResult[0]?.count) || 0;
      const activeResult = await db.select({ count: count2() }).from(projectOfHearts).where(eq2(projectOfHearts.status, "active"));
      const active = Number(activeResult[0]?.count) || 0;
      const nextResult = await db.select({ count: count2() }).from(projectOfHearts).where(eq2(projectOfHearts.status, "next"));
      const next = Number(nextResult[0]?.count) || 0;
      const northStarResult = await db.select({ count: count2() }).from(projectOfHearts).where(eq2(projectOfHearts.status, "horizon"));
      const northStar = Number(northStarResult[0]?.count) || 0;
      res.json({
        total_users: totalUsers,
        users_with_poh: usersWithPoh,
        active,
        next,
        north_star: northStar
      });
    } catch (error) {
      console.error("Error fetching POH usage:", error);
      res.status(500).json({ error: "Failed to fetch usage data" });
    }
  });
  app2.get("/admin/api/poh/daily-checkins", requireAdmin, async (req, res) => {
    try {
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const todayResult = await db.select({
        count: countDistinct(pohDailyRatings.userId)
      }).from(pohDailyRatings).where(eq2(pohDailyRatings.localDate, today));
      const todayCheckedIn = Number(todayResult[0]?.count) || 0;
      const activeUsersResult = await db.select({
        count: countDistinct(projectOfHearts.userId)
      }).from(projectOfHearts).where(eq2(projectOfHearts.status, "active"));
      const activeUsers = Number(activeUsersResult[0]?.count) || 0;
      const percentOfActive = activeUsers > 0 ? Math.round(todayCheckedIn / activeUsers * 100) : 0;
      const thirtyDaysAgo = /* @__PURE__ */ new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];
      const last30DaysResult = await db.select({
        date: pohDailyRatings.localDate,
        count: countDistinct(pohDailyRatings.userId)
      }).from(pohDailyRatings).where(gte(pohDailyRatings.localDate, thirtyDaysAgoStr)).groupBy(pohDailyRatings.localDate).orderBy(asc2(pohDailyRatings.localDate));
      const dateMap = new Map(last30DaysResult.map((r) => [r.date, Number(r.count)]));
      const last30Days = [];
      for (let i = 29; i >= 0; i--) {
        const d = /* @__PURE__ */ new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        last30Days.push({
          date: dateStr,
          users_checked_in: dateMap.get(dateStr) || 0
        });
      }
      res.json({
        today: {
          date: today,
          users_checked_in: todayCheckedIn,
          percent_of_active_users: percentOfActive
        },
        last_30_days: last30Days
      });
    } catch (error) {
      console.error("Error fetching daily check-ins:", error);
      res.status(500).json({ error: "Failed to fetch check-in data" });
    }
  });
  app2.get("/admin/api/poh/progress-signals", requireAdmin, async (req, res) => {
    try {
      const today = /* @__PURE__ */ new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];
      const completedPohResult = await db.select({ count: count2() }).from(projectOfHearts).where(eq2(projectOfHearts.status, "completed"));
      const completedPoh = Number(completedPohResult[0]?.count) || 0;
      const achieved30Result = await db.select({ count: count2() }).from(pohMilestones).where(and2(
        eq2(pohMilestones.achieved, true),
        gte(pohMilestones.achievedAt, thirtyDaysAgoStr)
      ));
      const milestonesAchieved30 = Number(achieved30Result[0]?.count) || 0;
      const firstMilestonesResult = await db.execute(sql3`
        SELECT AVG(days_to_first)::float as avg_days FROM (
          SELECT 
            p.id as poh_id,
            MIN(m.achieved_at::date - p.started_at::date) as days_to_first
          FROM project_of_hearts p
          JOIN poh_milestones m ON m.poh_id = p.id
          WHERE m.achieved = true AND p.started_at IS NOT NULL AND m.achieved_at IS NOT NULL
          GROUP BY p.id
        ) sub
      `);
      const avgDaysToFirst = Math.round(firstMilestonesResult.rows[0]?.avg_days || 0);
      res.json({
        completed_poh: Number(completedPoh),
        milestones_achieved_30_days: Number(milestonesAchieved30),
        avg_days_to_first_milestone: Number(avgDaysToFirst) || 0
      });
    } catch (error) {
      console.error("Error fetching progress signals:", error);
      res.status(500).json({ error: "Failed to fetch progress signals" });
    }
  });
  app2.get("/admin/api/poh/drop-offs", requireAdmin, async (req, res) => {
    try {
      const closedEarlyResult = await db.select({ count: count2() }).from(projectOfHearts).where(eq2(projectOfHearts.status, "closed_early"));
      const closedEarly = Number(closedEarlyResult[0]?.count) || 0;
      const activeNoMilestonesResult = await db.execute(sql3`
        SELECT COUNT(DISTINCT p.id) as count
        FROM project_of_hearts p
        LEFT JOIN poh_milestones m ON m.poh_id = p.id AND m.achieved = true
        WHERE p.status = 'active' AND m.id IS NULL
      `);
      const activeNoMilestones = parseInt(activeNoMilestonesResult.rows[0]?.count || "0");
      const avgDurationResult = await db.execute(sql3`
        SELECT AVG(ended_at::date - started_at::date)::float as avg_days
        FROM project_of_hearts
        WHERE ended_at IS NOT NULL AND started_at IS NOT NULL
          AND status IN ('completed', 'closed_early')
      `);
      const avgDuration = Math.round(avgDurationResult.rows[0]?.avg_days || 0);
      res.json({
        closed_early: Number(closedEarly),
        active_with_no_milestones: Number(activeNoMilestones),
        avg_active_duration_days: Number(avgDuration) || 0
      });
    } catch (error) {
      console.error("Error fetching drop-offs:", error);
      res.status(500).json({ error: "Failed to fetch drop-off data" });
    }
  });
  app2.get("/admin/api/poh/life-areas", requireAdmin, async (req, res) => {
    try {
      const categoryResult = await db.select({
        category: projectOfHearts.category,
        count: count2()
      }).from(projectOfHearts).where(eq2(projectOfHearts.status, "active")).groupBy(projectOfHearts.category);
      const categories2 = {
        career: 0,
        health: 0,
        relationships: 0,
        wealth: 0
      };
      categoryResult.forEach((r) => {
        if (r.category in categories2) {
          categories2[r.category] = Number(r.count) || 0;
        }
      });
      res.json(categories2);
    } catch (error) {
      console.error("Error fetching life areas:", error);
      res.status(500).json({ error: "Failed to fetch life areas" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    hmr: {
      overlay: false
      // ✅ disable red overlay error modal during dev reloads
    },
    fs: {
      strict: false
      // ✅ allow serving files outside root (important for Replit public)
    },
    publicDir: path2.resolve(import.meta.dirname, "client/public"),
    // ✅ ensure /RightDecisions.mp4 is served
    port: 5173
    // optional: helps when debugging locally
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/jobs/notificationCron.ts
init_storage();
var cronInterval = null;
var isProcessing = false;
async function processNotifications() {
  if (isProcessing) {
    console.log("Notification cron: Previous run still in progress, skipping");
    return;
  }
  isProcessing = true;
  try {
    const pendingNotifications = await storage.getPendingNotifications();
    for (const notification of pendingNotifications) {
      try {
        const eligibleUserIds = await storage.getEligibleUserIdsForNotification(
          notification.requiredProgramCode,
          notification.requiredProgramLevel
        );
        if (eligibleUserIds.length === 0) {
          console.log(`No eligible users for notification ${notification.id}, marking as sent`);
          await storage.markNotificationSent(notification.id);
          continue;
        }
        const deviceTokens2 = await storage.getDeviceTokensByUserIds(eligibleUserIds);
        if (deviceTokens2.length === 0) {
          console.log(`No device tokens found for notification ${notification.id}, marking as sent`);
          await storage.markNotificationSent(notification.id);
          continue;
        }
        const tokens = deviceTokens2.map((dt) => dt.token);
        const userIdByToken = new Map(deviceTokens2.map((dt) => [dt.token, dt.userId]));
        console.log(`Sending notification ${notification.id} to ${tokens.length} devices`);
        const dataPayload = {
          type: notification.type,
          notificationId: String(notification.id)
        };
        if (notification.type === "event_reminder" && notification.relatedEventId) {
          dataPayload.eventId = String(notification.relatedEventId);
        }
        const result = await sendPushNotification(
          tokens,
          notification.title,
          notification.body,
          dataPayload
        );
        const logs = [];
        for (const token of tokens) {
          const userId = userIdByToken.get(token) || 0;
          const failed = result.failedTokens.includes(token);
          logs.push({
            notificationId: notification.id,
            userId,
            deviceToken: token,
            status: failed ? "failed" : "sent",
            error: failed ? "FCM delivery failed" : null
          });
        }
        await storage.createNotificationLogs(logs);
        for (const failedToken of result.failedTokens) {
          try {
            await storage.deleteDeviceToken(failedToken);
            console.log(`Removed invalid token: ${failedToken.substring(0, 20)}...`);
          } catch (err) {
            console.error("Error removing failed token:", err);
          }
        }
        await storage.markNotificationSent(notification.id);
        console.log(
          `Notification ${notification.id}: ${result.successCount} sent, ${result.failureCount} failed`
        );
      } catch (notificationError) {
        console.error(`Error processing notification ${notification.id}:`, notificationError);
      }
    }
  } catch (error) {
    console.error("Error processing notifications:", error);
  } finally {
    isProcessing = false;
  }
}
function startNotificationCron() {
  if (cronInterval) {
    console.log("Notification cron already running");
    return;
  }
  console.log("Starting notification cron job (runs every 60 seconds)");
  cronInterval = setInterval(processNotifications, 60 * 1e3);
  processNotifications();
}

// server/index.ts
var app = express2();
app.get("/firebase-messaging-sw.js", (req, res) => {
  const swPath = path4.join(
    process.cwd(),
    "client/public/firebase-messaging-sw.js"
  );
  if (!fs3.existsSync(swPath)) {
    return res.status(404).send("Service worker not found");
  }
  res.setHeader("Content-Type", "application/javascript");
  res.sendFile(swPath);
});
app.use(
  express2.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  initializeFirebaseAdmin();
  startNotificationCron();
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();
