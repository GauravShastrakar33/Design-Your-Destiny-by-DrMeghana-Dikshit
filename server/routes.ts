import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCommunitySessionSchema, insertCategorySchema, insertArticleSchema,
  insertProcessFolderSchema, insertProcessSubfolderSchema, insertProcessSchema,
  insertSpiritualBreathSchema
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadToS3, checkS3Credentials } from "./s3Upload";

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

  // Public route: Get single article (published only)
  app.get("/api/articles/:id", async (req, res) => {
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

  // Configure multer for media uploads to S3 (using memory storage)
  const uploadMedia = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for video files
    fileFilter: (req, file, cb) => {
      const allowedTypes = /mp4|mp3|avi|mov|pdf|txt|doc|docx/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      if (extname) {
        cb(null, true);
      } else {
        cb(new Error("Only video, audio, and document files are allowed"));
      }
    }
  });

  // ==================== PUBLIC PROCESS LIBRARY ROUTE ====================
  
  // Public: Get complete process library with nested structure grouped by type
  app.get("/api/process-library", async (req, res) => {
    try {
      const [folders, subfolders, processes] = await Promise.all([
        storage.getAllProcessFolders(),
        storage.getAllProcessSubfolders(),
        storage.getAllProcesses(),
      ]);

      // Build nested structure for each folder
      const foldersWithNesting = folders.map(folder => ({
        ...folder,
        subfolders: subfolders
          .filter(sf => sf.folderId === folder.id)
          .map(subfolder => ({
            ...subfolder,
            processes: processes.filter(p => p.subfolderId === subfolder.id),
          })),
        processes: processes.filter(p => p.folderId === folder.id && !p.subfolderId),
      }));

      // Group folders by type for tab-based UI
      const groupedByType = foldersWithNesting.reduce((acc, folder) => {
        const type = folder.type;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(folder);
        return acc;
      }, {} as Record<string, typeof foldersWithNesting>);

      res.json(groupedByType);
    } catch (error) {
      console.error("Error fetching process library:", error);
      res.status(500).json({ error: "Failed to fetch process library" });
    }
  });

  // ==================== PROCESS FOLDERS ROUTES ====================
  
  // Admin: Get all process folders
  app.get("/api/admin/process-folders", requireAdmin, async (req, res) => {
    try {
      const folders = await storage.getAllProcessFolders();
      res.json(folders);
    } catch (error) {
      console.error("Error fetching process folders:", error);
      res.status(500).json({ error: "Failed to fetch process folders" });
    }
  });

  // Admin: Create process folder
  app.post("/api/admin/process-folders", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertProcessFolderSchema.parse(req.body);
      const folder = await storage.createProcessFolder(validatedData);
      res.status(201).json(folder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error creating process folder:", error);
        res.status(500).json({ error: "Failed to create process folder" });
      }
    }
  });

  // Admin: Update process folder
  app.put("/api/admin/process-folders/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProcessFolderSchema.partial().parse(req.body);
      const folder = await storage.updateProcessFolder(id, validatedData);
      
      if (!folder) {
        res.status(404).json({ error: "Process folder not found" });
        return;
      }
      
      res.json(folder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error updating process folder:", error);
        res.status(500).json({ error: "Failed to update process folder" });
      }
    }
  });

  // Admin: Delete process folder
  app.delete("/api/admin/process-folders/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProcessFolder(id);
      
      if (!success) {
        res.status(404).json({ error: "Process folder not found" });
        return;
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting process folder:", error);
      res.status(500).json({ error: "Failed to delete process folder" });
    }
  });

  // ==================== PROCESS SUBFOLDERS ROUTES ====================
  
  // Admin: Get all process subfolders
  app.get("/api/admin/process-subfolders", requireAdmin, async (req, res) => {
    try {
      const subfolders = await storage.getAllProcessSubfolders();
      res.json(subfolders);
    } catch (error) {
      console.error("Error fetching process subfolders:", error);
      res.status(500).json({ error: "Failed to fetch process subfolders" });
    }
  });

  // Admin: Create process subfolder
  app.post("/api/admin/process-subfolders", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertProcessSubfolderSchema.parse(req.body);
      const subfolder = await storage.createProcessSubfolder(validatedData);
      res.status(201).json(subfolder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error creating process subfolder:", error);
        res.status(500).json({ error: "Failed to create process subfolder" });
      }
    }
  });

  // Admin: Update process subfolder
  app.put("/api/admin/process-subfolders/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProcessSubfolderSchema.partial().parse(req.body);
      const subfolder = await storage.updateProcessSubfolder(id, validatedData);
      
      if (!subfolder) {
        res.status(404).json({ error: "Process subfolder not found" });
        return;
      }
      
      res.json(subfolder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error updating process subfolder:", error);
        res.status(500).json({ error: "Failed to update process subfolder" });
      }
    }
  });

  // Admin: Delete process subfolder
  app.delete("/api/admin/process-subfolders/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProcessSubfolder(id);
      
      if (!success) {
        res.status(404).json({ error: "Process subfolder not found" });
        return;
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting process subfolder:", error);
      res.status(500).json({ error: "Failed to delete process subfolder" });
    }
  });

  // ==================== PROCESSES ROUTES ====================

  // Public: Get all processes
  app.get("/api/processes", async (req, res) => {
    try {
      const processes = await storage.getAllProcesses();
      res.json(processes);
    } catch (error) {
      console.error("Error fetching processes:", error);
      res.status(500).json({ error: "Failed to fetch processes" });
    }
  });
  
  // Admin: Get all processes
  app.get("/api/admin/processes", requireAdmin, async (req, res) => {
    try {
      const processes = await storage.getAllProcesses();
      res.json(processes);
    } catch (error) {
      console.error("Error fetching processes:", error);
      res.status(500).json({ error: "Failed to fetch processes" });
    }
  });

  // Admin: Create process
  app.post("/api/admin/processes", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertProcessSchema.parse(req.body);
      const process = await storage.createProcess(validatedData);
      res.status(201).json(process);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error creating process:", error);
        res.status(500).json({ error: "Failed to create process" });
      }
    }
  });

  // Admin: Update process
  app.put("/api/admin/processes/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProcessSchema.partial().parse(req.body);
      const process = await storage.updateProcess(id, validatedData);
      
      if (!process) {
        res.status(404).json({ error: "Process not found" });
        return;
      }
      
      res.json(process);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error updating process:", error);
        res.status(500).json({ error: "Failed to update process" });
      }
    }
  });

  // Admin: Delete process
  app.delete("/api/admin/processes/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProcess(id);
      
      if (!success) {
        res.status(404).json({ error: "Process not found" });
        return;
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting process:", error);
      res.status(500).json({ error: "Failed to delete process" });
    }
  });

  // ==================== SPIRITUAL BREATHS ROUTES ====================

  // Public: Get all spiritual breaths
  app.get("/api/spiritual-breaths", async (req, res) => {
    try {
      const breaths = await storage.getAllSpiritualBreaths();
      res.json(breaths);
    } catch (error) {
      console.error("Error fetching spiritual breaths:", error);
      res.status(500).json({ error: "Failed to fetch spiritual breaths" });
    }
  });
  
  // Admin: Get all spiritual breaths
  app.get("/api/admin/spiritual-breaths", requireAdmin, async (req, res) => {
    try {
      const breaths = await storage.getAllSpiritualBreaths();
      res.json(breaths);
    } catch (error) {
      console.error("Error fetching spiritual breaths:", error);
      res.status(500).json({ error: "Failed to fetch spiritual breaths" });
    }
  });

  // Admin: Create spiritual breath
  app.post("/api/admin/spiritual-breaths", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertSpiritualBreathSchema.parse(req.body);
      const breath = await storage.createSpiritualBreath(validatedData);
      res.status(201).json(breath);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error creating spiritual breath:", error);
        res.status(500).json({ error: "Failed to create spiritual breath" });
      }
    }
  });

  // Admin: Update spiritual breath
  app.put("/api/admin/spiritual-breaths/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSpiritualBreathSchema.partial().parse(req.body);
      const breath = await storage.updateSpiritualBreath(id, validatedData);
      
      if (!breath) {
        res.status(404).json({ error: "Spiritual breath not found" });
        return;
      }
      
      res.json(breath);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error updating spiritual breath:", error);
        res.status(500).json({ error: "Failed to update spiritual breath" });
      }
    }
  });

  // Admin: Delete spiritual breath
  app.delete("/api/admin/spiritual-breaths/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSpiritualBreath(id);
      
      if (!success) {
        res.status(404).json({ error: "Spiritual breath not found" });
        return;
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting spiritual breath:", error);
      res.status(500).json({ error: "Failed to delete spiritual breath" });
    }
  });

  // ==================== FILE UPLOAD ROUTES ====================

  // Admin: Upload process media (video/audio/script) to S3
  app.post("/api/admin/upload/process-media", requireAdmin, uploadMedia.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      const credCheck = checkS3Credentials();
      if (!credCheck.valid) {
        res.status(503).json({ 
          error: "AWS S3 credentials not configured", 
          details: credCheck.error,
          message: "Please configure AWS credentials to upload files"
        });
        return;
      }

      const fileType = req.body.fileType || "other";
      const folder = `processes/${fileType}`;
      
      const result = await uploadToS3(req.file, folder);
      
      if (!result.success) {
        res.status(500).json({ error: result.error });
        return;
      }
      
      res.json({ url: result.url });
    } catch (error) {
      console.error("Error uploading process media:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Admin: Upload spiritual breath media (video/audio) to S3
  app.post("/api/admin/upload/spiritual-breath-media", requireAdmin, uploadMedia.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      const credCheck = checkS3Credentials();
      if (!credCheck.valid) {
        res.status(503).json({ 
          error: "AWS S3 credentials not configured", 
          details: credCheck.error,
          message: "Please configure AWS credentials to upload files"
        });
        return;
      }

      const fileType = req.body.fileType || "other";
      const folder = `spiritual-breaths/${fileType}`;
      
      const result = await uploadToS3(req.file, folder);
      
      if (!result.success) {
        res.status(500).json({ error: result.error });
        return;
      }
      
      res.json({ url: result.url });
    } catch (error) {
      console.error("Error uploading spiritual breath media:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
