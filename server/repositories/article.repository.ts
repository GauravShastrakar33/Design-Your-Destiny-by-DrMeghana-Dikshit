import { db } from "../db";
import { articles, categories } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { Article, InsertArticle, Category, InsertCategory } from "@shared/schema";

export const articleRepository = {
  async findAll(): Promise<Article[]> {
    return await db.query.articles.findMany({
      orderBy: (a, { desc }) => [desc(a.createdAt)],
    });
  },

  async findPublished(): Promise<Article[]> {
    return await db.query.articles.findMany({
      where: (a, { eq }) => eq(a.isPublished, true),
      orderBy: (a, { desc }) => [desc(a.createdAt)],
    });
  },

  async findById(id: number): Promise<Article | undefined> {
    return await db.query.articles.findFirst({
      where: (a, { eq }) => eq(a.id, id),
    });
  },

  async create(data: InsertArticle): Promise<Article> {
    const [a] = await db.insert(articles).values(data).returning();
    return a;
  },

  async update(id: number, data: Partial<InsertArticle>): Promise<Article | undefined> {
    const [a] = await db.update(articles).set(data).where(eq(articles.id, id)).returning();
    return a;
  },

  async delete(id: number): Promise<boolean> {
    const result = await db.delete(articles).where(eq(articles.id, id)).returning();
    return result.length > 0;
  },

  // ─── Categories ──────────────────────────────────────────────────────────────

  async findAllCategories(): Promise<Category[]> {
    return await db.query.categories.findMany({
      orderBy: (c, { asc }) => [asc(c.name)],
    });
  },

  async createCategory(data: InsertCategory): Promise<Category> {
    const [c] = await db.insert(categories).values(data).returning();
    return c;
  },
};
