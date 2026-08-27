"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import type { LoaiDiem } from "@prisma/client";

const LOAI_HOP_LE: LoaiDiem[] = ["MIENG", "LAN_1", "GIUA_KY", "CUOI_KY", "DANH_GIA"];

export async function luuDiem(formData: FormData) {
  const session = await requireSession();

  const lopHocId = String(formData.get("lopHocId") ?? "");
  const monHocId = String(formData.get("monHocId") ?? "");
  const hocKyId = String(formData.get("hocKyId") ?? "");
  if (!lopHocId || !monHocId || !hocKyId) {
    throw new Error("Thiếu thông tin lớp/môn/học kỳ.");
  }

  // Kiểm tra quyền: admin, tổ trưởng hoặc giáo viên được phân công dạy môn này ở lớp này
  if (session.vaiTro === "GIAO_VIEN") {
    const gv = await db.giaoVien.findFirst({ where: { userId: session.userId } });
    const pc = gv
      ? await db.phanCong.findFirst({
          where: { giaoVienId: gv.id, lopHocId, monHocId },
        })
      : null;
    if (!pc) {
      throw new Error("Bạn không được phân công dạy môn này ở lớp này.");
    }
  }

  // Thu thập dữ liệu: diem__<hocSinhId>__<loaiDiem>
  const entries = [...formData.entries()].filter(([key]) =>
    key.startsWith("diem__")
  );

  for (const [key, raw] of entries) {
    const [, hocSinhId, loaiDiemRaw] = key.split("__");
    if (!LOAI_HOP_LE.includes(loaiDiemRaw as LoaiDiem)) continue;
    const loaiDiem = loaiDiemRaw as LoaiDiem;

    const giaTriStr = String(raw).trim();
    if (!giaTriStr) {
      await db.diem.deleteMany({
        where: { hocSinhId, monHocId, hocKyId, loaiDiem },
      });
      continue;
    }

    let data: { giaTri?: number; ketQua?: string };
    if (loaiDiem === "DANH_GIA") {
      data = { ketQua: giaTriStr };
      delete data.giaTri;
    } else {
      const so = Number(giaTriStr);
      if (isNaN(so) || so < 0 || so > 10) continue;
      data = { giaTri: so };
      delete data.ketQua;
    }

    await db.diem.upsert({
      where: {
        hocSinhId_monHocId_hocKyId_loaiDiem_lanThu: {
          hocSinhId,
          monHocId,
          hocKyId,
          loaiDiem,
          lanThu: 1,
        },
      },
      update: data,
      create: {
        hocSinhId,
        monHocId,
        hocKyId,
        loaiDiem,
        lanThu: 1,
        ...data,
      },
    });
  }

  revalidatePath("/diem");
}
