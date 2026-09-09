import "server-only";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";
import { sha256 } from "@/lib/password";

export const SESSION_COOKIE = "qlcm_session";

export async function requireAppUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) throw new Error("UNAUTHORIZED");
  const db = getDb();
  const tokenHash = await sha256(token);
  const [session] = await db.select().from(sessions).where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, Date.now()))).limit(1);
  if (!session) throw new Error("UNAUTHORIZED");
  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) throw new Error("UNAUTHORIZED");
  if (!user.active) throw new Error("ACCOUNT_DISABLED");
  return user;
}

export async function requireAdmin() {
  const user = await requireAppUser();
  if (user.role !== "ADMIN" && user.role !== "BAN_GIAM_DOC") throw new Error("FORBIDDEN");
  return user;
}
