import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { duongDanChuKy } from "@/lib/chuky-upload";

/** Phục vụ ảnh mẫu chữ ký — mọi người đã đăng nhập đều xem được (để hiện trong khối ký) */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const { userId } = await params;
  const mau = await db.mauChuKy.findUnique({ where: { nguoiDungId: userId } });
  if (!mau) {
    return NextResponse.json({ error: "Chưa có mẫu chữ ký" }, { status: 404 });
  }

  const duongDan = duongDanChuKy(mau.tenLuu);
  try {
    await stat(duongDan);
  } catch {
    return NextResponse.json(
      { error: "File không tồn tại trên máy chủ" },
      { status: 404 }
    );
  }

  const data = await readFile(duongDan);
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": mau.mimeType || "image/png",
      "Cache-Control": "private, max-age=60",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
