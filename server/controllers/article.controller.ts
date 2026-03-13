import { Request, Response } from "express";
import path from "path";
import multer from "multer";
import fs from "fs";
import { articleService } from "../services/article.service";
import { insertArticleSchema, insertCategorySchema } from "@shared/schema";
import { z } from "zod";

// ─── Multer: article image uploads ───────────────────────────────────────────

const articlesDir = path.join(process.cwd(), "public", "articles");
if (!fs.existsSync(articlesDir)) {
  fs.mkdirSync(articlesDir, { recursive: true });
}

const articleImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, articlesDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const uploadArticleImage = multer({
  storage: articleImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (
      allowed.test(path.extname(file.originalname).toLowerCase()) &&
      allowed.test(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// ─── Controller ──────────────────────────────────────────────────────────────

export const articleController = {
  async getPublished(req: Request, res: Response) {
    try {
      const articles = await articleService.getPublishedArticles();
      res.json(articles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  },

  async getPublishedById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const article = await articleService.getPublishedArticleById(id);
      if (!article) return res.status(404).json({ error: "Article not found" });
      res.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ error: "Failed to fetch article" });
    }
  },

  async getAllAdmin(req: Request, res: Response) {
    try {
      const articles = await articleService.getAllArticles();
      res.json(articles);
    } catch (error) {
      console.error("Error fetching admin articles:", error);
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const validated = insertArticleSchema.parse(req.body);
      const article = await articleService.createArticle(validated);
      res.status(201).json(article);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error creating article:", error);
        res.status(500).json({ error: "Failed to create article" });
      }
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const validated = insertArticleSchema.partial().parse(req.body);
      const article = await articleService.updateArticle(id, validated);
      if (!article) return res.status(404).json({ error: "Article not found" });
      res.json(article);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error updating article:", error);
        res.status(500).json({ error: "Failed to update article" });
      }
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const success = await articleService.deleteArticle(id);
      if (!success) return res.status(404).json({ error: "Article not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting article:", error);
      res.status(500).json({ error: "Failed to delete article" });
    }
  },

  async uploadImage(req: Request, res: Response) {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      const imageUrl = `/articles/${req.file.filename}`;
      res.json({ imageUrl });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  },

  // ─── Categories ─────────────────────────────────────────────────

  async getCategories(req: Request, res: Response) {
    try {
      const categories = await articleService.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  },

  async createCategory(req: Request, res: Response) {
    try {
      const validated = insertCategorySchema.parse(req.body);
      const category = await articleService.createCategory(validated);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error creating category:", error);
        res.status(500).json({ error: "Failed to create category" });
      }
    }
  },
};
