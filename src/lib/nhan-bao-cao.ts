import "server-only";
import { db } from "@/lib/prisma";
import type { DoiTuongNhan } from "@prisma/client";
/**
 * Tính danh sách giáo viên nhận theo đối tượng:
 * TOAN_GV | GVBM (không chủ nhiệm) | GVCN | TO_CHUYEN_MON
 */
export async function danhSachGiaoVienNhan(
  doiTuong: DoiTuongNhan,
  toChuyenMonId: string | null
) {
  const namHoc = await db.namHoc.findFirst({ where: { dangHoatDong: true } });

  const gvcnIds = new Set<string>();
  if (namHoc) {
    const lops = await db.lopHoc.findMany({
      where: { namHocId: namHoc.id, gvcnId: { not: null } },
      select: { gvcnId: true },
    });
    for (const l of lops) if (l.gvcnId) gvcnIds.add(l.gvcnId);
  }

  switch (doiTuong) {
    case "TOAN_GV":
      return db.giaoVien.findMany({ orderBy: { hoTen: "asc" } });

    case "GVCN":
      return db.giaoVien.findMany({
        where: { id: { in: [...gvcnIds] } },
        orderBy: { hoTen: "asc" },
      });

    case "GVBM":
      return db.giaoVien.findMany({
        where: { id: { notIn: [...gvcnIds] } },
        orderBy: { hoTen: "asc" },
      });

    case "TO_CHUYEN_MON":
      if (!toChuyenMonId) return [];
      return db.giaoVien.findMany({
        where: { toChuyenMonId },
        orderBy: { hoTen: "asc" },
      });
  }
}
