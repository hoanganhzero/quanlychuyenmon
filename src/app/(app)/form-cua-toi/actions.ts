"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function nopForm(formData: FormData) {
  const session = await requireSession();
  const mauBaoCaoId = String(formData.get("mauBaoCaoId") ?? "");

  const gv = await db.giaoVien.findFirst({ where: { userId: session.userId } });
  if (!gv) throw new Error("Tài khoản chưa liên kết hồ sơ giáo viên.");

  const mau = await db.mauBaoCao.findUnique({
    where: { id: mauBaoCaoId },
    include: { fields: true },
  });
  if (!mau || mau.trangThai !== "DA_PHAT_HANH") {
    throw new Error("Form không còn nhận phản hồi.");
  }

  // Kiểm tra bắt buộc
  for (const f of mau.fields) {
    const val = String(formData.get(`f_${f.id}`) ?? "").trim();
    if (f.batBuoc && !val) {
      throw new Error(`Trường "${f.tenTruong}" là bắt buộc.`);
    }
  }

  const phanHoi = await db.phanHoiBaoCao.upsert({
    where: { mauBaoCaoId_giaoVienId: { mauBaoCaoId, giaoVienId: gv.id } },
    update: { guiLuc: new Date() },
    create: { mauBaoCaoId, giaoVienId: gv.id },
  });

  // Xóa giá trị cũ rồi ghi lại toàn bộ
  await db.giaTriPhanHoi.deleteMany({ where: { phanHoiId: phanHoi.id } });
  for (const f of mau.fields) {
    const val = String(formData.get(`f_${f.id}`) ?? "").trim().slice(0, 2000);
    await db.giaTriPhanHoi.create({
      data: { phanHoiId: phanHoi.id, fieldId: f.id, giaTri: val || null },
    });
  }

  revalidatePath("/form-cua-toi");
  redirect("/form-cua-toi?da_nop=1");
}
