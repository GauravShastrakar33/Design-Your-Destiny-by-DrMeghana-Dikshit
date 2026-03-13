import { userRepository } from "../repositories/user.repository";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const JWT_SECRET = process.env.JWT_SECRET as string;

export class AuthServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AuthServiceError";
  }
}

export const authService = {
  async adminLegacyLogin(password: string) {
    if (password === ADMIN_PASSWORD) {
      return { success: true };
    } else {
      throw new AuthServiceError("Invalid password", 401);
    }
  },

  async adminJwtLogin(email?: string, password?: string) {
    if (!email || !password) {
      throw new AuthServiceError("Email and password required", 400);
    }

    const user = await userRepository.getUserByEmail(email);
    if (!user) {
      throw new AuthServiceError("Invalid email or password", 401);
    }

    if (!["SUPER_ADMIN", "COACH"].includes(user.role)) {
      throw new AuthServiceError("Admin access required", 403);
    }

    if (user.status !== "active") {
      throw new AuthServiceError("Account is blocked", 403);
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw new AuthServiceError("Invalid email or password", 401);
    }

    // Update last login
    await userRepository.updateUserLastLogin(user.id);

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  },

  async userJwtLogin(email?: string, password?: string) {
    if (!email || !password) {
      throw new AuthServiceError("Email and password required", 400);
    }

    const user = await userRepository.getUserByEmail(email);
    if (!user) {
      throw new AuthServiceError("Invalid credentials", 401);
    }

    // Allow USER and COACH roles to login to user app
    // SUPER_ADMIN should use admin login only
    if (user.role === "SUPER_ADMIN") {
      throw new AuthServiceError("Super Admin must use admin login", 403);
    }

    if (user.status !== "active") {
      throw new AuthServiceError("Account is blocked", 403);
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw new AuthServiceError("Invalid credentials", 401);
    }

    // Update last login
    await userRepository.updateUserLastLogin(user.id);

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        forcePasswordChange: user.forcePasswordChange || false,
      },
    };
  },

  async getCurrentUser(userId: number) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new AuthServiceError("User not found", 404);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    };
  },
};
