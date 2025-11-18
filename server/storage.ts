import { 
  type User, type InsertUser, 
  type CommunitySession, type InsertCommunitySession, 
  type Category, type InsertCategory,
  type Article, type InsertArticle,
  type ProcessFolder, type InsertProcessFolder,
  type ProcessSubfolder, type InsertProcessSubfolder,
  type Process, type InsertProcess,
  type SpiritualBreath, type InsertSpiritualBreath,
  type Course, type InsertCourse,
  type CourseSection, type InsertCourseSection,
  type SectionVideo, type InsertSectionVideo,
  type Masterclass, type InsertMasterclass,
  type WorkshopVideo, type InsertWorkshopVideo,
  communitySessions, users as usersTable, categories as categoriesTable, articles as articlesTable,
  processFolders as processFoldersTable, processSubfolders as processSubfoldersTable,
  processes as processesTable, spiritualBreaths as spiritualBreathsTable,
  courses as coursesTable, courseSections as courseSectionsTable,
  sectionVideos as sectionVideosTable, masterclasses as masterclassesTable,
  workshopVideos as workshopVideosTable
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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

  getAllProcessFolders(): Promise<ProcessFolder[]>;
  getProcessFolder(id: number): Promise<ProcessFolder | undefined>;
  createProcessFolder(folder: InsertProcessFolder): Promise<ProcessFolder>;
  updateProcessFolder(id: number, folder: Partial<InsertProcessFolder>): Promise<ProcessFolder | undefined>;
  deleteProcessFolder(id: number): Promise<boolean>;

  getAllProcessSubfolders(): Promise<ProcessSubfolder[]>;
  getProcessSubfolder(id: number): Promise<ProcessSubfolder | undefined>;
  createProcessSubfolder(subfolder: InsertProcessSubfolder): Promise<ProcessSubfolder>;
  updateProcessSubfolder(id: number, subfolder: Partial<InsertProcessSubfolder>): Promise<ProcessSubfolder | undefined>;
  deleteProcessSubfolder(id: number): Promise<boolean>;

  getAllProcesses(): Promise<Process[]>;
  getProcess(id: number): Promise<Process | undefined>;
  createProcess(process: InsertProcess): Promise<Process>;
  updateProcess(id: number, process: Partial<InsertProcess>): Promise<Process | undefined>;
  deleteProcess(id: number): Promise<boolean>;

  getAllSpiritualBreaths(): Promise<SpiritualBreath[]>;
  getSpiritualBreath(id: number): Promise<SpiritualBreath | undefined>;
  createSpiritualBreath(breath: InsertSpiritualBreath): Promise<SpiritualBreath>;
  updateSpiritualBreath(id: number, breath: Partial<InsertSpiritualBreath>): Promise<SpiritualBreath | undefined>;
  deleteSpiritualBreath(id: number): Promise<boolean>;

  getAllCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;

  getAllCourseSections(): Promise<CourseSection[]>;
  getCourseSection(id: number): Promise<CourseSection | undefined>;
  createCourseSection(section: InsertCourseSection): Promise<CourseSection>;
  updateCourseSection(id: number, section: Partial<InsertCourseSection>): Promise<CourseSection | undefined>;
  deleteCourseSection(id: number): Promise<boolean>;

  getAllSectionVideos(): Promise<SectionVideo[]>;
  getSectionVideo(id: number): Promise<SectionVideo | undefined>;
  createSectionVideo(video: InsertSectionVideo): Promise<SectionVideo>;
  updateSectionVideo(id: number, video: Partial<InsertSectionVideo>): Promise<SectionVideo | undefined>;
  deleteSectionVideo(id: number): Promise<boolean>;

  getAllMasterclasses(): Promise<Masterclass[]>;
  getMasterclass(id: number): Promise<Masterclass | undefined>;
  createMasterclass(masterclass: InsertMasterclass): Promise<Masterclass>;
  updateMasterclass(id: number, masterclass: Partial<InsertMasterclass>): Promise<Masterclass | undefined>;
  deleteMasterclass(id: number): Promise<boolean>;

  getAllWorkshopVideos(): Promise<WorkshopVideo[]>;
  getWorkshopVideo(id: number): Promise<WorkshopVideo | undefined>;
  createWorkshopVideo(video: InsertWorkshopVideo): Promise<WorkshopVideo>;
  updateWorkshopVideo(id: number, video: Partial<InsertWorkshopVideo>): Promise<WorkshopVideo | undefined>;
  deleteWorkshopVideo(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private communitySessions: Map<number, CommunitySession>;
  private categories: Map<number, Category>;
  private articles: Map<number, Article>;
  private processFolders: Map<number, ProcessFolder>;
  private processSubfolders: Map<number, ProcessSubfolder>;
  private processes: Map<number, Process>;
  private spiritualBreaths: Map<number, SpiritualBreath>;
  private courses: Map<number, Course>;
  private courseSections: Map<number, CourseSection>;
  private sectionVideos: Map<number, SectionVideo>;
  private masterclasses: Map<number, Masterclass>;
  private workshopVideos: Map<number, WorkshopVideo>;
  private nextSessionId: number;
  private nextCategoryId: number;
  private nextArticleId: number;
  private nextProcessFolderId: number;
  private nextProcessSubfolderId: number;
  private nextProcessId: number;
  private nextSpiritualBreathId: number;
  private nextCourseId: number;
  private nextCourseSectionId: number;
  private nextSectionVideoId: number;
  private nextMasterclassId: number;
  private nextWorkshopVideoId: number;

  constructor() {
    this.users = new Map();
    this.communitySessions = new Map();
    this.categories = new Map();
    this.articles = new Map();
    this.processFolders = new Map();
    this.processSubfolders = new Map();
    this.processes = new Map();
    this.spiritualBreaths = new Map();
    this.courses = new Map();
    this.courseSections = new Map();
    this.sectionVideos = new Map();
    this.masterclasses = new Map();
    this.workshopVideos = new Map();
    this.nextSessionId = 1;
    this.nextCategoryId = 1;
    this.nextArticleId = 1;
    this.nextProcessFolderId = 1;
    this.nextProcessSubfolderId = 1;
    this.nextProcessId = 1;
    this.nextSpiritualBreathId = 1;
    this.nextCourseId = 1;
    this.nextCourseSectionId = 1;
    this.nextSectionVideoId = 1;
    this.nextMasterclassId = 1;
    this.nextWorkshopVideoId = 1;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
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

  async getAllProcessFolders(): Promise<ProcessFolder[]> {
    return Array.from(this.processFolders.values());
  }

  async getProcessFolder(id: number): Promise<ProcessFolder | undefined> {
    return this.processFolders.get(id);
  }

  async createProcessFolder(folder: InsertProcessFolder): Promise<ProcessFolder> {
    const id = this.nextProcessFolderId++;
    const newFolder: ProcessFolder = { ...folder, id, displayOrder: folder.displayOrder ?? 0 };
    this.processFolders.set(id, newFolder);
    return newFolder;
  }

  async updateProcessFolder(id: number, folder: Partial<InsertProcessFolder>): Promise<ProcessFolder | undefined> {
    const existing = this.processFolders.get(id);
    if (!existing) return undefined;
    const updated: ProcessFolder = { ...existing, ...folder };
    this.processFolders.set(id, updated);
    return updated;
  }

  async deleteProcessFolder(id: number): Promise<boolean> {
    return this.processFolders.delete(id);
  }

  async getAllProcessSubfolders(): Promise<ProcessSubfolder[]> {
    return Array.from(this.processSubfolders.values());
  }

  async getProcessSubfolder(id: number): Promise<ProcessSubfolder | undefined> {
    return this.processSubfolders.get(id);
  }

  async createProcessSubfolder(subfolder: InsertProcessSubfolder): Promise<ProcessSubfolder> {
    const id = this.nextProcessSubfolderId++;
    const newSubfolder: ProcessSubfolder = { ...subfolder, id, displayOrder: subfolder.displayOrder ?? 0 };
    this.processSubfolders.set(id, newSubfolder);
    return newSubfolder;
  }

  async updateProcessSubfolder(id: number, subfolder: Partial<InsertProcessSubfolder>): Promise<ProcessSubfolder | undefined> {
    const existing = this.processSubfolders.get(id);
    if (!existing) return undefined;
    const updated: ProcessSubfolder = { ...existing, ...subfolder };
    this.processSubfolders.set(id, updated);
    return updated;
  }

  async deleteProcessSubfolder(id: number): Promise<boolean> {
    return this.processSubfolders.delete(id);
  }

  async getAllProcesses(): Promise<Process[]> {
    return Array.from(this.processes.values());
  }

  async getProcess(id: number): Promise<Process | undefined> {
    return this.processes.get(id);
  }

  async createProcess(process: InsertProcess): Promise<Process> {
    const id = this.nextProcessId++;
    const newProcess: Process = { 
      ...process, 
      id,
      iconName: process.iconName ?? "Brain",
      displayOrder: process.displayOrder ?? 0,
      videoUrl: process.videoUrl ?? null,
      audioUrl: process.audioUrl ?? null,
      scriptUrl: process.scriptUrl ?? null,
      subfolderId: process.subfolderId ?? null,
      folderId: process.folderId ?? null,
    };
    this.processes.set(id, newProcess);
    return newProcess;
  }

  async updateProcess(id: number, process: Partial<InsertProcess>): Promise<Process | undefined> {
    const existing = this.processes.get(id);
    if (!existing) return undefined;
    const updated: Process = { ...existing, ...process };
    this.processes.set(id, updated);
    return updated;
  }

  async deleteProcess(id: number): Promise<boolean> {
    return this.processes.delete(id);
  }

  async getAllSpiritualBreaths(): Promise<SpiritualBreath[]> {
    return Array.from(this.spiritualBreaths.values());
  }

  async getSpiritualBreath(id: number): Promise<SpiritualBreath | undefined> {
    return this.spiritualBreaths.get(id);
  }

  async createSpiritualBreath(breath: InsertSpiritualBreath): Promise<SpiritualBreath> {
    const id = this.nextSpiritualBreathId++;
    const newBreath: SpiritualBreath = { 
      ...breath, 
      id,
      displayOrder: breath.displayOrder ?? 0,
      videoUrl: breath.videoUrl ?? null,
      audioUrl: breath.audioUrl ?? null,
    };
    this.spiritualBreaths.set(id, newBreath);
    return newBreath;
  }

  async updateSpiritualBreath(id: number, breath: Partial<InsertSpiritualBreath>): Promise<SpiritualBreath | undefined> {
    const existing = this.spiritualBreaths.get(id);
    if (!existing) return undefined;
    const updated: SpiritualBreath = { ...existing, ...breath };
    this.spiritualBreaths.set(id, updated);
    return updated;
  }

  async deleteSpiritualBreath(id: number): Promise<boolean> {
    return this.spiritualBreaths.delete(id);
  }

  async getAllCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const id = this.nextCourseId++;
    const newCourse: Course = { ...course, id, displayOrder: course.displayOrder ?? 0 };
    this.courses.set(id, newCourse);
    return newCourse;
  }

  async updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined> {
    const existing = this.courses.get(id);
    if (!existing) return undefined;
    const updated: Course = { ...existing, ...course };
    this.courses.set(id, updated);
    return updated;
  }

  async deleteCourse(id: number): Promise<boolean> {
    return this.courses.delete(id);
  }

  async getAllCourseSections(): Promise<CourseSection[]> {
    return Array.from(this.courseSections.values());
  }

  async getCourseSection(id: number): Promise<CourseSection | undefined> {
    return this.courseSections.get(id);
  }

  async createCourseSection(section: InsertCourseSection): Promise<CourseSection> {
    const id = this.nextCourseSectionId++;
    const newSection: CourseSection = { ...section, id, displayOrder: section.displayOrder ?? 0 };
    this.courseSections.set(id, newSection);
    return newSection;
  }

  async updateCourseSection(id: number, section: Partial<InsertCourseSection>): Promise<CourseSection | undefined> {
    const existing = this.courseSections.get(id);
    if (!existing) return undefined;
    const updated: CourseSection = { ...existing, ...section };
    this.courseSections.set(id, updated);
    return updated;
  }

  async deleteCourseSection(id: number): Promise<boolean> {
    return this.courseSections.delete(id);
  }

  async getAllSectionVideos(): Promise<SectionVideo[]> {
    return Array.from(this.sectionVideos.values());
  }

  async getSectionVideo(id: number): Promise<SectionVideo | undefined> {
    return this.sectionVideos.get(id);
  }

  async createSectionVideo(video: InsertSectionVideo): Promise<SectionVideo> {
    const id = this.nextSectionVideoId++;
    const newVideo: SectionVideo = { ...video, id, displayOrder: video.displayOrder ?? 0 };
    this.sectionVideos.set(id, newVideo);
    return newVideo;
  }

  async updateSectionVideo(id: number, video: Partial<InsertSectionVideo>): Promise<SectionVideo | undefined> {
    const existing = this.sectionVideos.get(id);
    if (!existing) return undefined;
    const updated: SectionVideo = { ...existing, ...video };
    this.sectionVideos.set(id, updated);
    return updated;
  }

  async deleteSectionVideo(id: number): Promise<boolean> {
    return this.sectionVideos.delete(id);
  }

  async getAllMasterclasses(): Promise<Masterclass[]> {
    return Array.from(this.masterclasses.values());
  }

  async getMasterclass(id: number): Promise<Masterclass | undefined> {
    return this.masterclasses.get(id);
  }

  async createMasterclass(masterclass: InsertMasterclass): Promise<Masterclass> {
    const id = this.nextMasterclassId++;
    const newMasterclass: Masterclass = { ...masterclass, id, isLive: masterclass.isLive ?? false, displayOrder: masterclass.displayOrder ?? 0 };
    this.masterclasses.set(id, newMasterclass);
    return newMasterclass;
  }

  async updateMasterclass(id: number, masterclass: Partial<InsertMasterclass>): Promise<Masterclass | undefined> {
    const existing = this.masterclasses.get(id);
    if (!existing) return undefined;
    const updated: Masterclass = { ...existing, ...masterclass };
    this.masterclasses.set(id, updated);
    return updated;
  }

  async deleteMasterclass(id: number): Promise<boolean> {
    return this.masterclasses.delete(id);
  }

  async getAllWorkshopVideos(): Promise<WorkshopVideo[]> {
    return Array.from(this.workshopVideos.values());
  }

  async getWorkshopVideo(id: number): Promise<WorkshopVideo | undefined> {
    return this.workshopVideos.get(id);
  }

  async createWorkshopVideo(video: InsertWorkshopVideo): Promise<WorkshopVideo> {
    const id = this.nextWorkshopVideoId++;
    const newVideo: WorkshopVideo = { 
      ...video, 
      id, 
      author: video.author ?? "Dr. Meghana Dikshit",
      displayOrder: video.displayOrder ?? 0 
    };
    this.workshopVideos.set(id, newVideo);
    return newVideo;
  }

  async updateWorkshopVideo(id: number, video: Partial<InsertWorkshopVideo>): Promise<WorkshopVideo | undefined> {
    const existing = this.workshopVideos.get(id);
    if (!existing) return undefined;
    const updated: WorkshopVideo = { ...existing, ...video };
    this.workshopVideos.set(id, updated);
    return updated;
  }

  async deleteWorkshopVideo(id: number): Promise<boolean> {
    return this.workshopVideos.delete(id);
  }
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const users = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, id),
    });
    return users;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, username),
    });
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(usersTable).values(insertUser).returning();
    return user;
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

  async getAllProcessFolders(): Promise<ProcessFolder[]> {
    return await db.query.processFolders.findMany({
      orderBy: (folders, { asc }) => [asc(folders.displayOrder)],
    });
  }

  async getProcessFolder(id: number): Promise<ProcessFolder | undefined> {
    return await db.query.processFolders.findFirst({
      where: (folders, { eq }) => eq(folders.id, id),
    });
  }

  async createProcessFolder(folder: InsertProcessFolder): Promise<ProcessFolder> {
    const [newFolder] = await db.insert(processFoldersTable).values(folder).returning();
    return newFolder;
  }

  async updateProcessFolder(id: number, folder: Partial<InsertProcessFolder>): Promise<ProcessFolder | undefined> {
    const [updated] = await db
      .update(processFoldersTable)
      .set(folder)
      .where(eq(processFoldersTable.id, id))
      .returning();
    return updated;
  }

  async deleteProcessFolder(id: number): Promise<boolean> {
    const result = await db
      .delete(processFoldersTable)
      .where(eq(processFoldersTable.id, id))
      .returning();
    return result.length > 0;
  }

  async getAllProcessSubfolders(): Promise<ProcessSubfolder[]> {
    return await db.query.processSubfolders.findMany({
      orderBy: (subfolders, { asc }) => [asc(subfolders.displayOrder)],
    });
  }

  async getProcessSubfolder(id: number): Promise<ProcessSubfolder | undefined> {
    return await db.query.processSubfolders.findFirst({
      where: (subfolders, { eq }) => eq(subfolders.id, id),
    });
  }

  async createProcessSubfolder(subfolder: InsertProcessSubfolder): Promise<ProcessSubfolder> {
    const [newSubfolder] = await db.insert(processSubfoldersTable).values(subfolder).returning();
    return newSubfolder;
  }

  async updateProcessSubfolder(id: number, subfolder: Partial<InsertProcessSubfolder>): Promise<ProcessSubfolder | undefined> {
    const [updated] = await db
      .update(processSubfoldersTable)
      .set(subfolder)
      .where(eq(processSubfoldersTable.id, id))
      .returning();
    return updated;
  }

  async deleteProcessSubfolder(id: number): Promise<boolean> {
    const result = await db
      .delete(processSubfoldersTable)
      .where(eq(processSubfoldersTable.id, id))
      .returning();
    return result.length > 0;
  }

  async getAllProcesses(): Promise<Process[]> {
    return await db.query.processes.findMany({
      orderBy: (processes, { asc }) => [asc(processes.displayOrder)],
    });
  }

  async getProcess(id: number): Promise<Process | undefined> {
    return await db.query.processes.findFirst({
      where: (processes, { eq }) => eq(processes.id, id),
    });
  }

  async createProcess(process: InsertProcess): Promise<Process> {
    const [newProcess] = await db.insert(processesTable).values(process).returning();
    return newProcess;
  }

  async updateProcess(id: number, process: Partial<InsertProcess>): Promise<Process | undefined> {
    const [updated] = await db
      .update(processesTable)
      .set(process)
      .where(eq(processesTable.id, id))
      .returning();
    return updated;
  }

  async deleteProcess(id: number): Promise<boolean> {
    const result = await db
      .delete(processesTable)
      .where(eq(processesTable.id, id))
      .returning();
    return result.length > 0;
  }

  async getAllSpiritualBreaths(): Promise<SpiritualBreath[]> {
    return await db.query.spiritualBreaths.findMany({
      orderBy: (breaths, { asc }) => [asc(breaths.displayOrder)],
    });
  }

  async getSpiritualBreath(id: number): Promise<SpiritualBreath | undefined> {
    return await db.query.spiritualBreaths.findFirst({
      where: (breaths, { eq }) => eq(breaths.id, id),
    });
  }

  async createSpiritualBreath(breath: InsertSpiritualBreath): Promise<SpiritualBreath> {
    const [newBreath] = await db.insert(spiritualBreathsTable).values(breath).returning();
    return newBreath;
  }

  async updateSpiritualBreath(id: number, breath: Partial<InsertSpiritualBreath>): Promise<SpiritualBreath | undefined> {
    const [updated] = await db
      .update(spiritualBreathsTable)
      .set(breath)
      .where(eq(spiritualBreathsTable.id, id))
      .returning();
    return updated;
  }

  async deleteSpiritualBreath(id: number): Promise<boolean> {
    const result = await db
      .delete(spiritualBreathsTable)
      .where(eq(spiritualBreathsTable.id, id))
      .returning();
    return result.length > 0;
  }

  async getAllCourses(): Promise<Course[]> {
    return await db.query.courses.findMany({
      orderBy: (courses, { asc }) => [asc(courses.displayOrder)],
    });
  }

  async getCourse(id: number): Promise<Course | undefined> {
    return await db.query.courses.findFirst({
      where: (courses, { eq }) => eq(courses.id, id),
    });
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(coursesTable).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined> {
    const [updated] = await db
      .update(coursesTable)
      .set(course)
      .where(eq(coursesTable.id, id))
      .returning();
    return updated;
  }

  async deleteCourse(id: number): Promise<boolean> {
    const result = await db
      .delete(coursesTable)
      .where(eq(coursesTable.id, id))
      .returning();
    return result.length > 0;
  }

  async getAllCourseSections(): Promise<CourseSection[]> {
    return await db.query.courseSections.findMany({
      orderBy: (sections, { asc }) => [asc(sections.displayOrder)],
    });
  }

  async getCourseSection(id: number): Promise<CourseSection | undefined> {
    return await db.query.courseSections.findFirst({
      where: (sections, { eq }) => eq(sections.id, id),
    });
  }

  async createCourseSection(section: InsertCourseSection): Promise<CourseSection> {
    const [newSection] = await db.insert(courseSectionsTable).values(section).returning();
    return newSection;
  }

  async updateCourseSection(id: number, section: Partial<InsertCourseSection>): Promise<CourseSection | undefined> {
    const [updated] = await db
      .update(courseSectionsTable)
      .set(section)
      .where(eq(courseSectionsTable.id, id))
      .returning();
    return updated;
  }

  async deleteCourseSection(id: number): Promise<boolean> {
    const result = await db
      .delete(courseSectionsTable)
      .where(eq(courseSectionsTable.id, id))
      .returning();
    return result.length > 0;
  }

  async getAllSectionVideos(): Promise<SectionVideo[]> {
    return await db.query.sectionVideos.findMany({
      orderBy: (videos, { asc }) => [asc(videos.displayOrder)],
    });
  }

  async getSectionVideo(id: number): Promise<SectionVideo | undefined> {
    return await db.query.sectionVideos.findFirst({
      where: (videos, { eq }) => eq(videos.id, id),
    });
  }

  async createSectionVideo(video: InsertSectionVideo): Promise<SectionVideo> {
    const [newVideo] = await db.insert(sectionVideosTable).values(video).returning();
    return newVideo;
  }

  async updateSectionVideo(id: number, video: Partial<InsertSectionVideo>): Promise<SectionVideo | undefined> {
    const [updated] = await db
      .update(sectionVideosTable)
      .set(video)
      .where(eq(sectionVideosTable.id, id))
      .returning();
    return updated;
  }

  async deleteSectionVideo(id: number): Promise<boolean> {
    const result = await db
      .delete(sectionVideosTable)
      .where(eq(sectionVideosTable.id, id))
      .returning();
    return result.length > 0;
  }

  async getAllMasterclasses(): Promise<Masterclass[]> {
    return await db.query.masterclasses.findMany({
      orderBy: (masterclasses, { asc }) => [asc(masterclasses.displayOrder)],
    });
  }

  async getMasterclass(id: number): Promise<Masterclass | undefined> {
    return await db.query.masterclasses.findFirst({
      where: (masterclasses, { eq }) => eq(masterclasses.id, id),
    });
  }

  async createMasterclass(masterclass: InsertMasterclass): Promise<Masterclass> {
    const [newMasterclass] = await db.insert(masterclassesTable).values(masterclass).returning();
    return newMasterclass;
  }

  async updateMasterclass(id: number, masterclass: Partial<InsertMasterclass>): Promise<Masterclass | undefined> {
    const [updated] = await db
      .update(masterclassesTable)
      .set(masterclass)
      .where(eq(masterclassesTable.id, id))
      .returning();
    return updated;
  }

  async deleteMasterclass(id: number): Promise<boolean> {
    const result = await db
      .delete(masterclassesTable)
      .where(eq(masterclassesTable.id, id))
      .returning();
    return result.length > 0;
  }

  async getAllWorkshopVideos(): Promise<WorkshopVideo[]> {
    return await db.query.workshopVideos.findMany({
      orderBy: (videos, { asc }) => [asc(videos.displayOrder)],
    });
  }

  async getWorkshopVideo(id: number): Promise<WorkshopVideo | undefined> {
    return await db.query.workshopVideos.findFirst({
      where: (videos, { eq }) => eq(videos.id, id),
    });
  }

  async createWorkshopVideo(video: InsertWorkshopVideo): Promise<WorkshopVideo> {
    const [newVideo] = await db.insert(workshopVideosTable).values(video).returning();
    return newVideo;
  }

  async updateWorkshopVideo(id: number, video: Partial<InsertWorkshopVideo>): Promise<WorkshopVideo | undefined> {
    const [updated] = await db
      .update(workshopVideosTable)
      .set(video)
      .where(eq(workshopVideosTable.id, id))
      .returning();
    return updated;
  }

  async deleteWorkshopVideo(id: number): Promise<boolean> {
    const result = await db
      .delete(workshopVideosTable)
      .where(eq(workshopVideosTable.id, id))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DbStorage();
