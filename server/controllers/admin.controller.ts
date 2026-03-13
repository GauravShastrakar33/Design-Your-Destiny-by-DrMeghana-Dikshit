import { Request, Response } from "express";
import multer from "multer";
import { adminService } from "../services/admin.service";
import { logAudit } from "../utils/audit";

export const adminController = {
  // ═══════════════════════════════════════════════════════════════════
  // PROGRAMS
  // ═══════════════════════════════════════════════════════════════════

  async getAllPrograms(req: Request, res: Response) {
    try {
      const programs = await adminService.getAllPrograms();
      res.json(programs);
    } catch (error) {
      console.error("Error fetching programs:", error);
      res.status(500).json({ error: "Failed to fetch programs" });
    }
  },

  async createProgram(req: Request, res: Response) {
    try {
      const { name, code, level, isActive } = req.body;
      if (!name || !code || level === undefined) {
        return res.status(400).json({ error: "Name, code and level are required" });
      }
      const program = await adminService.createProgram({ name, code, level: parseInt(level), isActive });
      res.status(201).json(program);
    } catch (error) {
      console.error("Error creating program:", error);
      res.status(500).json({ error: "Failed to create program" });
    }
  },

  async updateProgram(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { name, code, level, isActive } = req.body;
      const program = await adminService.updateProgram(id, {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(level !== undefined && { level: parseInt(level) }),
        ...(isActive !== undefined && { isActive }),
      });
      if (!program) return res.status(404).json({ error: "Program not found" });
      res.json(program);
    } catch (error) {
      console.error("Error updating program:", error);
      res.status(500).json({ error: "Failed to update program" });
    }
  },

  async deleteProgram(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const success = await adminService.deleteProgram(id);
      if (!success) return res.status(404).json({ error: "Program not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting program:", error);
      res.status(500).json({ error: "Failed to delete program" });
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  // STUDENTS
  // ═══════════════════════════════════════════════════════════════════

  async getStudents(req: Request, res: Response) {
    try {
      const search = req.query.search as string | undefined;
      const program = req.query.program as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await adminService.getStudents({ search, programCode: program, page, limit });
      res.json(result);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  },

  async getStudentById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const student = await adminService.getStudentById(id);
      if (!student) return res.status(404).json({ error: "Student not found" });
      res.json(student);
    } catch (error) {
      console.error("Error fetching student:", error);
      res.status(500).json({ error: "Failed to fetch student" });
    }
  },

  async createStudent(req: Request, res: Response) {
    try {
      const { name, email, phone, password, programCode } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
      }

      const student = await adminService.createStudent({ name, email, phone, password, programCode });

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
    } catch (error: any) {
      if (error.message === "Email already registered") {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error creating student:", error);
      res.status(500).json({ error: "Failed to create student" });
    }
  },

  async updateStudent(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { name, email, phone, status, programCode } = req.body;

      const student = await adminService.updateStudent(id, { name, email, phone, status }, programCode);
      if (!student) return res.status(404).json({ error: "Student not found" });

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
  },

  async updateStudentStatus(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!["active", "blocked"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const student = await adminService.updateStudentStatus(id, status);
      if (!student) return res.status(404).json({ error: "Student not found" });

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
  },

  async deleteStudent(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const student = await adminService.getStudentById(id);
      const success = await adminService.deleteStudent(id);

      if (!success) return res.status(404).json({ error: "Student not found" });

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
  },

  async resetStudentPassword(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { password } = req.body;

      if (!password || typeof password !== "string" || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      await adminService.resetStudentPassword(id, password);

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
    } catch (error: any) {
      if (error.message === "Student not found") {
        return res.status(404).json({ error: error.message });
      }
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  },

  async downloadSampleCsv(req: Request, res: Response) {
    const sampleCSV = `full_name,email,phone\nJohn Doe,john.doe@example.com,+1234567890\nJane Smith,jane.smith@example.com,\nBob Wilson,bob.wilson@example.com,+9876543210`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=student_upload_sample.csv");
    res.send(sampleCSV);
  },

  async bulkUploadStudents(req: Request, res: Response) {
    try {
      const { parse } = await import("csv-parse/sync");

      if (!req.file) {
        return res.status(400).json({ error: "CSV file is required" });
      }

      const programId = req.body.programId;
      if (!programId) {
        return res.status(400).json({ error: "Program is required" });
      }

      const csvContent = req.file.buffer.toString("utf-8");
      let records: any[];
      try {
        records = parse(csvContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          relax_column_count: true,
        });
      } catch {
        return res.status(400).json({ error: "Invalid CSV format. Please check file structure." });
      }

      if (records.length > 1000) {
        return res.status(400).json({ error: "Maximum 1000 rows allowed per upload" });
      }

      const normalised = records.map((row: any) => ({
        name: (row.full_name || row.name || "").trim(),
        email: (row.email || "").trim().toLowerCase(),
        phone: (row.phone || "").trim() || null,
      }));

      const result = await adminService.bulkCreateStudents(normalised, parseInt(programId));
      res.json(result);
    } catch (error) {
      console.error("Error in bulk upload:", error);
      res.status(500).json({ error: "Failed to process bulk upload" });
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  // ADMINS
  // ═══════════════════════════════════════════════════════════════════

  async getAdmins(req: Request, res: Response) {
    try {
      const search = req.query.search as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await adminService.getAdmins({ search, page, limit });
      res.json(result);
    } catch (error) {
      console.error("Error fetching admins:", error);
      res.status(500).json({ error: "Failed to fetch admins" });
    }
  },

  async getAdminById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const admin = await adminService.getAdminById(id);
      if (!admin) return res.status(404).json({ error: "Admin not found" });
      res.json(admin);
    } catch (error) {
      console.error("Error fetching admin:", error);
      res.status(500).json({ error: "Failed to fetch admin" });
    }
  },

  async createAdmin(req: Request, res: Response) {
    try {
      const { name, email, phone, password, role, status } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
      }
      if (!["SUPER_ADMIN", "COACH"].includes(role)) {
        return res.status(400).json({ error: "Role must be SUPER_ADMIN or COACH" });
      }

      const admin = await adminService.createAdmin({ name, email, phone, password, role, status });
      res.status(201).json({ message: "Admin created", adminId: admin.id });
    } catch (error: any) {
      if (error.message === "Email already registered") {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error creating admin:", error);
      res.status(500).json({ error: "Failed to create admin" });
    }
  },

  async updateAdmin(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { name, email, role, status } = req.body;

      if (role && !["SUPER_ADMIN", "COACH"].includes(role)) {
        return res.status(400).json({ error: "Role must be SUPER_ADMIN or COACH" });
      }

      const admin = await adminService.updateAdmin(id, { name, email, role, status });
      if (!admin) return res.status(404).json({ error: "Admin not found" });
      res.json({ message: "Admin updated" });
    } catch (error) {
      console.error("Error updating admin:", error);
      res.status(500).json({ error: "Failed to update admin" });
    }
  },

  async updateAdminStatus(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!["active", "blocked"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const admin = await adminService.updateAdminStatus(id, status, req.user?.sub);
      if (!admin) return res.status(404).json({ error: "Admin not found" });
      res.json({ message: "Status updated" });
    } catch (error: any) {
      if (error.message === "Cannot change your own status") {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error updating admin status:", error);
      res.status(500).json({ error: "Failed to update status" });
    }
  },

  async deleteAdmin(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      const success = await adminService.deleteAdmin(id, req.user?.sub);
      if (!success) return res.status(404).json({ error: "Admin not found" });
      res.json({ message: "Admin deleted" });
    } catch (error: any) {
      if (error.message === "Cannot delete yourself") {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error deleting admin:", error);
      res.status(500).json({ error: "Failed to delete admin" });
    }
  },
};

// Multer instance for CSV uploads (exported for use in routes)
export const uploadCSV = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
});
