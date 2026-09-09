import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { announcements, classes, departments, documents, schoolYears, sessions, subjects, teachers, users } from "@/db/schema";
import { requireAdmin, requireAppUser } from "@/lib/current-user";
import { hashPassword, validatePassword, validateUsername } from "@/lib/password";

const tables = { schoolYears, departments, teachers, subjects, classes, announcements } as const;
type Entity = keyof typeof tables;

function fail(error: unknown) {
  const message = error instanceof Error ? error.message : "Không thể xử lý yêu cầu";
  const messages: Record<string, string> = {
    UNAUTHORIZED: "Vui lòng đăng nhập.", FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
    ACCOUNT_DISABLED: "Tài khoản đã bị khóa.", ACCOUNT_NOT_PROVISIONED: "Tài khoản chưa được quản trị viên tạo.",
  };
  const status = message === "UNAUTHORIZED" ? 401 : ["FORBIDDEN", "ACCOUNT_DISABLED", "ACCOUNT_NOT_PROVISIONED"].includes(message) ? 403 : 400;
  return Response.json({ error: messages[message] ?? message }, { status });
}

export async function GET() {
  try {
    const currentUser = await requireAppUser();
    const db = getDb();
    const [yearRows, departmentRows, teacherRows, subjectRows, classRows, documentRows, announcementRows, userRows] = await Promise.all([
      db.select().from(schoolYears).orderBy(desc(schoolYears.active), desc(schoolYears.startDate)),
      db.select().from(departments).orderBy(departments.name),
      db.select().from(teachers).orderBy(teachers.name),
      db.select().from(subjects).orderBy(subjects.name),
      db.select().from(classes).orderBy(classes.grade, classes.name),
      db.select().from(documents).orderBy(desc(documents.createdAt)),
      db.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(20),
      db.select({ id: users.id, name: users.name, email: users.email, username: users.username, role: users.role, active: users.active, createdAt: users.createdAt, updatedAt: users.updatedAt }).from(users).orderBy(users.name),
    ]);
    const safeCurrentUser = { id: currentUser.id, name: currentUser.name, email: currentUser.email, username: currentUser.username, role: currentUser.role, active: currentUser.active };
    return Response.json({ currentUser: safeCurrentUser, schoolYears: yearRows, departments: departmentRows, teachers: teacherRows, subjects: subjectRows, classes: classRows, documents: documentRows, announcements: announcementRows, users: userRows });
  } catch (error) { return fail(error); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { action?: string; entity?: Entity; id?: string; data?: Record<string, unknown> };
    const db = getDb();

    if (body.action === "create") {
      const admin = await requireAdmin();
      if (!body.entity || !tables[body.entity]) throw new Error("Dữ liệu không hợp lệ");
      const id = crypto.randomUUID();
      const data = body.data ?? {};
      if (body.entity === "schoolYears") await db.insert(schoolYears).values({ id, name: String(data.name), startDate: String(data.startDate), endDate: String(data.endDate), active: Boolean(data.active) });
      if (body.entity === "departments") await db.insert(departments).values({ id, name: String(data.name), description: String(data.description ?? "") });
      if (body.entity === "teachers") await db.insert(teachers).values({ id, code: String(data.code), name: String(data.name), email: String(data.email ?? ""), phone: String(data.phone ?? ""), specialty: String(data.specialty ?? ""), departmentId: data.departmentId ? String(data.departmentId) : null });
      if (body.entity === "subjects") await db.insert(subjects).values({ id, code: String(data.code), name: String(data.name), description: String(data.description ?? "") });
      if (body.entity === "classes") await db.insert(classes).values({ id, name: String(data.name), grade: Number(data.grade), teacherId: data.teacherId ? String(data.teacherId) : null, schoolYearId: data.schoolYearId ? String(data.schoolYearId) : null });
      if (body.entity === "announcements") await db.insert(announcements).values({ id, title: String(data.title), content: String(data.content), authorEmail: admin.email });
      return Response.json({ ok: true });
    }

    if (body.action === "delete") {
      await requireAdmin();
      if (!body.entity || !body.id || !tables[body.entity]) throw new Error("Dữ liệu không hợp lệ");
      await db.delete(tables[body.entity] as typeof departments).where(eq((tables[body.entity] as typeof departments).id, body.id));
      return Response.json({ ok: true });
    }

    if (body.action === "setActiveYear") {
      await requireAdmin();
      if (!body.id) throw new Error("Thiếu năm học");
      await db.update(schoolYears).set({ active: false, updatedAt: new Date().toISOString() });
      await db.update(schoolYears).set({ active: true, updatedAt: new Date().toISOString() }).where(eq(schoolYears.id, body.id));
      return Response.json({ ok: true });
    }

    if (body.action === "documentStatus") {
      const user = await requireAppUser();
      if (!body.id) throw new Error("Thiếu hồ sơ");
      const status = String(body.data?.status ?? "");
      const [document] = await db.select().from(documents).where(eq(documents.id, body.id)).limit(1);
      if (!document) throw new Error("Không tìm thấy hồ sơ");
      const isAdmin = user.role === "ADMIN" || user.role === "BAN_GIAM_DOC";
      if (["DA_DUYET", "TU_CHOI"].includes(status) && !isAdmin) throw new Error("FORBIDDEN");
      if (status === "CHO_DUYET" && document.ownerEmail !== user.email && !isAdmin) throw new Error("FORBIDDEN");
      await db.update(documents).set({ status, reviewerNote: String(body.data?.reviewerNote ?? ""), updatedAt: new Date().toISOString() }).where(eq(documents.id, body.id));
      return Response.json({ ok: true });
    }

    if (body.action === "createAccount") {
      await requireAdmin();
      const name = String(body.data?.name ?? "").trim();
      const email = String(body.data?.email ?? "").trim().toLowerCase();
      const username = String(body.data?.username ?? "").trim().toLowerCase();
      const password = String(body.data?.password ?? "");
      const role = String(body.data?.role ?? "GIAO_VIEN");
      if (!name || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Vui lòng nhập đúng họ tên và email.");
      if (!validateUsername(username)) throw new Error("Tên tài khoản gồm 3–40 ký tự: chữ, số, dấu chấm, gạch ngang hoặc gạch dưới.");
      if (!validatePassword(password)) throw new Error("Mật khẩu phải có từ 8 đến 128 ký tự.");
      if (!["ADMIN", "BAN_GIAM_DOC", "TO_TRUONG", "GIAO_VIEN"].includes(role)) throw new Error("Vai trò không hợp lệ.");
      const [exists] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (exists) throw new Error("Email này đã có tài khoản.");
      const [usernameExists] = await db.select().from(users).where(eq(users.username, username)).limit(1);
      if (usernameExists) throw new Error("Tên tài khoản này đã được sử dụng.");
      const credentials = await hashPassword(password);
      await db.insert(users).values({ id: crypto.randomUUID(), name, email, username, role, active: true, passwordSalt: credentials.salt, passwordHash: credentials.hash, passwordIterations: credentials.iterations });
      return Response.json({ ok: true });
    }

    if (body.action === "updateUser") {
      const admin = await requireAdmin();
      if (!body.id) throw new Error("Thiếu tài khoản");
      const role = String(body.data?.role ?? "GIAO_VIEN");
      const active = body.data?.active !== false;
      if (body.id === admin.id && (role !== "ADMIN" || !active)) throw new Error("Không thể hạ quyền hoặc khóa tài khoản quản trị đang sử dụng.");
      await db.update(users).set({ role, active, updatedAt: new Date().toISOString() }).where(eq(users.id, body.id));
      if (!active) await db.delete(sessions).where(eq(sessions.userId, body.id));
      return Response.json({ ok: true });
    }

    if (body.action === "resetUserPassword") {
      const admin = await requireAdmin();
      if (!body.id) throw new Error("Thiếu tài khoản");
      const password = String(body.data?.password ?? "");
      const username = String(body.data?.username ?? "").trim().toLowerCase();
      if (!validatePassword(password)) throw new Error("Mật khẩu phải có từ 8 đến 128 ký tự.");
      if (!validateUsername(username)) throw new Error("Tên tài khoản gồm 3–40 ký tự: chữ, số, dấu chấm, gạch ngang hoặc gạch dưới.");
      const [usernameExists] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
      if (usernameExists && usernameExists.id !== body.id) throw new Error("Tên tài khoản này đã được sử dụng.");
      const credentials = await hashPassword(password);
      await db.update(users).set({ username, passwordSalt: credentials.salt, passwordHash: credentials.hash, passwordIterations: credentials.iterations, updatedAt: new Date().toISOString() }).where(eq(users.id, body.id));
      if (body.id !== admin.id) await db.delete(sessions).where(eq(sessions.userId, body.id));
      return Response.json({ ok: true });
    }

    throw new Error("Thao tác không được hỗ trợ");
  } catch (error) { return fail(error); }
}
