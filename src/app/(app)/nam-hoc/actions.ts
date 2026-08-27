"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export async function themNamHoc(formData: FormData) {
  await requireRole("ADMIN");
  const ten = String(formData.get("ten") ?? "").trim();
  const ngayBatDau = new Date(String(formData.get("ngayBatDau")));
  const ngayKetThuc = new Date(String(formData.get("ngayKetThuc")));

  if (!ten || isNaN(ngayBatDau.getTime()) || isNaN(ngayKetThuc.getTime())) {
    throw new Error("Vui lòng nhập đầy đủ thông tin hợp lệ.");
  }
  if (ngayKetThuc <= ngayBatDau) {
    throw new Error("Ngày kết thúc phải sau ngày bắt đầu.");
  }

  await db.namHoc.create({ data: { ten, ngayBatDau, ngayKetThuc } });
  revalidatePath("/nam-hoc");
}

export async function kichHoatNamHoc(id: string) {
  await requireRole("ADMIN");
  await db.$transaction([
    db.namHoc.updateMany({ data: { dangHoatDong: false } }),
    db.namHoc.update({ where: { id }, data: { dangHoatDong: true } }),
  ]);
  revalidatePath("/nam-hoc");
}

export async function xoaNamHoc(id: string) {
  await requireRole("ADMIN");
  await db.namHoc.delete({ where: { id } });
  revalidatePath("/nam-hoc");
}

export async function batDauHocKy(hocKyId: string) {
  await requireRole("ADMIN");
  const hk = await db.hocKy.findUnique({ where: { id: hocKyId } });
  if (!hk) return;
  await db.hocKy.updateMany({
    where: { namHocId: hk.namHocId },
    data: { dangChay: false },
  });
  await db.hocKy.update({ where: { id: hocKyId }, data: { dangChay: true } });
  revalidatePath("/nam-hoc");
}
