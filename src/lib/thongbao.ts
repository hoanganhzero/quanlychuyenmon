import "server-only";
import { db } from "@/lib/prisma";

/** Tạo thông báo cho 1 người dùng */
export async function thongBao(
  userId: string,
  tieuDe: string,
  noiDung?: string,
  lienKet?: string
) {
  await db.thongBao.create({ data: { userId, tieuDe, noiDung, lienKet } });
}

/** Thông báo cho tất cả user theo vai trò (ví dụ toàn bộ BGĐ + Admin) */
export async function thongBaoVaiTro(
  vaiTros: ("ADMIN" | "BAN_GIAM_DOC" | "TO_TRUONG" | "GIAO_VIEN")[],
  tieuDe: string,
  noiDung?: string,
  lienKet?: string,
  truUserId?: string // loại trừ chính người thực hiện
) {
  const users = await db.user.findMany({
    where: { vaiTro: { in: vaiTros }, hoatDong: true },
    select: { id: true },
  });
  const ds = truUserId ? users.filter((u) => u.id !== truUserId) : users;
  if (ds.length === 0) return;
  await db.thongBao.createMany({
    data: ds.map((u) => ({ userId: u.id, tieuDe, noiDung, lienKet })),
  });
}

/** Số thông báo chưa đọc của user (cho badge chuông) */
export async function soChuaDoc(userId: string) {
  return db.thongBao.count({ where: { userId, daDoc: false } });
}
