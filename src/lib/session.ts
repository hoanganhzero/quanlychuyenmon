import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { VaiTro } from "@prisma/client";

const COOKIE_NAME = "qlcm_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "fallback-secret-dev-only"
);

export interface SessionUser {
  userId: string;
  email: string;
  hoTen: string;
  vaiTro: VaiTro;
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      hoTen: payload.hoTen as string,
      vaiTro: payload.vaiTro as VaiTro,
    };
  } catch {
    return null;
  }
}

export class AuthError extends Error {}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new AuthError("Chưa đăng nhập");
  return session;
}

export async function requireRole(...roles: VaiTro[]): Promise<SessionUser> {
  const session = await requireSession();
  if (!roles.includes(session.vaiTro)) throw new AuthError("Không có quyền");
  return session;
}
