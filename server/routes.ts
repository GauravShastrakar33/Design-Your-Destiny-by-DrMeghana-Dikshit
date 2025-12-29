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
  dailyQuotes,
  insertDailyQuoteSchema,
  events as eventsTable,
  insertEventSchema,
  projectOfHearts,
  pohDailyRatings,
  pohActions,
  pohMilestones,
  pohCategoryEnum,
  pohStatusEnum,
  users,
  deviceTokens,
} from "@shared/schema";
import { sendPushNotification, initializeFirebaseAdmin } from "./lib/firebaseAdmin";
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
  uploadBufferToR2,
} from "./r2Upload";
// pdf2json for extracting text with preserved line breaks
import PDFParser from "pdf2json";

// Extract text from PDF buffer using pdf2json (preserves line-by-line structure)
async function extractTextWithPdf2json(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new (PDFParser as any)(null, 1);

    pdfParser.on("pdfParser_dataError", (errData: any) => {
      reject(errData.parserError);
    });

    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      const pages = pdfData.Pages || [];
      const lines: string[] = [];

      pages.forEach((page: any) => {
        // Group texts by Y position to reconstruct lines
        const textsByY: Map<number, string[]> = new Map();

        (page.Texts || []).forEach((textItem: any) => {
          const y = Math.round(textItem.y * 10); // Round Y to group nearby items
          const text =
            textItem.R?.map((r: any) => decodeURIComponent(r.T)).join("") || "";

          if (text.trim()) {
            if (!textsByY.has(y)) {
              textsByY.set(y, []);
            }
            textsByY.get(y)!.push(text);
          }
        });

        // Sort by Y position and join texts on same line
        const sortedYs = Array.from(textsByY.keys()).sort((a, b) => a - b);
        sortedYs.forEach((y) => {
          const lineText = textsByY.get(y)!.join(" ").trim();
          if (lineText) {
            lines.push(lineText);
          }
        });

        lines.push(""); // Add paragraph break between pages
      });

      resolve(lines.join("\n"));
    });

    pdfParser.parseBuffer(buffer);
  });
}

