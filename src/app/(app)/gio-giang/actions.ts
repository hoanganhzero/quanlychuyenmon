"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/session";

export async function themGioDay(formData: FormData) {
  const session = await requireSession();

  const gv = await db.giaoVien.findFirst({ where: { userId: session.userId } });
  if (!gv && session.vaiTro === "GIAO_VIEN") {
    throw new Error("Tài khoản chưa liên kết hồ sơ giáo viên.");
  }
  const giaoVienId =
    gv && session.vaiTro !== "ADMIN"
      ? gv.id
      : String(formData.get("giaoVienId") ?? "") || gv?.id;

  const ngay = new Date(String(formData.get("ngay")));
  const tiet = Number(formData.get("tiet"));
  const soTiet = Number(formData.get("soTiet") ?? 1);
  const phanCongId = String(formData.get("phanCongId") ?? "") || null;
  const daDay = formData.get("daDay") === "1";
  const lyDoVang = String(formData.get("lyDoVang") ?? "").trim() || null;
  const ghiChu = String(formData.get("ghiChu") ?? "").trim() || null;

  if (!giaoVienId || isNaN(ngay.getTime()) || !tiet) {
    throw new Error("Vui lòng chọn giáo viên, ngày và tiết.");
  }

  let lopHocId: string | null = null;
  if (phanCongId) {
    const pc = await db.phanCong.findUnique({ where: { id: phanCongId } });
    lopHocId = pc?.lopHocId ?? null;
  }

  try {
    await db.gioGiang.create({
      data: { giaoVienId, ngay, tiet, soTiet, phanCongId, lopHocId, daDay, lyDoVang, ghiChu },
    });
  } catch {
    throw new Error("Bản ghi trùng (giáo viên này đã có nhật ký ở tiết đó cùng ngày).");
  }
  revalidatePath("/gio-giang");
}

export async function xoaGioDay(id: string) {
  const session = await requireSession();
  const record = await db.gioGiang.findUnique({ where: { id } });
  if (!record) return;

  if (session.vaiTro !== "ADMIN" && session.vaiTro !== "TO_TRUONG") {
    const gv = await db.giaoVien.findFirst({ where: { userId: session.userId } });
    if (!gv || record.giaoVienId !== gv.id) throw new Error("Không có quyền xóa.");
  }
  await db.gioGiang.delete({ where: { id } });
  revalidatePath("/gio-giang");
}

export async function capNhatCoMat(id: string, daDay: boolean) {
  await requireRole("ADMIN", "TO_TRUONG");
  await db.gioGiang.update({ where: { id }, data: { daDay } });
  revalidatePath("/gio-giang");
}
