import { count, eq, isNotNull } from "drizzle-orm";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, validatePassword, validateUsername } from "@/lib/password";
import { createSession, setSessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  let phase = "verify-owner";
  try {
    const identity = await getChatGPTUser();
    if (!identity) return Response.json({ error: "Vui lòng xác nhận chủ Site bằng ChatGPT." }, { status: 401 });
    phase = "read-form";
    const data = await request.json() as { username?: string; password?: string; name?: string };
    const username = String(data.username ?? "").trim().toLowerCase();
    const password = String(data.password ?? "");
    const name = String(data.name ?? identity.displayName).trim();
    if (!validateUsername(username)) return Response.json({ error: "Tên tài khoản gồm 3–40 ký tự: chữ, số, dấu chấm, gạch ngang hoặc gạch dưới." }, { status: 400 });
    if (!validatePassword(password)) return Response.json({ error: "Mật khẩu phải có từ 8 đến 128 ký tự." }, { status: 400 });
    phase = "check-account";
    const db = getDb();
    const [{ total }] = await db.select({ total: count() }).from(users).where(isNotNull(users.passwordHash));
    if (Number(total) > 0) return Response.json({ error: "Tài khoản quản trị đã được thiết lập." }, { status: 409 });
    const [existing] = await db.select().from(users).where(eq(users.email, identity.email.toLowerCase())).limit(1);
    if (existing && existing.role !== "ADMIN") return Response.json({ error: "Email chủ Site không có quyền quản trị." }, { status: 403 });
    if (!existing) {
      const [{ allUsers }] = await db.select({ allUsers: count() }).from(users);
      if (Number(allUsers) > 0) return Response.json({ error: "Không tìm thấy tài khoản quản trị tương ứng với chủ Site." }, { status: 403 });
    }
    const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
    if (taken && taken.id !== existing?.id) return Response.json({ error: "Tên tài khoản đã được sử dụng." }, { status: 409 });
    phase = "hash-password";
    const credentials = await hashPassword(password);
    const userId = existing?.id ?? crypto.randomUUID();
    phase = "save-account";
    if (existing) {
      await db.update(users).set({ username, name: name || existing.name, passwordSalt: credentials.salt, passwordHash: credentials.hash, passwordIterations: credentials.iterations, active: true, updatedAt: new Date().toISOString() }).where(eq(users.id, existing.id));
    } else {
      await db.insert(users).values({ id: userId, email: identity.email.toLowerCase(), username, name: name || identity.displayName, role: "ADMIN", active: true, passwordSalt: credentials.salt, passwordHash: credentials.hash, passwordIterations: credentials.iterations });
    }
    phase = "create-session";
    const token = await createSession(userId);
    return setSessionCookie(Response.json({ ok: true }), token);
  } catch (error) {
    console.error("Admin bootstrap failed", { phase, error });
    return Response.json({ error: "Không thể thiết lập quản trị lúc này." }, { status: 500 });
  }
}
