import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCommunitySessionSchema, insertCategorySchema, insertArticleSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Ensure public/articles directory exists
const articlesDir = path.join(process.cwd(), "public", "articles");
if (!fs.existsSync(articlesDir)) {
  fs.mkdirSync(articlesDir, { recursive: true });
}

// Configure multer for article image uploads
const articleImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, articlesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadArticleImage = multer({
  storage: articleImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});

// Simple admin auth middleware
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader === `Bearer ${ADMIN_PASSWORD}`) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Public route: Get all active community sessions
  app.get("/api/sessions", async (req, res) => {
    try {
      const sessions = await storage.getAllCommunitySessions();
      const activeSessions = sessions.filter(s => s.isActive);
      res.json(activeSessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  // Admin login
  app.post("/api/admin/login", async (req, res) => {
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

  // Admin routes: Get all sessions (including inactive)
  app.get("/api/admin/sessions", requireAdmin, async (req, res) => {
    try {
      const sessions = await storage.getAllCommunitySessions();
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching admin sessions:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  // Admin routes: Create session
  app.post("/api/admin/sessions", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertCommunitySessionSchema.parse(req.body);
      const session = await storage.createCommunitySession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error creating session:", error);
        res.status(500).json({ error: "Failed to create session" });
      }
    }
  });

  // Admin routes: Update session
  app.put("/api/admin/sessions/:id", requireAdmin, async (req, res) => {
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
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error updating session:", error);
        res.status(500).json({ error: "Failed to update session" });
      }
    }
  });

  // Admin routes: Delete session
  app.delete("/api/admin/sessions/:id", requireAdmin, async (req, res) => {
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

  // ===== CATEGORY ROUTES =====

  // Public route: Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Admin route: Create category
  app.post("/api/admin/categories", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error creating category:", error);
        res.status(500).json({ error: "Failed to create category" });
      }
    }
  });

  // ===== ARTICLE ROUTES =====

  // Public route: Get published articles
  app.get("/api/articles", async (req, res) => {
    try {
      const articles = await storage.getPublishedArticles();
      res.json(articles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  // Public route: Get single article
  app.get("/api/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const article = await storage.getArticle(id);
      
      if (!article) {
        res.status(404).json({ error: "Article not found" });
        return;
      }
      
      res.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });

  // Admin route: Get all articles (including unpublished)
  app.get("/api/admin/articles", requireAdmin, async (req, res) => {
    try {
      const articles = await storage.getAllArticles();
      res.json(articles);
    } catch (error) {
      console.error("Error fetching admin articles:", error);
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  // Admin route: Create article
  app.post("/api/admin/articles", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertArticleSchema.parse(req.body);
      const article = await storage.createArticle(validatedData);
      res.status(201).json(article);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error creating article:", error);
        res.status(500).json({ error: "Failed to create article" });
      }
    }
  });

  // Admin route: Update article
  app.put("/api/admin/articles/:id", requireAdmin, async (req, res) => {
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
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error updating article:", error);
        res.status(500).json({ error: "Failed to update article" });
      }
    }
  });

  // Admin route: Delete article
  app.delete("/api/admin/articles/:id", requireAdmin, async (req, res) => {
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

  // Admin route: Upload article image
  app.post("/api/admin/upload/article-image", requireAdmin, uploadArticleImage.single("image"), (req, res) => {
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
  });

  const httpServer = createServer(app);

  return httpServer;
}
