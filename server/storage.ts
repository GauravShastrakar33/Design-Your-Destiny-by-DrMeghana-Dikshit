import { 
  type User, type InsertUser, 
  type CommunitySession, type InsertCommunitySession, 
  type Category, type InsertCategory,
  type Article, type InsertArticle,
  communitySessions, users as usersTable, categories as categoriesTable, articles as articlesTable
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
}

export const storage = new DbStorage();
