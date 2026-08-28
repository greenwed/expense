import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-fish-aquarium-jwt-key-2026";
const COOKIE_NAME = "fish_auth_token";

export interface SessionUser {
  id: string;
  email: string;
  username: string;
}

export function signToken(user: SessionUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

export function verifyToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser;
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function getSessionFromRequest(req: NextRequest): SessionUser | null {
  const token = req.cookies.get(COOKIE_NAME)?.value || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return verifyToken(token);
}

export function setAuthCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 3600, // 30 days
  });
}

export function clearAuthCookie() {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}
