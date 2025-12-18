import { 
  type User, type InsertUser, type UserWithPrograms,
  type CommunitySession, type InsertCommunitySession, 
  type Category, type InsertCategory,
  type Article, type InsertArticle,
  type Program, type InsertProgram,
  type UserProgram, type InsertUserProgram,
  type FrontendFeature, type InsertFrontendFeature,
  type FeatureCourseMap, type InsertFeatureCourseMap,
  type MoneyEntry,
  type Playlist, type InsertPlaylist,
  type PlaylistItem, type InsertPlaylistItem,
  type SessionBanner, type InsertSessionBanner,
  type UserStreak, type InsertUserStreak,
  type ActivityLog, type InsertActivityLog, type FeatureType,
  type RewiringBelief, type InsertRewiringBelief,
  type UserWellnessProfile, type InsertUserWellnessProfile,
  communitySessions, users as usersTable, categories as categoriesTable, articles as articlesTable,
  programs as programsTable, userPrograms as userProgramsTable,
  frontendFeatures as frontendFeaturesTable, featureCourseMap as featureCourseMapTable,
  cmsCourses, cmsModules, cmsLessons, cmsLessonFiles, moneyEntries,
  playlists as playlistsTable, playlistItems as playlistItemsTable,
  sessionBanners as sessionBannersTable,
  userStreaks as userStreaksTable,
  activityLogs as activityLogsTable,
  rewiringBeliefs as rewiringBeliefsTable,
  userWellnessProfiles as userWellnessProfilesTable
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, ilike, and, or, inArray, sql, count, asc, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(id: number): Promise<void>;
  
  getAllCommunitySessions(): Promise<CommunitySession[]>;
  getCommunitySession(id: number): Promise<CommunitySession | undefined>;
  createCommunitySession(session: InsertCommunitySession): Promise<CommunitySession>;
  updateCommunitySession(id: number, session: Partial<InsertCommunitySession>): Promise<CommunitySession | undefined>;
  deleteCommunitySession(id: number): Promise<boolean>;

  getAllCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  getAllArticles(): Promise<Article[]>;
  getPublishedArticles(): Promise<Article[]>;
  getArticle(id: number): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article | undefined>;
  deleteArticle(id: number): Promise<boolean>;

  getAllPrograms(): Promise<Program[]>;
  getProgramByCode(code: string): Promise<Program | undefined>;
  getProgramById(id: number): Promise<Program | undefined>;
  createProgram(program: InsertProgram): Promise<Program>;

  getStudents(params: { search?: string; programCode?: string; page?: number; limit?: number }): Promise<{ data: UserWithPrograms[]; pagination: { total: number; page: number; pages: number } }>;
  getStudentById(id: number): Promise<UserWithPrograms | undefined>;
  createStudent(student: InsertUser, programCode?: string): Promise<User>;
  updateStudent(id: number, student: Partial<InsertUser>, programCode?: string): Promise<User | undefined>;
  updateStudentStatus(id: number, status: string): Promise<User | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  getUserPrograms(userId: number): Promise<string[]>;
  assignUserProgram(userId: number, programId: number): Promise<void>;
  clearUserPrograms(userId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private communitySessions: Map<number, CommunitySession>;
  private categories: Map<number, Category>;
  private articles: Map<number, Article>;
  private nextSessionId: number;
  private nextCategoryId: number;
  private nextArticleId: number;

  constructor() {
    this.users = new Map();
    this.communitySessions = new Map();
    this.categories = new Map();
    this.articles = new Map();
    this.nextSessionId = 1;
    this.nextCategoryId = 1;
    this.nextArticleId = 1;
  }

  async getUser(id: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.id.toString() === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserById(id: number): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.id === id);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = Array.from(this.users.values()).length + 1;
    const user: User = { 
      ...insertUser, 
      id,
      phone: insertUser.phone || null,
      role: insertUser.role || "USER",
      status: insertUser.status || "active",
      lastLogin: null,
      lastActivity: null,
      createdAt: new Date()
    };
    this.users.set(id.toString(), user);
    return user;
  }

  async updateUserLastLogin(id: number): Promise<void> {
    const user = await this.getUserById(id);
    if (user) {
      user.lastLogin = new Date();
      this.users.set(id.toString(), user);
    }
  }

  async getAllCommunitySessions(): Promise<CommunitySession[]> {
    return Array.from(this.communitySessions.values());
  }

  async getCommunitySession(id: number): Promise<CommunitySession | undefined> {
    return this.communitySessions.get(id);
  }

  async createCommunitySession(session: InsertCommunitySession): Promise<CommunitySession> {
    const id = this.nextSessionId++;
    const newSession: CommunitySession = { 
      ...session, 
      id,
      participants: session.participants ?? 0,
      isActive: session.isActive ?? true,
    };
    this.communitySessions.set(id, newSession);
    return newSession;
  }

  async updateCommunitySession(id: number, session: Partial<InsertCommunitySession>): Promise<CommunitySession | undefined> {
    const existing = this.communitySessions.get(id);
    if (!existing) return undefined;
    
    const updated: CommunitySession = { ...existing, ...session };
    this.communitySessions.set(id, updated);
    return updated;
  }

  async deleteCommunitySession(id: number): Promise<boolean> {
    return this.communitySessions.delete(id);
  }

  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.nextCategoryId++;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  async getAllArticles(): Promise<Article[]> {
    return Array.from(this.articles.values());
  }

  async getPublishedArticles(): Promise<Article[]> {
    return Array.from(this.articles.values()).filter(a => a.isPublished);
  }

  async getArticle(id: number): Promise<Article | undefined> {
    return this.articles.get(id);
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const id = this.nextArticleId++;
    const newArticle: Article = { 
      ...article, 
      id,
      isPublished: article.isPublished ?? false,
      createdAt: new Date().toISOString(),
    };
    this.articles.set(id, newArticle);
    return newArticle;
  }

  async updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article | undefined> {
    const existing = this.articles.get(id);
    if (!existing) return undefined;
    
    const updated: Article = { ...existing, ...article };
    this.articles.set(id, updated);
    return updated;
  }

  async deleteArticle(id: number): Promise<boolean> {
    return this.articles.delete(id);
  }

  async getAllPrograms(): Promise<Program[]> {
    return [];
  }

  async getProgramByCode(code: string): Promise<Program | undefined> {
    return undefined;
  }

  async getProgramById(id: number): Promise<Program | undefined> {
    return undefined;
  }

  async createProgram(program: InsertProgram): Promise<Program> {
    throw new Error("Not implemented in MemStorage");
  }

  async getStudents(params: { search?: string; programCode?: string; page?: number; limit?: number }): Promise<{ data: UserWithPrograms[]; pagination: { total: number; page: number; pages: number } }> {
    return { data: [], pagination: { total: 0, page: 1, pages: 1 } };
  }

  async getStudentById(id: number): Promise<UserWithPrograms | undefined> {
    return undefined;
  }

  async createStudent(student: InsertUser, programCode?: string): Promise<User> {
    return this.createUser(student);
  }

  async updateStudent(id: number, student: Partial<InsertUser>, programCode?: string): Promise<User | undefined> {
    const existing = await this.getUserById(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...student } as User;
    this.users.set(id.toString(), updated);
    return updated;
  }

  async updateStudentStatus(id: number, status: string): Promise<User | undefined> {
    const existing = await this.getUserById(id);
    if (!existing) return undefined;
    existing.status = status;
    this.users.set(id.toString(), existing);
    return existing;
  }

  async deleteStudent(id: number): Promise<boolean> {
    return this.users.delete(id.toString());
  }

  async getUserPrograms(userId: number): Promise<string[]> {
    return [];
  }

  async assignUserProgram(userId: number, programId: number): Promise<void> {
  }

  async clearUserPrograms(userId: number): Promise<void> {
  }

  async getAllFrontendFeatures(): Promise<FrontendFeature[]> {
    return [];
  }

  async getFrontendFeatureByCode(code: string): Promise<FrontendFeature | undefined> {
    return undefined;
  }

  async getFeatureCourseMappings(featureId: number): Promise<(FeatureCourseMap & { course: { id: number; title: string } })[]> {
    return [];
  }

  async createFeatureCourseMapping(mapping: InsertFeatureCourseMap): Promise<FeatureCourseMap> {
    throw new Error("Not implemented");
  }

  async deleteFeatureCourseMapping(featureId: number, courseId: number): Promise<boolean> {
    return false;
  }

  async clearFeatureCourseMappings(featureId: number): Promise<void> {
  }

  async reorderFeatureCourseMappings(featureId: number, courseIds: number[]): Promise<void> {
  }
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, parseInt(id)),
    });
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, username),
    });
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    });
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, id),
    });
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(usersTable).values(insertUser).returning();
    return user;
  }

  async updateUserLastLogin(id: number): Promise<void> {
    await db.update(usersTable).set({ lastLogin: new Date() }).where(eq(usersTable.id, id));
  }

  async getAllCommunitySessions(): Promise<CommunitySession[]> {
    return await db.query.communitySessions.findMany({
      orderBy: (sessions, { asc }) => [asc(sessions.time)],
    });
  }

  async getCommunitySession(id: number): Promise<CommunitySession | undefined> {
    return await db.query.communitySessions.findFirst({
      where: (sessions, { eq }) => eq(sessions.id, id),
    });
  }

  async createCommunitySession(session: InsertCommunitySession): Promise<CommunitySession> {
    const [newSession] = await db.insert(communitySessions).values(session).returning();
    return newSession;
  }

  async updateCommunitySession(id: number, session: Partial<InsertCommunitySession>): Promise<CommunitySession | undefined> {
    const [updated] = await db
      .update(communitySessions)
      .set(session)
      .where(eq(communitySessions.id, id))
      .returning();
    return updated;
  }

  async deleteCommunitySession(id: number): Promise<boolean> {
    const result = await db
      .delete(communitySessions)
      .where(eq(communitySessions.id, id))
      .returning();
    return result.length > 0;
  }

  async getAllCategories(): Promise<Category[]> {
    return await db.query.categories.findMany({
      orderBy: (categories, { asc }) => [asc(categories.name)],
    });
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return await db.query.categories.findFirst({
      where: (categories, { eq }) => eq(categories.id, id),
    });
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categoriesTable).values(category).returning();
    return newCategory;
  }

  async getAllArticles(): Promise<Article[]> {
    return await db.query.articles.findMany({
      orderBy: (articles, { desc }) => [desc(articles.createdAt)],
    });
  }

  async getPublishedArticles(): Promise<Article[]> {
    return await db.query.articles.findMany({
      where: (articles, { eq }) => eq(articles.isPublished, true),
      orderBy: (articles, { desc }) => [desc(articles.createdAt)],
    });
  }

  async getArticle(id: number): Promise<Article | undefined> {
    return await db.query.articles.findFirst({
      where: (articles, { eq }) => eq(articles.id, id),
    });
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const [newArticle] = await db.insert(articlesTable).values(article).returning();
    return newArticle;
  }

  async updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article | undefined> {
    const [updated] = await db
      .update(articlesTable)
      .set(article)
      .where(eq(articlesTable.id, id))
      .returning();
    return updated;
  }

  async deleteArticle(id: number): Promise<boolean> {
    const result = await db
      .delete(articlesTable)
      .where(eq(articlesTable.id, id))
      .returning();
    return result.length > 0;
  }

  async getAllPrograms(): Promise<Program[]> {
    return await db.query.programs.findMany({
      orderBy: (programs, { asc }) => [asc(programs.code)],
    });
  }

  async getProgramByCode(code: string): Promise<Program | undefined> {
    return await db.query.programs.findFirst({
      where: (programs, { eq }) => eq(programs.code, code),
    });
  }

  async getProgramById(id: number): Promise<Program | undefined> {
    return await db.query.programs.findFirst({
      where: (programs, { eq }) => eq(programs.id, id),
    });
  }

  async createProgram(program: InsertProgram): Promise<Program> {
    const [newProgram] = await db.insert(programsTable).values(program).returning();
    return newProgram;
  }

  async getUserPrograms(userId: number): Promise<string[]> {
    const userProgramLinks = await db.select().from(userProgramsTable).where(eq(userProgramsTable.userId, userId));
    if (userProgramLinks.length === 0) return [];
    
    const programIds = userProgramLinks.map(up => up.programId);
    const programs = await db.select().from(programsTable).where(inArray(programsTable.id, programIds));
    return programs.map(p => p.code);
  }

  async assignUserProgram(userId: number, programId: number): Promise<void> {
    await db.insert(userProgramsTable).values({ userId, programId });
  }

  async clearUserPrograms(userId: number): Promise<void> {
    await db.delete(userProgramsTable).where(eq(userProgramsTable.userId, userId));
  }

  async getStudents(params: { search?: string; programCode?: string; page?: number; limit?: number }): Promise<{ data: UserWithPrograms[]; pagination: { total: number; page: number; pages: number } }> {
    const { search = "", programCode = "ALL", page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    let userIdsFilter: number[] | null = null;

    if (programCode && programCode !== "ALL") {
      const program = await this.getProgramByCode(programCode);
      if (program) {
        const userProgramLinks = await db.select().from(userProgramsTable).where(eq(userProgramsTable.programId, program.id));
        userIdsFilter = userProgramLinks.map(up => up.userId);
        if (userIdsFilter.length === 0) {
          return { data: [], pagination: { total: 0, page: 1, pages: 1 } };
        }
      }
    }

    const conditions = [eq(usersTable.role, "USER")];
    
    if (search) {
      conditions.push(
        or(
          ilike(usersTable.name, `%${search}%`),
          ilike(usersTable.email, `%${search}%`)
        )!
      );
    }

    if (userIdsFilter) {
      conditions.push(inArray(usersTable.id, userIdsFilter));
    }

    const totalResult = await db
      .select({ count: count() })
      .from(usersTable)
      .where(and(...conditions));
    const total = totalResult[0]?.count || 0;

    const students = await db
      .select()
      .from(usersTable)
      .where(and(...conditions))
      .orderBy(usersTable.createdAt)
      .limit(limit)
      .offset(offset);

    const studentsWithPrograms: UserWithPrograms[] = await Promise.all(
      students.map(async (student) => {
        const programs = await this.getUserPrograms(student.id);
        return { ...student, programs };
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

  async getStudentById(id: number): Promise<UserWithPrograms | undefined> {
    const student = await db.query.users.findFirst({
      where: (users, { eq, and }) => and(eq(users.id, id), eq(users.role, "USER")),
    });
    if (!student) return undefined;
    
    const programs = await this.getUserPrograms(id);
    return { ...student, programs };
  }

  async createStudent(student: InsertUser, programCode?: string): Promise<User> {
    const [newStudent] = await db.insert(usersTable).values({
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

  async updateStudent(id: number, student: Partial<InsertUser>, programCode?: string): Promise<User | undefined> {
    const [updated] = await db
      .update(usersTable)
      .set(student)
      .where(eq(usersTable.id, id))
      .returning();

    if (programCode) {
      await this.clearUserPrograms(id);
      const program = await this.getProgramByCode(programCode);
      if (program) {
        await this.assignUserProgram(id, program.id);
      }
    }

    return updated;
  }

  async updateStudentStatus(id: number, status: string): Promise<User | undefined> {
    const [updated] = await db
      .update(usersTable)
      .set({ status })
      .where(eq(usersTable.id, id))
      .returning();
    return updated;
  }

  async deleteStudent(id: number): Promise<boolean> {
    await this.clearUserPrograms(id);
    const result = await db
      .delete(usersTable)
      .where(eq(usersTable.id, id))
      .returning();
    return result.length > 0;
  }

  // ===== ADMIN MANAGEMENT =====

  async getAdmins(params: { search?: string; page?: number; limit?: number }): Promise<{ data: User[]; pagination: { total: number; page: number; pages: number } }> {
    const { search = "", page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    const conditions = [
      or(
        eq(usersTable.role, "SUPER_ADMIN"),
        eq(usersTable.role, "COACH")
      )!
    ];
    
    if (search) {
      conditions.push(
        or(
          ilike(usersTable.name, `%${search}%`),
          ilike(usersTable.email, `%${search}%`)
        )!
      );
    }

    const totalResult = await db
      .select({ count: count() })
      .from(usersTable)
      .where(and(...conditions));
    const total = totalResult[0]?.count || 0;

    const admins = await db
      .select()
      .from(usersTable)
      .where(and(...conditions))
      .orderBy(usersTable.createdAt)
      .limit(limit)
      .offset(offset);

    return {
      data: admins,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit) || 1
      }
    };
  }

  async getAdminById(id: number): Promise<User | undefined> {
    return await db.query.users.findFirst({
      where: (users, { eq, and, or }) => and(
        eq(users.id, id),
        or(eq(users.role, "SUPER_ADMIN"), eq(users.role, "COACH"))
      ),
    });
  }

  async createAdmin(admin: InsertUser): Promise<User> {
    const [newAdmin] = await db.insert(usersTable).values({
      ...admin,
      status: admin.status || "active"
    }).returning();
    return newAdmin;
  }

  async updateAdmin(id: number, admin: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db
      .update(usersTable)
      .set(admin)
      .where(eq(usersTable.id, id))
      .returning();
    return updated;
  }

  async updateAdminStatus(id: number, status: string): Promise<User | undefined> {
    const [updated] = await db
      .update(usersTable)
      .set({ status })
      .where(eq(usersTable.id, id))
      .returning();
    return updated;
  }

  async deleteAdmin(id: number): Promise<boolean> {
    const result = await db
      .delete(usersTable)
      .where(eq(usersTable.id, id))
      .returning();
    return result.length > 0;
  }

  // ===== FRONTEND FEATURE MAPPING =====

  async getAllFrontendFeatures(): Promise<FrontendFeature[]> {
    return await db.select().from(frontendFeaturesTable).orderBy(asc(frontendFeaturesTable.id));
  }

  async getFrontendFeatureByCode(code: string): Promise<FrontendFeature | undefined> {
    const result = await db.select().from(frontendFeaturesTable).where(eq(frontendFeaturesTable.code, code));
    return result[0];
  }

  async getFeatureCourseMappings(featureId: number): Promise<(FeatureCourseMap & { course: { id: number; title: string } })[]> {
    const mappings = await db
      .select()
      .from(featureCourseMapTable)
      .where(eq(featureCourseMapTable.featureId, featureId))
      .orderBy(asc(featureCourseMapTable.position));
    
    const result = await Promise.all(mappings.map(async (mapping) => {
      const courseResult = await db.select({ id: cmsCourses.id, title: cmsCourses.title }).from(cmsCourses).where(eq(cmsCourses.id, mapping.courseId));
      return {
        ...mapping,
        course: courseResult[0] || { id: mapping.courseId, title: 'Unknown Course' }
      };
    }));
    return result;
  }

  async createFeatureCourseMapping(mapping: InsertFeatureCourseMap): Promise<FeatureCourseMap> {
    const [newMapping] = await db.insert(featureCourseMapTable).values(mapping).returning();
    return newMapping;
  }

  async deleteFeatureCourseMapping(featureId: number, courseId: number): Promise<boolean> {
    const result = await db
      .delete(featureCourseMapTable)
      .where(and(eq(featureCourseMapTable.featureId, featureId), eq(featureCourseMapTable.courseId, courseId)))
      .returning();
    return result.length > 0;
  }

  async clearFeatureCourseMappings(featureId: number): Promise<void> {
    await db.delete(featureCourseMapTable).where(eq(featureCourseMapTable.featureId, featureId));
  }

  async reorderFeatureCourseMappings(featureId: number, courseIds: number[]): Promise<void> {
    for (let i = 0; i < courseIds.length; i++) {
      await db
        .update(featureCourseMapTable)
        .set({ position: i })
        .where(and(eq(featureCourseMapTable.featureId, featureId), eq(featureCourseMapTable.courseId, courseIds[i])));
    }
  }

  async getModulesForCourse(courseId: number) {
    return await db.select().from(cmsModules).where(eq(cmsModules.courseId, courseId)).orderBy(asc(cmsModules.position));
  }

  async getLessonsForCourse(courseId: number) {
    const modules = await db.select().from(cmsModules).where(eq(cmsModules.courseId, courseId));
    const moduleIds = modules.map(m => m.id);
    if (moduleIds.length === 0) return [];
    return await db.select().from(cmsLessons).where(inArray(cmsLessons.moduleId, moduleIds)).orderBy(asc(cmsLessons.position));
  }

  // Money Calendar Methods
  async upsertMoneyEntry(userId: number, entryDate: string, amount: string): Promise<MoneyEntry> {
    const [entry] = await db
      .insert(moneyEntries)
      .values({
        userId,
        entryDate,
        amount,
      })
      .onConflictDoUpdate({
        target: [moneyEntries.userId, moneyEntries.entryDate],
        set: {
          amount,
          updatedAt: new Date(),
        },
      })
      .returning();
    return entry;
  }

  async getMoneyEntriesForMonth(userId: number, year: number, month: number): Promise<{ days: Record<string, number>; summary: { total: number; highest: number; average: number } }> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const entries = await db
      .select()
      .from(moneyEntries)
      .where(
        and(
          eq(moneyEntries.userId, userId),
          sql`${moneyEntries.entryDate} >= ${startDate}::date`,
          sql`${moneyEntries.entryDate} <= ${endDate}::date`
        )
      );

    const days: Record<string, number> = {};
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
        average: Math.round(average * 100) / 100,
      },
    };
  }

  // Playlist Methods
  async getUserPlaylists(userId: number): Promise<Playlist[]> {
    return await db.select().from(playlistsTable).where(eq(playlistsTable.userId, userId)).orderBy(desc(playlistsTable.createdAt));
  }

  async getPlaylistById(id: number): Promise<Playlist | undefined> {
    const [playlist] = await db.select().from(playlistsTable).where(eq(playlistsTable.id, id));
    return playlist;
  }

  async createPlaylist(playlist: InsertPlaylist): Promise<Playlist> {
    const [newPlaylist] = await db.insert(playlistsTable).values(playlist).returning();
    return newPlaylist;
  }

  async updatePlaylist(id: number, title: string): Promise<Playlist | undefined> {
    const [updated] = await db
      .update(playlistsTable)
      .set({ title, updatedAt: new Date() })
      .where(eq(playlistsTable.id, id))
      .returning();
    return updated;
  }

  async deletePlaylist(id: number): Promise<boolean> {
    const result = await db.delete(playlistsTable).where(eq(playlistsTable.id, id)).returning();
    return result.length > 0;
  }

  async getPlaylistItems(playlistId: number): Promise<(PlaylistItem & { lesson: { id: number; title: string; description: string | null } })[]> {
    const items = await db
      .select()
      .from(playlistItemsTable)
      .where(eq(playlistItemsTable.playlistId, playlistId))
      .orderBy(asc(playlistItemsTable.position));

    const result = await Promise.all(items.map(async (item) => {
      const [lesson] = await db
        .select({ id: cmsLessons.id, title: cmsLessons.title, description: cmsLessons.description })
        .from(cmsLessons)
        .where(eq(cmsLessons.id, item.lessonId));
      return {
        ...item,
        lesson: lesson || { id: item.lessonId, title: 'Unknown Lesson', description: null }
      };
    }));
    return result;
  }

  async setPlaylistItems(playlistId: number, lessonIds: number[]): Promise<PlaylistItem[]> {
    await db.delete(playlistItemsTable).where(eq(playlistItemsTable.playlistId, playlistId));
    
    if (lessonIds.length === 0) return [];

    const items = lessonIds.map((lessonId, index) => ({
      playlistId,
      lessonId,
      position: index,
    }));

    return await db.insert(playlistItemsTable).values(items).returning();
  }

  async reorderPlaylistItems(playlistId: number, orderedItemIds: number[]): Promise<void> {
    for (let i = 0; i < orderedItemIds.length; i++) {
      await db
        .update(playlistItemsTable)
        .set({ position: i })
        .where(and(eq(playlistItemsTable.playlistId, playlistId), eq(playlistItemsTable.id, orderedItemIds[i])));
    }
  }

  async deletePlaylistItem(playlistId: number, itemId: number): Promise<boolean> {
    const result = await db
      .delete(playlistItemsTable)
      .where(and(eq(playlistItemsTable.playlistId, playlistId), eq(playlistItemsTable.id, itemId)))
      .returning();
    return result.length > 0;
  }

  async getPlaylistSourceData(courseId: number) {
    const [course] = await db.select().from(cmsCourses).where(eq(cmsCourses.id, courseId));
    if (!course) return null;

    const modules = await db.select().from(cmsModules).where(eq(cmsModules.courseId, courseId)).orderBy(asc(cmsModules.position));
    
    const modulesWithLessons = await Promise.all(modules.map(async (module) => {
      const lessons = await db.select().from(cmsLessons).where(eq(cmsLessons.moduleId, module.id)).orderBy(asc(cmsLessons.position));
      
      const lessonsWithAudio = await Promise.all(lessons.map(async (lesson) => {
        const audioFiles = await db
          .select()
          .from(cmsLessonFiles)
          .where(and(eq(cmsLessonFiles.lessonId, lesson.id), eq(cmsLessonFiles.fileType, 'audio')))
          .orderBy(asc(cmsLessonFiles.position));
        
        if (audioFiles.length === 0) return null;
        
        return {
          ...lesson,
          audioFiles
        };
      }));

      const filteredLessons = lessonsWithAudio.filter(l => l !== null);
      if (filteredLessons.length === 0) return null;

      return {
        ...module,
        lessons: filteredLessons
      };
    }));

    return {
      course,
      modules: modulesWithLessons.filter(m => m !== null)
    };
  }

  async isLessonInMappedCourse(lessonId: number, featureCode: string): Promise<boolean> {
    const feature = await this.getFrontendFeatureByCode(featureCode);
    if (!feature) return false;

    const mappings = await this.getFeatureCourseMappings(feature.id);
    if (mappings.length === 0) return false;

    const courseId = mappings[0].courseId;
    const modules = await db.select().from(cmsModules).where(eq(cmsModules.courseId, courseId));
    const moduleIds = modules.map(m => m.id);
    if (moduleIds.length === 0) return false;

    const [lesson] = await db.select().from(cmsLessons).where(and(eq(cmsLessons.id, lessonId), inArray(cmsLessons.moduleId, moduleIds)));
    return !!lesson;
  }

  async doesLessonHaveAudio(lessonId: number): Promise<boolean> {
    const audioFiles = await db
      .select()
      .from(cmsLessonFiles)
      .where(and(eq(cmsLessonFiles.lessonId, lessonId), eq(cmsLessonFiles.fileType, 'audio')));
    return audioFiles.length > 0;
  }

  // ===== SESSION BANNERS =====

  async getAllSessionBanners(): Promise<SessionBanner[]> {
    return await db.select().from(sessionBannersTable).orderBy(desc(sessionBannersTable.startAt));
  }

  async getSessionBannerById(id: number): Promise<SessionBanner | undefined> {
    const [banner] = await db.select().from(sessionBannersTable).where(eq(sessionBannersTable.id, id));
    return banner;
  }

  async createSessionBanner(banner: InsertSessionBanner): Promise<SessionBanner> {
    const [newBanner] = await db.insert(sessionBannersTable).values(banner).returning();
    return newBanner;
  }

  async updateSessionBanner(id: number, banner: Partial<InsertSessionBanner>): Promise<SessionBanner | undefined> {
    const [updated] = await db
      .update(sessionBannersTable)
      .set({ ...banner, updatedAt: new Date() })
      .where(eq(sessionBannersTable.id, id))
      .returning();
    return updated;
  }

  async deleteSessionBanner(id: number): Promise<boolean> {
    const result = await db.delete(sessionBannersTable).where(eq(sessionBannersTable.id, id)).returning();
    return result.length > 0;
  }

  async getActiveBanner(): Promise<SessionBanner | undefined> {
    const now = new Date();
    const [active] = await db
      .select()
      .from(sessionBannersTable)
      .where(
        and(
          sql`${sessionBannersTable.startAt} <= ${now}`,
          sql`${sessionBannersTable.endAt} > ${now}`
        )
      )
      .orderBy(desc(sessionBannersTable.startAt))
      .limit(1);
    return active;
  }

  async getNextScheduledBanner(): Promise<SessionBanner | undefined> {
    const now = new Date();
    const [scheduled] = await db
      .select()
      .from(sessionBannersTable)
      .where(sql`${sessionBannersTable.startAt} > ${now}`)
      .orderBy(asc(sessionBannersTable.startAt))
      .limit(1);
    return scheduled;
  }

  async getLastExpiredBanner(): Promise<SessionBanner | undefined> {
    const now = new Date();
    const [expired] = await db
      .select()
      .from(sessionBannersTable)
      .where(sql`${sessionBannersTable.endAt} <= ${now}`)
      .orderBy(desc(sessionBannersTable.endAt))
      .limit(1);
    return expired;
  }

  // ===== USER STREAKS =====

  async markUserActivityDate(userId: number, activityDate: string): Promise<UserStreak> {
    const [existing] = await db
      .select()
      .from(userStreaksTable)
      .where(and(eq(userStreaksTable.userId, userId), eq(userStreaksTable.activityDate, activityDate)));
    
    if (existing) {
      return existing;
    }

    const [newStreak] = await db
      .insert(userStreaksTable)
      .values({ userId, activityDate })
      .returning();
    return newStreak;
  }

  async getUserStreakDates(userId: number, dates: string[]): Promise<string[]> {
    if (dates.length === 0) return [];
    
    const records = await db
      .select({ activityDate: userStreaksTable.activityDate })
      .from(userStreaksTable)
      .where(and(
        eq(userStreaksTable.userId, userId),
        inArray(userStreaksTable.activityDate, dates)
      ));
    
    return records.map(r => r.activityDate);
  }

  async getConsistencyMonth(userId: number, year: number, month: number): Promise<{ date: string; active: boolean }[]> {
    const daysInMonth = new Date(year, month, 0).getDate();
    const allDates: string[] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      allDates.push(dateStr);
    }

    const activeDates = await this.getUserStreakDates(userId, allDates);
    const activeDateSet = new Set(activeDates);

    return allDates.map(date => ({
      date,
      active: activeDateSet.has(date)
    }));
  }

  async getConsistencyRange(userId: number): Promise<{ startMonth: string | null; currentMonth: string }> {
    const [earliest] = await db
      .select({ activityDate: userStreaksTable.activityDate })
      .from(userStreaksTable)
      .where(eq(userStreaksTable.userId, userId))
      .orderBy(asc(userStreaksTable.activityDate))
      .limit(1);

    const startMonth = earliest ? earliest.activityDate.slice(0, 7) : null;
    
    return { startMonth, currentMonth: "current" };
  }

  async getCurrentStreak(userId: number, todayDate: string): Promise<number> {
    const allRecords = await db
      .select({ activityDate: userStreaksTable.activityDate })
      .from(userStreaksTable)
      .where(eq(userStreaksTable.userId, userId))
      .orderBy(desc(userStreaksTable.activityDate));

    if (allRecords.length === 0) return 0;

    const activeDates = new Set(allRecords.map(r => r.activityDate));
    
    let streak = 0;
    let checkDate = new Date(todayDate + 'T12:00:00');
    
    if (!activeDates.has(todayDate)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
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

  async logActivity(
    userId: number,
    lessonId: number,
    lessonName: string,
    featureType: FeatureType,
    activityDate: string
  ): Promise<{ logged: boolean; activity: ActivityLog }> {
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(activityDate)) {
      // Fall back to server date if invalid
      activityDate = new Date().toISOString().split('T')[0];
    }

    // Validate date is within ±1 day of server time
    const serverDate = new Date();
    const inputDate = new Date(activityDate + 'T12:00:00');
    const diffDays = Math.abs((serverDate.getTime() - inputDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 1) {
      activityDate = serverDate.toISOString().split('T')[0];
    }

    // Check if already logged for this user/lesson/feature/date
    const [existing] = await db
      .select()
      .from(activityLogsTable)
      .where(and(
        eq(activityLogsTable.userId, userId),
        eq(activityLogsTable.lessonId, lessonId),
        eq(activityLogsTable.featureType, featureType),
        eq(activityLogsTable.activityDate, activityDate)
      ));

    if (existing) {
      return { logged: false, activity: existing };
    }

    // Insert new activity log
    const [newLog] = await db
      .insert(activityLogsTable)
      .values({ userId, lessonId, lessonName, featureType, activityDate })
      .returning();

    return { logged: true, activity: newLog };
  }

  async getMonthlyStats(userId: number, month: string): Promise<{
    PROCESS: { lessonId: number; lessonName: string; count: number }[];
    PLAYLIST: { lessonId: number; lessonName: string; count: number }[];
    maxCount: number;
  }> {
    // Validate month format (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      month = new Date().toISOString().slice(0, 7);
    }

    // Ensure month is within last 6 months
    const now = new Date();
    const inputDate = new Date(month + '-01');
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    if (inputDate < sixMonthsAgo) {
      month = sixMonthsAgo.toISOString().slice(0, 7);
    }

    // Query activities for the given month
    const startDate = month + '-01';
    const endDate = month + '-31'; // Works for all months since we use <= comparison

    const activities = await db
      .select({
        lessonId: activityLogsTable.lessonId,
        lessonName: activityLogsTable.lessonName,
        featureType: activityLogsTable.featureType,
        count: count(activityLogsTable.id),
      })
      .from(activityLogsTable)
      .where(and(
        eq(activityLogsTable.userId, userId),
        sql`${activityLogsTable.activityDate} >= ${startDate}`,
        sql`${activityLogsTable.activityDate} <= ${endDate}`
      ))
      .groupBy(activityLogsTable.lessonId, activityLogsTable.lessonName, activityLogsTable.featureType);

    // Group by feature type
    const result = {
      PROCESS: [] as { lessonId: number; lessonName: string; count: number }[],
      PLAYLIST: [] as { lessonId: number; lessonName: string; count: number }[],
      maxCount: 0,
    };

    for (const activity of activities) {
      const item = {
        lessonId: activity.lessonId,
        lessonName: activity.lessonName,
        count: Number(activity.count),
      };

      if (item.count > result.maxCount) {
        result.maxCount = item.count;
      }

      if (activity.featureType === 'PROCESS') {
        result.PROCESS.push(item);
      } else if (activity.featureType === 'PLAYLIST') {
        result.PLAYLIST.push(item);
      }
    }

    // Sort each array by count descending
    result.PROCESS.sort((a, b) => b.count - a.count);
    result.PLAYLIST.sort((a, b) => b.count - a.count);

    return result;
  }

  // ===== REWIRING BELIEFS =====

  async getRewiringBeliefsByUserId(userId: number): Promise<RewiringBelief[]> {
    const beliefs = await db
      .select()
      .from(rewiringBeliefsTable)
      .where(eq(rewiringBeliefsTable.userId, userId))
      .orderBy(desc(rewiringBeliefsTable.createdAt));
    return beliefs;
  }

  async getRewiringBeliefById(id: number): Promise<RewiringBelief | undefined> {
    const [belief] = await db
      .select()
      .from(rewiringBeliefsTable)
      .where(eq(rewiringBeliefsTable.id, id));
    return belief;
  }

  async createRewiringBelief(belief: InsertRewiringBelief): Promise<RewiringBelief> {
    const [newBelief] = await db
      .insert(rewiringBeliefsTable)
      .values(belief)
      .returning();
    return newBelief;
  }

  async updateRewiringBelief(
    id: number,
    userId: number,
    updates: Partial<Pick<InsertRewiringBelief, 'limitingBelief' | 'upliftingBelief'>>
  ): Promise<RewiringBelief | undefined> {
    const [updated] = await db
      .update(rewiringBeliefsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(rewiringBeliefsTable.id, id), eq(rewiringBeliefsTable.userId, userId)))
      .returning();
    return updated;
  }

  async deleteRewiringBelief(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(rewiringBeliefsTable)
      .where(and(eq(rewiringBeliefsTable.id, id), eq(rewiringBeliefsTable.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // ===== USER WELLNESS PROFILES =====

  async getWellnessProfileByUserId(userId: number): Promise<UserWellnessProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userWellnessProfilesTable)
      .where(eq(userWellnessProfilesTable.userId, userId));
    return profile;
  }

  async upsertWellnessProfile(
    userId: number,
    data: { karmicAffirmation?: string | null; prescription?: unknown }
  ): Promise<UserWellnessProfile> {
    const existing = await this.getWellnessProfileByUserId(userId);
    
    if (existing) {
      const [updated] = await db
        .update(userWellnessProfilesTable)
        .set({
          karmicAffirmation: data.karmicAffirmation,
          prescription: data.prescription,
          updatedAt: new Date(),
        })
        .where(eq(userWellnessProfilesTable.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userWellnessProfilesTable)
        .values({
          userId,
          karmicAffirmation: data.karmicAffirmation,
          prescription: data.prescription,
        })
        .returning();
      return created;
    }
  }
}

export const storage = new DbStorage();
