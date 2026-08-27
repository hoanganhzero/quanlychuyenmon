import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { duongDanTep } from "@/lib/upload";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const { id } = await params;
  const tep = await db.tepTrinhKy.findUnique({ where: { id } });
  if (!tep) {
    return NextResponse.json({ error: "Không tìm thấy file" }, { status: 404 });
  }

  const duongDan = duongDanTep(tep.tenLuu);
  try {
    await stat(duongDan);
  } catch {
    return NextResponse.json(
      { error: "File không tồn tại trên máy chủ" },
      { status: 404 }
    );
  }

  const data = await readFile(duongDan);
  // ?inline=1 → mở trực tiếp trên trình duyệt (PDF viewer), ngược lại tải về
  const inline = new URL(req.url).searchParams.get("inline") === "1";
  const disposition = inline ? "inline" : "attachment";

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": tep.mimeType || "application/octet-stream",
      "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(tep.tenGoc)}`,
      "Content-Length": String(data.length),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
