var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  activityLogs: () => activityLogs,
  articles: () => articles,
  categories: () => categories,
  cmsCourses: () => cmsCourses,
  cmsLessonFiles: () => cmsLessonFiles,
  cmsLessons: () => cmsLessons,
  cmsModuleFolders: () => cmsModuleFolders,
  cmsModules: () => cmsModules,
  communitySessions: () => communitySessions,
  drmMessageSchema: () => drmMessageSchema,
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
  insertFeatureCourseMapSchema: () => insertFeatureCourseMapSchema,
  insertFrontendFeatureSchema: () => insertFrontendFeatureSchema,
  insertMoneyEntrySchema: () => insertMoneyEntrySchema,
  insertPlaylistItemSchema: () => insertPlaylistItemSchema,
  insertPlaylistSchema: () => insertPlaylistSchema,
  insertProgramSchema: () => insertProgramSchema,
  insertSessionBannerSchema: () => insertSessionBannerSchema,
  insertUserProgramSchema: () => insertUserProgramSchema,
  insertUserSchema: () => insertUserSchema,
  insertUserStreakSchema: () => insertUserStreakSchema,
  lessonFileTypeEnum: () => lessonFileTypeEnum,
  moneyEntries: () => moneyEntries,
  playlistItems: () => playlistItems,
  playlists: () => playlists,
  programs: () => programs,
  sessionBanners: () => sessionBanners,
  userPrograms: () => userPrograms,
  userStreaks: () => userStreaks,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, serial, timestamp, date, numeric, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
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
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  lastLogin: true,
  lastActivity: true,
  createdAt: true
});
var communitySessions = pgTable("community_sessions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  time: text("time").notNull(),
  displayTime: text("display_time").notNull(),
  meetingLink: text("meeting_link").notNull(),
  participants: integer("participants").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true)
});
var insertCommunitySessionSchema = createInsertSchema(communitySessions).omit({
  id: true
});
var drmMessageSchema = z.object({
  id: z.string(),
  question: z.string(),
  userName: z.string().optional(),
  videoUrl: z.string(),
  subtitlesUrl: z.string().optional(),
  textResponse: z.string(),
  timestamp: z.number()
});
var categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique()
});
var insertCategorySchema = createInsertSchema(categories).omit({
  id: true
});
var articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  categoryId: integer("category_id").notNull(),
  imageUrl: text("image_url").notNull(),
  content: text("content").notNull(),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});
var insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  createdAt: true
});
var programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull()
});
var insertProgramSchema = createInsertSchema(programs).omit({
  id: true
});
var userPrograms = pgTable("user_programs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  programId: integer("program_id").notNull().references(() => programs.id, { onDelete: "cascade" })
});
var insertUserProgramSchema = createInsertSchema(userPrograms).omit({
  id: true
});
var cmsCourses = pgTable("cms_courses", {
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
var insertCmsCourseSchema = createInsertSchema(cmsCourses).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var cmsModules = pgTable("cms_modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => cmsCourses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
});
var insertCmsModuleSchema = createInsertSchema(cmsModules).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var cmsModuleFolders = pgTable("cms_module_folders", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull().references(() => cmsModules.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
});
var insertCmsModuleFolderSchema = createInsertSchema(cmsModuleFolders).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var cmsLessons = pgTable("cms_lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull().references(() => cmsModules.id, { onDelete: "cascade" }),
  folderId: integer("folder_id").references(() => cmsModuleFolders.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
});
var insertCmsLessonSchema = createInsertSchema(cmsLessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var lessonFileTypeEnum = ["video", "audio", "script"];
var cmsLessonFiles = pgTable("cms_lesson_files", {
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
var insertCmsLessonFileSchema = createInsertSchema(cmsLessonFiles).omit({
  id: true,
  createdAt: true
});
var frontendFeatures = pgTable("frontend_features", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  displayName: text("display_name").notNull(),
  displayMode: text("display_mode").notNull(),
  // 'modules' | 'lessons' | 'courses'
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
});
var insertFrontendFeatureSchema = createInsertSchema(frontendFeatures).omit({
  id: true,
  createdAt: true
});
var featureCourseMap = pgTable("feature_course_map", {
  id: serial("id").primaryKey(),
  featureId: integer("feature_id").notNull().references(() => frontendFeatures.id, { onDelete: "cascade" }),
  courseId: integer("course_id").notNull().references(() => cmsCourses.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
});
var insertFeatureCourseMapSchema = createInsertSchema(featureCourseMap).omit({
  id: true,
  createdAt: true
});
var moneyEntries = pgTable("money_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  entryDate: date("entry_date", { mode: "string" }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
}, (table) => ({
  uniqueUserDate: unique("unique_user_date").on(table.userId, table.entryDate)
}));
var insertMoneyEntrySchema = createInsertSchema(moneyEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var playlists = pgTable("playlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
});
var insertPlaylistSchema = createInsertSchema(playlists).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var playlistItems = pgTable("playlist_items", {
  id: serial("id").primaryKey(),
  playlistId: integer("playlist_id").notNull().references(() => playlists.id, { onDelete: "cascade" }),
  lessonId: integer("lesson_id").notNull().references(() => cmsLessons.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
}, (table) => ({
  uniquePlaylistLesson: unique("unique_playlist_lesson").on(table.playlistId, table.lessonId)
}));
var insertPlaylistItemSchema = createInsertSchema(playlistItems).omit({
  id: true,
  createdAt: true
});
var sessionBanners = pgTable("session_banners", {
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
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
});
var insertSessionBannerSchema = createInsertSchema(sessionBanners).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var userStreaks = pgTable("user_streaks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  activityDate: varchar("activity_date", { length: 10 }).notNull(),
  // YYYY-MM-DD format
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
}, (table) => ({
  uniqueUserActivityDate: unique("unique_user_activity_date").on(table.userId, table.activityDate)
}));
var insertUserStreakSchema = createInsertSchema(userStreaks).omit({
  id: true,
  createdAt: true
});
var activityLogs = pgTable("activity_logs", {
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
var insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true
});
var featureTypeEnum = ["PROCESS", "BREATH", "CHECKLIST"];

// server/db.ts
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
import { eq, ilike, and, or, inArray, sql as sql2, count, asc, desc } from "drizzle-orm";
var DbStorage = class {
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
      orderBy: (articles2, { desc: desc2 }) => [desc2(articles2.createdAt)]
    });
  }
  async getPublishedArticles() {
    return await db.query.articles.findMany({
      where: (articles2, { eq: eq3 }) => eq3(articles2.isPublished, true),
      orderBy: (articles2, { desc: desc2 }) => [desc2(articles2.createdAt)]
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
  async createAdmin(admin) {
    const [newAdmin] = await db.insert(users).values({
      ...admin,
      status: admin.status || "active"
    }).returning();
    return newAdmin;
  }
  async updateAdmin(id, admin) {
    const [updated] = await db.update(users).set(admin).where(eq(users.id, id)).returning();
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
      BREATH: [],
      CHECKLIST: [],
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
      } else if (activity.featureType === "BREATH") {
        result.BREATH.push(item);
      } else if (activity.featureType === "CHECKLIST") {
        result.CHECKLIST.push(item);
      }
    }
    result.PROCESS.sort((a, b) => b.count - a.count);
    result.BREATH.sort((a, b) => b.count - a.count);
    result.CHECKLIST.sort((a, b) => b.count - a.count);
    return result;
  }
};
var storage = new DbStorage();

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
function sanitizeFileName(filename) {
  return filename.toLowerCase().replace(/[^a-z0-9.-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
function generateCourseThumnailKey(courseId, filename) {
  const timestamp2 = Date.now();
  const safeName = sanitizeFileName(filename);
  return `courses/${courseId}/thumbnail/${timestamp2}-${safeName}`;
}
function generateLessonFileKey(lessonId, fileType, filename) {
  const timestamp2 = Date.now();
  const safeName = sanitizeFileName(filename);
  return `lessons/${lessonId}/${fileType}/${timestamp2}-${safeName}`;
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

// server/routes.ts
import PDFParser from "pdf2json";
import { eq as eq2, asc as asc2, and as and2, sql as sql3 } from "drizzle-orm";
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
          const text2 = textItem.R?.map((r) => decodeURIComponent(r.T)).join("") || "";
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
      if (!featureType || !["PROCESS", "BREATH", "CHECKLIST"].includes(featureType)) {
        return res.status(400).json({ error: "featureType must be PROCESS, BREATH, or CHECKLIST" });
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
      console.log(`[monthly-stats] Results: PROCESS=${stats.PROCESS.length}, BREATH=${stats.BREATH.length}, CHECKLIST=${stats.CHECKLIST.length}`);
      res.set("Cache-Control", "no-store");
      res.json(stats);
    } catch (error) {
      console.error("Error fetching monthly stats:", error);
      res.status(500).json({ error: "Failed to fetch monthly stats" });
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
      const admin = await storage.getAdminById(id);
      if (!admin) {
        res.status(404).json({ error: "Admin not found" });
        return;
      }
      res.json(admin);
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
      const admin = await storage.createAdmin({
        name,
        email,
        phone: phone || null,
        passwordHash,
        role,
        status: status || "active"
      });
      res.status(201).json({ message: "Admin created", adminId: admin.id });
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
      const admin = await storage.updateAdmin(id, {
        name,
        email,
        role,
        status
      });
      if (!admin) {
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
        const admin = await storage.updateAdminStatus(id, status);
        if (!admin) {
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
      res.json({ ...course, thumbnailSignedUrl, modules: modulesWithContent });
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
        if (uploadType === "thumbnail" && courseId) {
          key = generateCourseThumnailKey(courseId, filename);
        } else if (lessonId && fileType) {
          key = generateLessonFileKey(lessonId, fileType, filename);
        } else {
          res.status(400).json({ error: "Invalid upload parameters" });
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
        if (code !== "ABUNDANCE") {
          return res.status(400).json({ error: "Reorder only allowed for ABUNDANCE feature" });
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
        const builtIns = [
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
        ];
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
      const { type, thumbnailKey, videoKey, posterKey, ctaText, ctaLink, startAt, endAt, liveEnabled } = req.body;
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
        liveEnabled: liveEnabled || false
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
      const { type, thumbnailKey, videoKey, posterKey, ctaText, ctaLink, startAt, endAt, liveEnabled } = req.body;
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
        liveEnabled: original.liveEnabled
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
      const isLive = banner.type === "session" && banner.liveEnabled && status === "active" && now >= banner.startAt && now < banner.endAt;
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

// server/index.ts
var app = express2();
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
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
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
