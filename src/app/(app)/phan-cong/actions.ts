"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export async function themPhanCong(formData: FormData) {
  await requireRole("ADMIN", "TO_TRUONG");
  const giaoVienId = String(formData.get("giaoVienId") ?? "");
  const monHocId = String(formData.get("monHocId") ?? "");
  const lopHocId = String(formData.get("lopHocId") ?? "");
  const soTietTuan = Number(formData.get("soTietTuan") ?? 0);

  const namHoc = await db.namHoc.findFirst({ where: { dangHoatDong: true } });
  if (!namHoc) throw new Error("Chưa có năm học đang hoạt động.");
  if (!giaoVienId || !monHocId || !lopHocId) {
    throw new Error("Vui lòng chọn giáo viên, môn học và lớp.");
  }

  try {
    await db.phanCong.create({
      data: { giaoVienId, monHocId, lopHocId, namHocId: namHoc.id, soTietTuan },
    });
  } catch {
    throw new Error("Phân công này có thể đã tồn tại.");
  }
  revalidatePath("/phan-cong");
}

export async function xoaPhanCong(id: string) {
  await requireRole("ADMIN", "TO_TRUONG");
  await db.phanCong.delete({ where: { id } });
  revalidatePath("/phan-cong");
}
