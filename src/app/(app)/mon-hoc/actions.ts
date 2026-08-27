"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export async function themMonHoc(formData: FormData) {
  await requireRole("ADMIN");
  const maMon = String(formData.get("maMon") ?? "").trim().toUpperCase();
  const tenMon = String(formData.get("tenMon") ?? "").trim();
  if (!maMon || !tenMon) throw new Error("Vui lòng nhập mã và tên môn học.");

  const existed = await db.monHoc.findUnique({ where: { maMon } });
  if (existed) throw new Error("Mã môn đã tồn tại.");

  await db.monHoc.create({ data: { maMon, tenMon } });
  revalidatePath("/mon-hoc");
}

export async function suaMonHoc(formData: FormData) {
  await requireRole("ADMIN");
  const id = String(formData.get("id"));
  const maMon = String(formData.get("maMon") ?? "").trim().toUpperCase();
  const tenMon = String(formData.get("tenMon") ?? "").trim();
  const moTa = String(formData.get("moTa") ?? "").trim() || null;
  if (!maMon || !tenMon) throw new Error("Vui lòng nhập mã và tên môn học.");

  const existed = await db.monHoc.findFirst({ where: { maMon, NOT: { id } } });
  if (existed) throw new Error("Mã môn đã tồn tại.");

  await db.monHoc.update({ where: { id }, data: { maMon, tenMon, moTa } });
  revalidatePath("/mon-hoc");
}

export async function xoaMonHoc(id: string) {
  await requireRole("ADMIN");
  await db.monHoc.delete({ where: { id } });
  revalidatePath("/mon-hoc");
}