import { db } from "./db";
import { eq, asc, and, ilike, or, sql, count, countDistinct, gte, desc, lt, avg, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticateJWT, type AuthPayload } from "./middleware/auth";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const JWT_SECRET = process.env.JWT_SECRET as string;
// Convert PDF text to formatted HTML (handles line-by-line output from pdf2json)
export function convertTextToFormattedHtml(text: string): string {
  // Normalize newlines
  const norm = text
    .replace(/\r\n/g, "\n")
    .replace(/\u00A0/g, " ")
    .trim();
  const lines = norm.split("\n").map((l) => l.trim());

  const html: string[] = [];
  let currentParagraph: string[] = [];
  let currentListType: "ul" | "ol" | null = null;
  let listItems: string[] = [];

  // Header keywords
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
    "step",
    "part",
    "exercise",
    "practice",
    "dyd",
    "usm",
  ];

  function isHeader(line: string): boolean {
    const t = line.trim();
    if (!t) return false;

    if (/^--\s*\d+\s*(of|\/)\s*\d+\s*--$/i.test(t)) return false;

    const words = t.split(/\s+/);
    if (t.length > 35 || words.length > 3) return false;
    if (/,/.test(t)) return false;
    if (/[.!?;]$/.test(t)) return false;

    if (
      /\b(say|the|your|my|and|or|is|are|was|were|on|in|at|to|for|with|from)\b/i.test(
        t,
      )
    ) {
      return false;
    }

    const lower = t
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .trim();

    if (headerKeywords.includes(lower)) return true;

    if (
      headerKeywords.find(
        (k) => lower.startsWith(k) && /^\w+\s*\([^)]+\)$/.test(t),
      )
    )
      return true;

    if (words.length <= 2 && t.length < 25 && /^[A-Z]/.test(t)) return true;

    return false;
  }

  function flushList() {
    if (listItems.length > 0 && currentListType) {
      const tag = currentListType;
      html.push(
        `<${tag} class="${tag === "ul" ? "list-disc" : "list-decimal"} list-inside space-y-1 my-4">`,
      );
      listItems.forEach((item) => html.push(`<li class="ml-4">${item}</li>`));
      html.push(`</${tag}>`);
      listItems = [];
      currentListType = null;
    }
  }

  // FIXED: merge paragraph lines, do not create <br>
  function flushParagraph() {
    flushList();
    if (currentParagraph.length > 0) {
      const content = currentParagraph.join(" ").trim(); // MERGE LINES HERE
      if (content) {
        html.push(`<p class="my-4 leading-relaxed">${content}</p>`);
      }
      currentParagraph = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip page markers
    if (/^--\s*\d+\s*(of|\/)\s*\d+\s*--$/i.test(line)) continue;

    // Empty line = paragraph break
    if (!line) {
      flushParagraph();
      continue;
    }

    // Headers
    if (isHeader(line)) {
      flushParagraph();
      const headerText = line.replace(/[,:]$/, "").trim();
      html.push(
        `<h3 class="mt-6 mb-3 text-lg font-semibold text-primary">${headerText}</h3>`,
      );
      continue;
    }

    // Bullet lists
    if (/^[-•*]\s+/.test(line)) {
      flushParagraph();
      if (currentListType !== "ul") {
        flushList();
        currentListType = "ul";
      }
      listItems.push(line.replace(/^[-•*]\s+/, ""));
      continue;
    }

    // Numbered lists
    if (/^\d+\s*[.)]\s+/.test(line)) {
      flushParagraph();
      if (currentListType !== "ol") {
        flushList();
        currentListType = "ol";
      }
      listItems.push(line.replace(/^\d+\s*[.)]\s+/, ""));
      continue;
    }

    // Regular paragraph content
    flushList();
    currentParagraph.push(line);
  }

  flushParagraph();
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

  // ===== USER STREAK ROUTES =====

  // Mark today as active for streak tracking
  app.post("/api/v1/streak/mark-today", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { date } = req.body;
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
      }

      await storage.markUserActivityDate(req.user.sub, date);
      res.json({ success: true, date });
    } catch (error) {
      console.error("Error marking streak:", error);
      res.status(500).json({ error: "Failed to mark activity" });
    }
  });

  // Get last 7 days of streak activity
  app.get("/api/v1/streak/last-7-days", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const baseDate = req.query.date as string || new Date().toISOString().split('T')[0];
      
      const dates: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
      }

      const activeDates = await storage.getUserStreakDates(req.user.sub, dates);
      const activeDateSet = new Set(activeDates);

      const result = dates.map(date => ({
        date,
        active: activeDateSet.has(date)
      }));

      res.json(result);
    } catch (error) {
      console.error("Error fetching streak:", error);
      res.status(500).json({ error: "Failed to fetch streak data" });
    }
  });

  // ===== CONSISTENCY CALENDAR ROUTES =====

  // Get monthly consistency data (read-only)
  app.get("/api/v1/consistency/month", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const yearParam = req.query.year as string;
      const monthParam = req.query.month as string;

      if (!yearParam || !monthParam) {
        return res.status(400).json({ error: "year and month query parameters are required" });
      }

      const year = parseInt(yearParam, 10);
      const month = parseInt(monthParam, 10);

      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ error: "Invalid year or month" });
      }

      const days = await storage.getConsistencyMonth(req.user.sub, year, month);
      
      res.json({ year, month, days });
    } catch (error) {
      console.error("Error fetching consistency month:", error);
      res.status(500).json({ error: "Failed to fetch consistency data" });
    }
  });

  // Get consistency range (earliest activity to current month)
  app.get("/api/v1/consistency/range", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const todayDate = req.query.today as string;
      if (!todayDate || !/^\d{4}-\d{2}-\d{2}$/.test(todayDate)) {
        return res.status(400).json({ error: "today query parameter required (YYYY-MM-DD)" });
      }

      const currentMonth = todayDate.slice(0, 7);
      const rangeData = await storage.getConsistencyRange(req.user.sub);
      const currentStreak = await storage.getCurrentStreak(req.user.sub, todayDate);

      res.json({
        startMonth: rangeData.startMonth,
        currentMonth,
        currentStreak
      });
    } catch (error) {
      console.error("Error fetching consistency range:", error);
      res.status(500).json({ error: "Failed to fetch consistency range" });
    }
  });

  // ===== ACTIVITY LOGGING ROUTES (AI INSIGHTS) =====

  // Log user activity (practice/breath/checklist)
  app.post("/api/v1/activity/log", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { lessonId, lessonName, featureType, activityDate } = req.body;

      // Validate required fields
      if (!lessonId || typeof lessonId !== 'number') {
        return res.status(400).json({ error: "lessonId is required and must be a number" });
      }
      if (!lessonName || typeof lessonName !== 'string') {
        return res.status(400).json({ error: "lessonName is required" });
      }
      if (!featureType || !['PROCESS', 'PLAYLIST'].includes(featureType)) {
        return res.status(400).json({ error: "featureType must be PROCESS or PLAYLIST" });
      }

      // Use provided date or server date
      const dateToUse = activityDate || new Date().toISOString().split('T')[0];

      const result = await storage.logActivity(
        req.user.sub,
        lessonId,
        lessonName,
        featureType,
        dateToUse
      );

      res.json({ success: true, logged: result.logged });
    } catch (error) {
      console.error("Error logging activity:", error);
      res.status(500).json({ error: "Failed to log activity" });
    }
  });

  // Get monthly activity stats for AI Insights
  app.get("/api/v1/activity/monthly-stats", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);

      console.log(`[monthly-stats] Fetching stats for userId=${req.user.sub}, month=${month}`);
      
      const stats = await storage.getMonthlyStats(req.user.sub, month);
      
      console.log(`[monthly-stats] Results: PROCESS=${stats.PROCESS.length}, PLAYLIST=${stats.PLAYLIST.length}`);
      
      res.set('Cache-Control', 'no-store');
      res.json(stats);
    } catch (error) {
      console.error("Error fetching monthly stats:", error);
      res.status(500).json({ error: "Failed to fetch monthly stats" });
    }
  });

  // ===== REWIRING BELIEFS ROUTES =====

  // GET /api/v1/rewiring-beliefs - Get all beliefs for authenticated user
  app.get("/api/v1/rewiring-beliefs", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const beliefs = await storage.getRewiringBeliefsByUserId(req.user.sub);
      res.json(beliefs);
    } catch (error) {
      console.error("Error fetching rewiring beliefs:", error);
      res.status(500).json({ error: "Failed to fetch beliefs" });
    }
  });

  // POST /api/v1/rewiring-beliefs - Create a new belief pair
  app.post("/api/v1/rewiring-beliefs", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { limitingBelief, upliftingBelief } = req.body;

      if (!limitingBelief || typeof limitingBelief !== 'string' || !limitingBelief.trim()) {
        return res.status(400).json({ error: "Limiting belief is required" });
      }
      if (!upliftingBelief || typeof upliftingBelief !== 'string' || !upliftingBelief.trim()) {
        return res.status(400).json({ error: "Uplifting belief is required" });
      }

      const belief = await storage.createRewiringBelief({
        userId: req.user.sub,
        limitingBelief: limitingBelief.trim(),
        upliftingBelief: upliftingBelief.trim(),
      });

      res.status(201).json(belief);
    } catch (error) {
      console.error("Error creating rewiring belief:", error);
      res.status(500).json({ error: "Failed to create belief" });
    }
  });

  // PUT /api/v1/rewiring-beliefs/:id - Update an existing belief (user can only update their own)
  app.put("/api/v1/rewiring-beliefs/:id", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid belief ID" });
      }

      const { limitingBelief, upliftingBelief } = req.body;
      const updates: { limitingBelief?: string; upliftingBelief?: string } = {};

      if (limitingBelief !== undefined) {
        if (typeof limitingBelief !== 'string' || !limitingBelief.trim()) {
          return res.status(400).json({ error: "Limiting belief cannot be empty" });
        }
        updates.limitingBelief = limitingBelief.trim();
      }

      if (upliftingBelief !== undefined) {
        if (typeof upliftingBelief !== 'string' || !upliftingBelief.trim()) {
          return res.status(400).json({ error: "Uplifting belief cannot be empty" });
        }
        updates.upliftingBelief = upliftingBelief.trim();
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No updates provided" });
      }

      const updated = await storage.updateRewiringBelief(id, req.user.sub, updates);

      if (!updated) {
        return res.status(404).json({ error: "Belief not found or not authorized" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating rewiring belief:", error);
      res.status(500).json({ error: "Failed to update belief" });
    }
  });

  // DELETE /api/v1/rewiring-beliefs/:id - Delete a belief (user can only delete their own)
  app.delete("/api/v1/rewiring-beliefs/:id", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid belief ID" });
      }

      const success = await storage.deleteRewiringBelief(id, req.user.sub);

      if (!success) {
        return res.status(404).json({ error: "Belief not found or not authorized" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting rewiring belief:", error);
      res.status(500).json({ error: "Failed to delete belief" });
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

  // Admin routes: Download sample CSV for bulk upload
  app.get("/api/admin/students/sample-csv", requireAdmin, (req, res) => {
    const sampleCSV = `full_name,email,phone
John Doe,john.doe@example.com,+1234567890
Jane Smith,jane.smith@example.com,
Bob Wilson,bob.wilson@example.com,+9876543210`;
    
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=student_upload_sample.csv");
    res.send(sampleCSV);
  });

  // Configure multer for CSV upload (memory storage)
  const uploadCSV = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
        cb(null, true);
      } else {
        cb(new Error("Only CSV files are allowed"));
      }
    },
  });

  // Admin routes: Bulk upload students via CSV
  app.post("/api/admin/students/bulk-upload", requireAdmin, uploadCSV.single("file"), async (req, res) => {
    try {
      const { parse } = await import("csv-parse/sync");
      
      // Validate file
      if (!req.file) {
        return res.status(400).json({ error: "CSV file is required" });
      }

      // Validate programId
      const programId = req.body.programId;
      if (!programId) {
        return res.status(400).json({ error: "Program is required" });
      }

      const program = await storage.getProgramById(parseInt(programId));
      if (!program) {
        return res.status(400).json({ error: "Invalid program selected" });
      }

      // Parse CSV
      const csvContent = req.file.buffer.toString("utf-8");
      let records: any[];
      
      try {
        records = parse(csvContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          relax_column_count: true,
        });
      } catch (parseError) {
        return res.status(400).json({ error: "Invalid CSV format. Please check file structure." });
      }

      // Validate row limit
      if (records.length > 1000) {
        return res.status(400).json({ error: "Maximum 1000 rows allowed per upload" });
      }

      const errors: { row: number; reason: string }[] = [];
      let created = 0;
      const defaultPassword = "User@123";
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      // Email validation regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      // Process each row
      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const rowNumber = i + 2; // CSV row number (1-indexed + header row)

        // Get full_name (support both full_name and name columns)
        const fullName = (row.full_name || row.name || "").trim();
        if (!fullName) {
          errors.push({ row: rowNumber, reason: "Missing full_name" });
          continue;
        }

        // Get and validate email
        const email = (row.email || "").trim().toLowerCase();
        if (!email) {
          errors.push({ row: rowNumber, reason: "Missing email" });
          continue;
        }
        if (!emailRegex.test(email)) {
          errors.push({ row: rowNumber, reason: "Invalid email format" });
          continue;
        }

        // Check if email already exists
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          errors.push({ row: rowNumber, reason: "Email already exists" });
          continue;
        }

        // Get phone (optional)
        const phone = (row.phone || "").trim() || null;

        // Create student using existing logic (ignoring any program/password from CSV)
        try {
          await storage.createStudent(
            {
              name: fullName,
              email,
              phone,
              passwordHash,
              role: "USER",
              status: "active",
            },
            program.code, // Always use program from modal, not CSV
          );
          created++;
        } catch (createError: any) {
          errors.push({ row: rowNumber, reason: createError.message || "Failed to create student" });
        }
      }

      res.json({
        totalRows: records.length,
        created,
        skipped: errors.length,
        errors,
      });
    } catch (error) {
      console.error("Error in bulk upload:", error);
      res.status(500).json({ error: "Failed to process bulk upload" });
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

        // Convert PDF to HTML with formatting preserved using pdf2json
        if (parsed.data.fileType === "script" && parsed.data.r2Key) {
          try {
            console.log("Converting PDF to HTML:", parsed.data.r2Key);
            const downloadResult = await downloadR2Object(parsed.data.r2Key);

            if (downloadResult.success && downloadResult.data) {
              // Use pdf2json to extract text (preserves line breaks)
              extractedText = await extractTextWithPdf2json(
                downloadResult.data,
              );

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

  // Reorder courses for ABUNDANCE and MASTERCLASS features
  app.patch(
    "/admin/v1/frontend-mapping/features/:code/courses/reorder",
    requireAdmin,
    async (req, res) => {
      try {
        const { code } = req.params;
        const { courseIds } = req.body;

        const allowedCodes = ["ABUNDANCE", "MASTERCLASS"];
        if (!allowedCodes.includes(code)) {
          return res
            .status(400)
            .json({ error: "Reorder only allowed for ABUNDANCE and MASTERCLASS features" });
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
        // ABUNDANCE has built-ins, MASTERCLASS doesn't
        const builtIns = code === "ABUNDANCE" ? [
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
        ] : [];

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
              let signedUrl: string | null = null;
              if (file.r2Key) {
                try {
                  const result = await getSignedGetUrl(file.r2Key, 3600);
                  if (result.success && result.url) {
                    signedUrl = result.url;
                  }
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

  // ===== SESSION BANNER ADMIN ROUTES =====

  // GET /api/admin/v1/session-banners - List all banners
  app.get("/api/admin/v1/session-banners", requireAdmin, async (req, res) => {
    try {
      const banners = await storage.getAllSessionBanners();
      res.json(banners);
    } catch (error) {
      console.error("Error fetching session banners:", error);
      res.status(500).json({ error: "Failed to fetch session banners" });
    }
  });

  // GET /api/admin/v1/session-banners/upload-url - Get signed URL for R2 upload
  // NOTE: This must be BEFORE the /:id route to prevent "upload-url" being parsed as an ID
  app.get("/api/admin/v1/session-banners/upload-url", requireAdmin, async (req, res) => {
    try {
      const { filename, contentType } = req.query as { filename: string; contentType: string };
      if (!filename || !contentType) {
        return res.status(400).json({ error: "filename and contentType are required" });
      }

      const key = `session-banners/${Date.now()}-${filename}`;
      const result = await getSignedPutUrl(key, contentType);
      
      if (!result.success) {
        console.error("R2 upload URL error:", result.error);
        return res.status(500).json({ error: result.error || "Failed to generate upload URL" });
      }

      res.json({ key: result.key, signedUrl: result.uploadUrl });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // GET /api/admin/v1/session-banners/:id - Get single banner
  app.get("/api/admin/v1/session-banners/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const banner = await storage.getSessionBannerById(id);
      if (!banner) {
        return res.status(404).json({ error: "Banner not found" });
      }
      res.json(banner);
    } catch (error) {
      console.error("Error fetching session banner:", error);
      res.status(500).json({ error: "Failed to fetch session banner" });
    }
  });

  // POST /api/admin/v1/session-banners - Create banner
  app.post("/api/admin/v1/session-banners", requireAdmin, async (req, res) => {
    try {
      const { type, thumbnailKey, videoKey, posterKey, ctaText, ctaLink, startAt, endAt, liveEnabled } = req.body;
      
      if (!type || !startAt || !endAt) {
        return res.status(400).json({ error: "type, startAt, and endAt are required" });
      }

      const banner = await storage.createSessionBanner({
        type,
        thumbnailKey: thumbnailKey || null,
        videoKey: videoKey || null,
        posterKey: posterKey || null,
        ctaText: ctaText || null,
        ctaLink: ctaLink || null,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        liveEnabled: liveEnabled || false,
      });
      res.status(201).json(banner);
    } catch (error) {
      console.error("Error creating session banner:", error);
      res.status(500).json({ error: "Failed to create session banner" });
    }
  });

  // PUT /api/admin/v1/session-banners/:id - Update banner
  app.put("/api/admin/v1/session-banners/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { type, thumbnailKey, videoKey, posterKey, ctaText, ctaLink, startAt, endAt, liveEnabled } = req.body;

      const updateData: any = {};
      if (type !== undefined) updateData.type = type;
      if (thumbnailKey !== undefined) updateData.thumbnailKey = thumbnailKey;
      if (videoKey !== undefined) updateData.videoKey = videoKey;
      if (posterKey !== undefined) updateData.posterKey = posterKey;
      if (ctaText !== undefined) updateData.ctaText = ctaText;
      if (ctaLink !== undefined) updateData.ctaLink = ctaLink;
      if (startAt !== undefined) updateData.startAt = new Date(startAt);
      if (endAt !== undefined) updateData.endAt = new Date(endAt);
      if (liveEnabled !== undefined) updateData.liveEnabled = liveEnabled;

      const banner = await storage.updateSessionBanner(id, updateData);
      if (!banner) {
        return res.status(404).json({ error: "Banner not found" });
      }
      res.json(banner);
    } catch (error) {
      console.error("Error updating session banner:", error);
      res.status(500).json({ error: "Failed to update session banner" });
    }
  });

  // DELETE /api/admin/v1/session-banners/:id - Delete banner
  app.delete("/api/admin/v1/session-banners/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSessionBanner(id);
      if (!success) {
        return res.status(404).json({ error: "Banner not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting session banner:", error);
      res.status(500).json({ error: "Failed to delete session banner" });
    }
  });

  // POST /api/admin/v1/session-banners/:id/duplicate - Duplicate banner
  app.post("/api/admin/v1/session-banners/:id/duplicate", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const original = await storage.getSessionBannerById(id);
      if (!original) {
        return res.status(404).json({ error: "Banner not found" });
      }

      const duplicate = await storage.createSessionBanner({
        type: original.type,
        thumbnailKey: original.thumbnailKey,
        videoKey: original.videoKey,
        posterKey: original.posterKey,
        ctaText: original.ctaText,
        ctaLink: original.ctaLink,
        startAt: original.startAt,
        endAt: original.endAt,
        liveEnabled: original.liveEnabled,
      });
      res.status(201).json(duplicate);
    } catch (error) {
      console.error("Error duplicating session banner:", error);
      res.status(500).json({ error: "Failed to duplicate session banner" });
    }
  });

  // ===== SESSION BANNER PUBLIC ROUTE =====

  // GET /api/public/v1/session-banner - Get current active banner with fallback
  app.get("/api/public/v1/session-banner", async (req, res) => {
    try {
      // Try to get active banner first
      let banner = await storage.getActiveBanner();
      let status = "active";

      // If no active, try next scheduled
      if (!banner) {
        banner = await storage.getNextScheduledBanner();
        status = "scheduled";
      }

      // If no scheduled, try last expired
      if (!banner) {
        banner = await storage.getLastExpiredBanner();
        status = "expired";
      }

      if (!banner) {
        return res.json({ banner: null, status: "none" });
      }

      // Generate signed URLs for media
      let thumbnailUrl = null;
      let videoUrl = null;
      let posterUrl = null;

      if (banner.thumbnailKey) {
        const result = await getSignedGetUrl(banner.thumbnailKey);
        thumbnailUrl = result.success ? result.url : null;
      }
      if (banner.videoKey) {
        const result = await getSignedGetUrl(banner.videoKey);
        videoUrl = result.success ? result.url : null;
      }
      if (banner.posterKey) {
        const result = await getSignedGetUrl(banner.posterKey);
        posterUrl = result.success ? result.url : null;
      }

      // Check if live badge should show (session banners only)
      const now = new Date();
      const isLive = banner.type === "session" && 
                     banner.liveEnabled && 
                     status === "active" &&
                     now >= banner.startAt && 
                     now < banner.endAt;

      res.json({
        banner: {
          ...banner,
          thumbnailUrl,
          videoUrl,
          posterUrl,
        },
        status,
        isLive,
      });
    } catch (error) {
      console.error("Error fetching public session banner:", error);
      res.status(500).json({ error: "Failed to fetch session banner" });
    }
  });

  // ===== DAILY QUOTES ROUTES =====

  // Public API: Get today's quote (with round-robin rotation)
  app.get("/api/quotes/today", async (req, res) => {
    try {
      // Get today's date in YYYY-MM-DD format (server date)
      const today = new Date().toISOString().split("T")[0];

      // Check if any active quote has last_shown_date = today
      const [todayQuote] = await db
        .select()
        .from(dailyQuotes)
        .where(and(eq(dailyQuotes.isActive, true), eq(dailyQuotes.lastShownDate, today)));

      if (todayQuote) {
        return res.json({
          quote: todayQuote.quoteText,
          author: todayQuote.author || null,
        });
      }

      // No quote shown today - select next quote using round-robin logic
      // Priority: NULL lastShownDate first (ordered by displayOrder), then oldest lastShownDate (ordered by displayOrder)
      const activeQuotes = await db
        .select()
        .from(dailyQuotes)
        .where(eq(dailyQuotes.isActive, true))
        .orderBy(
          sql`CASE WHEN ${dailyQuotes.lastShownDate} IS NULL THEN 0 ELSE 1 END`,
          sql`${dailyQuotes.lastShownDate} NULLS FIRST`,
          asc(dailyQuotes.displayOrder)
        );

      if (activeQuotes.length === 0) {
        return res.json({ quote: null, author: null });
      }

      // Select the first quote (next in rotation)
      const selectedQuote = activeQuotes[0];

      // Update the selected quote with today's date
      await db
        .update(dailyQuotes)
        .set({ lastShownDate: today, updatedAt: new Date() })
        .where(eq(dailyQuotes.id, selectedQuote.id));

      res.json({
        quote: selectedQuote.quoteText,
        author: selectedQuote.author || null,
      });
    } catch (error) {
      console.error("Error fetching today's quote:", error);
      res.status(500).json({ error: "Failed to fetch quote" });
    }
  });

  // Admin API: Get all quotes (active + inactive)
  app.get("/api/admin/quotes", requireAdmin, async (req, res) => {
    try {
      const quotes = await db
        .select()
        .from(dailyQuotes)
        .orderBy(asc(dailyQuotes.displayOrder));
      res.json(quotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ error: "Failed to fetch quotes" });
    }
  });

  // Admin API: Create a new quote
  app.post("/api/admin/quotes", requireAdmin, async (req, res) => {
    try {
      const parsed = insertDailyQuoteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Validation failed", details: parsed.error.errors });
      }

      const [newQuote] = await db
        .insert(dailyQuotes)
        .values(parsed.data)
        .returning();

      res.status(201).json(newQuote);
    } catch (error) {
      console.error("Error creating quote:", error);
      res.status(500).json({ error: "Failed to create quote" });
    }
  });

  // Admin API: Update a quote
  app.put("/api/admin/quotes/:id", requireAdmin, async (req, res) => {
    try {
      const quoteId = parseInt(req.params.id);
      const { quoteText, author, displayOrder, isActive } = req.body;

      const [updated] = await db
        .update(dailyQuotes)
        .set({
          ...(quoteText !== undefined && { quoteText }),
          ...(author !== undefined && { author }),
          ...(displayOrder !== undefined && { displayOrder }),
          ...(isActive !== undefined && { isActive }),
          updatedAt: new Date(),
        })
        .where(eq(dailyQuotes.id, quoteId))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Quote not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating quote:", error);
      res.status(500).json({ error: "Failed to update quote" });
    }
  });

  // Admin API: Soft delete a quote (set isActive = false)
  app.delete("/api/admin/quotes/:id", requireAdmin, async (req, res) => {
    try {
      const quoteId = parseInt(req.params.id);

      const [updated] = await db
        .update(dailyQuotes)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(dailyQuotes.id, quoteId))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Quote not found" });
      }

      res.json({ success: true, message: "Quote deactivated" });
    } catch (error) {
      console.error("Error deleting quote:", error);
      res.status(500).json({ error: "Failed to delete quote" });
    }
  });

  // ===== USER WELLNESS PROFILE APIs =====

  // Admin API: Get wellness profile for a user
  app.get("/admin/v1/users/:userId/wellness-profile", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const profile = await storage.getWellnessProfileByUserId(userId);
      res.json(profile || { userId, karmicAffirmation: null, prescription: null });
    } catch (error) {
      console.error("Error fetching wellness profile:", error);
      res.status(500).json({ error: "Failed to fetch wellness profile" });
    }
  });

  // Admin API: Create or update wellness profile for a user
  app.post("/admin/v1/users/:userId/wellness-profile", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Verify user exists
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { karmicAffirmation, prescription } = req.body;

      const profile = await storage.upsertWellnessProfile(userId, {
        karmicAffirmation: karmicAffirmation ?? null,
        prescription: prescription ?? null,
      });

      res.json(profile);
    } catch (error) {
      console.error("Error saving wellness profile:", error);
      res.status(500).json({ error: "Failed to save wellness profile" });
    }
  });

  // User API: Get own wellness profile (read-only)
  app.get("/api/v1/me/wellness-profile", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const profile = await storage.getWellnessProfileByUserId(req.user.sub);
      res.json(profile || { karmicAffirmation: null, prescription: null });
    } catch (error) {
      console.error("Error fetching user wellness profile:", error);
      res.status(500).json({ error: "Failed to fetch wellness profile" });
    }
  });

  // ===== EVENT CALENDAR APIs =====

  // Admin API: Get all events with filters
  app.get("/api/admin/v1/events", requireAdmin, async (req, res) => {
    try {
      const { status, month, year } = req.query;
      const filters: { status?: string; month?: number; year?: number } = {};
      
      if (status) filters.status = String(status);
      if (month) filters.month = parseInt(String(month));
      if (year) filters.year = parseInt(String(year));

      const events = await storage.getAllEvents(filters);
      
      // Generate signed thumbnail URLs
      const eventsWithSignedUrls = await Promise.all(
        events.map(async (event) => {
          let thumbnailSignedUrl: string | null = null;
          if (event.thumbnailUrl) {
            const signedResult = await getSignedGetUrl(event.thumbnailUrl);
            if (signedResult.success && signedResult.url) {
              thumbnailSignedUrl = signedResult.url;
            }
          }
          return { ...event, thumbnailSignedUrl };
        })
      );

      res.json(eventsWithSignedUrls);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // Admin API: Get upcoming events (for decision zone)
  app.get("/api/admin/v1/events/upcoming", requireAdmin, async (req, res) => {
    try {
      const events = await storage.getAllEvents({ status: "UPCOMING" });
      
      const eventsWithSignedUrls = await Promise.all(
        events.map(async (event) => {
          let thumbnailSignedUrl: string | null = null;
          if (event.thumbnailUrl) {
            const signedResult = await getSignedGetUrl(event.thumbnailUrl);
            if (signedResult.success && signedResult.url) {
              thumbnailSignedUrl = signedResult.url;
            }
          }
          return { ...event, thumbnailSignedUrl };
        })
      );

      res.json(eventsWithSignedUrls);
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
      res.status(500).json({ error: "Failed to fetch upcoming events" });
    }
  });

  // Admin API: Get latest events (completed, decision zone)
  app.get("/api/admin/v1/events/latest", requireAdmin, async (req, res) => {
    try {
      // Get completed events that need recording decision or have recording published
      const allCompleted = await storage.getAllEvents({ status: "COMPLETED" });
      
      // Filter: show_recording = true OR recording_url IS NULL (needs decision)
      const latestEvents = allCompleted.filter(event => 
        event.showRecording === true || event.recordingUrl === null
      );

      const eventsWithSignedUrls = await Promise.all(
        latestEvents.map(async (event) => {
          let thumbnailSignedUrl: string | null = null;
          if (event.thumbnailUrl) {
            const signedResult = await getSignedGetUrl(event.thumbnailUrl);
            if (signedResult.success && signedResult.url) {
              thumbnailSignedUrl = signedResult.url;
            }
          }
          return { ...event, thumbnailSignedUrl };
        })
      );

      res.json(eventsWithSignedUrls);
    } catch (error) {
      console.error("Error fetching latest events:", error);
      res.status(500).json({ error: "Failed to fetch latest events" });
    }
  });

  // Admin API: Get upload URL for event thumbnail (R2)
  // NOTE: This must be BEFORE the /:id route to prevent "upload-url" being parsed as an ID
  app.get("/api/admin/v1/events/upload-url", requireAdmin, async (req, res) => {
    try {
      const { filename, contentType } = req.query as { filename: string; contentType: string };
      if (!filename || !contentType) {
        return res.status(400).json({ error: "filename and contentType are required" });
      }

      const key = `events/${Date.now()}-${filename}`;
      const result = await getSignedPutUrl(key, contentType);
      
      if (!result.success) {
        console.error("R2 upload URL error:", result.error);
        return res.status(500).json({ error: result.error || "Failed to generate upload URL" });
      }

      res.json({ key: result.key, signedUrl: result.uploadUrl });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Admin API: Get single event
  app.get("/api/admin/v1/events/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getEventById(id);
      
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      let thumbnailSignedUrl: string | null = null;
      if (event.thumbnailUrl) {
        const signedResult = await getSignedGetUrl(event.thumbnailUrl);
        if (signedResult.success && signedResult.url) {
          thumbnailSignedUrl = signedResult.url;
        }
      }

      res.json({ ...event, thumbnailSignedUrl });
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  // Admin API: Create event
  app.post("/api/admin/v1/events", requireAdmin, async (req, res) => {
    try {
      const parsed = insertEventSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Validation failed", details: parsed.error.errors });
      }

      const event = await storage.createEvent(parsed.data);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  // Admin API: Update event
  app.put("/api/admin/v1/events/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.updateEvent(id, req.body);
      
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      res.json(event);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  // Admin API: Cancel event (soft delete)
  app.delete("/api/admin/v1/events/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.cancelEvent(id);
      
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      res.json({ success: true, message: "Event cancelled" });
    } catch (error) {
      console.error("Error cancelling event:", error);
      res.status(500).json({ error: "Failed to cancel event" });
    }
  });

  // Admin API: Skip recording for an event
  app.post("/api/admin/v1/events/:id/skip-recording", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.updateEvent(id, {
        showRecording: false,
        recordingSkipped: true,
        recordingUrl: null,
        recordingPasscode: null,
        recordingExpiryDate: null,
      });
      
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      res.json({ success: true, message: "Recording skipped" });
    } catch (error) {
      console.error("Error skipping recording:", error);
      res.status(500).json({ error: "Failed to skip recording" });
    }
  });

  // Admin API: Add recording to an event
  app.post("/api/admin/v1/events/:id/add-recording", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { recordingUrl, recordingPasscode, recordingExpiryDate } = req.body;

      if (!recordingUrl || !recordingPasscode || !recordingExpiryDate) {
        return res.status(400).json({ error: "recordingUrl, recordingPasscode, and recordingExpiryDate are required" });
      }

      const event = await storage.updateEvent(id, {
        recordingUrl,
        recordingPasscode,
        recordingExpiryDate,
        showRecording: true,
        recordingSkipped: false,
      });
      
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      res.json(event);
    } catch (error) {
      console.error("Error adding recording:", error);
      res.status(500).json({ error: "Failed to add recording" });
    }
  });

  // ===== PUBLIC EVENT APIs (User App) =====

  // User API: Get upcoming events
  app.get("/api/events/upcoming", async (req, res) => {
    try {
      const events = await storage.getUpcomingEvents();
      
      const eventsWithSignedUrls = await Promise.all(
        events.map(async (event) => {
          let thumbnailSignedUrl: string | null = null;
          if (event.thumbnailUrl) {
            const signedResult = await getSignedGetUrl(event.thumbnailUrl);
            if (signedResult.success && signedResult.url) {
              thumbnailSignedUrl = signedResult.url;
            }
          }
          
          // Derive LIVE status
          const now = new Date();
          const isLive = event.startDatetime <= now && now <= event.endDatetime;
          
          return { ...event, thumbnailSignedUrl, isLive };
        })
      );

      res.json(eventsWithSignedUrls);
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
      res.status(500).json({ error: "Failed to fetch upcoming events" });
    }
  });

  // User API: Get latest events (recordings)
  app.get("/api/events/latest", async (req, res) => {
    try {
      const events = await storage.getLatestEvents();
      
      const eventsWithSignedUrls = await Promise.all(
        events.map(async (event) => {
          let thumbnailSignedUrl: string | null = null;
          if (event.thumbnailUrl) {
            const signedResult = await getSignedGetUrl(event.thumbnailUrl);
            if (signedResult.success && signedResult.url) {
              thumbnailSignedUrl = signedResult.url;
            }
          }
          return { ...event, thumbnailSignedUrl };
        })
      );

      res.json(eventsWithSignedUrls);
    } catch (error) {
      console.error("Error fetching latest events:", error);
      res.status(500).json({ error: "Failed to fetch latest events" });
    }
  });

  // User API: Get single event (for recording access)
  app.get("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getEventById(id);
      
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Don't expose cancelled events to users
      if (event.status === "CANCELLED") {
        return res.status(404).json({ error: "Event not found" });
      }

      let thumbnailSignedUrl: string | null = null;
      if (event.thumbnailUrl) {
        const signedResult = await getSignedGetUrl(event.thumbnailUrl);
        if (signedResult.success && signedResult.url) {
          thumbnailSignedUrl = signedResult.url;
        }
      }

      // Derive LIVE status
      const now = new Date();
      const isLive = event.startDatetime <= now && now <= event.endDatetime;

      res.json({ ...event, thumbnailSignedUrl, isLive });
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  // ===== PROJECT OF HEART (POH) APIs =====

  // 1. GET /api/poh/current - Fetch current POH state
  app.get("/api/poh/current", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userId = req.user.sub;
      
      // Fetch all POHs for user
      const userPOHs = await storage.getUserPOHs(userId);
      
      const activePOH = userPOHs.find(p => p.status === "active");
      const nextPOH = userPOHs.find(p => p.status === "next");
      const horizonPOH = userPOHs.find(p => p.status === "horizon");

      // Build ACTIVE POH response with full details (milestones, actions, today's rating)
      let activeResponse = null;
      if (activePOH) {
        const milestones = await storage.getPOHMilestones(activePOH.id);
        const actions = await storage.getPOHActions(activePOH.id);
        const today = new Date().toISOString().split('T')[0];
        const todayRating = await storage.getPOHRatingByDate(userId, today);
        
        // Generate signed URLs for vision images
        const visionImages = activePOH.visionImages || [];
        const signedVisionImages: (string | null)[] = [];
        for (const img of visionImages) {
          if (img && img !== 'NULL') {
            try {
              // Extract key from stored URL - handle both direct R2 URLs and custom domains
              // Format 1: https://account.r2.cloudflarestorage.com/key
              // Format 2: https://custom-domain.com/key
              let key: string;
              if (img.includes('.r2.cloudflarestorage.com/')) {
                key = img.split('.r2.cloudflarestorage.com/')[1];
              } else if (img.startsWith('http')) {
                // Custom domain - extract path after domain
                const url = new URL(img);
                key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
              } else {
                // Already just a key
                key = img;
              }
              const signedResult = await getSignedGetUrl(key, 3600); // 1 hour TTL
              signedVisionImages.push(signedResult.success ? signedResult.url! : null);
            } catch (err) {
              console.error("Error generating signed URL for vision image:", err);
              signedVisionImages.push(null);
            }
          } else {
            signedVisionImages.push(null);
          }
        }
        
        activeResponse = {
          id: activePOH.id,
          title: activePOH.title,
          why: activePOH.why,
          category: activePOH.category,
          started_at: activePOH.startedAt,
          vision_images: signedVisionImages,
          milestones: milestones.map(m => ({
            id: m.id,
            text: m.text,
            achieved: m.achieved,
            achieved_at: m.achievedAt,
            order_index: m.orderIndex
          })),
          actions: actions.map(a => ({
            id: a.id,
            text: a.text,
            order: a.orderIndex
          })),
          today_rating: todayRating ? todayRating.rating : null
        };
      }

      // Build NEXT POH response with empty arrays for milestones/actions (placeholder only)
      let nextResponse = null;
      if (nextPOH) {
        nextResponse = {
          id: nextPOH.id,
          title: nextPOH.title,
          why: nextPOH.why,
          category: nextPOH.category,
          milestones: [],
          actions: []
        };
      }

      // Build HORIZON POH response with empty arrays for milestones/actions (placeholder only)
      let horizonResponse = null;
      if (horizonPOH) {
        horizonResponse = {
          id: horizonPOH.id,
          title: horizonPOH.title,
          why: horizonPOH.why,
          category: horizonPOH.category,
          milestones: [],
          actions: []
        };
      }

      res.json({
        active: activeResponse,
        next: nextResponse,
        horizon: horizonResponse
      });
    } catch (error) {
      console.error("Error fetching current POH:", error);
      res.status(500).json({ error: "Failed to fetch POH state" });
    }
  });

  // 2. POST /api/poh - Create Project of Heart
  app.post("/api/poh", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userId = req.user.sub;
      const { title, why, category } = req.body;

      // Validate inputs
      if (!title || title.length > 120) {
        return res.status(400).json({ error: "Title is required and must be <= 120 characters" });
      }
      if (!why || why.length > 500) {
        return res.status(400).json({ error: "Why is required and must be <= 500 characters" });
      }
      if (!pohCategoryEnum.safeParse(category).success) {
        return res.status(400).json({ error: "Invalid category. Must be: career, health, relationships, or wealth" });
      }

      // Check existing POHs to determine status
      const userPOHs = await storage.getUserPOHs(userId);
      const hasActive = userPOHs.some(p => p.status === "active");
      const hasNext = userPOHs.some(p => p.status === "next");
      const hasHorizon = userPOHs.some(p => p.status === "horizon");

      let status: "active" | "next" | "horizon";
      let startedAt: string | null = null;

      if (!hasActive) {
        status = "active";
        startedAt = new Date().toISOString().split('T')[0]; // Today
      } else if (!hasNext) {
        status = "next";
      } else if (!hasHorizon) {
        status = "horizon";
      } else {
        return res.status(400).json({ 
          error: "Cannot create more POHs. You already have active, next, and horizon projects." 
        });
      }

      const newPOH = await storage.createPOH({
        userId,
        title,
        why,
        category,
        status,
        startedAt
      });

      res.status(201).json(newPOH);
    } catch (error) {
      console.error("Error creating POH:", error);
      res.status(500).json({ error: "Failed to create POH" });
    }
  });

  // 3. PUT /api/poh/:id - Update POH text
  app.put("/api/poh/:id", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userId = req.user.sub;
      const pohId = req.params.id;
      const { title, why, category } = req.body;

      // Verify ownership
      const poh = await storage.getPOHById(pohId);
      if (!poh || poh.userId !== userId) {
        return res.status(404).json({ error: "POH not found" });
      }

      // Validate inputs
      const updates: any = {};
      
      if (title !== undefined) {
        if (title.length > 120) {
          return res.status(400).json({ error: "Title must be <= 120 characters" });
        }
        updates.title = title;
      }
      
      // Only active POH can update "why"
      if (why !== undefined) {
        if (poh.status !== "active") {
          return res.status(403).json({ error: "Only active POH can update 'why' field" });
        }
        if (why.length > 500) {
          return res.status(400).json({ error: "Why must be <= 500 characters" });
        }
        updates.why = why;
      }
      
      if (category !== undefined) {
        if (!pohCategoryEnum.safeParse(category).success) {
          return res.status(400).json({ error: "Invalid category" });
        }
        updates.category = category;
      }

      const updatedPOH = await storage.updatePOH(pohId, updates);
      res.json(updatedPOH);
    } catch (error) {
      console.error("Error updating POH:", error);
      res.status(500).json({ error: "Failed to update POH" });
    }
  });

  // 4. POST /api/poh/:id/milestones - Add milestone
  app.post("/api/poh/:id/milestones", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userId = req.user.sub;
      const pohId = req.params.id;
      const { text } = req.body;

      // Verify ownership and status
      const poh = await storage.getPOHById(pohId);
      if (!poh || poh.userId !== userId) {
        return res.status(404).json({ error: "POH not found" });
      }

      if (poh.status !== "active") {
        return res.status(403).json({ error: "Can only add milestones to active POH" });
      }

      // Validate text
      if (!text || text.length > 200) {
        return res.status(400).json({ error: "Milestone text is required and must be <= 200 characters" });
      }

      // Check milestone count (max 5)
      const existingMilestones = await storage.getPOHMilestones(pohId);
      if (existingMilestones.length >= 5) {
        return res.status(400).json({ error: "Maximum 5 milestones per POH" });
      }

      const milestone = await storage.createPOHMilestone({
        pohId,
        text,
        orderIndex: existingMilestones.length
      });

      res.status(201).json(milestone);
    } catch (error) {
      console.error("Error creating milestone:", error);
      res.status(500).json({ error: "Failed to create milestone" });
    }
  });

  // 5. POST /api/poh/milestone/:id/achieve - Achieve milestone
  app.post("/api/poh/milestone/:id/achieve", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userId = req.user.sub;
      const milestoneId = req.params.id;

      // Get milestone and verify ownership via POH
      const milestone = await storage.getPOHMilestoneById(milestoneId);
      if (!milestone) {
        return res.status(404).json({ error: "Milestone not found" });
      }

      const poh = await storage.getPOHById(milestone.pohId);
      if (!poh || poh.userId !== userId) {
        return res.status(404).json({ error: "Milestone not found" });
      }

      if (poh.status !== "active") {
        return res.status(403).json({ error: "Can only achieve milestones on active POH" });
      }

      if (milestone.achieved) {
        return res.status(400).json({ error: "Milestone already achieved" });
      }

      const today = new Date().toISOString().split('T')[0];
      const updatedMilestone = await storage.achievePOHMilestone(milestoneId, today);

      res.json(updatedMilestone);
    } catch (error) {
      console.error("Error achieving milestone:", error);
      res.status(500).json({ error: "Failed to achieve milestone" });
    }
  });

  // 6. PUT /api/poh/milestone/:id - Update milestone
  app.put("/api/poh/milestone/:id", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userId = req.user.sub;
      const milestoneId = req.params.id;
      const { text } = req.body;

      // Get milestone and verify ownership
      const milestone = await storage.getPOHMilestoneById(milestoneId);
      if (!milestone) {
        return res.status(404).json({ error: "Milestone not found" });
      }

      const poh = await storage.getPOHById(milestone.pohId);
      if (!poh || poh.userId !== userId) {
        return res.status(404).json({ error: "Milestone not found" });
      }

      // Can only edit milestones on ACTIVE POH
      if (poh.status !== "active") {
        return res.status(403).json({ 
          error: "POH_NOT_ACTIVE",
          message: "Can only edit milestones on active POH"
        });
      }

      // Cannot edit achieved milestone
      if (milestone.achieved) {
        return res.status(403).json({ 
          error: "MILESTONE_LOCKED",
          message: "Achieved milestones cannot be edited."
        });
      }

      if (!text || text.length > 200) {
        return res.status(400).json({ error: "Milestone text must be <= 200 characters" });
      }

      const updatedMilestone = await storage.updatePOHMilestone(milestoneId, { text });
      res.json(updatedMilestone);
    } catch (error) {
      console.error("Error updating milestone:", error);
      res.status(500).json({ error: "Failed to update milestone" });
    }
  });

  // 7. PUT /api/poh/:id/actions - Update actions (Top 3)
  app.put("/api/poh/:id/actions", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userId = req.user.sub;
      const pohId = req.params.id;
      const { actions } = req.body;

      // Verify ownership
      const poh = await storage.getPOHById(pohId);
      if (!poh || poh.userId !== userId) {
        return res.status(404).json({ error: "POH not found" });
      }

      if (poh.status !== "active") {
        return res.status(403).json({ error: "Can only update actions on active POH" });
      }

      // Validate actions
      if (!Array.isArray(actions) || actions.length > 3) {
        return res.status(400).json({ error: "Actions must be an array with max 3 items" });
      }

      for (const action of actions) {
        if (typeof action !== 'string' || action.length === 0) {
          return res.status(400).json({ error: "Each action must be a non-empty string" });
        }
      }

      // Replace all actions
      await storage.replacePOHActions(pohId, actions);
      
      const updatedActions = await storage.getPOHActions(pohId);
      res.json(updatedActions);
    } catch (error) {
      console.error("Error updating actions:", error);
      res.status(500).json({ error: "Failed to update actions" });
    }
  });

  // 8. POST /api/poh/rate - Save daily rating
  app.post("/api/poh/rate", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userId = req.user.sub;
      const { poh_id, rating, local_date } = req.body;

      // Validate POH
      const poh = await storage.getPOHById(poh_id);
      if (!poh || poh.userId !== userId) {
        return res.status(404).json({ error: "POH not found" });
      }

      if (poh.status !== "active") {
        return res.status(403).json({ error: "Can only rate active POH" });
      }

      // Validate rating
      if (typeof rating !== 'number' || rating < 0 || rating > 10) {
        return res.status(400).json({ error: "Rating must be between 0 and 10" });
      }

      // Validate date format
      if (!local_date || !/^\d{4}-\d{2}-\d{2}$/.test(local_date)) {
        return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
      }

      // Can only rate today - no backdating allowed
      const today = new Date().toISOString().split('T')[0];
      if (local_date !== today) {
        return res.status(403).json({ 
          error: "RATING_DATE_LOCKED",
          message: "Can only submit or update rating for today"
        });
      }

      // Check if rating exists for this date
      const existingRating = await storage.getPOHRatingByDate(userId, local_date);
      
      let result;
      if (existingRating) {
        // Update existing rating
        result = await storage.updatePOHRating(existingRating.id, rating);
      } else {
        // Create new rating
        result = await storage.createPOHRating({
          userId,
          pohId: poh_id,
          localDate: local_date,
          rating
        });
      }

      res.json(result);
    } catch (error) {
      console.error("Error saving rating:", error);
      res.status(500).json({ error: "Failed to save rating" });
    }
  });

  // 9. POST /api/poh/:id/complete - Complete POH
  app.post("/api/poh/:id/complete", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userId = req.user.sub;
      const pohId = req.params.id;
      const { closing_reflection } = req.body;

      // Verify ownership
      const poh = await storage.getPOHById(pohId);
      if (!poh || poh.userId !== userId) {
        return res.status(404).json({ error: "POH not found" });
      }

      if (poh.status !== "active") {
        return res.status(403).json({ error: "Can only complete active POH" });
      }

      // Validate reflection
      if (!closing_reflection || closing_reflection.length < 20) {
        return res.status(400).json({ error: "Closing reflection is required (minimum 20 characters)" });
      }

      const today = new Date().toISOString().split('T')[0];
      
      // Complete the POH
      await storage.completePOH(pohId, {
        status: "completed",
        endedAt: today,
        closingReflection: closing_reflection
      });

      // Promote NEXT -> ACTIVE and HORIZON -> NEXT
      await storage.promotePOHs(userId, today);

      res.json({ success: true, message: "POH completed successfully" });
    } catch (error) {
      console.error("Error completing POH:", error);
      res.status(500).json({ error: "Failed to complete POH" });
    }
  });

  // 10. POST /api/poh/:id/close - Close POH early
  app.post("/api/poh/:id/close", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userId = req.user.sub;
      const pohId = req.params.id;
      const { closing_reflection } = req.body;

      // Verify ownership
      const poh = await storage.getPOHById(pohId);
      if (!poh || poh.userId !== userId) {
        return res.status(404).json({ error: "POH not found" });
      }

      if (poh.status !== "active") {
        return res.status(403).json({ error: "Can only close active POH" });
      }

      // Validate reflection
      if (!closing_reflection || closing_reflection.length < 20) {
        return res.status(400).json({ error: "Closing reflection is required (minimum 20 characters)" });
      }

      const today = new Date().toISOString().split('T')[0];
      
      // Close the POH early
      await storage.completePOH(pohId, {
        status: "closed_early",
        endedAt: today,
        closingReflection: closing_reflection
      });

      // Promote NEXT -> ACTIVE and HORIZON -> NEXT
      await storage.promotePOHs(userId, today);

      res.json({ success: true, message: "POH closed early" });
    } catch (error) {
      console.error("Error closing POH:", error);
      res.status(500).json({ error: "Failed to close POH" });
    }
  });

  // 11. GET /api/poh/history - Get POH history
  app.get("/api/poh/history", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userId = req.user.sub;
      
      // Get completed and closed_early POHs
      const historyPOHs = await storage.getPOHHistory(userId);
      
      // Build response with only achieved milestones
      const historyWithMilestones = await Promise.all(
        historyPOHs.map(async (poh) => {
          const milestones = await storage.getPOHMilestones(poh.id);
          const achievedMilestones = milestones
            .filter(m => m.achieved)
            .map(m => m.text);

          return {
            id: poh.id,
            title: poh.title,
            category: poh.category,
            status: poh.status,
            started_at: poh.startedAt,
            ended_at: poh.endedAt,
            closing_reflection: poh.closingReflection,
            milestones: achievedMilestones
          };
        })
      );

      res.json(historyWithMilestones);
    } catch (error) {
      console.error("Error fetching POH history:", error);
      res.status(500).json({ error: "Failed to fetch POH history" });
    }
  });

  // Configure multer for POH vision image uploads (memory storage)
  const uploadPOHVision = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('INVALID_IMAGE'));
      }
    }
  });

  // 12. POST /api/poh/:id/vision - Upload vision image
  app.post("/api/poh/:id/vision", authenticateJWT, uploadPOHVision.single('image'), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userId = req.user.sub;
      const pohId = req.params.id;
      const indexStr = req.body.index;

      // Validate index (3 vision slots: 0, 1, 2)
      const index = parseInt(indexStr, 10);
      if (isNaN(index) || index < 0 || index > 2) {
        return res.status(400).json({ 
          error: "INVALID_INDEX",
          message: "Index must be 0, 1, or 2"
        });
      }

      // Verify POH ownership and status
      const poh = await storage.getPOHById(pohId);
      if (!poh || poh.userId !== userId) {
        return res.status(404).json({ error: "POH not found" });
      }

      if (poh.status !== "active") {
        return res.status(403).json({ 
          error: "VISION_UPLOAD_NOT_ALLOWED",
          message: "Can only upload vision images to active POH"
        });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ 
          error: "INVALID_IMAGE",
          message: "No image file provided"
        });
      }

      // Determine file extension
      const extMap: { [key: string]: string } = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp'
      };
      const ext = extMap[req.file.mimetype] || 'jpg';

      // Deterministic path: poh-visions/{user_id}/{poh_id}/vision-{index}.{ext}
      const key = `poh-visions/${userId}/${pohId}/vision-${index}.${ext}`;

      // Upload to R2
      const uploadResult = await uploadBufferToR2(req.file.buffer, key, req.file.mimetype);
      if (!uploadResult.success) {
        console.error("R2 upload failed:", uploadResult.error);
        return res.status(500).json({ error: "Failed to upload image" });
      }

      // Update vision_images array in database
      const currentImages = poh.visionImages || [];
      const newImages = [...currentImages];
      
      // Ensure array has at least 3 slots (pad with nulls)
      while (newImages.length < 3) {
        newImages.push(null as any);
      }
      
      // Replace the image at the specified index
      newImages[index] = uploadResult.url!;

      await storage.updatePOH(pohId, { visionImages: newImages });

      res.json({ 
        success: true, 
        vision_images: newImages,
        uploaded_index: index
      });
    } catch (error: any) {
      console.error("Error uploading vision image:", error);
      if (error.message === 'INVALID_IMAGE') {
        return res.status(400).json({ 
          error: "INVALID_IMAGE",
          message: "Only JPEG, PNG, and WebP images are allowed"
        });
      }
      res.status(500).json({ error: "Failed to upload vision image" });
    }
  });

  // ===== PUSH NOTIFICATIONS =====
  
  // Register device token for push notifications
  app.post("/api/v1/notifications/register-device", authenticateJWT, async (req, res) => {
    try {
      const userId = (req as any).user.sub;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { token } = req.body;
      
      if (!token || typeof token !== "string") {
        return res.status(400).json({ error: "Token is required" });
      }

      // Check if this exact token already exists
      const existingToken = await db.select()
        .from(deviceTokens)
        .where(eq(deviceTokens.token, token))
        .limit(1);

      if (existingToken.length > 0) {
        // Token already exists - update user_id if different
        if (existingToken[0].userId !== userId) {
          await db.update(deviceTokens)
            .set({ userId })
            .where(eq(deviceTokens.token, token));
        }
        return res.json({ success: true, message: "Token already registered" });
      }

      // UPSERT: Delete any old tokens for this user first, then insert new one
      // This ensures only the latest token is stored per user (tokens change on browser refresh)
      await db.delete(deviceTokens).where(eq(deviceTokens.userId, userId));

      // Insert new token
      await db.insert(deviceTokens).values({
        userId,
        token,
        platform: "web",
      });

      res.json({ success: true, message: "Device registered successfully" });
    } catch (error: any) {
      console.error("Error registering device token:", error);
      res.status(500).json({ error: "Failed to register device" });
    }
  });

  // Unregister device token (called on logout or manual opt-out)
  app.delete("/api/v1/notifications/unregister-device", authenticateJWT, async (req, res) => {
    try {
      const userId = (req as any).user.sub;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { token } = req.body;
      
      if (token) {
        // Remove specific token
        await db.delete(deviceTokens)
          .where(and(eq(deviceTokens.userId, userId), eq(deviceTokens.token, token)));
      } else {
        // Remove all tokens for this user (used on logout)
        await db.delete(deviceTokens).where(eq(deviceTokens.userId, userId));
      }

      res.json({ success: true, message: "Device unregistered" });
    } catch (error: any) {
      console.error("Error unregistering device token:", error);
      res.status(500).json({ error: "Failed to unregister device" });
    }
  });

  // Get notification status for current user (DB source of truth)
  app.get("/api/v1/notifications/status", authenticateJWT, async (req, res) => {
    try {
      const userId = (req as any).user.sub;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const tokens = await db.select()
        .from(deviceTokens)
        .where(eq(deviceTokens.userId, userId))
        .limit(1);

      res.json({ enabled: tokens.length > 0 });
    } catch (error: any) {
      console.error("Error getting notification status:", error);
      res.status(500).json({ error: "Failed to get notification status" });
    }
  });

  // Admin: Get notification stats
  app.get("/admin/api/notifications/stats", requireAdmin, async (req, res) => {
    try {
      const allTokens = await db.select().from(deviceTokens);
      const uniqueUserIds = new Set(allTokens.map(t => t.userId));
      
      res.json({
        totalDevices: allTokens.length,
        uniqueUsers: uniqueUserIds.size,
      });
    } catch (error: any) {
      console.error("Error getting notification stats:", error);
      res.status(500).json({ error: "Failed to get stats" });
    }
  });

  // Admin: Send test notification to all registered devices
  app.post("/admin/api/notifications/test", requireAdmin, async (req, res) => {
    try {
      const { title, body } = req.body;
      
      if (!title || !body) {
        return res.status(400).json({ error: "Title and body are required" });
      }

      // Fetch all device tokens
      const allTokens = await db.select({ token: deviceTokens.token })
        .from(deviceTokens);

      if (allTokens.length === 0) {
        return res.json({ 
          success: true, 
          message: "No devices registered",
          successCount: 0,
          failureCount: 0
        });
      }

      const tokens = allTokens.map(t => t.token);
      const result = await sendPushNotification(tokens, title, body);

      // Clean up failed tokens (invalid tokens)
      if (result.failedTokens.length > 0) {
        for (const failedToken of result.failedTokens) {
          await db.delete(deviceTokens).where(eq(deviceTokens.token, failedToken));
        }
      }

      res.json({
        success: true,
        message: `Notification sent`,
        successCount: result.successCount,
        failureCount: result.failureCount,
        tokensCleanedUp: result.failedTokens.length
      });
    } catch (error: any) {
      console.error("Error sending test notification:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // ===== ADMIN PROJECT OF HEART ROUTES =====
  // Observational only - aggregate data, no individual user data
  
  // 1. Usage - Are users creating Projects of Heart?
  app.get("/admin/api/poh/usage", requireAdmin, async (req, res) => {
    try {
      // Total users count
      const totalUsersResult = await db.select({ count: count() }).from(users);
      const totalUsers = Number(totalUsersResult[0]?.count) || 0;
      
      // Users with any POH (distinct user_id)
      const usersWithPohResult = await db.select({ 
        count: countDistinct(projectOfHearts.userId) 
      }).from(projectOfHearts);
      const usersWithPoh = Number(usersWithPohResult[0]?.count) || 0;
      
      // Count by status
      const activeResult = await db.select({ count: count() })
        .from(projectOfHearts)
        .where(eq(projectOfHearts.status, "active"));
      const active = Number(activeResult[0]?.count) || 0;
      
      const nextResult = await db.select({ count: count() })
        .from(projectOfHearts)
        .where(eq(projectOfHearts.status, "next"));
      const next = Number(nextResult[0]?.count) || 0;
      
      const northStarResult = await db.select({ count: count() })
        .from(projectOfHearts)
        .where(eq(projectOfHearts.status, "horizon"));
      const northStar = Number(northStarResult[0]?.count) || 0;
      
      res.json({
        total_users: totalUsers,
        users_with_poh: usersWithPoh,
        active,
        next,
        north_star: northStar
      });
    } catch (error: any) {
      console.error("Error fetching POH usage:", error);
      res.status(500).json({ error: "Failed to fetch usage data" });
    }
  });
  
  // 2. Daily Check-ins - Are users reflecting daily?
  app.get("/admin/api/poh/daily-checkins", requireAdmin, async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Today's check-ins
      const todayResult = await db.select({ 
        count: countDistinct(pohDailyRatings.userId) 
      })
        .from(pohDailyRatings)
        .where(eq(pohDailyRatings.localDate, today));
      const todayCheckedIn = Number(todayResult[0]?.count) || 0;
      
      // Active users count (for percentage)
      const activeUsersResult = await db.select({ 
        count: countDistinct(projectOfHearts.userId) 
      })
        .from(projectOfHearts)
        .where(eq(projectOfHearts.status, "active"));
      const activeUsers = Number(activeUsersResult[0]?.count) || 0;
      
      const percentOfActive = activeUsers > 0 
        ? Math.round((todayCheckedIn / activeUsers) * 100) 
        : 0;
      
      // Last 30 days check-ins
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
      
      const last30DaysResult = await db.select({
        date: pohDailyRatings.localDate,
        count: countDistinct(pohDailyRatings.userId)
      })
        .from(pohDailyRatings)
        .where(gte(pohDailyRatings.localDate, thirtyDaysAgoStr))
        .groupBy(pohDailyRatings.localDate)
        .orderBy(asc(pohDailyRatings.localDate));
      
      // Fill in missing dates with 0
      const dateMap = new Map(last30DaysResult.map(r => [r.date, Number(r.count)]));
      const last30Days = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        last30Days.push({
          date: dateStr,
          users_checked_in: dateMap.get(dateStr) || 0
        });
      }
      
      res.json({
        today: {
          date: today,
          users_checked_in: todayCheckedIn,
          percent_of_active_users: percentOfActive
        },
        last_30_days: last30Days
      });
    } catch (error: any) {
      console.error("Error fetching daily check-ins:", error);
      res.status(500).json({ error: "Failed to fetch check-in data" });
    }
  });
  
  // 3. Progress Signals - Are milestones being achieved?
  app.get("/admin/api/poh/progress-signals", requireAdmin, async (req, res) => {
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
      
      // Completed POH count
      const completedPohResult = await db.select({ count: count() })
        .from(projectOfHearts)
        .where(eq(projectOfHearts.status, "completed"));
      const completedPoh = Number(completedPohResult[0]?.count) || 0;
      
      // Milestones achieved in last 30 days
      const achieved30Result = await db.select({ count: count() })
        .from(pohMilestones)
        .where(and(
          eq(pohMilestones.achieved, true),
          gte(pohMilestones.achievedAt, thirtyDaysAgoStr)
        ));
      const milestonesAchieved30 = Number(achieved30Result[0]?.count) || 0;
      
      // Average days to first milestone
      // Join milestones with POH to get started_at, find first achieved milestone
      const firstMilestonesResult = await db.execute(sql`
        SELECT AVG(days_to_first)::float as avg_days FROM (
          SELECT 
            p.id as poh_id,
            MIN(m.achieved_at::date - p.started_at::date) as days_to_first
          FROM project_of_hearts p
          JOIN poh_milestones m ON m.poh_id = p.id
          WHERE m.achieved = true AND p.started_at IS NOT NULL AND m.achieved_at IS NOT NULL
          GROUP BY p.id
        ) sub
      `);
      const avgDaysToFirst = Math.round((firstMilestonesResult.rows[0] as any)?.avg_days || 0);
      
      res.json({
        completed_poh: Number(completedPoh),
        milestones_achieved_30_days: Number(milestonesAchieved30),
        avg_days_to_first_milestone: Number(avgDaysToFirst) || 0
      });
    } catch (error: any) {
      console.error("Error fetching progress signals:", error);
      res.status(500).json({ error: "Failed to fetch progress signals" });
    }
  });
  
  // 4. Drop-offs - Where do users disengage?
  app.get("/admin/api/poh/drop-offs", requireAdmin, async (req, res) => {
    try {
      // Closed early count
      const closedEarlyResult = await db.select({ count: count() })
        .from(projectOfHearts)
        .where(eq(projectOfHearts.status, "closed_early"));
      const closedEarly = Number(closedEarlyResult[0]?.count) || 0;
      
      // Active with no achieved milestones
      const activeNoMilestonesResult = await db.execute(sql`
        SELECT COUNT(DISTINCT p.id) as count
        FROM project_of_hearts p
        LEFT JOIN poh_milestones m ON m.poh_id = p.id AND m.achieved = true
        WHERE p.status = 'active' AND m.id IS NULL
      `);
      const activeNoMilestones = parseInt((activeNoMilestonesResult.rows[0] as any)?.count || '0');
      
      // Average active duration (for closed_early and completed)
      const avgDurationResult = await db.execute(sql`
        SELECT AVG(ended_at::date - started_at::date)::float as avg_days
        FROM project_of_hearts
        WHERE ended_at IS NOT NULL AND started_at IS NOT NULL
          AND status IN ('completed', 'closed_early')
      `);
      const avgDuration = Math.round((avgDurationResult.rows[0] as any)?.avg_days || 0);
      
      res.json({
        closed_early: Number(closedEarly),
        active_with_no_milestones: Number(activeNoMilestones),
        avg_active_duration_days: Number(avgDuration) || 0
      });
    } catch (error: any) {
      console.error("Error fetching drop-offs:", error);
      res.status(500).json({ error: "Failed to fetch drop-off data" });
    }
  });
  
  // 5. Life Areas - Which life categories are users focusing on?
  app.get("/admin/api/poh/life-areas", requireAdmin, async (req, res) => {
    try {
      // Count by category (prefer active, but include all)
      const categoryResult = await db.select({
        category: projectOfHearts.category,
        count: count()
      })
        .from(projectOfHearts)
        .where(eq(projectOfHearts.status, "active"))
        .groupBy(projectOfHearts.category);
      
      // Build response object with all categories
      const categories: Record<string, number> = {
        career: 0,
        health: 0,
        relationships: 0,
        wealth: 0
      };
      
      categoryResult.forEach(r => {
        if (r.category in categories) {
          categories[r.category] = Number(r.count) || 0;
        }
      });
      
      res.json(categories);
    } catch (error: any) {
      console.error("Error fetching life areas:", error);
      res.status(500).json({ error: "Failed to fetch life areas" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
