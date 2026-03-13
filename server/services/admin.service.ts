import bcrypt from "bcryptjs";
import { adminRepository } from "../repositories/admin.repository";
import type { InsertUser, InsertProgram } from "@shared/schema";

export const adminService = {
  // ─── Programs ─────────────────────────────────────────────────────────────

  async getAllPrograms() {
    return await adminRepository.getAllPrograms();
  },

  async createProgram(data: InsertProgram) {
    return await adminRepository.createProgram(data);
  },

  async updateProgram(id: number, data: Partial<InsertProgram>) {
    return await adminRepository.updateProgram(id, data);
  },

  async deleteProgram(id: number) {
    return await adminRepository.deleteProgram(id);
  },

  async getProgramById(id: number) {
    return await adminRepository.findProgramById(id);
  },

  // ─── Students ─────────────────────────────────────────────────────────────

  async getStudents(params: {
    search?: string;
    programCode?: string;
    page?: number;
    limit?: number;
  }) {
    return await adminRepository.getStudents(params);
  },

  async getStudentById(id: number) {
    return await adminRepository.getStudentById(id);
  },

  async createStudent(data: {
    name: string;
    email: string;
    phone?: string | null;
    password?: string;
    programCode?: string;
  }) {
    const existingUser = await adminRepository.findUserByEmail(data.email);
    if (existingUser) throw new Error("Email already registered");

    const passwordHash = await bcrypt.hash(data.password || "User@123", 10);
    return await adminRepository.createStudent(
      {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        passwordHash,
        role: "USER",
        status: "active",
      },
      data.programCode
    );
  },

  async updateStudent(
    id: number,
    data: { name?: string; email?: string; phone?: string | null; status?: string },
    programCode?: string
  ) {
    return await adminRepository.updateStudent(id, data, programCode);
  },

  async updateStudentStatus(id: number, status: string) {
    return await adminRepository.updateStudentStatus(id, status);
  },

  async deleteStudent(id: number) {
    return await adminRepository.deleteStudent(id);
  },

  async resetStudentPassword(id: number, password: string) {
    const user = await adminRepository.findUserById(id);
    if (!user) throw new Error("Student not found");
    const hashedPassword = await bcrypt.hash(password, 10);
    await adminRepository.resetUserPassword(id, hashedPassword);
  },

  async bulkCreateStudents(
    records: { name: string; email: string; phone: string | null }[],
    programId: number
  ) {
    const program = await adminRepository.findProgramById(programId);
    if (!program) throw new Error("Invalid program selected");

    const defaultPassword = "User@123";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const errors: { row: number; reason: string }[] = [];
    let created = 0;

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2;

      if (!row.name) {
        errors.push({ row: rowNumber, reason: "Missing full_name" });
        continue;
      }
      if (!row.email) {
        errors.push({ row: rowNumber, reason: "Missing email" });
        continue;
      }
      if (!emailRegex.test(row.email)) {
        errors.push({ row: rowNumber, reason: "Invalid email format" });
        continue;
      }

      const existingUser = await adminRepository.findUserByEmail(row.email);
      if (existingUser) {
        errors.push({ row: rowNumber, reason: "Email already exists" });
        continue;
      }

      try {
        await adminRepository.createStudent(
          { name: row.name, email: row.email, phone: row.phone, passwordHash, role: "USER", status: "active" },
          program.code
        );
        created++;
      } catch (err: any) {
        errors.push({ row: rowNumber, reason: err.message || "Failed to create student" });
      }
    }

    return { totalRows: records.length, created, skipped: errors.length, errors };
  },

  // ─── Admins ───────────────────────────────────────────────────────────────

  async getAdmins(params: { search?: string; page?: number; limit?: number }) {
    return await adminRepository.getAdmins(params);
  },

  async getAdminById(id: number) {
    return await adminRepository.getAdminById(id);
  },

  async createAdmin(data: {
    name: string;
    email: string;
    phone?: string | null;
    password?: string;
    role: string;
    status?: string;
  }) {
    const existingUser = await adminRepository.findUserByEmail(data.email);
    if (existingUser) throw new Error("Email already registered");

    const passwordHash = await bcrypt.hash(data.password || "Admin@123", 10);
    return await adminRepository.createAdmin({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      passwordHash,
      role: data.role,
      status: data.status || "active",
    });
  },

  async updateAdmin(id: number, data: { name?: string; email?: string; role?: string; status?: string }) {
    return await adminRepository.updateAdmin(id, data);
  },

  async updateAdminStatus(id: number, status: string, requestingUserId?: number) {
    if (requestingUserId !== undefined && requestingUserId === id) {
      throw new Error("Cannot change your own status");
    }
    return await adminRepository.updateAdminStatus(id, status);
  },

  async deleteAdmin(id: number, requestingUserId?: number) {
    if (requestingUserId !== undefined && requestingUserId === id) {
      throw new Error("Cannot delete yourself");
    }
    return await adminRepository.deleteAdmin(id);
  },
};
