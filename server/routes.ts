import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCommunitySessionSchema, insertCategorySchema, insertArticleSchema,
  insertProcessFolderSchema, insertProcessSubfolderSchema, insertProcessSchema,
  insertSpiritualBreathSchema, insertCourseSchema, insertCourseSectionSchema,
  insertSectionVideoSchema, insertMasterclassSchema, insertWorkshopVideoSchema
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadToS3, checkS3Credentials } from "./s3Upload";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticateJWT, type AuthPayload } from "./middleware/auth";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const JWT_SECRET = process.env.JWT_SECRET as string;

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

// Admin auth middleware - supports both JWT and legacy password auth
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  // Legacy password-based auth (backward compatible)
  if (authHeader === `Bearer ${ADMIN_PASSWORD}`) {
    next();
    return;
  }
  
  // JWT-based auth
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as unknown as AuthPayload;
      if (["SUPER_ADMIN", "COACH"].includes(decoded.role)) {
        req.user = decoded;
        next();
        return;
      }
    } catch (error) {
      // Token invalid, continue to unauthorized response
    }
  }
  
  res.status(401).json({ error: "Unauthorized" });
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

  // Legacy admin login (kept for backward compatibility)
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

  // Admin JWT login (SUPER_ADMIN and COACH)
  app.post("/admin/v1/auth/login", async (req, res) => {
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

      // Update last login
      await storage.updateUserLastLogin(user.id);

      const token = jwt.sign(
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

  // User JWT login
  app.post("/api/v1/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (user.role !== "USER") {
        return res.status(403).json({ message: "Admins must use admin login" });
      }

      if (user.status !== "active") {
        return res.status(403).json({ message: "Account is blocked" });
      }

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update last login
      await storage.updateUserLastLogin(user.id);

      const token = jwt.sign(
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

  // Get current authenticated user
  app.get("/api/v1/me", authenticateJWT, async (req, res) => {
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

  // ===== STUDENT MANAGEMENT ROUTES =====

  // Admin routes: Get all students with search, filter, pagination
  app.get("/admin/v1/students", requireAdmin, async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const program = req.query.program as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await storage.getStudents({ search, programCode: program, page, limit });
      res.json(result);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  // Admin routes: Get single student
  app.get("/admin/v1/students/:id", requireAdmin, async (req, res) => {
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

  // Admin routes: Create student
  app.post("/admin/v1/students", requireAdmin, async (req, res) => {
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

      const student = await storage.createStudent({
        name,
        email,
        phone: phone || null,
        passwordHash,
        role: "USER",
        status: "active"
      }, programCode);

      res.status(201).json({ message: "Student added", userId: student.id });
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(500).json({ error: "Failed to create student" });
    }
  });

  // Admin routes: Update student
  app.put("/admin/v1/students/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, email, phone, status, programCode } = req.body;

      const student = await storage.updateStudent(id, { name, email, phone, status }, programCode);
      
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

  // Admin routes: Update student status (block/unblock)
  app.patch("/admin/v1/students/:id/status", requireAdmin, async (req, res) => {
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

  // Admin routes: Delete student
  app.delete("/admin/v1/students/:id", requireAdmin, async (req, res) => {
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

  // Admin routes: Get all programs
  app.get("/admin/v1/programs", requireAdmin, async (req, res) => {
    try {
      const programs = await storage.getAllPrograms();
      res.json(programs);
    } catch (error) {
      console.error("Error fetching programs:", error);
      res.status(500).json({ error: "Failed to fetch programs" });
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

  // ==================== WORKSHOPS ROUTES ====================

  // ===== COURSES =====
  
  // Public: Get all courses
  app.get("/api/courses", async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  // Admin: Create course
  app.post("/api/admin/courses", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(validatedData);
      res.status(201).json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error creating course:", error);
        res.status(500).json({ error: "Failed to create course" });
      }
    }
  });

  // Admin: Update course
  app.put("/api/admin/courses/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCourseSchema.partial().parse(req.body);
      const course = await storage.updateCourse(id, validatedData);
      
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      
      res.json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error updating course:", error);
        res.status(500).json({ error: "Failed to update course" });
      }
    }
  });

  // Admin: Delete course
  app.delete("/api/admin/courses/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCourse(id);
      
      if (!success) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ error: "Failed to delete course" });
    }
  });

  // ===== COURSE SECTIONS =====
  
  // Public: Get all course sections
  app.get("/api/course-sections", async (req, res) => {
    try {
      const sections = await storage.getAllCourseSections();
      res.json(sections);
    } catch (error) {
      console.error("Error fetching course sections:", error);
      res.status(500).json({ error: "Failed to fetch course sections" });
    }
  });

  // Admin: Create course section
  app.post("/api/admin/course-sections", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertCourseSectionSchema.parse(req.body);
      const section = await storage.createCourseSection(validatedData);
      res.status(201).json(section);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error creating course section:", error);
        res.status(500).json({ error: "Failed to create course section" });
      }
    }
  });

  // Admin: Update course section
  app.put("/api/admin/course-sections/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCourseSectionSchema.partial().parse(req.body);
      const section = await storage.updateCourseSection(id, validatedData);
      
      if (!section) {
        res.status(404).json({ error: "Course section not found" });
        return;
      }
      
      res.json(section);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error updating course section:", error);
        res.status(500).json({ error: "Failed to update course section" });
      }
    }
  });

  // Admin: Delete course section
  app.delete("/api/admin/course-sections/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCourseSection(id);
      
      if (!success) {
        res.status(404).json({ error: "Course section not found" });
        return;
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting course section:", error);
      res.status(500).json({ error: "Failed to delete course section" });
    }
  });

  // ===== SECTION VIDEOS =====
  
  // Public: Get all section videos
  app.get("/api/section-videos", async (req, res) => {
    try {
      const videos = await storage.getAllSectionVideos();
      res.json(videos);
    } catch (error) {
      console.error("Error fetching section videos:", error);
      res.status(500).json({ error: "Failed to fetch section videos" });
    }
  });

  // Admin: Create section video
  app.post("/api/admin/section-videos", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertSectionVideoSchema.parse(req.body);
      const video = await storage.createSectionVideo(validatedData);
      res.status(201).json(video);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error creating section video:", error);
        res.status(500).json({ error: "Failed to create section video" });
      }
    }
  });

  // Admin: Update section video
  app.put("/api/admin/section-videos/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSectionVideoSchema.partial().parse(req.body);
      const video = await storage.updateSectionVideo(id, validatedData);
      
      if (!video) {
        res.status(404).json({ error: "Section video not found" });
        return;
      }
      
      res.json(video);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error updating section video:", error);
        res.status(500).json({ error: "Failed to update section video" });
      }
    }
  });

  // Admin: Delete section video
  app.delete("/api/admin/section-videos/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSectionVideo(id);
      
      if (!success) {
        res.status(404).json({ error: "Section video not found" });
        return;
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting section video:", error);
      res.status(500).json({ error: "Failed to delete section video" });
    }
  });

  // ===== MASTERCLASSES =====
  
  // Public: Get all masterclasses
  app.get("/api/masterclasses", async (req, res) => {
    try {
      const masterclasses = await storage.getAllMasterclasses();
      res.json(masterclasses);
    } catch (error) {
      console.error("Error fetching masterclasses:", error);
      res.status(500).json({ error: "Failed to fetch masterclasses" });
    }
  });

  // Admin: Create masterclass
  app.post("/api/admin/masterclasses", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertMasterclassSchema.parse(req.body);
      const masterclass = await storage.createMasterclass(validatedData);
      res.status(201).json(masterclass);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error creating masterclass:", error);
        res.status(500).json({ error: "Failed to create masterclass" });
      }
    }
  });

  // Admin: Update masterclass
  app.put("/api/admin/masterclasses/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertMasterclassSchema.partial().parse(req.body);
      const masterclass = await storage.updateMasterclass(id, validatedData);
      
      if (!masterclass) {
        res.status(404).json({ error: "Masterclass not found" });
        return;
      }
      
      res.json(masterclass);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error updating masterclass:", error);
        res.status(500).json({ error: "Failed to update masterclass" });
      }
    }
  });

  // Admin: Delete masterclass
  app.delete("/api/admin/masterclasses/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMasterclass(id);
      
      if (!success) {
        res.status(404).json({ error: "Masterclass not found" });
        return;
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting masterclass:", error);
      res.status(500).json({ error: "Failed to delete masterclass" });
    }
  });

  // ===== WORKSHOP VIDEOS =====
  
  // Public: Get all workshop videos
  app.get("/api/workshop-videos", async (req, res) => {
    try {
      const videos = await storage.getAllWorkshopVideos();
      res.json(videos);
    } catch (error) {
      console.error("Error fetching workshop videos:", error);
      res.status(500).json({ error: "Failed to fetch workshop videos" });
    }
  });

  // Admin: Create workshop video
  app.post("/api/admin/workshop-videos", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertWorkshopVideoSchema.parse(req.body);
      const video = await storage.createWorkshopVideo(validatedData);
      res.status(201).json(video);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error creating workshop video:", error);
        res.status(500).json({ error: "Failed to create workshop video" });
      }
    }
  });

  // Admin: Update workshop video
  app.put("/api/admin/workshop-videos/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertWorkshopVideoSchema.partial().parse(req.body);
      const video = await storage.updateWorkshopVideo(id, validatedData);
      
      if (!video) {
        res.status(404).json({ error: "Workshop video not found" });
        return;
      }
      
      res.json(video);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        console.error("Error updating workshop video:", error);
        res.status(500).json({ error: "Failed to update workshop video" });
      }
    }
  });

  // Admin: Delete workshop video
  app.delete("/api/admin/workshop-videos/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteWorkshopVideo(id);
      
      if (!success) {
        res.status(404).json({ error: "Workshop video not found" });
        return;
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting workshop video:", error);
      res.status(500).json({ error: "Failed to delete workshop video" });
    }
  });

  // Admin: Upload workshop media (thumbnails, videos) to S3
  app.post("/api/admin/upload/workshop-media", requireAdmin, uploadMedia.single("file"), async (req, res) => {
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
      const folder = `workshops/${fileType}`;
      
      const result = await uploadToS3(req.file, folder);
      
      if (!result.success) {
        res.status(500).json({ error: result.error });
        return;
      }
      
      res.json({ url: result.url });
    } catch (error) {
      console.error("Error uploading workshop media:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
