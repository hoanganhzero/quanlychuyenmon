"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { requireRole, requireSession } from "@/lib/session";

export async function themHoatDong(formData: FormData) {
  await requireRole("ADMIN", "TO_TRUONG", "BAN_GIAM_DOC");
  const tieuDe = String(formData.get("tieuDe") ?? "").trim();
  const loai = String(formData.get("loai") ?? "SINH_HOAT_TO") as
    | "SINH_HOAT_TO"
    | "BOI_DUONG"
    | "HOI_THAO"
    | "DAY_TRUC_TIEP";
  const ngay = String(formData.get("ngay") ?? "");
  const diaDiem = String(formData.get("diaDiem") ?? "").trim() || null;
  const noiDung = String(formData.get("noiDung") ?? "").trim() || null;
  const toChuyenMonId = String(formData.get("toChuyenMonId") ?? "") || null;

  if (!tieuDe || !ngay) throw new Error("Vui lòng nhập tiêu đề và ngày.");

  const hd = await db.hoatDongChuyenMon.create({
    data: {
      tieuDe,
      loai,
      ngay: new Date(ngay),
      diaDiem,
      noiDung,
      toChuyenMonId,
    },
  });

  // Thêm toàn bộ giáo viên vào danh sách điểm danh (mặc định vắng)
  const giaoViens = await db.giaoVien.findMany({ select: { id: true } });
  for (const gv of giaoViens) {
    await db.thamDu.create({
      data: { hoatDongId: hd.id, giaoVienId: gv.id, coMat: false },
    });
  }
  revalidatePath("/hoat-dong");
}

export async function datDiemDanh(hoatDongId: string, giaoVienId: string, coMat: boolean) {
  await requireRole("ADMIN", "TO_TRUONG", "BAN_GIAM_DOC");
  await db.thamDu.update({
    where: { hoatDongId_giaoVienId: { hoatDongId, giaoVienId } },
    data: { coMat },
  });
  revalidatePath("/hoat-dong");
}

export async function datDiemDanhForm(formData: FormData) {
  await datDiemDanh(
    String(formData.get("hoatDongId") ?? ""),
    String(formData.get("giaoVienId") ?? ""),
    formData.get("coMat") !== "1"
  );
}

export async function xoaHoatDongForm(formData: FormData) {
  await xoaHoatDong(String(formData.get("id") ?? ""));
}

export async function xoaHoatDong(id: string) {
  await requireRole("ADMIN", "TO_TRUONG", "BAN_GIAM_DOC");
  await db.hoatDongChuyenMon.delete({ where: { id } });
  revalidatePath("/hoat-dong");
}
