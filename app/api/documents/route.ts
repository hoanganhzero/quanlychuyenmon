import { env } from "cloudflare:workers";
import { getDb } from "@/db";
import { documents } from "@/db/schema";
import { requireAppUser } from "@/lib/current-user";

const allowed = new Set(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);

export async function POST(request: Request) {
  try {
    const user = await requireAppUser();
    const form = await request.formData();
    const title = String(form.get("title") ?? "").trim();
    const category = String(form.get("category") ?? "GIAO_AN");
    const notes = String(form.get("notes") ?? "").trim();
    const file = form.get("file");
    if (!title) return Response.json({ error: "Vui lòng nhập tên hồ sơ" }, { status: 400 });
    if (!(file instanceof File) || file.size === 0) return Response.json({ error: "Vui lòng chọn tệp Word hoặc PDF" }, { status: 400 });
    if (file.size > 100 * 1024 * 1024) return Response.json({ error: "Tệp vượt quá 100 MB" }, { status: 400 });
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!allowed.has(file.type) && !["pdf", "doc", "docx"].includes(ext ?? "")) return Response.json({ error: "Chỉ chấp nhận tệp Word hoặc PDF" }, { status: 400 });

    const id = crypto.randomUUID();
    const objectKey = `documents/${id}/${encodeURIComponent(file.name)}`;
    await env.BUCKET.put(objectKey, file.stream(), { httpMetadata: { contentType: file.type || "application/octet-stream" } });
    try {
      await getDb().insert(documents).values({ id, title, category, notes, ownerEmail: user.email, originalName: file.name, objectKey, mimeType: file.type || "application/octet-stream", size: file.size });
    } catch (error) {
      await env.BUCKET.delete(objectKey).catch(() => undefined);
      throw error;
    }
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể tải hồ sơ";
    return Response.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 400 });
  }
}
