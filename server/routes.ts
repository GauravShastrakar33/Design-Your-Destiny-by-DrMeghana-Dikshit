import type { Express, Request, Response, NextFunction } from "express";
import { registerDomainRoutes } from "./routes/index";
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
  activityLogs,
  userBadges,
  notificationLogs,
  notifications,
  communitySessions,
  goldmineVideos,
  insertProjectOfHeartSchema,
} from "@shared/schema";
import {
  sendPushNotification,
  initializeFirebaseAdmin,
} from "./lib/firebaseAdmin";
import { createEventReminders } from "./jobs/notificationCron";
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
            textItem.R?.map((r: any) => {
              try {
                return decodeURIComponent(r.T);
              } catch {
                return r.T || "";
              }
            }).join("") || "";

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
import {
  eq,
  asc,
  and,
  ilike,
  or,
  sql,
  count,
  countDistinct,
  gte,
  desc,
  lt,
  avg,
  isNull,
  inArray,
} from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticateJWT, type AuthPayload } from "./middleware/auth";
import { logAudit } from "./utils/audit";

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
        t
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
        (k) => lower.startsWith(k) && /^\w+\s*\([^)]+\)$/.test(t)
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
        `<${tag} class="${
          tag === "ul" ? "list-disc" : "list-decimal"
        } list-inside space-y-1 my-4">`
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
        `<h3 class="mt-6 mb-3 text-lg font-semibold text-primary">${headerText}</h3>`
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
      path.extname(file.originalname).toLowerCase()
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
    req.user = {
      sub: 0,
      email: "legacy-admin@system.local",
      role: "SUPER_ADMIN",
    };
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
  // Health check endpoint for connectivity testing
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

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

  registerDomainRoutes(app);

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

  // ===== ADMIN DASHBOARD ROUTES =====

  // Admin Dashboard: Get all dashboard data in one request
  app.get("/admin/v1/dashboard", requireAdmin, async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split("T")[0];

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const sevenDaysLater = new Date(today);
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      // KPIs
      const [
        totalUsersResult,
        activeTodayResult,
        practisedTodayResult,
        badgesEarnedTodayResult,
      ] = await Promise.all([
        // Total registered users
        db.select({ count: count() }).from(users).where(eq(users.role, "USER")),
        // Active Today: Users active in last 24 hours
        db
          .select({ count: count() })
          .from(users)
          .where(
            and(
              eq(users.role, "USER"),
              gte(users.lastActivity, twentyFourHoursAgo)
            )
          ),
        // Practised Today: Users who logged activity in last 24 hours
        db
          .select({ count: countDistinct(activityLogs.userId) })
          .from(activityLogs)
          .where(
            and(
              gte(activityLogs.createdAt, twentyFourHoursAgo), // Use created_at, not activityDate
              or(
                eq(activityLogs.featureType, "PROCESS"),
                eq(activityLogs.featureType, "PLAYLIST")
              )
            )
          ),
        // Badges earned in last 24 hours (keep consistent)
        db
          .select({ count: count() })
          .from(userBadges)
          .where(gte(userBadges.earnedAt, twentyFourHoursAgo)),
      ]);

      // Events
      const [eventsToday, upcomingEvents] = await Promise.all([
        // Events happening today
        db
          .select()
          .from(eventsTable)
          .where(
            and(
              gte(eventsTable.startDatetime, today),
              lt(eventsTable.startDatetime, tomorrow)
            )
          )
          .orderBy(asc(eventsTable.startDatetime)),
        // Events in next 7 days (excluding today)
        db
          .select()
          .from(eventsTable)
          .where(
            and(
              gte(eventsTable.startDatetime, tomorrow),
              lt(eventsTable.startDatetime, sevenDaysLater)
            )
          )
          .orderBy(asc(eventsTable.startDatetime)),
      ]);

      // Notifications health
      const [failedNotificationsResult, usersWithDeviceTokens, totalUserCount] =
        await Promise.all([
          // Failed notifications in last 24 hours
          db
            .select({ count: count() })
            .from(notificationLogs)
            .where(
              and(
                eq(notificationLogs.status, "failed"),
                gte(notificationLogs.createdAt, twentyFourHoursAgo)
              )
            ),
          // Count of unique users with device tokens
          db
            .select({ count: countDistinct(deviceTokens.userId) })
            .from(deviceTokens),
          // Total users
          db
            .select({ count: count() })
            .from(users)
            .where(eq(users.role, "USER")),
        ]);

      // Users without device tokens = total users - users with tokens
      const usersWithNotificationsDisabled =
        (totalUserCount[0]?.count ?? 0) -
        (usersWithDeviceTokens[0]?.count ?? 0);

      // Community Practices
      const [communityPracticesResult] = await Promise.all([
        db.select({ count: count() }).from(communitySessions),
      ]);

      // CMS Health
      const [
        totalCoursesResult,
        publishedCoursesResult,
        lastUpdatedCourseResult,
      ] = await Promise.all([
        // Total courses
        db.select({ count: count() }).from(cmsCourses),
        // Published courses
        db
          .select({ count: count() })
          .from(cmsCourses)
          .where(eq(cmsCourses.isPublished, true)),
        // Last updated course
        db
          .select({
            id: cmsCourses.id,
            title: cmsCourses.title,
            updatedAt: cmsCourses.updatedAt,
          })
          .from(cmsCourses)
          .orderBy(desc(cmsCourses.updatedAt))
          .limit(1),
      ]);

      // Helper to get event status
      const getEventStatus = (event: typeof eventsTable.$inferSelect) => {
        const now = new Date();
        if (now < event.startDatetime) return "upcoming";
        if (now >= event.startDatetime && now <= event.endDatetime)
          return "live";
        return "completed";
      };

      res.json({
        kpis: {
          totalUsers: totalUsersResult[0]?.count ?? 0,
          activeToday: activeTodayResult[0]?.count ?? 0,
          practisedToday: practisedTodayResult[0]?.count ?? 0,
          badgesEarnedToday: badgesEarnedTodayResult[0]?.count ?? 0,
        },
        events: {
          today: eventsToday.map((e) => ({
            id: e.id,
            title: e.title,
            startDatetime: e.startDatetime,
            endDatetime: e.endDatetime,
            status: getEventStatus(e),
          })),
          upcoming: upcomingEvents.map((e) => ({
            id: e.id,
            title: e.title,
            startDatetime: e.startDatetime,
            endDatetime: e.endDatetime,
            status: getEventStatus(e),
          })),
        },
        notifications: {
          failedLast24h: failedNotificationsResult[0]?.count ?? 0,
          usersDisabled: usersWithNotificationsDisabled,
        },
        communityPractices: {
          total: communityPracticesResult[0]?.count ?? 0,
        },
        cmsHealth: {
          totalCourses: totalCoursesResult[0]?.count ?? 0,
          publishedCourses: publishedCoursesResult[0]?.count ?? 0,
          lastUpdatedCourse: lastUpdatedCourseResult[0]
            ? {
                title: lastUpdatedCourseResult[0].title,
                updatedAt: lastUpdatedCourseResult[0].updatedAt,
              }
            : null,
        },
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
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
        programCode
      );

      if (req.user) {
        logAudit({
          req,
          userId: req.user.sub,
          userEmail: req.user.email,
          action: "CREATE",
          entityType: "USER",
          entityId: student.id,
          newValues: { name, email, phone, programCode },
        });
      }

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
        programCode
      );

      if (!student) {
        res.status(404).json({ error: "Student not found" });
        return;
      }

      if (req.user) {
        logAudit({
          req,
          userId: req.user.sub,
          userEmail: req.user.email,
          action: "UPDATE",
          entityType: "USER",
          entityId: id,
          newValues: { name, email, phone, status, programCode },
        });
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

      if (req.user) {
        logAudit({
          req,
          userId: req.user.sub,
          userEmail: req.user.email,
          action: "UPDATE_STATUS",
          entityType: "USER",
          entityId: id,
          newValues: { status },
        });
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
      const student = await storage.getStudentById(id);
      const success = await storage.deleteStudent(id);

      if (!success) {
        res.status(404).json({ error: "Student not found" });
        return;
      }

      if (req.user) {
        logAudit({
          req,
          userId: req.user.sub,
          userEmail: req.user.email,
          action: "DELETE",
          entityType: "USER",
          entityId: id,
          oldValues: student,
        });
      }

      res.json({ message: "Student deleted" });
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ error: "Failed to delete student" });
    }
  });

  // Admin routes: Reset student password
  app.post(
    "/admin/v1/students/:id/reset-password",
    requireAdmin,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const { password } = req.body;

        if (!password || typeof password !== "string" || password.length < 6) {
          return res
            .status(400)
            .json({ error: "Password must be at least 6 characters" });
        }

        const user = await storage.getUserById(id);
        if (!user) {
          return res.status(404).json({ error: "Student not found" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await storage.resetUserPassword(id, hashedPassword);

        if (req.user) {
          logAudit({
            req,
            userId: req.user.sub,
            userEmail: req.user.email,
            action: "PASSWORD_CHANGE",
            entityType: "USER",
            entityId: id,
          });
        }

        res.json({ success: true, message: "Password reset successfully" });
      } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ error: "Failed to reset password" });
      }
    }
  );


  // Admin routes: Download sample CSV for bulk upload
  app.get("/api/admin/students/sample-csv", requireAdmin, (req, res) => {
    const sampleCSV = `full_name,email,phone
John Doe,john.doe@example.com,+1234567890
Jane Smith,jane.smith@example.com,
Bob Wilson,bob.wilson@example.com,+9876543210`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=student_upload_sample.csv"
    );
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
  app.post(
    "/api/admin/students/bulk-upload",
    requireAdmin,
    uploadCSV.single("file"),
    async (req, res) => {
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
          return res.status(400).json({
            error: "Invalid CSV format. Please check file structure.",
          });
        }

        // Validate row limit
        if (records.length > 1000) {
          return res
            .status(400)
            .json({ error: "Maximum 1000 rows allowed per upload" });
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
              program.code // Always use program from modal, not CSV
            );
            created++;
          } catch (createError: any) {
            errors.push({
              row: rowNumber,
              reason: createError.message || "Failed to create student",
            });
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
    }
  );

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
    }
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
    }
  );

  // ===== PUBLIC SEARCH API =====

  interface SearchResult {
    type: "module" | "lesson" | "course";
    feature: string;
    id: number;
    title: string;
    course_id?: number;
    module_id?: number;
    navigate_to: string;
  }

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
          amount.toString()
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
    }
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
        monthNum
      );

      res.json(data);
    } catch (error) {
      console.error("Error fetching money calendar:", error);
      res.status(500).json({ error: "Failed to fetch money calendar" });
    }
  });

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
  app.get(
    "/api/admin/v1/session-banners/upload-url",
    requireAdmin,
    async (req, res) => {
      try {
        const { filename, contentType } = req.query as {
          filename: string;
          contentType: string;
        };
        if (!filename || !contentType) {
          return res
            .status(400)
            .json({ error: "filename and contentType are required" });
        }

        const key = `session-banners/${Date.now()}-${filename}`;
        const result = await getSignedPutUrl(key, contentType);

        if (!result.success) {
          console.error("R2 upload URL error:", result.error);
          return res
            .status(500)
            .json({ error: result.error || "Failed to generate upload URL" });
        }

        res.json({ key: result.key, signedUrl: result.uploadUrl });
      } catch (error) {
        console.error("Error generating upload URL:", error);
        res.status(500).json({ error: "Failed to generate upload URL" });
      }
    }
  );

  // GET /api/admin/v1/session-banners/:id - Get single banner
  app.get(
    "/api/admin/v1/session-banners/:id",
    requireAdmin,
    async (req, res) => {
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
    }
  );

  // POST /api/admin/v1/session-banners - Create banner
  app.post("/api/admin/v1/session-banners", requireAdmin, async (req, res) => {
    try {
      const {
        type,
        thumbnailKey,
        videoKey,
        posterKey,
        ctaText,
        ctaLink,
        startAt,
        endAt,
        liveEnabled,
        liveStartAt,
        liveEndAt,
      } = req.body;

      if (!type || !startAt || !endAt) {
        return res
          .status(400)
          .json({ error: "type, startAt, and endAt are required" });
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
        liveStartAt: liveStartAt ? new Date(liveStartAt) : null,
        liveEndAt: liveEndAt ? new Date(liveEndAt) : null,
      });
      if (req.user) {
        logAudit({
          req,
          userId: req.user.sub,
          userEmail: req.user.email,
          action: "CREATE",
          entityType: "BANNER",
          entityId: banner.id,
          newValues: banner,
        });
      }
      res.status(201).json(banner);
    } catch (error) {
      console.error("Error creating session banner:", error);
      res.status(500).json({ error: "Failed to create session banner" });
    }
  });

  // PUT /api/admin/v1/session-banners/:id - Update banner
  app.put(
    "/api/admin/v1/session-banners/:id",
    requireAdmin,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const {
          type,
          thumbnailKey,
          videoKey,
          posterKey,
          ctaText,
          ctaLink,
          startAt,
          endAt,
          liveEnabled,
          liveStartAt,
          liveEndAt,
        } = req.body;

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
        if (liveStartAt !== undefined)
          updateData.liveStartAt = liveStartAt ? new Date(liveStartAt) : null;
        if (liveEndAt !== undefined)
          updateData.liveEndAt = liveEndAt ? new Date(liveEndAt) : null;

        const existing = await storage.getSessionBannerById(id);
        const banner = await storage.updateSessionBanner(id, updateData);
        if (!banner) {
          return res.status(404).json({ error: "Banner not found" });
        }

        if (req.user && existing) {
          logAudit({
            req,
            userId: req.user.sub,
            userEmail: req.user.email,
            action: "UPDATE",
            entityType: "BANNER",
            entityId: id,
            oldValues: existing,
            newValues: banner,
          });
        }
        res.json(banner);
      } catch (error) {
        console.error("Error updating session banner:", error);
        res.status(500).json({ error: "Failed to update session banner" });
      }
    }
  );

  // DELETE /api/admin/v1/session-banners/:id - Delete banner
  app.delete(
    "/api/admin/v1/session-banners/:id",
    requireAdmin,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const existing = await storage.getSessionBannerById(id);
        const success = await storage.deleteSessionBanner(id);
        if (!success) {
          return res.status(404).json({ error: "Banner not found" });
        }

        if (req.user && existing) {
          logAudit({
            req,
            userId: req.user.sub,
            userEmail: req.user.email,
            action: "DELETE",
            entityType: "BANNER",
            entityId: id,
            oldValues: existing,
          });
        }
        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting session banner:", error);
        res.status(500).json({ error: "Failed to delete session banner" });
      }
    }
  );

  // POST /api/admin/v1/session-banners/:id/duplicate - Duplicate banner
  app.post(
    "/api/admin/v1/session-banners/:id/duplicate",
    requireAdmin,
    async (req, res) => {
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
          liveStartAt: original.liveStartAt,
          liveEndAt: original.liveEndAt,
        });
        if (req.user) {
          logAudit({
            req,
            userId: req.user.sub,
            userEmail: req.user.email,
            action: "CREATE",
            entityType: "BANNER",
            entityId: duplicate.id,
            newValues: duplicate,
          });
        }
        res.status(201).json(duplicate);
      } catch (error) {
        console.error("Error duplicating session banner:", error);
        res.status(500).json({ error: "Failed to duplicate session banner" });
      }
    }
  );

  // POST /api/admin/v1/session-banners/:id/set-default - Set banner as default
  app.post(
    "/api/admin/v1/session-banners/:id/set-default",
    requireAdmin,
    async (req, res) => {
      try {
        const bannerId = parseInt(req.params.id);
        const updated = await storage.setDefaultBanner(bannerId);

        if (!updated) {
          return res.status(404).json({ error: "Banner not found" });
        }

        res.json(updated);
      } catch (error) {
        console.error("Error setting default banner:", error);
        res.status(500).json({ error: "Failed to set default banner" });
      }
    }
  );

  // ===== SESSION BANNER PUBLIC ROUTE =====

  // GET /api/public/v1/session-banner - Get current active banner with default fallback
  app.get("/api/public/v1/session-banner", async (req, res) => {
    try {
      const now = new Date();

      // Step 1: Try active banner (latest updated wins if overlap)
      let banner = await storage.getActiveBanner();
      let status = "active";

      // Step 2: Fallback to default banner
      if (!banner) {
        banner = await storage.getDefaultBanner();
        status = "default";
      }

      // Step 3: No banner available
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

      // Calculate LIVE status (backend single source of truth)
      // LIVE is OPTIONAL - only show if explicitly enabled
      const isLive =
        banner.type === "session" &&
        banner.liveEnabled &&
        banner.liveStartAt &&
        banner.liveEndAt &&
        now >= new Date(banner.liveStartAt) &&
        now < new Date(banner.liveEndAt);

      res.json({
        banner: {
          id: banner.id,
          type: banner.type,
          thumbnailUrl,
          videoUrl,
          posterUrl,
          ctaText: banner.ctaText,
          ctaLink: banner.ctaLink,
          isLive, // Backend-calculated, frontend must consume
        },
        status,
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
        .where(
          and(
            eq(dailyQuotes.isActive, true),
            eq(dailyQuotes.lastShownDate, today)
          )
        );

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
      // Remove displayOrder from request body - we auto-assign it
      const { displayOrder, ...bodyWithoutOrder } = req.body;

      const parsed = insertDailyQuoteSchema.safeParse(bodyWithoutOrder);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: "Validation failed", details: parsed.error.errors });
      }

      // Auto-assign displayOrder as MAX + 1
      const maxOrderResult = await db
        .select({
          maxOrder: sql<number>`COALESCE(MAX(${dailyQuotes.displayOrder}), 0)`,
        })
        .from(dailyQuotes);

      const nextOrder = (maxOrderResult[0]?.maxOrder || 0) + 1;

      const [newQuote] = await db
        .insert(dailyQuotes)
        .values({
          ...parsed.data,
          displayOrder: nextOrder,
        })
        .returning();

      res.status(201).json(newQuote);
    } catch (error: any) {
      console.error("Error creating quote:", error);

      // Catch PostgreSQL unique violation error (code 23505)
      if (
        error.code === "23505" &&
        error.constraint === "unique_display_order"
      ) {
        return res.status(400).json({
          error: "Display order conflict detected. Please try again.",
        });
      }

      res.status(500).json({ error: "Failed to create quote" });
    }
  });

  // Admin API: Update a quote
  app.put("/api/admin/quotes/:id", requireAdmin, async (req, res) => {
    try {
      const quoteId = parseInt(req.params.id);
      // displayOrder is now auto-managed and cannot be updated
      const { quoteText, author, isActive } = req.body;

      const [updated] = await db
        .update(dailyQuotes)
        .set({
          ...(quoteText !== undefined && { quoteText }),
          ...(author !== undefined && { author }),
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

  // Admin API: Hard delete a quote
  app.delete("/api/admin/quotes/:id", requireAdmin, async (req, res) => {
    try {
      const quoteId = parseInt(req.params.id);

      const [deleted] = await db
        .delete(dailyQuotes)
        .where(eq(dailyQuotes.id, quoteId))
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: "Quote not found" });
      }

      res.json({ success: true, message: "Quote deleted" });
    } catch (error) {
      console.error("Error deleting quote:", error);
      res.status(500).json({ error: "Failed to delete quote" });
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
      console.log("DEBUG /api/poh/current: Fetched POHs for user", userId, "Count:", userPOHs.length);

      const activePOH = userPOHs.find((p) => p.status === "active");
      const nextPOH = userPOHs.find((p) => p.status === "next");

      // Build ACTIVE POH response with full details (milestones, actions, today's rating)
      let activeResponse = null;
      if (activePOH) {
        const milestones = await storage.getPOHMilestones(activePOH.id);
        const actions = await storage.getPOHActions(activePOH.id);
        const today = new Date().toISOString().split("T")[0];
        const todayRating = await storage.getPOHRatingByDate(userId, today);

        // Generate signed URLs for vision images
        const visionImages = activePOH.visionImages || [];
        const signedVisionImages: (string | null)[] = [];
        for (const img of visionImages) {
          if (img && img !== "NULL") {
            try {
              // Extract key from stored URL - handle both direct R2 URLs and custom domains
              // Format 1: https://account.r2.cloudflarestorage.com/key
              // Format 2: https://custom-domain.com/key
              let key: string;
              if (img.includes(".r2.cloudflarestorage.com/")) {
                key = img.split(".r2.cloudflarestorage.com/")[1];
              } else if (img.startsWith("http")) {
                // Custom domain - extract path after domain
                const url = new URL(img);
                key = url.pathname.startsWith("/")
                  ? url.pathname.slice(1)
                  : url.pathname;
              } else {
                // Already just a key
                key = img;
              }
              const signedResult = await getSignedGetUrl(key, 3600); // 1 hour TTL
              signedVisionImages.push(
                signedResult.success ? signedResult.url! : null
              );
            } catch (err) {
              console.error(
                "Error generating signed URL for vision image:",
                err
              );
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
          customCategory: activePOH.customCategory,
          custom_category: activePOH.customCategory,
          started_at: activePOH.startedAt,
          vision_images: signedVisionImages,
          milestones: milestones.map((m) => ({
            id: m.id,
            text: m.text,
            achieved: m.achieved,
            achieved_at: m.achievedAt,
            order_index: m.orderIndex,
          })),
          actions: actions.map((a) => ({
            id: a.id,
            text: a.text,
            order: a.orderIndex,
          })),
          today_rating: todayRating ? todayRating.rating : null,
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
          customCategory: nextPOH.customCategory,
          custom_category: nextPOH.customCategory,
          milestones: [],
          actions: [],
        };
      }

      res.json({
        active: activeResponse,
        next: nextResponse,
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
      const { title, why, category, customCategory } = req.body;

      // Validate inputs using schema
      const validation = insertProjectOfHeartSchema.safeParse({
        userId,
        title,
        why,
        category,
        customCategory,
        status: "active", // Placeholder for validation
      });

      if (!validation.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validation.error.format(),
        });
      }

      // Check existing POHs to determine status
      const userPOHs = await storage.getUserPOHs(userId);
      const hasActive = userPOHs.some((p) => p.status === "active");
      const hasNext = userPOHs.some((p) => p.status === "next");

      let status: "active" | "next";
      let startedAt: string | null = null;

      if (!hasActive) {
        status = "active";
        startedAt = new Date().toISOString().split("T")[0]; // Today
      } else if (!hasNext) {
        status = "next";
      } else {
        return res.status(400).json({
          error:
            "Cannot create more POHs. You already have active and next projects.",
        });
      }

      const newPOH = await storage.createPOH({
        userId,
        title,
        why,
        category,
        customCategory,
        status,
        startedAt,
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
      const { title, why, category, customCategory } = req.body;

      // Verify ownership
      const poh = await storage.getPOHById(pohId);
      if (!poh || poh.userId !== userId) {
        return res.status(404).json({ error: "POH not found" });
      }

      // Validate inputs
      const updates: any = {};

      if (title !== undefined) {
        if (title.length > 120) {
          return res
            .status(400)
            .json({ error: "Title must be <= 120 characters" });
        }
        updates.title = title;
      }

      // Only active POH can update "why"
      if (why !== undefined) {
        if (poh.status !== "active") {
          return res
            .status(403)
            .json({ error: "Only active POH can update 'why' field" });
        }
        if (why.length > 500) {
          return res
            .status(400)
            .json({ error: "Why must be <= 500 characters" });
        }
        updates.why = why;
      }

      if (category !== undefined) {
        if (!pohCategoryEnum.safeParse(category).success) {
          return res.status(400).json({ error: "Invalid category" });
        }
        updates.category = category;

        // Custom category validation if other selected
        if (category === "other") {
          if (!customCategory || !customCategory.trim()) {
            return res.status(400).json({ error: "Custom category is required when 'other' is selected" });
          }
          updates.customCategory = customCategory.trim();
        } else {
          updates.customCategory = null;
        }
      } else if (customCategory !== undefined && poh.category === "other") {
        if (!customCategory || !customCategory.trim()) {
          return res.status(400).json({ error: "Custom category cannot be empty" });
        }
        updates.customCategory = customCategory.trim();
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
        return res
          .status(403)
          .json({ error: "Can only add milestones to active POH" });
      }

      // Validate text
      if (!text || text.length > 200) {
        return res.status(400).json({
          error: "Milestone text is required and must be <= 200 characters",
        });
      }

      // Check milestone count (max 5)
      const existingMilestones = await storage.getPOHMilestones(pohId);
      if (existingMilestones.length >= 5) {
        return res.status(400).json({ error: "Maximum 5 milestones per POH" });
      }

      const milestone = await storage.createPOHMilestone({
        pohId,
        text,
        orderIndex: existingMilestones.length,
      });

      res.status(201).json(milestone);
    } catch (error) {
      console.error("Error creating milestone:", error);
      res.status(500).json({ error: "Failed to create milestone" });
    }
  });

  // 5. POST /api/poh/milestone/:id/achieve - Achieve milestone
  app.post(
    "/api/poh/milestone/:id/achieve",
    authenticateJWT,
    async (req, res) => {
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
          return res
            .status(403)
            .json({ error: "Can only achieve milestones on active POH" });
        }

        if (milestone.achieved) {
          return res.status(400).json({ error: "Milestone already achieved" });
        }

        const today = new Date().toISOString().split("T")[0];
        const updatedMilestone = await storage.achievePOHMilestone(
          milestoneId,
          today
        );

        res.json(updatedMilestone);
      } catch (error) {
        console.error("Error achieving milestone:", error);
        res.status(500).json({ error: "Failed to achieve milestone" });
      }
    }
  );

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
          message: "Can only edit milestones on active POH",
        });
      }

      // Cannot edit achieved milestone
      if (milestone.achieved) {
        return res.status(403).json({
          error: "MILESTONE_LOCKED",
          message: "Achieved milestones cannot be edited.",
        });
      }

      if (!text || text.length > 200) {
        return res
          .status(400)
          .json({ error: "Milestone text must be <= 200 characters" });
      }

      const updatedMilestone = await storage.updatePOHMilestone(milestoneId, {
        text,
      });
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
        return res
          .status(403)
          .json({ error: "Can only update actions on active POH" });
      }

      // Validate actions
      if (!Array.isArray(actions) || actions.length > 3) {
        return res
          .status(400)
          .json({ error: "Actions must be an array with max 3 items" });
      }

      for (const action of actions) {
        if (typeof action !== "string" || action.length === 0) {
          return res
            .status(400)
            .json({ error: "Each action must be a non-empty string" });
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
      if (typeof rating !== "number" || rating < 0 || rating > 10) {
        return res
          .status(400)
          .json({ error: "Rating must be between 0 and 10" });
      }

      // Validate date format
      if (!local_date || !/^\d{4}-\d{2}-\d{2}$/.test(local_date)) {
        return res
          .status(400)
          .json({ error: "Invalid date format. Use YYYY-MM-DD" });
      }

      // Can only rate today - no backdating allowed
      const today = new Date().toISOString().split("T")[0];
      if (local_date !== today) {
        return res.status(403).json({
          error: "RATING_DATE_LOCKED",
          message: "Can only submit or update rating for today",
        });
      }

      // Check if rating exists for this date
      const existingRating = await storage.getPOHRatingByDate(
        userId,
        local_date
      );

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
          rating,
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
        return res.status(400).json({
          error: "Closing reflection is required (minimum 20 characters)",
        });
      }

      const today = new Date().toISOString().split("T")[0];

      // Complete the POH
      await storage.completePOH(pohId, {
        status: "completed",
        endedAt: today,
        closingReflection: closing_reflection,
      });

      // Promote NEXT -> ACTIVE
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
        return res.status(400).json({
          error: "Closing reflection is required (minimum 20 characters)",
        });
      }

      const today = new Date().toISOString().split("T")[0];

      // Close the POH early
      await storage.completePOH(pohId, {
        status: "closed_early",
        endedAt: today,
        closingReflection: closing_reflection,
      });

      // Promote NEXT -> ACTIVE
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
            .filter((m) => m.achieved)
            .map((m) => m.text);

          return {
            id: poh.id,
            title: poh.title,
            category: poh.category,
            customCategory: poh.customCategory,
            custom_category: poh.customCategory,
            status: poh.status,
            started_at: poh.startedAt,
            ended_at: poh.endedAt,
            closing_reflection: poh.closingReflection,
            milestones: achievedMilestones,
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
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("INVALID_IMAGE"));
      }
    },
  });

  // 12. POST /api/poh/:id/vision - Upload vision image
  app.post(
    "/api/poh/:id/vision",
    authenticateJWT,
    uploadPOHVision.single("image"),
    async (req, res) => {
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
            message: "Index must be 0, 1, or 2",
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
            message: "Can only upload vision images to active POH",
          });
        }

        // Check if file was uploaded
        if (!req.file) {
          return res.status(400).json({
            error: "INVALID_IMAGE",
            message: "No image file provided",
          });
        }

        // Determine file extension
        const extMap: { [key: string]: string } = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
        };
        const ext = extMap[req.file.mimetype] || "jpg";

        // Deterministic path: poh-visions/{user_id}/{poh_id}/vision-{index}.{ext}
        const key = `poh-visions/${userId}/${pohId}/vision-${index}.${ext}`;

        // Upload to R2
        const uploadResult = await uploadBufferToR2(
          req.file.buffer,
          key,
          req.file.mimetype
        );
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
          uploaded_index: index,
        });
      } catch (error: any) {
        console.error("Error uploading vision image:", error);
        if (error.message === "INVALID_IMAGE") {
          return res.status(400).json({
            error: "INVALID_IMAGE",
            message: "Only JPEG, PNG, and WebP images are allowed",
          });
        }
        res.status(500).json({ error: "Failed to upload vision image" });
      }
    }
  );

  // ===== PUSH NOTIFICATIONS =====

  // Get in-app notifications for logged-in user
  app.get("/api/v1/notifications", authenticateJWT, async (req, res) => {
    try {
      const userId = (req as any).user.sub;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const notifications = await storage.getUserNotifications(userId);

      res.json(notifications);
    } catch (error) {
      console.error("Error fetching user notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Get unread notification count
  app.get(
    "/api/v1/notifications/unread-count",
    authenticateJWT,
    async (req, res) => {
      try {
        const userId = (req as any).user.sub;
        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }
        const count = await storage.getUnreadNotificationCount(userId);
        res.json({ count });
      } catch (error) {
        console.error("Error fetching unread count:", error);
        res.status(500).json({ error: "Failed to fetch unread count" });
      }
    }
  );

  // Mark all notifications as read
  app.post(
    "/api/v1/notifications/read-all",
    authenticateJWT,
    async (req, res) => {
      try {
        const userId = (req as any).user.sub;
        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }
        await storage.markAllNotificationsAsRead(userId);
        res.json({ success: true });
      } catch (error) {
        console.error("Error marking all as read:", error);
        res.status(500).json({ error: "Failed to mark notifications as read" });
      }
    }
  );

  // Mark specific notification as read
  app.patch(
    "/api/v1/notifications/:id/read",
    authenticateJWT,
    async (req, res) => {
      try {
        const userId = (req as any).user.sub;
        const notificationId = Number(req.params.id);

        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        if (isNaN(notificationId)) {
          return res.status(400).json({ error: "Invalid notification ID" });
        }

        await storage.markNotificationAsRead(userId, notificationId);
        res.json({ success: true });
      } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ error: "Failed to mark notification as read" });
      }
    }
  );

  // Register device token for push notifications
  app.post(
    "/api/v1/notifications/register-device",
    authenticateJWT,
    async (req, res) => {
      try {
        const userId = (req as any).user.sub;

        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const { token, platform } = req.body;
        const platformValue =
          platform && typeof platform === "string" ? platform : "web";

        if (!token || typeof token !== "string") {
          return res.status(400).json({ error: "Token is required" });
        }

        if (platformValue.length > 10) {
          return res.status(400).json({ error: "Platform name too long" });
        }

        // Atomic UPSERT: Update if token exists (regardless of user), or insert as new
        // This allows multiple devices per user while keeping tokens unique
        await db
          .insert(deviceTokens)
          .values({
            userId,
            token,
            platform: platformValue,
          })
          .onConflictDoUpdate({
            target: deviceTokens.token,
            set: {
              userId,
              platform: platformValue,
            },
          });

        res.json({ success: true, message: "Device registered successfully" });
      } catch (error: any) {
        console.error("Error registering device token:", error);
        res.status(500).json({ error: "Failed to register device" });
      }
    }
  );

  // Unregister device token (called on logout or manual opt-out)
  app.delete(
    "/api/v1/notifications/unregister-device",
    authenticateJWT,
    async (req, res) => {
      try {
        const userId = (req as any).user.sub;

        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const { token } = req.body;

        if (token) {
          // Remove specific token
          await db
            .delete(deviceTokens)
            .where(
              and(
                eq(deviceTokens.userId, userId),
                eq(deviceTokens.token, token)
              )
            );
        } else {
          // Remove all tokens for this user (used on logout)
          await db.delete(deviceTokens).where(eq(deviceTokens.userId, userId));
        }

        res.json({ success: true, message: "Device unregistered" });
      } catch (error: any) {
        console.error("Error unregistering device token:", error);
        res.status(500).json({ error: "Failed to unregister device" });
      }
    }
  );

  // Get notification status for current user (DB source of truth)
  app.get("/api/v1/notifications/status", authenticateJWT, async (req, res) => {
    try {
      const userId = (req as any).user.sub;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const tokens = await db
        .select()
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
      const uniqueUserIds = new Set(allTokens.map((t) => t.userId));

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

      // Fetch all device tokens with userId
      const allTokens = await db
        .select({ token: deviceTokens.token, userId: deviceTokens.userId })
        .from(deviceTokens);

      if (allTokens.length === 0) {
        return res.json({
          success: true,
          message: "No devices registered",
          successCount: 0,
          failureCount: 0,
        });
      }

      // Create a notification record for in-app display
      const [notification] = await db
        .insert(notifications)
        .values({
          title,
          body,
          type: "admin_test",
          scheduledAt: new Date(),
          sent: true,
          requiredProgramCode: "",
          requiredProgramLevel: 0,
        })
        .returning();

      if (req.user) {
        logAudit({
          req,
          userId: req.user.sub,
          userEmail: req.user.email,
          action: "CREATE",
          entityType: "NOTIFICATION",
          entityId: notification.id,
          newValues: notification,
        });
      }

      const tokens = allTokens.map((t) => t.token);
      // Send with default deep link to notifications page
      const result = await sendPushNotification(tokens, title, body, {
        notificationId: notification.id.toString(),
        url: "/notifications",
        type: "admin_test",
      });

      // Create notification logs for each device token that received the push
      if (allTokens.length > 0 && notification) {
        const notificationLogRecords = allTokens.map((t) => ({
          notificationId: notification.id,
          userId: t.userId,
          deviceToken: t.token,
          status: "sent",
        }));
        await db.insert(notificationLogs).values(notificationLogRecords);
      }

      /* 
      // Clean up failed tokens (invalid tokens)
      if (result.failedTokens.length > 0) {
        for (const failedToken of result.failedTokens) {
          await db
            .delete(deviceTokens)
            .where(eq(deviceTokens.token, failedToken));
        }
      }
      */

      res.json({
        success: true,
        message: `Notification sent`,
        successCount: result.successCount,
        failureCount: result.failureCount,
        tokensCleanedUp: result.failedTokens.length,
      });
    } catch (error: any) {
      console.error("Error sending test notification:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // ===== DR. M QUESTIONS ROUTES =====

  // User: Get current month's question (if any) and all past questions
  app.get("/api/v1/drm/questions", authenticateJWT, async (req, res) => {
    try {
      const userId = (req as any).user.sub;
      const questions = await storage.getUserDrmQuestions(userId);

      // Get current month in YYYY-MM format
      const now = new Date();
      const currentMonthYear = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}`;

      // Check if user has submitted a question this month
      const hasSubmittedThisMonth = questions.some(
        (q) => q.monthYear === currentMonthYear
      );

      res.json({
        questions,
        currentMonthYear,
        hasSubmittedThisMonth,
      });
    } catch (error) {
      console.error("Error fetching DrM questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  // User: Get a specific question by ID (with audio URL if answered)
  app.get("/api/v1/drm/questions/:id", authenticateJWT, async (req, res) => {
    try {
      const userId = (req as any).user.sub;
      const questionId = parseInt(req.params.id);

      const question = await storage.getDrmQuestionById(questionId);

      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }

      // Ensure user can only access their own question
      if (question.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // If question has audio, generate signed URL
      let audioUrl = null;
      if (question.audioR2Key) {
        console.log("DrM audio R2 key:", question.audioR2Key);
        const result = await getSignedGetUrl(question.audioR2Key);
        console.log(
          "DrM signed URL result:",
          result.success,
          result.url ? "URL generated" : "No URL",
          result.error || ""
        );
        if (result.success && result.url) {
          audioUrl = result.url;
        }
      }

      res.json({
        ...question,
        audioUrl,
      });
    } catch (error) {
      console.error("Error fetching DrM question:", error);
      res.status(500).json({ error: "Failed to fetch question" });
    }
  });

  // User: Submit a new question
  app.post("/api/v1/drm/questions", authenticateJWT, async (req, res) => {
    try {
      const userId = (req as any).user.sub;
      const { questionText } = req.body;

      // Validate question text
      if (!questionText || typeof questionText !== "string") {
        return res.status(400).json({ error: "Question text is required" });
      }

      if (questionText.length > 240) {
        return res
          .status(400)
          .json({ error: "Question exceeds 240 character limit" });
      }

      if (questionText.trim().length === 0) {
        return res.status(400).json({ error: "Question cannot be empty" });
      }

      // Get current month in YYYY-MM format
      const now = new Date();
      const monthYear = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}`;

      // Check if user already submitted this month
      const existingQuestion = await storage.getDrmQuestionByUserMonth(
        userId,
        monthYear
      );
      if (existingQuestion) {
        return res
          .status(409)
          .json({ error: "You have already submitted a question this month" });
      }

      // Create the question
      const question = await storage.createDrmQuestion({
        userId,
        questionText: questionText.trim(),
        monthYear,
      });

      res.status(201).json({
        success: true,
        message: "Your question has been sent. Dr. M will respond soon.",
        question,
      });
    } catch (error) {
      console.error("Error submitting DrM question:", error);
      res.status(500).json({ error: "Failed to submit question" });
    }
  });

  // Admin: Get all questions
  app.get("/admin/api/drm/questions", requireAdmin, async (req, res) => {
    try {
      const questions = await storage.getAllDrmQuestions();
      res.json(questions);
    } catch (error) {
      console.error("Error fetching DrM questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  // Admin: Get a specific question by ID
  app.get("/admin/api/drm/questions/:id", requireAdmin, async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const question = await storage.getDrmQuestionById(questionId);

      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }

      // Get user name
      const user = await storage.getUserById(question.userId);

      // If question has audio, generate signed URL
      let audioUrl = null;
      if (question.audioR2Key) {
        const result = await getSignedGetUrl(question.audioR2Key);
        if (result.success && result.url) {
          audioUrl = result.url;
        }
      }

      res.json({
        ...question,
        userName: user?.name || "Unknown",
        audioUrl,
      });
    } catch (error) {
      console.error("Error fetching DrM question:", error);
      res.status(500).json({ error: "Failed to fetch question" });
    }
  });

  // Admin: Upload audio answer for a question
  app.post(
    "/admin/api/drm/questions/:id/answer",
    requireAdmin,
    async (req, res) => {
      try {
        const questionId = parseInt(req.params.id);
        const { mimeType } = req.body;

        const question = await storage.getDrmQuestionById(questionId);
        if (!question) {
          return res.status(404).json({ error: "Question not found" });
        }

        // Determine file extension based on mime type
        let extension = "webm";
        const contentType = mimeType || "audio/webm";
        if (contentType.includes("mp4") || contentType.includes("m4a")) {
          extension = "mp4";
        } else if (contentType.includes("ogg")) {
          extension = "ogg";
        }

        // Generate upload URL for audio with correct content type
        const audioKey = `drm-audio/questions/${questionId}/answer.${extension}`;
        const result = await getSignedPutUrl(audioKey, contentType);

        if (!result.success) {
          return res
            .status(500)
            .json({ error: result.error || "Failed to generate upload URL" });
        }

        res.json({
          uploadUrl: result.uploadUrl,
          audioKey,
        });
      } catch (error) {
        console.error("Error generating audio upload URL:", error);
        res.status(500).json({ error: "Failed to generate upload URL" });
      }
    }
  );

  // Admin: Confirm audio answer uploaded and trigger notification
  app.post(
    "/admin/api/drm/questions/:id/confirm-answer",
    requireAdmin,
    async (req, res) => {
      try {
        const questionId = parseInt(req.params.id);
        const { audioKey } = req.body;

        if (!audioKey) {
          return res.status(400).json({ error: "Audio key is required" });
        }

        const question = await storage.getDrmQuestionById(questionId);
        if (!question) {
          return res.status(404).json({ error: "Question not found" });
        }

        // Update question status
        const updatedQuestion = await storage.updateDrmQuestionAnswer(
          questionId,
          audioKey
        );

        if (!updatedQuestion) {
          return res.status(500).json({ error: "Failed to update question" });
        }

        if (req.user) {
          logAudit({
            req,
            userId: req.user.sub,
            userEmail: req.user.email,
            action: "UPDATE",
            entityType: "DRM_QUESTION",
            entityId: questionId,
            oldValues: { status: question.status },
            newValues: { status: "ANSWERED", audioR2Key: audioKey },
          });
        }

        // Create notification for the user
        const [notification] = await db
          .insert(notifications)
          .values({
            title: "Dr. M has answered your question 🎧",
            body: "Your personal voice response is ready to listen.",
            type: "drm_answer",
            scheduledAt: new Date(),
            sent: true,
            requiredProgramCode: "",
            requiredProgramLevel: 0,
          })
          .returning();

        // Get user's device tokens and send push notification
        const userTokens = await storage.getDeviceTokensByUserIds([
          question.userId,
        ]);

        if (userTokens.length > 0) {
          const tokens = userTokens.map((t) => t.token);
          const result = await sendPushNotification(
            tokens,
            "Dr. M has answered your question 🎧",
            "Your personal voice response is ready to listen.",
            {
              notificationId: notification.id.toString(),
              questionId: questionId.toString(),
              deepLink: `/dr-m/questions/${questionId}`,
            }
          );

          // Create notification logs
          const notificationLogRecords = userTokens.map((t) => ({
            notificationId: notification.id,
            userId: t.userId,
            deviceToken: t.token,
            status: result.successCount > 0 ? "sent" : "failed",
          }));
          await db.insert(notificationLogs).values(notificationLogRecords);
        } else {
          // Still create notification log for in-app display
          await db.insert(notificationLogs).values({
            notificationId: notification.id,
            userId: question.userId,
            deviceToken: "in-app-only",
            status: "sent",
          });
        }

        console.log(
          `DrM answer submitted for question ${questionId}, notification sent to user ${question.userId}`
        );

        // Generate signed URL for admin verification
        const audioUrl = await getSignedGetUrl(audioKey);

        res.json({
          success: true,
          message: "Answer submitted and user notified",
          question: updatedQuestion,
          audioUrl,
        });
      } catch (error) {
        console.error("Error confirming DrM answer:", error);
        res.status(500).json({ error: "Failed to confirm answer" });
      }
    }
  );

  // ===== ADMIN PROJECT OF HEART ROUTES =====
  // Observational only - aggregate data, no individual user data

  // 1. Usage - Are users creating Projects of Heart?
  app.get("/admin/api/poh/usage", requireAdmin, async (req, res) => {
    try {
      // Total users count
      const totalUsersResult = await db.select({ count: count() }).from(users);
      const totalUsers = Number(totalUsersResult[0]?.count) || 0;

      // Users with any POH (distinct user_id)
      const usersWithPohResult = await db
        .select({
          count: countDistinct(projectOfHearts.userId),
        })
        .from(projectOfHearts);
      const usersWithPoh = Number(usersWithPohResult[0]?.count) || 0;

      // Count by status
      const activeResult = await db
        .select({ count: count() })
        .from(projectOfHearts)
        .where(eq(projectOfHearts.status, "active"));
      const active = Number(activeResult[0]?.count) || 0;

      const nextResult = await db
        .select({ count: count() })
        .from(projectOfHearts)
        .where(eq(projectOfHearts.status, "next"));
      const next = Number(nextResult[0]?.count) || 0;

      res.json({
        total_users: totalUsers,
        users_with_poh: usersWithPoh,
        active,
        next,
      });
    } catch (error: any) {
      console.error("Error fetching POH usage:", error);
      res.status(500).json({ error: "Failed to fetch usage data" });
    }
  });

  // 2. Daily Check-ins - Are users reflecting daily?
  app.get("/admin/api/poh/daily-checkins", requireAdmin, async (req, res) => {
    try {
      const today = new Date().toISOString().split("T")[0];

      // Today's check-ins
      const todayResult = await db
        .select({
          count: countDistinct(pohDailyRatings.userId),
        })
        .from(pohDailyRatings)
        .where(eq(pohDailyRatings.localDate, today));
      const todayCheckedIn = Number(todayResult[0]?.count) || 0;

      // Active users count (for percentage)
      const activeUsersResult = await db
        .select({
          count: countDistinct(projectOfHearts.userId),
        })
        .from(projectOfHearts)
        .where(eq(projectOfHearts.status, "active"));
      const activeUsers = Number(activeUsersResult[0]?.count) || 0;

      const percentOfActive =
        activeUsers > 0 ? Math.round((todayCheckedIn / activeUsers) * 100) : 0;

      // Last 30 days check-ins
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

      const last30DaysResult = await db
        .select({
          date: pohDailyRatings.localDate,
          count: countDistinct(pohDailyRatings.userId),
        })
        .from(pohDailyRatings)
        .where(gte(pohDailyRatings.localDate, thirtyDaysAgoStr))
        .groupBy(pohDailyRatings.localDate)
        .orderBy(asc(pohDailyRatings.localDate));

      // Fill in missing dates with 0
      const dateMap = new Map(
        last30DaysResult.map((r) => [r.date, Number(r.count)])
      );
      const last30Days = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        last30Days.push({
          date: dateStr,
          users_checked_in: dateMap.get(dateStr) || 0,
        });
      }

      res.json({
        today: {
          date: today,
          users_checked_in: todayCheckedIn,
          percent_of_active_users: percentOfActive,
        },
        last_30_days: last30Days,
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

      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

      // Completed POH count
      const completedPohResult = await db
        .select({ count: count() })
        .from(projectOfHearts)
        .where(eq(projectOfHearts.status, "completed"));
      const completedPoh = Number(completedPohResult[0]?.count) || 0;

      // Milestones achieved in last 30 days
      const achieved30Result = await db
        .select({ count: count() })
        .from(pohMilestones)
        .where(
          and(
            eq(pohMilestones.achieved, true),
            gte(pohMilestones.achievedAt, thirtyDaysAgoStr)
          )
        );
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
      const avgDaysToFirst = Math.round(
        (firstMilestonesResult.rows[0] as any)?.avg_days || 0
      );

      res.json({
        completed_poh: Number(completedPoh),
        milestones_achieved_30_days: Number(milestonesAchieved30),
        avg_days_to_first_milestone: Number(avgDaysToFirst) || 0,
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
      const closedEarlyResult = await db
        .select({ count: count() })
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
      const activeNoMilestones = parseInt(
        (activeNoMilestonesResult.rows[0] as any)?.count || "0"
      );

      // Average active duration (for closed_early and completed)
      const avgDurationResult = await db.execute(sql`
        SELECT AVG(ended_at::date - started_at::date)::float as avg_days
        FROM project_of_hearts
        WHERE ended_at IS NOT NULL AND started_at IS NOT NULL
          AND status IN ('completed', 'closed_early')
      `);
      const avgDuration = Math.round(
        (avgDurationResult.rows[0] as any)?.avg_days || 0
      );

      res.json({
        closed_early: Number(closedEarly),
        active_with_no_milestones: Number(activeNoMilestones),
        avg_active_duration_days: Number(avgDuration) || 0,
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
      const categoryResult = await db
        .select({
          category: projectOfHearts.category,
          count: count(),
        })
        .from(projectOfHearts)
        .where(eq(projectOfHearts.status, "active"))
        .groupBy(projectOfHearts.category);

      // Build response object with all categories
      const categories: Record<string, number> = {
        career: 0,
        health: 0,
        relationships: 0,
        wealth: 0,
        other: 0,
      };

      categoryResult.forEach((r) => {
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

  // ===== GOLDMINE VIDEOS =====

  // Configure multer for goldmine video + thumbnail uploads (memory storage)
  const uploadGoldmineFiles = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB per file
  });

  // GET /api/admin/goldmine/videos — paginated list (admin only, all videos)
  app.get("/api/admin/goldmine/videos", requireAdmin, async (req, res) => {
    try {
      // Parse & validate page (default 1, min 1)
      let page = parseInt(req.query.page as string, 10);
      if (!Number.isFinite(page) || page < 1) page = 1;

      // Parse & validate limit (default 20, min 1, max 100)
      let limit = parseInt(req.query.limit as string, 10);
      if (!Number.isFinite(limit) || limit < 1 || limit > 100) limit = 20;

      const search = req.query.search as string | undefined;

      const { data, total } = await storage.listGoldmineVideos({
        page,
        limit,
        search,
      });

      // Generate signed URLs for thumbnails
      const dataWithSignedUrls = await Promise.all(
        data.map(async (v) => {
          let thumbnailSignedUrl: string | null = null;
          if (v.thumbnailKey) {
            const result = await getSignedGetUrl(v.thumbnailKey);
            if (result.success && result.url) {
              thumbnailSignedUrl = result.url;
            }
          }
          return { ...v, thumbnailSignedUrl };
        })
      );

      return res.json({
        data: dataWithSignedUrls,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      });
    } catch (error) {
      console.error("Error listing goldmine videos:", error);
      return res.status(500).json({ error: "Failed to fetch goldmine videos" });
    }
  });

  // GET /api/admin/goldmine/get-upload-urls
  app.get(
    "/api/admin/goldmine/get-upload-urls",
    requireAdmin,
    async (req, res) => {
      try {
        const videoContentType =
          (req.query.videoContentType as string) || "video/mp4";
        const thumbnailContentType =
          (req.query.thumbnailContentType as string) || "image/webp";

        const uuid = crypto.randomUUID();
        const videoKey = `goldmine/videos/${uuid}.mp4`;
        const thumbnailKey = `goldmine/thumbnails/${uuid}.webp`;

        const [videoResult, thumbnailResult] = await Promise.all([
          getSignedPutUrl(videoKey, videoContentType),
          getSignedPutUrl(thumbnailKey, thumbnailContentType),
        ]);

        if (!videoResult.success || !thumbnailResult.success) {
          return res
            .status(500)
            .json({ error: "Failed to generate upload URLs" });
        }

        return res.json({
          uuid,
          video: {
            uploadUrl: videoResult.uploadUrl,
            key: videoKey,
          },
          thumbnail: {
            uploadUrl: thumbnailResult.uploadUrl,
            key: thumbnailKey,
          },
        });
      } catch (error) {
        console.error("Error generating goldmine upload URLs:", error);
        return res
          .status(500)
          .json({ error: "Failed to generate upload URLs" });
      }
    }
  );

  // POST /api/admin/goldmine/videos/confirm
  app.post(
    "/api/admin/goldmine/videos/confirm",
    requireAdmin,
    async (req, res) => {
      try {
        const {
          id,
          title,
          description,
          videoKey,
          thumbnailKey,
          sizeMb,
          tags,
          isPublished,
        } = req.body;

        if (!id || !title || !videoKey || !thumbnailKey) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Normalize tags
        const tagsToProcess =
          typeof tags === "string"
            ? tags.split(",")
            : Array.isArray(tags)
            ? tags
            : [];
        const normalizedTags = Array.from(
          new Set(
            tagsToProcess
              .map((t: any) => String(t).trim().toLowerCase())
              .filter((t: string) => t.length > 0)
          )
        );

        const video = await storage.createGoldmineVideo({
          id,
          title: title.trim(),
          description: description?.trim() || null,
          r2Key: videoKey,
          thumbnailKey,
          durationSec: null,
          sizeMb: parseInt(sizeMb) || 0,
          tags: normalizedTags,
          isPublished: isPublished === true || isPublished === "true",
        });

        return res.status(201).json(video);
      } catch (error) {
        console.error("Error confirming goldmine video:", error);
        return res
          .status(500)
          .json({ error: "Failed to confirm goldmine video" });
      }
    }
  );

  // POST /api/admin/goldmine/videos
  app.post(
    "/api/admin/goldmine/videos",
    requireAdmin,
    uploadGoldmineFiles.fields([
      { name: "video", maxCount: 1 },
      { name: "thumbnail", maxCount: 1 },
    ]),
    async (req, res) => {
      try {
        const { title, description, tags: tagsRaw, isPublished } = req.body;
        const files = req.files as
          | { [fieldname: string]: Express.Multer.File[] }
          | undefined;

        // Validate required text fields
        if (!title || typeof title !== "string" || title.trim() === "") {
          return res.status(400).json({ error: "title is required" });
        }

        if (!tagsRaw) {
          return res.status(400).json({ error: "tags is required" });
        }

        // Validate required files
        if (!files?.video?.[0]) {
          return res.status(400).json({ error: "video file is required" });
        }
        if (!files?.thumbnail?.[0]) {
          return res.status(400).json({ error: "thumbnail file is required" });
        }

        const videoFile = files.video[0];
        const thumbnailFile = files.thumbnail[0];

        // Generate UUID and derive R2 keys (ONLY inside goldmine/ folders)
        const uuid = crypto.randomUUID();
        const videoKey = `goldmine/videos/${uuid}.mp4`;
        const thumbnailKey = `goldmine/thumbnails/${uuid}.webp`;

        // Normalize tags: handle string or array, split, trim, lowercase, remove empty, deduplicate
        const tagsToProcess =
          typeof tagsRaw === "string"
            ? tagsRaw.split(",")
            : Array.isArray(tagsRaw)
            ? tagsRaw
            : [];
        if (tagsToProcess.length === 0 && !Array.isArray(tagsRaw)) {
          return res.status(400).json({
            error: "tags must be a comma-separated string or an array",
          });
        }

        const normalizedTags = Array.from(
          new Set(
            tagsToProcess
              .map((t: any) => String(t).trim().toLowerCase())
              .filter((t: string) => t.length > 0)
          )
        );

        // Calculate sizeMb from video file buffer
        const sizeMb = Math.ceil(videoFile.size / (1024 * 1024));

        // Upload video to R2
        const videoUpload = await uploadBufferToR2(
          videoFile.buffer,
          videoKey,
          videoFile.mimetype || "video/mp4"
        );
        if (!videoUpload.success) {
          console.error("Goldmine video R2 upload failed:", videoUpload.error);
          return res
            .status(500)
            .json({ error: "Failed to upload video to R2" });
        }

        // Upload thumbnail to R2
        const thumbnailUpload = await uploadBufferToR2(
          thumbnailFile.buffer,
          thumbnailKey,
          thumbnailFile.mimetype || "image/webp"
        );
        if (!thumbnailUpload.success) {
          console.error(
            "Goldmine thumbnail R2 upload failed:",
            thumbnailUpload.error
          );
          return res
            .status(500)
            .json({ error: "Failed to upload thumbnail to R2" });
        }

        // Insert record into goldmine_videos
        const video = await storage.createGoldmineVideo({
          id: uuid,
          title: title.trim(),
          description: description?.trim() || null,
          r2Key: videoKey,
          thumbnailKey,
          durationSec: null,
          sizeMb,
          tags: normalizedTags,
          isPublished: isPublished === "true" || isPublished === true,
        });

        if (req.user) {
          logAudit({
            req,
            userId: req.user.sub,
            userEmail: req.user.email,
            action: "CREATE",
            entityType: "GOLDMINE_VIDEO",
            entityId: video.id,
            newValues: {
              title: video.title,
              description: video.description,
              isPublished: video.isPublished,
              tags: video.tags,
            },
          });
        }

        return res.status(201).json(video);
      } catch (error) {
        console.error("Error creating goldmine video:", error);
        return res
          .status(500)
          .json({ error: "Failed to create goldmine video" });
      }
    }
  );

  // DELETE /api/admin/goldmine/videos/:id (admin only)
  app.delete(
    "/api/admin/goldmine/videos/:id",
    requireAdmin,
    async (req, res) => {
      try {
        const { id } = req.params;

        const video = await storage.getGoldmineVideo(id);
        if (!video) {
          return res.status(404).json({ error: "Video not found" });
        }

        // Delete R2 objects
        if (video.r2Key) {
          const videoDeletion = await deleteR2Object(video.r2Key);
          if (!videoDeletion.success) {
            console.error(
              "Goldmine video R2 deletion failed:",
              videoDeletion.error
            );
            return res
              .status(500)
              .json({ error: "Failed to delete video from storage" });
          }
        }

        if (video.thumbnailKey) {
          const thumbnailDeletion = await deleteR2Object(video.thumbnailKey);
          if (!thumbnailDeletion.success) {
            console.error(
              "Goldmine thumbnail R2 deletion failed:",
              thumbnailDeletion.error
            );
            return res
              .status(500)
              .json({ error: "Failed to delete thumbnail from storage" });
          }
        }

        // Delete database record
        const result = await storage.deleteGoldmineVideo(id);
        if (!result) {
          return res
            .status(500)
            .json({ error: "Failed to delete video record" });
        }

        if (req.user) {
          logAudit({
            req,
            userId: req.user.sub,
            userEmail: req.user.email,
            action: "DELETE",
            entityType: "GOLDMINE_VIDEO",
            entityId: id,
            oldValues: {
              title: video.title,
              description: video.description,
              isPublished: video.isPublished,
              tags: video.tags,
            },
          });
        }

        return res.json({ success: true });
      } catch (error) {
        console.error("Error deleting goldmine video:", error);
        return res
          .status(500)
          .json({ error: "Failed to delete goldmine video" });
      }
    }
  );

  // PATCH /api/admin/goldmine/videos/:id (admin only)
  app.patch(
    "/api/admin/goldmine/videos/:id",
    requireAdmin,
    uploadGoldmineFiles.single("thumbnail"),
    async (req, res) => {
      try {
        const { id } = req.params;
        const { title, description, tags, isPublished } = req.body;
        const thumbnailFile = req.file;

        const video = await storage.getGoldmineVideo(id);
        if (!video) {
          return res.status(404).json({ error: "Video not found" });
        }

        const updateData: any = {};

        // Metadata update logic
        if (title !== undefined) {
          if (typeof title !== "string" || title.trim() === "") {
            return res.status(400).json({ error: "title must not be empty" });
          }
          updateData.title = title.trim();
        }

        if (description !== undefined) {
          updateData.description = description?.trim() || null;
        }

        if (tags !== undefined) {
          const tagsToProcess =
            typeof tags === "string"
              ? tags.split(",")
              : Array.isArray(tags)
              ? tags
              : null;
          if (tagsToProcess === null) {
            return res
              .status(400)
              .json({ error: "tags must be a string or an array" });
          }

          updateData.tags = Array.from(
            new Set(
              tagsToProcess
                .map((t: any) => String(t).trim().toLowerCase())
                .filter((t: string) => t.length > 0)
            )
          );
        }

        if (isPublished !== undefined) {
          updateData.isPublished =
            isPublished === "true" || isPublished === true;
        }

        // Thumbnail replacement logic
        if (thumbnailFile) {
          const thumbnailKey = `goldmine/thumbnails/${id}.webp`;

          // Upload new thumbnail
          const uploadResult = await uploadBufferToR2(
            thumbnailFile.buffer,
            thumbnailKey,
            thumbnailFile.mimetype || "image/webp"
          );

          if (!uploadResult.success) {
            console.error(
              "Goldmine thumbnail replacement R2 upload failed:",
              uploadResult.error
            );
            return res
              .status(500)
              .json({ error: "Failed to upload new thumbnail" });
          }

          // Delete old thumbnail AFTER successful upload (if key is different, but here it's likely the same)
          // If the key is exactly the same, R2 overwrites it, but we follow the deletion requirement if keys were different
          // Since our key pattern is goldmine/thumbnails/{id}.webp, it will be the same key.
          // However, if the old key was different for some reason, we'd delete it.
          if (video.thumbnailKey && video.thumbnailKey !== thumbnailKey) {
            const deleteResult = await deleteR2Object(video.thumbnailKey);
            if (!deleteResult.success) {
              console.error(
                "Goldmine old thumbnail R2 deletion failed:",
                deleteResult.error
              );
              return res
                .status(500)
                .json({ error: "Failed to delete old thumbnail" });
            }
          }

          updateData.thumbnailKey = thumbnailKey;
        }

        const updatedVideo = await storage.updateGoldmineVideo(id, updateData);
        if (!updatedVideo) {
          return res
            .status(404)
            .json({ error: "Video not found during update" });
        }

        if (req.user) {
          logAudit({
            req,
            userId: req.user.sub,
            userEmail: req.user.email,
            action: "UPDATE",
            entityType: "GOLDMINE_VIDEO",
            entityId: id,
            oldValues: {
              title: video.title,
              description: video.description,
              isPublished: video.isPublished,
              tags: video.tags,
            },
            newValues: updateData,
          });
        }

        return res.json(updatedVideo);
      } catch (error) {
        console.error("Error updating goldmine video:", error);
        return res
          .status(500)
          .json({ error: "Failed to update goldmine video" });
      }
    }
  );

  // GET /api/goldmine/videosList (authenticated user, only published)
  app.get("/api/goldmine/videosList", authenticateJWT, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(1, parseInt(req.query.limit as string) || 20);
      const search = req.query.search as string | undefined;

      const { data: videos, total } = await storage.listPublishedGoldmineVideos(
        {
          page,
          limit,
          search,
        }
      );

      // Transform and generate signed URLs
      const transformedVideos = await Promise.all(
        videos.map(async (v) => {
          let thumbnailUrl = "";
          if (v.thumbnailKey) {
            const result = await getSignedGetUrl(v.thumbnailKey);
            if (result.success && result.url) {
              thumbnailUrl = result.url;
            }
          }

          return {
            id: v.id,
            title: v.title,
            description: v.description,
            thumbnailUrl,
            durationSec: v.durationSec,
            createdAt: v.createdAt,
          };
        })
      );

      return res.json({
        data: transformedVideos,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error listing public goldmine videos:", error);
      return res.status(500).json({ error: "Failed to list videos" });
    }
  });

  // GET /api/goldmine/videos/:id/play (authenticated user, only published)
  app.get(
    "/api/goldmine/videos/:id/play",
    authenticateJWT,
    async (req, res) => {
      try {
        const { id } = req.params;

        const video = await storage.getGoldmineVideo(id);

        // Validate existence and publication status
        if (!video || !video.isPublished) {
          return res.status(404).json({ error: "Video not found" });
        }

        // Generate signed URL for the video file
        if (!video.r2Key) {
          return res.status(500).json({ error: "Video file key missing" });
        }

        const result = await getSignedGetUrl(video.r2Key);
        if (!result.success || !result.url) {
          return res
            .status(500)
            .json({ error: "Failed to generate video playback URL" });
        }

        return res.json({
          videoUrl: result.url,
        });
      } catch (error) {
        console.error("Error getting goldmine video playback URL:", error);
        return res.status(500).json({ error: "Failed to fetch playback URL" });
      }
    }
  );

  const httpServer = createServer(app);

  return httpServer;
}
