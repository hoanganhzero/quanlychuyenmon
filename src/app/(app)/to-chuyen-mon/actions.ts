"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export async function themTo(formData: FormData) {
  await requireRole("ADMIN", "TO_TRUONG");
  const ten = String(formData.get("ten") ?? "").trim();
  const moTa = String(formData.get("moTa") ?? "").trim() || null;
  if (!ten) throw new Error("Vui lòng nhập tên tổ.");
  const existed = await db.toChuyenMon.findUnique({ where: { ten } });
  if (existed) throw new Error("Tên tổ đã tồn tại.");
  await db.toChuyenMon.create({ data: { ten, moTa } });
  revalidatePath("/to-chuyen-mon");
}

export async function suaTo(formData: FormData) {
  await requireRole("ADMIN");
  const id = String(formData.get("id"));
  const ten = String(formData.get("ten") ?? "").trim();
  const moTa = String(formData.get("moTa") ?? "").trim() || null;
  if (!ten) throw new Error("Vui lòng nhập tên tổ.");
  const existed = await db.toChuyenMon.findFirst({ where: { ten, NOT: { id } } });
  if (existed) throw new Error("Tên tổ đã tồn tại.");
  await db.toChuyenMon.update({ where: { id }, data: { ten, moTa } });
  revalidatePath("/to-chuyen-mon");
}

export async function xoaTo(id: string) {
  await requireRole("ADMIN");
  await db.toChuyenMon.delete({ where: { id } });
  revalidatePath("/to-chuyen-mon");
}

export async function datToTruong(formData: FormData) {
  await requireRole("ADMIN");
  const toId = String(formData.get("toId") ?? "");
  const giaoVienId = String(formData.get("giaoVienId") ?? "") || null;
  await db.toChuyenMon.update({
    where: { id: toId },
    data: { toTruongId: giaoVienId },
  });
  revalidatePath("/to-chuyen-mon");
}
