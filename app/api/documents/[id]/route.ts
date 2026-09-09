import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { documents } from "@/db/schema";
import { requireAppUser } from "@/lib/current-user";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAppUser();
    const { id } = await params;
    const [document] = await getDb().select().from(documents).where(eq(documents.id, id)).limit(1);
    if (!document?.objectKey) return Response.json({ error: "Không tìm thấy tệp" }, { status: 404 });
    const object = await env.BUCKET.get(document.objectKey);
    if (!object) return Response.json({ error: "Tệp không còn trong kho lưu trữ" }, { status: 404 });
    return new Response(object.body, { headers: {
      "Content-Type": document.mimeType || "application/octet-stream",
      "Content-Length": String(object.size),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(document.originalName || "hoso")}`,
      "X-Content-Type-Options": "nosniff",
    }});
  } catch { return Response.json({ error: "Chưa đăng nhập" }, { status: 401 }); }
}
