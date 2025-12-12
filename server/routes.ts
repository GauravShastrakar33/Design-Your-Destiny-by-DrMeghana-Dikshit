import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertCommunitySessionSchema,
  insertCategorySchema,
  insertArticleSchema,
  insertCmsCourseSchema,
  insertCmsModuleSchema,
  insertCmsModuleFolderSchema,
  insertCmsLessonSchema,
  insertCmsLessonFileSchema,
  cmsCourses,
  cmsModules,
  cmsModuleFolders,
  cmsLessons,
  cmsLessonFiles,
  programs,
  frontendFeatures,
  featureCourseMap,
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadToS3, checkS3Credentials } from "./s3Upload";
import {
  checkR2Credentials,
  getSignedPutUrl,
  getSignedGetUrl,
  deleteR2Object,
  generateCourseThumnailKey,
  generateLessonFileKey,
  downloadR2Object,
} from "./r2Upload";
// pdf-parse will be dynamically imported when needed
import { db } from "./db";
import { eq, asc, and, ilike, or, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticateJWT, type AuthPayload } from "./middleware/auth";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const JWT_SECRET = process.env.JWT_SECRET as string;

// Keep real paragraphs and line breaks from pdf-parse output
export function convertTextToFormattedHtml(text: string): string {
  // 1) normalize newlines
  const norm = text
    .replace(/\r\n/g, "\n")
    .replace(/\u00A0/g, " ")
    .trim();

  // 2) split into "blocks" by 1+ blank lines (paragraph gaps)
  //    This keeps natural paragraph spacing from the PDF
  const blocks = norm.split(/\n{2,}/);

  const html: string[] = [];

  // Header heuristics tuned for your scripts (Intention, Affirmation, Tapping (...))
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
  ];

  const looksLikeHeader = (s: string) => {
    const t = s.trim();
    if (!t) return false;
    if (t.length > 60) return false;
    if (/[.!?]$/.test(t)) return false; // sentences are not headers
    const lower = t.toLowerCase();

    // exact keyword or keyword with parens e.g. Tapping (Release)
    if (headerKeywords.some((k) => lower === k || lower.startsWith(k + " ")))
      return true;

    // Short, title-like line (<= 6 words), not all-caps noise
    const words = t.split(/\s+/);
    if (words.length <= 6 && /^[A-Z]/.test(t)) return true;

    return false;
  };

  // helper: list detection inside a block
  const splitLines = (b: string) =>
    b
      .split("\n")
      .map((l) => l.trim())
      .filter(
        (l) => l.length > 0 && !/^--\s*\d+\s*(of|\/)\s*\d+\s*--$/i.test(l),
      );

  const isUnordered = (line: string) => /^[-•*]\s+/.test(line);
  const isOrdered = (line: string) => /^\d+\s*[.)]\s+/.test(line);

  for (const block of blocks) {
    const lines = splitLines(block);
    if (lines.length === 0) {
      // multiple blank lines => add extra gap
      html.push('<div class="h-4"></div>');
      continue;
    }

    // Single short line that looks like a header
    if (lines.length === 1 && looksLikeHeader(lines[0])) {
      const header = lines[0].replace(/[,:]$/, "").trim();
      html.push(
        `<h3 class="mt-6 mb-2 text-lg font-semibold text-primary">${header}</h3>`,
      );
      continue;
    }

    // Entire block is a list?
    const allUnordered = lines.every(isUnordered);
    const allOrdered = lines.every(isOrdered);

    if (allUnordered) {
      html.push('<ul class="list-disc list-inside space-y-1 my-3">');
      for (const l of lines)
        html.push(`<li>${l.replace(/^[-•*]\s+/, "")}</li>`);
      html.push("</ul>");
      continue;
    }
    if (allOrdered) {
      html.push('<ol class="list-decimal list-inside space-y-1 my-3">');
      for (const l of lines)
        html.push(`<li>${l.replace(/^\d+\s*[.)]\s+/, "")}</li>`);
      html.push("</ol>");
      continue;
    }

    // Mixed content: keep line breaks *inside* the block
    // Convert single \n to <br/> so you see original line wrapping
    const body = lines.join("<br/>");

    // If the first line looks like a header, split it out
    if (looksLikeHeader(lines[0])) {
      const header = lines[0].replace(/[,:]$/, "").trim();
      const rest = lines.slice(1).join("<br/>");
      html.push(
        `<h3 class="mt-6 mb-2 text-lg font-semibold text-primary">${header}</h3>`,
      );
      if (rest.trim()) html.push(`<p class="my-3 leading-relaxed">${rest}</p>`);
    } else {
      html.push(`<p class="my-3 leading-relaxed">${body}</p>`);
    }
  }

  return html.join("\n");
}

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
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadArticleImage = multer({
  storage: articleImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
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

// Super Admin only middleware - for admin management routes
const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as unknown as AuthPayload;
      if (decoded.role === "SUPER_ADMIN") {
        req.user = decoded;
        next();
        return;
      }
    } catch (error) {
      // Token invalid
    }
  }

  res.status(403).json({ error: "Super Admin access required" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Public route: Get all active community sessions
  app.get("/api/sessions", async (req, res) => {
    try {
      const sessions = await storage.getAllCommunitySessions();
      const activeSessions = sessions.filter((s) => s.isActive);
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
        { expiresIn: "30d" },
      );

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
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

      // Allow USER and COACH roles to login to user app
      // SUPER_ADMIN should use admin login only
      if (user.role === "SUPER_ADMIN") {
        return res
          .status(403)
          .json({ message: "Super Admin must use admin login" });
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
        { expiresIn: "30d" },
      );

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
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
        phone: user.phone,
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
        res
          .status(400)
          .json({ error: "Validation failed", details: error.errors });
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
      const validatedData = insertCommunitySessionSchema
        .partial()
        .parse(req.body);
      const session = await storage.updateCommunitySession(id, validatedData);

      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ error: "Validation failed", details: error.errors });
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

      const result = await storage.getStudents({
        search,
        programCode: program,
        page,
        limit,
      });
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

      const student = await storage.createStudent(
        {
          name,
          email,
          phone: phone || null,
          passwordHash,
          role: "USER",
          status: "active",
        },
        programCode,
      );

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

      const student = await storage.updateStudent(
        id,
        { name, email, phone, status },
        programCode,
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

  // ===== ADMIN MANAGEMENT ROUTES =====

  // Get all admins with search and pagination (SUPER_ADMIN can see all, COACH can view only)
  app.get("/admin/v1/admins", requireAdmin, async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await storage.getAdmins({ search, page, limit });
      res.json(result);
    } catch (error) {
      console.error("Error fetching admins:", error);
      res.status(500).json({ error: "Failed to fetch admins" });
    }
  });

  // Get single admin (SUPER_ADMIN only)
  app.get("/admin/v1/admins/:id", requireSuperAdmin, async (req, res) => {
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

  // Create admin (SUPER_ADMIN only)
  app.post("/admin/v1/admins", requireSuperAdmin, async (req, res) => {
    try {
      const { name, email, phone, password, role, status } = req.body;

      if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
      }

      if (!["SUPER_ADMIN", "COACH"].includes(role)) {
        return res
          .status(400)
          .json({ error: "Role must be SUPER_ADMIN or COACH" });
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
        status: status || "active",
      });

      res.status(201).json({ message: "Admin created", adminId: admin.id });
    } catch (error) {
      console.error("Error creating admin:", error);
      res.status(500).json({ error: "Failed to create admin" });
    }
  });

  // Update admin (SUPER_ADMIN only)
  app.put("/admin/v1/admins/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, email, role, status } = req.body;

      if (role && !["SUPER_ADMIN", "COACH"].includes(role)) {
        return res
          .status(400)
          .json({ error: "Role must be SUPER_ADMIN or COACH" });
      }

      const admin = await storage.updateAdmin(id, {
        name,
        email,
        role,
        status,
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

  // Update admin status (block/unblock) - SUPER_ADMIN only
  app.patch(
    "/admin/v1/admins/:id/status",
    requireSuperAdmin,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const { status } = req.body;

        if (!["active", "blocked"].includes(status)) {
          return res.status(400).json({ error: "Invalid status" });
        }

        // Prevent self-blocking
        if (req.user && req.user.sub === id) {
          return res
            .status(400)
            .json({ error: "Cannot change your own status" });
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
    },
  );

  // Delete admin (SUPER_ADMIN only)
  app.delete("/admin/v1/admins/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Prevent self-deletion
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
        res
          .status(400)
          .json({ error: "Validation failed", details: error.errors });
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
        res
          .status(400)
          .json({ error: "Validation failed", details: error.errors });
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
        res
          .status(400)
          .json({ error: "Validation failed", details: error.errors });
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
  app.post(
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
    },
  );

  // ============================================
  // CMS ROUTES - Programs, Courses, Modules, Folders, Lessons, Files
  // ============================================

  // --- PROGRAMS CRUD ---

  // Get all programs
  app.get("/api/admin/v1/programs", requireAdmin, async (req, res) => {
    try {
      const allPrograms = await db
        .select()
        .from(programs)
        .orderBy(asc(programs.name));
      res.json(allPrograms);
    } catch (error) {
      console.error("Error fetching programs:", error);
      res.status(500).json({ error: "Failed to fetch programs" });
    }
  });

  // Create a new program
  app.post("/api/admin/v1/programs", requireAdmin, async (req, res) => {
    try {
      const { code, name } = req.body;

      if (!code || !name) {
        res.status(400).json({ error: "Code and name are required" });
        return;
      }

      const [newProgram] = await db
        .insert(programs)
        .values({
          code: String(code).toUpperCase(),
          name: String(name),
        })
        .returning();

      res.status(201).json(newProgram);
    } catch (error: any) {
      console.error("Error creating program:", error);
      if (error.code === "23505") {
        res
          .status(409)
          .json({ error: "A program with this code already exists" });
        return;
      }
      res.status(500).json({ error: "Failed to create program" });
    }
  });

  // Update a program
  app.put("/api/admin/v1/programs/:id", requireAdmin, async (req, res) => {
    try {
      const programId = parseInt(req.params.id);
      const { code, name } = req.body;

      const [updated] = await db
        .update(programs)
        .set({
          ...(code && { code: String(code).toUpperCase() }),
          ...(name && { name: String(name) }),
        })
        .where(eq(programs.id, programId))
        .returning();

      if (!updated) {
        res.status(404).json({ error: "Program not found" });
        return;
      }

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating program:", error);
      if (error.code === "23505") {
        res
          .status(409)
          .json({ error: "A program with this code already exists" });
        return;
      }
      res.status(500).json({ error: "Failed to update program" });
    }
  });

  // Delete a program
  app.delete("/api/admin/v1/programs/:id", requireAdmin, async (req, res) => {
    try {
      const programId = parseInt(req.params.id);

      // Check if any courses use this program
      const linkedCourses = await db
        .select({ id: cmsCourses.id })
        .from(cmsCourses)
        .where(eq(cmsCourses.programId, programId));

      if (linkedCourses.length > 0) {
        res.status(400).json({
          error: "Cannot delete program",
          message: `This program is linked to ${linkedCourses.length} course(s). Please reassign or delete those courses first.`,
        });
        return;
      }

      const [deleted] = await db
        .delete(programs)
        .where(eq(programs.id, programId))
        .returning();

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

  // --- CMS COURSES ---

  // Get all courses
  app.get("/api/admin/v1/cms/courses", requireAdmin, async (req, res) => {
    try {
      const { search, programId, sortOrder = "asc" } = req.query;

      const courses = await db
        .select()
        .from(cmsCourses)
        .orderBy(
          sortOrder === "desc" ? sql`position DESC` : asc(cmsCourses.position),
        );

      let filteredCourses = courses;

      if (search) {
        const searchLower = String(search).toLowerCase();
        filteredCourses = filteredCourses.filter((c) =>
          c.title.toLowerCase().includes(searchLower),
        );
      }

      if (programId) {
        const pid = parseInt(String(programId));
        filteredCourses = filteredCourses.filter((c) => c.programId === pid);
      }

      // Generate signed thumbnail URLs from keys
      const coursesWithSignedUrls = await Promise.all(
        filteredCourses.map(async (course) => {
          let thumbnailSignedUrl: string | null = null;
          if (course.thumbnailKey) {
            const signedResult = await getSignedGetUrl(course.thumbnailKey);
            if (signedResult.success && signedResult.url) {
              thumbnailSignedUrl = signedResult.url;
            }
          }
          return { ...course, thumbnailSignedUrl };
        }),
      );

      res.json(coursesWithSignedUrls);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  // Get single course with full details
  app.get("/api/admin/v1/cms/courses/:id", requireAdmin, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);

      const [course] = await db
        .select()
        .from(cmsCourses)
        .where(eq(cmsCourses.id, courseId));

      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }

      // Generate signed thumbnail URL from key
      let thumbnailSignedUrl: string | null = null;
      if (course.thumbnailKey) {
        const signedResult = await getSignedGetUrl(course.thumbnailKey);
        if (signedResult.success && signedResult.url) {
          thumbnailSignedUrl = signedResult.url;
        }
      }

      // Get modules with their folders and lessons
      const modules = await db
        .select()
        .from(cmsModules)
        .where(eq(cmsModules.courseId, courseId))
        .orderBy(asc(cmsModules.position));

      const modulesWithContent = await Promise.all(
        modules.map(async (module) => {
          const folders = await db
            .select()
            .from(cmsModuleFolders)
            .where(eq(cmsModuleFolders.moduleId, module.id))
            .orderBy(asc(cmsModuleFolders.position));

          const lessons = await db
            .select()
            .from(cmsLessons)
            .where(eq(cmsLessons.moduleId, module.id))
            .orderBy(asc(cmsLessons.position));

          const lessonsWithFiles = await Promise.all(
            lessons.map(async (lesson) => {
              const files = await db
                .select()
                .from(cmsLessonFiles)
                .where(eq(cmsLessonFiles.lessonId, lesson.id))
                .orderBy(asc(cmsLessonFiles.position));
              return { ...lesson, files };
            }),
          );

          return { ...module, folders, lessons: lessonsWithFiles };
        }),
      );

      res.json({ ...course, thumbnailSignedUrl, modules: modulesWithContent });
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });

  // Create course
  app.post("/api/admin/v1/cms/courses", requireAdmin, async (req, res) => {
    try {
      const parsed = insertCmsCourseSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: "Invalid course data", details: parsed.error.errors });
        return;
      }

      // Get max position
      const [maxPos] = await db
        .select({ max: sql<number>`COALESCE(MAX(position), 0)` })
        .from(cmsCourses);
      const position = (maxPos?.max || 0) + 1;

      const adminId = req.user?.sub || null;

      const [course] = await db
        .insert(cmsCourses)
        .values({
          ...parsed.data,
          position,
          createdByAdminId: adminId,
        })
        .returning();

      res.status(201).json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ error: "Failed to create course" });
    }
  });

  // Update course
  app.put("/api/admin/v1/cms/courses/:id", requireAdmin, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);

      const [existing] = await db
        .select()
        .from(cmsCourses)
        .where(eq(cmsCourses.id, courseId));
      if (!existing) {
        res.status(404).json({ error: "Course not found" });
        return;
      }

      const [updated] = await db
        .update(cmsCourses)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(cmsCourses.id, courseId))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ error: "Failed to update course" });
    }
  });

  // Delete course
  app.delete(
    "/api/admin/v1/cms/courses/:id",
    requireAdmin,
    async (req, res) => {
      try {
        const courseId = parseInt(req.params.id);

        await db.delete(cmsCourses).where(eq(cmsCourses.id, courseId));

        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting course:", error);
        res.status(500).json({ error: "Failed to delete course" });
      }
    },
  );

  // Toggle course publish status
  app.patch(
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

        const [updated] = await db
          .update(cmsCourses)
          .set({ isPublished, updatedAt: new Date() })
          .where(eq(cmsCourses.id, courseId))
          .returning();

        if (!updated) {
          res.status(404).json({ error: "Course not found" });
          return;
        }

        res.json(updated);
      } catch (error) {
        console.error("Error toggling course publish:", error);
        res.status(500).json({ error: "Failed to toggle course publish" });
      }
    },
  );

  // Reorder courses
  app.patch(
    "/api/admin/v1/cms/courses/reorder",
    requireAdmin,
    async (req, res) => {
      try {
        const { items } = req.body as {
          items: { id: number; position: number }[];
        };

        if (!Array.isArray(items)) {
          res.status(400).json({ error: "Invalid reorder data" });
          return;
        }

        await Promise.all(
          items.map((item) =>
            db
              .update(cmsCourses)
              .set({ position: item.position, updatedAt: new Date() })
              .where(eq(cmsCourses.id, item.id)),
          ),
        );

        res.json({ success: true });
      } catch (error) {
        console.error("Error reordering courses:", error);
        res.status(500).json({ error: "Failed to reorder courses" });
      }
    },
  );

  // --- CMS MODULES ---

  // Get modules for a course (query param style)
  app.get("/api/admin/v1/cms/modules", requireAdmin, async (req, res) => {
    try {
      const courseId = parseInt(req.query.courseId as string);

      if (!courseId) {
        res.status(400).json({ error: "courseId is required" });
        return;
      }

      const modules = await db
        .select()
        .from(cmsModules)
        .where(eq(cmsModules.courseId, courseId))
        .orderBy(asc(cmsModules.position));

      res.json(modules);
    } catch (error) {
      console.error("Error fetching modules:", error);
      res.status(500).json({ error: "Failed to fetch modules" });
    }
  });

  // Get modules for a course (path param style - used by admin processes page)
  app.get(
    "/api/admin/v1/cms/courses/:courseId/modules",
    requireAdmin,
    async (req, res) => {
      try {
        const courseId = parseInt(req.params.courseId);

        if (!courseId || isNaN(courseId)) {
          res.status(400).json({ error: "Valid courseId is required" });
          return;
        }

        const modules = await db
          .select()
          .from(cmsModules)
          .where(eq(cmsModules.courseId, courseId))
          .orderBy(asc(cmsModules.position));

        res.json(modules);
      } catch (error) {
        console.error("Error fetching modules for course:", error);
        res.status(500).json({ error: "Failed to fetch modules" });
      }
    },
  );

  // Create module
  app.post("/api/admin/v1/cms/modules", requireAdmin, async (req, res) => {
    try {
      const parsed = insertCmsModuleSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: "Invalid module data", details: parsed.error.errors });
        return;
      }

      // Get max position for this course
      const [maxPos] = await db
        .select({ max: sql<number>`COALESCE(MAX(position), 0)` })
        .from(cmsModules)
        .where(eq(cmsModules.courseId, parsed.data.courseId));

      const position = (maxPos?.max || 0) + 1;

      const [module] = await db
        .insert(cmsModules)
        .values({
          ...parsed.data,
          position,
        })
        .returning();

      res.status(201).json(module);
    } catch (error) {
      console.error("Error creating module:", error);
      res.status(500).json({ error: "Failed to create module" });
    }
  });

  // Update module
  app.put("/api/admin/v1/cms/modules/:id", requireAdmin, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);

      const [updated] = await db
        .update(cmsModules)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(cmsModules.id, moduleId))
        .returning();

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

  // Delete module
  app.delete(
    "/api/admin/v1/cms/modules/:id",
    requireAdmin,
    async (req, res) => {
      try {
        const moduleId = parseInt(req.params.id);

        await db.delete(cmsModules).where(eq(cmsModules.id, moduleId));

        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting module:", error);
        res.status(500).json({ error: "Failed to delete module" });
      }
    },
  );

  // Reorder modules
  app.patch(
    "/api/admin/v1/cms/modules/reorder",
    requireAdmin,
    async (req, res) => {
      try {
        const { items } = req.body as {
          items: { id: number; position: number }[];
        };

        await Promise.all(
          items.map((item) =>
            db
              .update(cmsModules)
              .set({ position: item.position, updatedAt: new Date() })
              .where(eq(cmsModules.id, item.id)),
          ),
        );

        res.json({ success: true });
      } catch (error) {
        console.error("Error reordering modules:", error);
        res.status(500).json({ error: "Failed to reorder modules" });
      }
    },
  );

  // --- CMS MODULE FOLDERS ---

  // Get folders for a module
  app.get("/api/admin/v1/cms/folders", requireAdmin, async (req, res) => {
    try {
      const moduleId = parseInt(req.query.moduleId as string);

      if (!moduleId) {
        res.status(400).json({ error: "moduleId is required" });
        return;
      }

      const folders = await db
        .select()
        .from(cmsModuleFolders)
        .where(eq(cmsModuleFolders.moduleId, moduleId))
        .orderBy(asc(cmsModuleFolders.position));

      res.json(folders);
    } catch (error) {
      console.error("Error fetching folders:", error);
      res.status(500).json({ error: "Failed to fetch folders" });
    }
  });

  // Create folder
  app.post("/api/admin/v1/cms/folders", requireAdmin, async (req, res) => {
    try {
      const parsed = insertCmsModuleFolderSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: "Invalid folder data", details: parsed.error.errors });
        return;
      }

      const [maxPos] = await db
        .select({ max: sql<number>`COALESCE(MAX(position), 0)` })
        .from(cmsModuleFolders)
        .where(eq(cmsModuleFolders.moduleId, parsed.data.moduleId));

      const position = (maxPos?.max || 0) + 1;

      const [folder] = await db
        .insert(cmsModuleFolders)
        .values({
          ...parsed.data,
          position,
        })
        .returning();

      res.status(201).json(folder);
    } catch (error) {
      console.error("Error creating folder:", error);
      res.status(500).json({ error: "Failed to create folder" });
    }
  });

  // Update folder
  app.put("/api/admin/v1/cms/folders/:id", requireAdmin, async (req, res) => {
    try {
      const folderId = parseInt(req.params.id);

      const [updated] = await db
        .update(cmsModuleFolders)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(cmsModuleFolders.id, folderId))
        .returning();

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

  // Delete folder
  app.delete(
    "/api/admin/v1/cms/folders/:id",
    requireAdmin,
    async (req, res) => {
      try {
        const folderId = parseInt(req.params.id);

        await db
          .delete(cmsModuleFolders)
          .where(eq(cmsModuleFolders.id, folderId));

        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting folder:", error);
        res.status(500).json({ error: "Failed to delete folder" });
      }
    },
  );

  // Reorder folders
  app.patch(
    "/api/admin/v1/cms/folders/reorder",
    requireAdmin,
    async (req, res) => {
      try {
        const { items } = req.body as {
          items: { id: number; position: number }[];
        };

        await Promise.all(
          items.map((item) =>
            db
              .update(cmsModuleFolders)
              .set({ position: item.position, updatedAt: new Date() })
              .where(eq(cmsModuleFolders.id, item.id)),
          ),
        );

        res.json({ success: true });
      } catch (error) {
        console.error("Error reordering folders:", error);
        res.status(500).json({ error: "Failed to reorder folders" });
      }
    },
  );

  // --- CMS LESSONS ---

  // Get lessons for a module (optionally filtered by folder)
  app.get("/api/admin/v1/cms/lessons", requireAdmin, async (req, res) => {
    try {
      const moduleId = parseInt(req.query.moduleId as string);
      const folderId = req.query.folderId
        ? parseInt(req.query.folderId as string)
        : null;

      if (!moduleId) {
        res.status(400).json({ error: "moduleId is required" });
        return;
      }

      let query = db
        .select()
        .from(cmsLessons)
        .where(eq(cmsLessons.moduleId, moduleId));

      const lessons = await query.orderBy(asc(cmsLessons.position));

      const filteredLessons =
        folderId !== null
          ? lessons.filter((l) => l.folderId === folderId)
          : lessons;

      res.json(filteredLessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  // Get single lesson by ID with files
  app.get("/api/admin/v1/cms/lessons/:id", requireAdmin, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);

      const [lesson] = await db
        .select()
        .from(cmsLessons)
        .where(eq(cmsLessons.id, lessonId));

      if (!lesson) {
        res.status(404).json({ error: "Lesson not found" });
        return;
      }

      const files = await db
        .select()
        .from(cmsLessonFiles)
        .where(eq(cmsLessonFiles.lessonId, lessonId))
        .orderBy(asc(cmsLessonFiles.position));

      res.json({ ...lesson, files });
    } catch (error) {
      console.error("Error fetching lesson:", error);
      res.status(500).json({ error: "Failed to fetch lesson" });
    }
  });

  // Create lesson
  app.post("/api/admin/v1/cms/lessons", requireAdmin, async (req, res) => {
    try {
      const parsed = insertCmsLessonSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: "Invalid lesson data", details: parsed.error.errors });
        return;
      }

      const [maxPos] = await db
        .select({ max: sql<number>`COALESCE(MAX(position), 0)` })
        .from(cmsLessons)
        .where(eq(cmsLessons.moduleId, parsed.data.moduleId));

      const position = (maxPos?.max || 0) + 1;

      const [lesson] = await db
        .insert(cmsLessons)
        .values({
          ...parsed.data,
          position,
        })
        .returning();

      res.status(201).json(lesson);
    } catch (error) {
      console.error("Error creating lesson:", error);
      res.status(500).json({ error: "Failed to create lesson" });
    }
  });

  // Update lesson
  app.put("/api/admin/v1/cms/lessons/:id", requireAdmin, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);

      const [updated] = await db
        .update(cmsLessons)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(cmsLessons.id, lessonId))
        .returning();

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

  // Delete lesson
  app.delete(
    "/api/admin/v1/cms/lessons/:id",
    requireAdmin,
    async (req, res) => {
      try {
        const lessonId = parseInt(req.params.id);

        // First delete associated files from R2
        const files = await db
          .select()
          .from(cmsLessonFiles)
          .where(eq(cmsLessonFiles.lessonId, lessonId));
        for (const file of files) {
          await deleteR2Object(file.r2Key);
        }

        await db.delete(cmsLessons).where(eq(cmsLessons.id, lessonId));

        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting lesson:", error);
        res.status(500).json({ error: "Failed to delete lesson" });
      }
    },
  );

  // Reorder lessons
  app.patch(
    "/api/admin/v1/cms/lessons/reorder",
    requireAdmin,
    async (req, res) => {
      try {
        const { items } = req.body as {
          items: { id: number; position: number }[];
        };

        await Promise.all(
          items.map((item) =>
            db
              .update(cmsLessons)
              .set({ position: item.position, updatedAt: new Date() })
              .where(eq(cmsLessons.id, item.id)),
          ),
        );

        res.json({ success: true });
      } catch (error) {
        console.error("Error reordering lessons:", error);
        res.status(500).json({ error: "Failed to reorder lessons" });
      }
    },
  );

  // --- CMS FILES ---

  // Get files for a lesson
  app.get("/api/admin/v1/cms/files", requireAdmin, async (req, res) => {
    try {
      const lessonId = parseInt(req.query.lessonId as string);

      if (!lessonId) {
        res.status(400).json({ error: "lessonId is required" });
        return;
      }

      const files = await db
        .select()
        .from(cmsLessonFiles)
        .where(eq(cmsLessonFiles.lessonId, lessonId))
        .orderBy(asc(cmsLessonFiles.position));

      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ error: "Failed to fetch files" });
    }
  });

  // Get signed PUT URL for file upload
  app.post(
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
          uploadType,
        } = req.body;

        if (!filename || !contentType) {
          res
            .status(400)
            .json({ error: "filename and contentType are required" });
          return;
        }

        const credCheck = checkR2Credentials();
        if (!credCheck.valid) {
          res.status(503).json({
            error: "R2 credentials not configured",
            details: credCheck.error,
            message: "Please configure R2 credentials to upload files",
          });
          return;
        }

        let key: string;

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

        // Generate a signed GET URL for immediate preview after upload
        const getResult = await getSignedGetUrl(key);
        const signedUrl = getResult.success ? getResult.url : null;

        res.json({
          uploadUrl: result.uploadUrl,
          key: result.key,
          signedUrl, // Use signed URL instead of public URL
        });
      } catch (error) {
        console.error("Error getting upload URL:", error);
        res.status(500).json({ error: "Failed to get upload URL" });
      }
    },
  );

  // Confirm file upload and save metadata
  app.post(
    "/api/admin/v1/cms/files/confirm",
    requireAdmin,
    async (req, res) => {
      try {
        const parsed = insertCmsLessonFileSchema.safeParse(req.body);
        if (!parsed.success) {
          res
            .status(400)
            .json({ error: "Invalid file data", details: parsed.error.errors });
          return;
        }

        const [maxPos] = await db
          .select({ max: sql<number>`COALESCE(MAX(position), 0)` })
          .from(cmsLessonFiles)
          .where(eq(cmsLessonFiles.lessonId, parsed.data.lessonId));

        const position = (maxPos?.max || 0) + 1;

        let extractedText: string | null = null;
        let scriptHtml: string | null = null;

        // Convert PDF to HTML with formatting preserved
        if (parsed.data.fileType === "script" && parsed.data.r2Key) {
          try {
            console.log("Converting PDF to HTML:", parsed.data.r2Key);
            const downloadResult = await downloadR2Object(parsed.data.r2Key);

            if (downloadResult.success && downloadResult.data) {
              // Use pdf-parse v2 to extract text
              const { PDFParse } = await import("pdf-parse");
              const parser = new PDFParse({ data: downloadResult.data });
              const textResult = await parser.getText();
              extractedText = textResult.text;
              await parser.destroy();

              // Convert extracted text to formatted HTML
              if (extractedText) {
                scriptHtml = convertTextToFormattedHtml(extractedText);
                console.log(
                  "PDF converted to HTML, length:",
                  scriptHtml?.length || 0,
                );
              }
            } else {
              console.error(
                "Failed to download PDF for conversion:",
                downloadResult.error,
              );
            }
          } catch (pdfError) {
            console.error("Error converting PDF to HTML:", pdfError);
            // Continue without HTML - file will still be saved
          }
        }

        const [file] = await db
          .insert(cmsLessonFiles)
          .values({
            ...parsed.data,
            position,
            extractedText,
            scriptHtml,
          })
          .returning();

        res.status(201).json(file);
      } catch (error) {
        console.error("Error confirming file upload:", error);
        res.status(500).json({ error: "Failed to confirm file upload" });
      }
    },
  );

  // Delete file
  app.delete("/api/admin/v1/cms/files/:id", requireAdmin, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);

      const [file] = await db
        .select()
        .from(cmsLessonFiles)
        .where(eq(cmsLessonFiles.id, fileId));

      if (file) {
        await deleteR2Object(file.r2Key);
      }

      await db.delete(cmsLessonFiles).where(eq(cmsLessonFiles.id, fileId));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ error: "Failed to delete file" });
    }
  });

  // Get signed GET URL for protected file access
  app.get(
    "/api/admin/v1/cms/files/:id/signed-url",
    requireAdmin,
    async (req, res) => {
      try {
        const fileId = parseInt(req.params.id);

        const [file] = await db
          .select()
          .from(cmsLessonFiles)
          .where(eq(cmsLessonFiles.id, fileId));

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
    },
  );

  // ===== FRONTEND FEATURE MAPPING ROUTES =====

  // Get all frontend features
  app.get(
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
    },
  );

  // Get mapped courses for a feature
  app.get(
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
    },
  );

  // Map a course to a feature
  app.post(
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

        // For DYD, USM, BREATH, PLAYLIST - only 1 course allowed, replace existing
        if (["DYD", "USM", "BREATH", "PLAYLIST"].includes(code)) {
          await storage.clearFeatureCourseMappings(feature.id);
        }

        // Check if course already mapped for ABUNDANCE
        if (code === "ABUNDANCE") {
          const existingMappings = await storage.getFeatureCourseMappings(
            feature.id,
          );
          if (existingMappings.some((m) => m.courseId === courseId)) {
            return res.status(400).json({ error: "Course already mapped" });
          }
        }

        // Get max position for ABUNDANCE
        let position = 0;
        if (code === "ABUNDANCE") {
          const existingMappings = await storage.getFeatureCourseMappings(
            feature.id,
          );
          position =
            existingMappings.length > 0
              ? Math.max(...existingMappings.map((m) => m.position)) + 1
              : 0;
        }

        const mapping = await storage.createFeatureCourseMapping({
          featureId: feature.id,
          courseId,
          position,
        });

        res.status(201).json(mapping);
      } catch (error) {
        console.error("Error creating feature course mapping:", error);
        res.status(500).json({ error: "Failed to create mapping" });
      }
    },
  );

  // Delete a course mapping
  app.delete(
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
          parseInt(courseId),
        );

        if (!success) {
          return res.status(404).json({ error: "Mapping not found" });
        }

        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting feature course mapping:", error);
        res.status(500).json({ error: "Failed to delete mapping" });
      }
    },
  );

  // Reorder courses for ABUNDANCE feature
  app.patch(
    "/admin/v1/frontend-mapping/features/:code/courses/reorder",
    requireAdmin,
    async (req, res) => {
      try {
        const { code } = req.params;
        const { courseIds } = req.body;

        if (code !== "ABUNDANCE") {
          return res
            .status(400)
            .json({ error: "Reorder only allowed for ABUNDANCE feature" });
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
    },
  );

  // ===== PUBLIC FEATURE API =====

  // Get feature content for user app
  app.get("/api/public/v1/features/:code", async (req, res) => {
    try {
      const { code } = req.params;

      const feature = await storage.getFrontendFeatureByCode(code);
      if (!feature) {
        return res.status(404).json({ error: "Feature not found" });
      }

      const mappings = await storage.getFeatureCourseMappings(feature.id);

      // Handle based on display_mode
      if (feature.displayMode === "modules") {
        // DYD / USM - return course with its modules
        if (mappings.length === 0) {
          return res.json({ feature, course: null, modules: [] });
        }

        const courseId = mappings[0].courseId;
        const [course] = await db
          .select()
          .from(cmsCourses)
          .where(eq(cmsCourses.id, courseId));
        const modules = await storage.getModulesForCourse(courseId);

        return res.json({ feature, course, modules });
      }

      if (feature.displayMode === "lessons") {
        // BREATH - return course with its lessons (ignore folders)
        if (mappings.length === 0) {
          return res.json({ feature, course: null, lessons: [] });
        }

        const courseId = mappings[0].courseId;
        const [course] = await db
          .select()
          .from(cmsCourses)
          .where(eq(cmsCourses.id, courseId));
        const lessons = await storage.getLessonsForCourse(courseId);

        return res.json({ feature, course, lessons });
      }

      if (feature.displayMode === "courses") {
        // ABUNDANCE - return built-ins + mapped courses
        const builtIns = [
          {
            id: "builtin-money-calendar",
            title: "Money Calendar",
            isBuiltIn: true,
          },
          {
            id: "builtin-rewiring-belief",
            title: "Rewiring Belief",
            isBuiltIn: true,
          },
        ];

        const mappedCourses = await Promise.all(
          mappings.map(async (m) => {
            const [course] = await db
              .select()
              .from(cmsCourses)
              .where(eq(cmsCourses.id, m.courseId));
            return {
              id: course.id,
              title: course.title,
              description: course.description,
              thumbnailKey: course.thumbnailKey,
              position: m.position,
              isBuiltIn: false,
            };
          }),
        );

        return res.json({ feature, builtIns, courses: mappedCourses });
      }

      res.json({ feature, mappings });
    } catch (error) {
      console.error("Error fetching public feature:", error);
      res.status(500).json({ error: "Failed to fetch feature" });
    }
  });

  // ===== PUBLIC CONTENT APIs (for deep-linking) =====

  // Get module by ID (for Processes deep-link)
  app.get("/api/public/v1/modules/:id", async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const [module] = await db
        .select()
        .from(cmsModules)
        .where(eq(cmsModules.id, moduleId));

      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }

      // Get lessons for this module
      const lessons = await db
        .select()
        .from(cmsLessons)
        .where(eq(cmsLessons.moduleId, moduleId))
        .orderBy(asc(cmsLessons.position));

      res.json({ module, lessons });
    } catch (error) {
      console.error("Error fetching module:", error);
      res.status(500).json({ error: "Failed to fetch module" });
    }
  });

  // Get lesson by ID (for Processes and Spiritual Breaths deep-link)
  app.get("/api/public/v1/lessons/:id", async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const [lesson] = await db
        .select()
        .from(cmsLessons)
        .where(eq(cmsLessons.id, lessonId));

      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }

      // Get files for this lesson (with signed URLs)
      const files = await db
        .select()
        .from(cmsLessonFiles)
        .where(eq(cmsLessonFiles.lessonId, lessonId))
        .orderBy(asc(cmsLessonFiles.position));

      // Generate signed URLs for files
      const filesWithUrls = await Promise.all(
        files.map(async (file) => {
          let signedUrl: string | null = null;
          if (file.r2Key) {
            try {
              const result = await getSignedGetUrl(file.r2Key, 3600);
              // Handle both string and object {success, url} response formats
              if (typeof result === "string") {
                signedUrl = result;
              } else if (
                result &&
                typeof result === "object" &&
                "url" in result
              ) {
                signedUrl = (result as { url: string }).url;
              }
            } catch (e) {
              console.error("Error generating signed URL:", e);
            }
          }
          return { ...file, signedUrl };
        }),
      );

      res.json({ lesson, files: filesWithUrls });
    } catch (error) {
      console.error("Error fetching lesson:", error);
      res.status(500).json({ error: "Failed to fetch lesson" });
    }
  });

  // Get course by ID (for Abundance Mastery deep-link)
  app.get("/api/public/v1/courses/:id", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const [course] = await db
        .select()
        .from(cmsCourses)
        .where(eq(cmsCourses.id, courseId));

      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Get modules for this course
      const modules = await storage.getModulesForCourse(courseId);

      // Generate signed URL for thumbnail if exists
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

  // ===== PUBLIC SEARCH API =====

  interface SearchResult {
    type: "module" | "lesson" | "course";
    feature: string;
    id: number;
    title: string;
    module_id?: number;
    navigate_to: string;
  }

  app.get("/api/public/v1/search", async (req, res) => {
    try {
      const query = ((req.query.q as string) || "").trim().toLowerCase();

      // If empty query, return empty results
      if (!query) {
        return res.json({ results: [] });
      }

      // For now, assume all features accessible (until access control is built)
      const allowedFeatures = ["DYD", "USM", "BREATH", "ABUNDANCE"];

      const results: SearchResult[] = [];

      // Get all features with their mappings
      const features = await storage.getAllFrontendFeatures();

      for (const feature of features) {
        if (!allowedFeatures.includes(feature.code)) continue;

        const mappings = await storage.getFeatureCourseMappings(feature.id);
        if (mappings.length === 0) continue;

        if (feature.displayMode === "modules") {
          // DYD / USM - index modules and lessons
          for (const mapping of mappings) {
            const courseId = mapping.courseId;
            const modules = await storage.getModulesForCourse(courseId);

            for (const module of modules) {
              // Add module to index
              if (module.title.toLowerCase().includes(query)) {
                results.push({
                  type: "module",
                  feature: feature.code,
                  id: module.id,
                  title: module.title,
                  navigate_to: `/processes/module/${module.id}`,
                });
              }

              // Get lessons for this module
              const lessons = await db
                .select()
                .from(cmsLessons)
                .where(eq(cmsLessons.moduleId, module.id))
                .orderBy(asc(cmsLessons.position));

              for (const lesson of lessons) {
                if (lesson.title.toLowerCase().includes(query)) {
                  results.push({
                    type: "lesson",
                    feature: feature.code,
                    id: lesson.id,
                    title: lesson.title,
                    module_id: lesson.moduleId,
                    navigate_to: `/processes/lesson/${lesson.id}`,
                  });
                }
              }
            }
          }
        } else if (feature.displayMode === "lessons") {
          // BREATH - index lessons only
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
                  navigate_to: `/spiritual-breaths/lesson/${lesson.id}`,
                });
              }
            }
          }
        } else if (feature.displayMode === "courses") {
          // ABUNDANCE - index courses only (NOT lessons, NOT built-ins)
          for (const mapping of mappings) {
            const [course] = await db
              .select()
              .from(cmsCourses)
              .where(eq(cmsCourses.id, mapping.courseId));
            if (course && course.title.toLowerCase().includes(query)) {
              results.push({
                type: "course",
                feature: feature.code,
                id: course.id,
                title: course.title,
                navigate_to: `/abundance-mastery/course/${course.id}`,
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

  // ===== MONEY CALENDAR ROUTES (User API) =====

  // POST /api/v1/money-calendar/entry - Create or update a money entry
  app.post(
    "/api/v1/money-calendar/entry",
    authenticateJWT,
    async (req, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ error: "Not authenticated" });
        }

        const { date, amount } = req.body;

        if (!date || typeof date !== "string") {
          return res
            .status(400)
            .json({ error: "Date is required in YYYY-MM-DD format" });
        }

        if (
          amount === undefined ||
          amount === null ||
          typeof amount !== "number"
        ) {
          return res
            .status(400)
            .json({ error: "Amount is required as a number" });
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
          return res
            .status(400)
            .json({ error: "Date must be in YYYY-MM-DD format" });
        }

        const entry = await storage.upsertMoneyEntry(
          req.user.sub,
          date,
          amount.toString(),
        );

        res.json({
          id: entry.id,
          date: entry.entryDate,
          amount: parseFloat(entry.amount),
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        });
      } catch (error) {
        console.error("Error saving money entry:", error);
        res.status(500).json({ error: "Failed to save money entry" });
      }
    },
  );

  // GET /api/v1/money-calendar?month=YYYY-MM - Get monthly data with summary
  app.get("/api/v1/money-calendar", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { month } = req.query;

      if (!month || typeof month !== "string") {
        return res
          .status(400)
          .json({ error: "Month is required in YYYY-MM format" });
      }

      // Validate month format
      const monthRegex = /^\d{4}-\d{2}$/;
      if (!monthRegex.test(month)) {
        return res
          .status(400)
          .json({ error: "Month must be in YYYY-MM format" });
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
        monthNum,
      );

      res.json(data);
    } catch (error) {
      console.error("Error fetching money calendar:", error);
      res.status(500).json({ error: "Failed to fetch money calendar" });
    }
  });

  // ===== PLAYLIST ROUTES (User API) =====

  // GET /api/public/v1/playlist/source - Get playlist source (mapped course with audio-only lessons)
  app.get(
    "/api/public/v1/playlist/source",
    authenticateJWT,
    async (req, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ error: "Not authenticated" });
        }

        const feature = await storage.getFrontendFeatureByCode("PLAYLIST");
        if (!feature) {
          return res
            .status(404)
            .json({ error: "PLAYLIST feature not configured" });
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

        // Generate signed URLs for audio files
        const modulesWithSignedUrls = await Promise.all(
          data.modules.map(async (module: any) => ({
            ...module,
            lessons: await Promise.all(
              module.lessons.map(async (lesson: any) => ({
                ...lesson,
                audioFiles: await Promise.all(
                  lesson.audioFiles.map(async (file: any) => {
                    let signedUrl = null;
                    if (file.r2Key) {
                      try {
                        signedUrl = await getSignedGetUrl(file.r2Key, 3600);
                      } catch (e) {
                        console.error("Error generating signed URL:", e);
                      }
                    }
                    return { ...file, signedUrl };
                  }),
                ),
              })),
            ),
          })),
        );

        res.json({ course: data.course, modules: modulesWithSignedUrls });
      } catch (error) {
        console.error("Error fetching playlist source:", error);
        res.status(500).json({ error: "Failed to fetch playlist source" });
      }
    },
  );

  // GET /api/public/v1/playlists - List user's playlists
  app.get("/api/public/v1/playlists", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const playlists = await storage.getUserPlaylists(req.user.sub);
      res.json(playlists);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      res.status(500).json({ error: "Failed to fetch playlists" });
    }
  });

  // POST /api/public/v1/playlists - Create a playlist
  app.post("/api/public/v1/playlists", authenticateJWT, async (req, res) => {
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
        title: title.trim(),
      });

      res.status(201).json(playlist);
    } catch (error) {
      console.error("Error creating playlist:", error);
      res.status(500).json({ error: "Failed to create playlist" });
    }
  });

  // GET /api/public/v1/playlists/:id - Get playlist with items
  app.get("/api/public/v1/playlists/:id", authenticateJWT, async (req, res) => {
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

      // Get audio files for each lesson with signed URLs
      const itemsWithAudio = await Promise.all(
        items.map(async (item) => {
          const audioFiles = await db
            .select()
            .from(cmsLessonFiles)
            .where(
              and(
                eq(cmsLessonFiles.lessonId, item.lessonId),
                eq(cmsLessonFiles.fileType, "audio"),
              ),
            )
            .orderBy(asc(cmsLessonFiles.position));

          const audioFilesWithUrls = await Promise.all(
            audioFiles.map(async (file) => {
              let signedUrl = null;
              if (file.r2Key) {
                try {
                  signedUrl = await getSignedGetUrl(file.r2Key, 3600);
                } catch (e) {
                  console.error("Error generating signed URL:", e);
                }
              }
              return { ...file, signedUrl };
            }),
          );

          return { ...item, audioFiles: audioFilesWithUrls };
        }),
      );

      res.json({ playlist, items: itemsWithAudio });
    } catch (error) {
      console.error("Error fetching playlist:", error);
      res.status(500).json({ error: "Failed to fetch playlist" });
    }
  });

  // PATCH /api/public/v1/playlists/:id - Rename playlist
  app.patch(
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
    },
  );

  // DELETE /api/public/v1/playlists/:id - Delete playlist
  app.delete(
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
    },
  );

  // POST /api/public/v1/playlists/:id/items - Set playlist items (replace all)
  app.post(
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

        // Validate all lessons belong to mapped PLAYLIST course and have audio
        for (const lessonId of lessonIds) {
          const inMappedCourse = await storage.isLessonInMappedCourse(
            lessonId,
            "PLAYLIST",
          );
          if (!inMappedCourse) {
            return res.status(400).json({
              error: `Lesson ${lessonId} is not in the mapped playlist course`,
            });
          }

          const hasAudio = await storage.doesLessonHaveAudio(lessonId);
          if (!hasAudio) {
            return res
              .status(400)
              .json({ error: `Lesson ${lessonId} has no audio files` });
          }
        }

        const items = await storage.setPlaylistItems(playlistId, lessonIds);
        res.json(items);
      } catch (error) {
        console.error("Error setting playlist items:", error);
        res.status(500).json({ error: "Failed to set playlist items" });
      }
    },
  );

  // PATCH /api/public/v1/playlists/:id/items/reorder - Reorder playlist items
  app.patch(
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
          return res
            .status(400)
            .json({ error: "orderedItemIds must be an array" });
        }

        await storage.reorderPlaylistItems(playlistId, orderedItemIds);
        res.json({ success: true });
      } catch (error) {
        console.error("Error reordering playlist items:", error);
        res.status(500).json({ error: "Failed to reorder playlist items" });
      }
    },
  );

  // DELETE /api/public/v1/playlists/:id/items/:itemId - Remove one item
  app.delete(
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
    },
  );

  const httpServer = createServer(app);

  return httpServer;
}
