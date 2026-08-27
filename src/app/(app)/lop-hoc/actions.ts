"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export async function themLop(formData: FormData) {
  await requireRole("ADMIN");
  const ten = String(formData.get("ten") ?? "").trim();
  const khoi = Number(formData.get("khoi"));
  const gvcnId = String(formData.get("gvcnId") ?? "") || null;

  const namHoc = await db.namHoc.findFirst({ where: { dangHoatDong: true } });
  if (!namHoc) throw new Error("Chưa có năm học đang hoạt động. Hãy thêm trong mục Năm học.");
  if (!ten || !khoi) throw new Error("Vui lòng nhập tên lớp và khối.");

  const existed = await db.lopHoc.findFirst({
    where: { ten, namHocId: namHoc.id },
  });
  if (existed) throw new Error(`Lớp ${ten} đã tồn tại trong năm học này.`);

  await db.lopHoc.create({ data: { ten, khoi, gvcnId, namHocId: namHoc.id } });
  revalidatePath("/lop-hoc");
}

export async function suaLop(formData: FormData) {
  await requireRole("ADMIN");
  const id = String(formData.get("id"));
  const ten = String(formData.get("ten") ?? "").trim();
  const khoi = Number(formData.get("khoi"));
  if (!ten || !khoi) throw new Error("Vui lòng nhập tên lớp và khối.");

  const namHoc = await db.lopHoc.findUnique({ where: { id }, select: { namHocId: true } });
  if (!namHoc) throw new Error("Không tìm thấy lớp.");
  const existed = await db.lopHoc.findFirst({
    where: { ten, namHocId: namHoc.namHocId, NOT: { id } },
  });
  if (existed) throw new Error(`Lớp ${ten} đã tồn tại trong năm học này.`);

  await db.lopHoc.update({ where: { id }, data: { ten, khoi } });
  revalidatePath("/lop-hoc");
}

export async function xoaLop(id: string) {
  await requireRole("ADMIN");
  await db.lopHoc.delete({ where: { id } });
  revalidatePath("/lop-hoc");
}

export async function ganGvcn(formData: FormData) {
  await requireRole("ADMIN");
  const lopId = String(formData.get("lopId") ?? "");
  const gvcnId = String(formData.get("gvcnId") ?? "") || null;
  await db.lopHoc.update({ where: { id: lopId }, data: { gvcnId } });
  revalidatePath("/lop-hoc");
}
