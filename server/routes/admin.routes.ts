import { Router } from "express";
import { authenticateJWT } from "../middleware/auth";
import { requireAdmin, requireSuperAdmin } from "../middleware/rbac";
import { adminController, uploadCSV } from "../controllers/admin.controller";

const router = Router();

// ═══════════════════════════════════════════════════════════════════════
// STUDENT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

router.get("/admin/v1/students", authenticateJWT, requireAdmin, adminController.getStudents);
router.get("/admin/v1/students/:id", authenticateJWT, requireAdmin, adminController.getStudentById);
router.post("/admin/v1/students", authenticateJWT, requireAdmin, adminController.createStudent);
router.put("/admin/v1/students/:id", authenticateJWT, requireAdmin, adminController.updateStudent);
router.patch("/admin/v1/students/:id/status", authenticateJWT, requireAdmin, adminController.updateStudentStatus);
router.delete("/admin/v1/students/:id", authenticateJWT, requireAdmin, adminController.deleteStudent);
router.post("/admin/v1/students/:id/reset-password", authenticateJWT, requireAdmin, adminController.resetStudentPassword);

// CSV bulk upload
router.get("/api/admin/students/sample-csv", authenticateJWT, requireAdmin, adminController.downloadSampleCsv);
router.post("/api/admin/students/bulk-upload", authenticateJWT, requireAdmin, uploadCSV.single("file"), adminController.bulkUploadStudents);

// ═══════════════════════════════════════════════════════════════════════
// ADMIN MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

router.get("/admin/v1/admins", authenticateJWT, requireAdmin, adminController.getAdmins);
router.get("/admin/v1/admins/:id", authenticateJWT, requireSuperAdmin, adminController.getAdminById);
router.post("/admin/v1/admins", authenticateJWT, requireSuperAdmin, adminController.createAdmin);
router.put("/admin/v1/admins/:id", authenticateJWT, requireSuperAdmin, adminController.updateAdmin);
router.patch("/admin/v1/admins/:id/status", authenticateJWT, requireSuperAdmin, adminController.updateAdminStatus);
router.delete("/admin/v1/admins/:id", authenticateJWT, requireSuperAdmin, adminController.deleteAdmin);

export default router;
