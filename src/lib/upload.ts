import "server-only";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { db } from "@/lib/prisma";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "trinh-ky");

const MIME_CHO_PHEP: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
};

const MAX_SIZE = 100 * 1024 * 1024; // 100MB

export interface LuuTepOptions {
  file: File;
  giaoAnId?: string;
  baoCaoId?: string;
  vanBanId?: string;
  nguoiTaiId: string;
}

/** Kiểm tra & lưu file Word/PDF vào thư mục uploads, ghi bản ghi database */
export async function luuTepTrinhKy(opts: LuuTepOptions) {
  const { file } = opts;

  if (!file || file.size === 0) throw new Error("File rỗng.");
  if (file.size > MAX_SIZE) throw new Error("File vượt quá 100MB.");

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const mimeOk = Object.keys(MIME_CHO_PHEP).includes(file.type);
  const extOk = ["pdf", "doc", "docx"].includes(ext);
  if (!mimeOk && !extOk) {
    throw new Error("Chỉ chấp nhận file Word (.doc, .docx) hoặc PDF.");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const tenLuu = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, tenLuu), buffer);

  return db.tepTrinhKy.create({
    data: {
      tenGoc: file.name,
      tenLuu,
      mimeType: file.type || "application/octet-stream",
      kichThuoc: file.size,
      giaoAnId: opts.giaoAnId ?? null,
      baoCaoId: opts.baoCaoId ?? null,
      vanBanId: opts.vanBanId ?? null,
      nguoiTaiId: opts.nguoiTaiId,
    },
  });
}

/** Xóa bản ghi + file vật lý */
export async function xoaTepTrinhKy(tepId: string) {
  const tep = await db.tepTrinhKy.findUnique({ where: { id: tepId } });
  if (!tep) return;
  await unlink(path.join(UPLOAD_DIR, tep.tenLuu)).catch(() => {});
  await db.tepTrinhKy.delete({ where: { id: tep.id } });
}

export function duongDanTep(tenLuu: string) {
  return path.join(UPLOAD_DIR, tenLuu);
}

export function formatKichThuoc(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
