import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { AuthSession, UserRole } from "./types";

const JWT_SECRET = process.env.JWT_SECRET || "jari_coffee_house_super_secure_secret_loyalty_2026_jwt_token";
export const TOKEN_COOKIE_NAME = "jari_loyalty_session";
// 10 years persistent session in seconds (permanent session)
export const PERMANENT_COOKIE_MAX_AGE = 10 * 365 * 24 * 60 * 60;

export function signToken(session: AuthSession): string {
  return jwt.sign(session, JWT_SECRET, {
    expiresIn: "3650d",
  });
}

export function verifyToken(token: string): AuthSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthSession;
  } catch {
    return null;
  }
}

export async function getSession(req?: Request): Promise<AuthSession | null> {
  try {
    // 1. Check Authorization header or x-customer-auth if req provided
    if (req) {
      const authHeader = req.headers.get("x-customer-auth") || req.headers.get("authorization");
      if (authHeader) {
        const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
        const verified = verifyToken(token);
        if (verified) return verified;
      }
    }

    // 2. Check HTTP-only cookie
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function requireRole(session: AuthSession | null, allowedRoles: UserRole[]): boolean {
  if (!session) return false;
  return allowedRoles.includes(session.role);
}
