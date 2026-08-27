"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

/** Đánh dấu 1 thông báo đã đọc */
export async function daDocForm(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id"));
  await db.thongBao.updateMany({
    where: { id, userId: session.userId },
    data: { daDoc: true },
  });
  revalidatePath("/thong-bao");
}

/** Đánh dấu TẤT CẢ đã đọc */
export async function docHetForm() {
  const session = await requireSession();
  await db.thongBao.updateMany({
    where: { userId: session.userId, daDoc: false },
    data: { daDoc: true },
  });
  revalidatePath("/thong-bao");
}

/** Xóa toàn bộ thông báo của tôi */
export async function xoaHetForm() {
  const session = await requireSession();
  await db.thongBao.deleteMany({ where: { userId: session.userId } });
  revalidatePath("/thong-bao");
}
