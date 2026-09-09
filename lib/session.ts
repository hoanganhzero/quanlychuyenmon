import "server-only";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { sessions } from "@/db/schema";
import { randomToken, sha256 } from "@/lib/password";
import { SESSION_COOKIE } from "@/lib/current-user";

const SESSION_AGE_SECONDS = 12 * 60 * 60;

export async function createSession(userId: string) {
  const token = randomToken();
  await getDb().insert(sessions).values({ tokenHash: await sha256(token), userId, expiresAt: Date.now() + SESSION_AGE_SECONDS * 1000 });
  return token;
}

export function setSessionCookie(response: Response, token: string) {
  response.headers.append("Set-Cookie", `${SESSION_COOKIE}=${token}; Max-Age=${SESSION_AGE_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Lax`);
  return response;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await getDb().delete(sessions).where(eq(sessions.tokenHash, await sha256(token)));
}

export function clearSessionCookie(response: Response) {
  response.headers.append("Set-Cookie", `${SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`);
  return response;
}
