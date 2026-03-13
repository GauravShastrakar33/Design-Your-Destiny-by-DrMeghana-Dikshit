import { articleRepository } from "../repositories/article.repository";
import type { InsertArticle, InsertCategory } from "@shared/schema";

export const articleService = {
  async getAllArticles() {
    return await articleRepository.findAll();
  },

  async getPublishedArticles() {
    return await articleRepository.findPublished();
  },

  async getPublishedArticleById(id: number) {
    const article = await articleRepository.findById(id);
    if (!article || !article.isPublished) return null;
    return article;
  },

  async createArticle(data: InsertArticle) {
    return await articleRepository.create(data);
  },

  async updateArticle(id: number, data: Partial<InsertArticle>) {
    return await articleRepository.update(id, data);
  },

  async deleteArticle(id: number) {
    return await articleRepository.delete(id);
  },

  // ─── Categories ──────────────────────────────────────────────────────────────

  async getAllCategories() {
    return await articleRepository.findAllCategories();
  },

  async createCategory(data: InsertCategory) {
    return await articleRepository.createCategory(data);
  },
};
