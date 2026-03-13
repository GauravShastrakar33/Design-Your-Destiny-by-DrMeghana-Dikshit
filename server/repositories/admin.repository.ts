import { db } from "../db";
import {
  users,
  userPrograms,
  programs,
} from "@shared/schema";
import { eq, and, or, ilike, inArray, count } from "drizzle-orm";
import type { User, InsertUser, InsertProgram, Program } from "@shared/schema";

export type UserWithPrograms = User & { programs: string[] };

// ─── Shared helpers ────────────────────────────────────────────────────────────

async function getUserProgramCodes(userId: number): Promise<string[]> {
  const links = await db
    .select()
    .from(userPrograms)
    .where(eq(userPrograms.userId, userId));
  if (links.length === 0) return [];

  const programIds = links.map((l) => l.programId);
  const progs = await db
    .select()
    .from(programs)
    .where(inArray(programs.id, programIds));
  return progs.map((p) => p.code);
}

export const adminRepository = {
  // ─── User lookup ──────────────────────────────────────────────────────────

  async findUserByEmail(email: string): Promise<User | undefined> {
    return await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, email),
    });
  },

  async findUserById(id: number): Promise<User | undefined> {
    return await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, id),
    });
  },

  async resetUserPassword(id: number, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ passwordHash: hashedPassword, forcePasswordChange: true })
      .where(eq(users.id, id));
  },

  // ─── Programs ────────────────────────────────────────────────────────────

  async findProgramByCode(code: string) {
    return await db.query.programs.findFirst({
      where: (p, { eq }) => eq(p.code, code),
    });
  },

  async findProgramById(id: number) {
    return await db.query.programs.findFirst({
      where: (p, { eq }) => eq(p.id, id),
    });
  },

  async getAllPrograms() {
    return await db.query.programs.findMany({
      orderBy: (p, { asc }) => [asc(p.code)],
    });
  },

  async createProgram(data: InsertProgram): Promise<Program> {
    const [p] = await db.insert(programs).values(data).returning();
    return p;
  },

  async updateProgram(id: number, data: Partial<InsertProgram>): Promise<Program | undefined> {
    const [p] = await db.update(programs).set(data).where(eq(programs.id, id)).returning();
    return p;
  },

  async deleteProgram(id: number): Promise<boolean> {
    const result = await db.delete(programs).where(eq(programs.id, id)).returning();
    return result.length > 0;
  },

  async assignUserProgram(userId: number, programId: number): Promise<void> {
    await db.insert(userPrograms).values({ userId, programId });
  },

  async clearUserPrograms(userId: number): Promise<void> {
    await db.delete(userPrograms).where(eq(userPrograms.userId, userId));
  },

  // ─── Students ────────────────────────────────────────────────────────────

  async getStudents(params: {
    search?: string;
    programCode?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: UserWithPrograms[];
    pagination: { total: number; page: number; pages: number };
  }> {
    const { search = "", programCode = "ALL", page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    let userIdsFilter: number[] | null = null;

    if (programCode && programCode !== "ALL") {
      const program = await this.findProgramByCode(programCode);
      if (program) {
        const links = await db
          .select()
          .from(userPrograms)
          .where(eq(userPrograms.programId, program.id));
        userIdsFilter = links.map((l) => l.userId);
        if (userIdsFilter.length === 0) {
          return { data: [], pagination: { total: 0, page: 1, pages: 1 } };
        }
      }
    }

    const conditions: any[] = [eq(users.role, "USER")];
    if (search) {
      conditions.push(
        or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`))!
      );
    }
    if (userIdsFilter) {
      conditions.push(inArray(users.id, userIdsFilter));
    }

    const totalResult = await db
      .select({ count: count() })
      .from(users)
      .where(and(...conditions));
    const total = totalResult[0]?.count || 0;

    const students = await db
      .select()
      .from(users)
      .where(and(...conditions))
      .orderBy(users.createdAt)
      .limit(limit)
      .offset(offset);

    const data = await Promise.all(
      students.map(async (s) => ({
        ...s,
        programs: await getUserProgramCodes(s.id),
      }))
    );

    return { data, pagination: { total, page, pages: Math.ceil(total / limit) || 1 } };
  },

  async getStudentById(id: number): Promise<UserWithPrograms | undefined> {
    const student = await db.query.users.findFirst({
      where: (u, { eq, and }) => and(eq(u.id, id), eq(u.role, "USER")),
    });
    if (!student) return undefined;
    return { ...student, programs: await getUserProgramCodes(id) };
  },

  async createStudent(student: InsertUser, programCode?: string): Promise<User> {
    const [newStudent] = await db
      .insert(users)
      .values({ ...student, role: "USER", status: student.status || "active" })
      .returning();

    if (programCode) {
      const program = await this.findProgramByCode(programCode);
      if (program) await this.assignUserProgram(newStudent.id, program.id);
    }
    return newStudent;
  },

  async updateStudent(
    id: number,
    data: Partial<InsertUser>,
    programCode?: string
  ): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();

    if (programCode) {
      await this.clearUserPrograms(id);
      const program = await this.findProgramByCode(programCode);
      if (program) await this.assignUserProgram(id, program.id);
    }
    return updated;
  },

  async updateStudentStatus(id: number, status: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ status })
      .where(eq(users.id, id))
      .returning();
    return updated;
  },

  async deleteStudent(id: number): Promise<boolean> {
    await this.clearUserPrograms(id);
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  },

  // ─── Admins ──────────────────────────────────────────────────────────────

  async getAdmins(params: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: User[]; pagination: { total: number; page: number; pages: number } }> {
    const { search = "", page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    const conditions: any[] = [
      or(eq(users.role, "SUPER_ADMIN"), eq(users.role, "COACH"))!,
    ];
    if (search) {
      conditions.push(
        or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`))!
      );
    }

    const totalResult = await db
      .select({ count: count() })
      .from(users)
      .where(and(...conditions));
    const total = totalResult[0]?.count || 0;

    const admins = await db
      .select()
      .from(users)
      .where(and(...conditions))
      .orderBy(users.createdAt)
      .limit(limit)
      .offset(offset);

    return { data: admins, pagination: { total, page, pages: Math.ceil(total / limit) || 1 } };
  },

  async getAdminById(id: number): Promise<User | undefined> {
    return await db.query.users.findFirst({
      where: (u, { eq, and, or }) =>
        and(eq(u.id, id), or(eq(u.role, "SUPER_ADMIN"), eq(u.role, "COACH"))),
    });
  },

  async createAdmin(admin: InsertUser): Promise<User> {
    const [newAdmin] = await db
      .insert(users)
      .values({ ...admin, status: admin.status || "active" })
      .returning();
    return newAdmin;
  },

  async updateAdmin(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updated;
  },

  async updateAdminStatus(id: number, status: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ status })
      .where(eq(users.id, id))
      .returning();
    return updated;
  },

  async deleteAdmin(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  },
};
