import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { loginAttempts, users } from "@/db/schema";
import { sha256, validatePassword, validateUsername, verifyPassword } from "@/lib/password";
import { createSession, setSessionCookie } from "@/lib/session";

const WINDOW = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const data = await request.json() as { username?: string; password?: string };
    const username = String(data.username ?? "").trim().toLowerCase();
    const password = String(data.password ?? "");
    if (!validateUsername(username) || !validatePassword(password)) return Response.json({ error: "Tên tài khoản hoặc mật khẩu không đúng." }, { status: 401 });
    const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
    const attemptId = await sha256(`${ip}:${username}`);
    const db = getDb();
    const [attempt] = await db.select().from(loginAttempts).where(eq(loginAttempts.id, attemptId)).limit(1);
    if (attempt?.blockedUntil && attempt.blockedUntil > Date.now()) return Response.json({ error: "Đăng nhập bị tạm khóa. Vui lòng thử lại sau 15 phút." }, { status: 429 });
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    const valid = Boolean(user?.passwordSalt && user.passwordHash && user.passwordIterations && await verifyPassword(password, user.passwordSalt, user.passwordHash, user.passwordIterations));
    if (!valid) {
      const recentFailures = attempt && Date.now() - attempt.updatedAt < WINDOW ? attempt.failures + 1 : 1;
      await db.insert(loginAttempts).values({ id: attemptId, failures: recentFailures, blockedUntil: recentFailures >= 5 ? Date.now() + WINDOW : null, updatedAt: Date.now() }).onConflictDoUpdate({ target: loginAttempts.id, set: { failures: recentFailures, blockedUntil: recentFailures >= 5 ? Date.now() + WINDOW : null, updatedAt: Date.now() } });
      return Response.json({ error: recentFailures >= 5 ? "Đăng nhập bị tạm khóa. Vui lòng thử lại sau 15 phút." : "Tên tài khoản hoặc mật khẩu không đúng." }, { status: recentFailures >= 5 ? 429 : 401 });
    }
    if (!user!.active) return Response.json({ error: "Tài khoản đã bị khóa." }, { status: 403 });
    await db.delete(loginAttempts).where(eq(loginAttempts.id, attemptId));
    const token = await createSession(user!.id);
    return setSessionCookie(Response.json({ ok: true }), token);
  } catch (error) {
    console.error("Login failed", error);
    return Response.json({ error: "Không thể đăng nhập lúc này." }, { status: 500 });
  }
}
