"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { luuMauChuKy, xoaMauChuKy } from "@/lib/chuky-upload";

/** Tải lên / thay thế mẫu chữ ký của tôi */
export async function uploadMauChuKyForm(formData: FormData) {
  const session = await requireSession();
  const file = formData.get("file") as File | null;
  if (!file) throw new Error("Vui lòng chọn ảnh chữ ký.");

  await luuMauChuKy(file, session.userId);
  revalidatePath("/chu-ky-cua-toi");
}

/** Xóa mẫu chữ ký của tôi */
export async function xoaMauChuKyForm() {
  const session = await requireSession();
  await xoaMauChuKy(session.userId);
  revalidatePath("/chu-ky-cua-toi");
}
