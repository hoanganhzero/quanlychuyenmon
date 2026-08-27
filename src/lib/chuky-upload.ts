import "server-only";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { db } from "@/lib/prisma";

const CHUKY_DIR = path.join(process.cwd(), "uploads", "chu-ky");

const MIME_CHO_PHEP: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/** Lưu/ghi đè mẫu chữ ký của người dùng (mỗi user 1 mẫu) */
export async function luuMauChuKy(file: File, nguoiDungId: string) {
  if (!file || file.size === 0) throw new Error("File rỗng.");
  if (file.size > MAX_SIZE) throw new Error("Ảnh chữ ký vượt quá 5MB.");

  const ext = MIME_CHO_PHEP[file.type];
  const extOk = Object.values(MIME_CHO_PHEP).includes(
    (file.name.split(".").pop() ?? "").toLowerCase()
  );
  if (!ext && !extOk) {
    throw new Error("Chỉ chấp nhận ảnh PNG, JPG hoặc WebP.");
  }

  await mkdir(CHUKY_DIR, { recursive: true });

  // Xóa mẫu cũ (file vật lý + bản ghi)
  const cu = await db.mauChuKy.findUnique({ where: { nguoiDungId } });
  if (cu) {
    await unlink(path.join(CHUKY_DIR, cu.tenLuu)).catch(() => {});
    await db.mauChuKy.delete({ where: { id: cu.id } });
  }

  const duoi =
    ext ?? (file.name.split(".").pop() ?? "png").toLowerCase();
  const tenLuu = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${duoi}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(CHUKY_DIR, tenLuu), buffer);

  return db.mauChuKy.create({
    data: {
      tenGoc: file.name,
      tenLuu,
      mimeType: file.type || "image/png",
      kichThuoc: file.size,
      nguoiDungId,
    },
  });
}

/** Xóa mẫu chữ ký của người dùng */
export async function xoaMauChuKy(nguoiDungId: string) {
  const mau = await db.mauChuKy.findUnique({ where: { nguoiDungId } });
  if (!mau) return;
  await unlink(path.join(CHUKY_DIR, mau.tenLuu)).catch(() => {});
  await db.mauChuKy.delete({ where: { id: mau.id } });
}

export function duongDanChuKy(tenLuu: string) {
  return path.join(CHUKY_DIR, tenLuu);
}
