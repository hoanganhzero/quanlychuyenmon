"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/session";
import { luuTepTrinhKy, xoaTepTrinhKy } from "@/lib/upload";
import type { TheLoaiVanBan, DoiTuongNhan } from "@prisma/client";

const QUYEN = ["ADMIN", "BAN_GIAM_DOC", "TO_TRUONG"] as const;

async function kiemTraSoHuu(vbId: string) {
  const session = await requireRole(...QUYEN);
  const vb = await db.vanBan.findUnique({ where: { id: vbId } });
  if (!vb) throw new Error("Không tìm thấy văn bản.");
  if (
    vb.nguoiTaoId !== session.userId &&
    !["ADMIN", "BAN_GIAM_DOC"].includes(session.vaiTro)
  ) {
    throw new Error("Chỉ người phát hành hoặc Ban Giám đốc mới được quản lý.");
  }
}

export async function taoVanBan(formData: FormData) {
  const session = await requireRole(...QUYEN);

  const soHieu = String(formData.get("soHieu") ?? "").trim() || null;
  const trichYeu = String(formData.get("trichYeu") ?? "").trim();
  const loaiVanBan = String(formData.get("loaiVanBan") ?? "KHAC") as TheLoaiVanBan;
  const noiDung = String(formData.get("noiDung") ?? "").trim();
  const ngayBanHanh = String(formData.get("ngayBanHanh") ?? "");
  const nguoiTrinhBay = String(formData.get("nguoiTrinhBay") ?? "").trim() || null;
  const hanChot = String(formData.get("hanChot") ?? "");
  const doiTuong = String(formData.get("doiTuong") ?? "TOAN_GV") as DoiTuongNhan;
  const toChuyenMonId = String(formData.get("toChuyenMonId") ?? "") || null;

  const tepEntry = formData.get("tep");
  const tep =
    tepEntry instanceof File && tepEntry.size > 0 ? tepEntry : null;

  if (!trichYeu) throw new Error("Vui lòng nhập trích yếu nội dung.");
  if (!noiDung && !tep) {
    throw new Error("Vui lòng nhập nội dung HOẶC đính kèm file văn bản.");
  }

  const vanBan = await db.vanBan.create({
    data: {
      soHieu,
      trichYeu,
      loaiVanBan,
      noiDung,
      ngayBanHanh: ngayBanHanh ? new Date(ngayBanHanh) : null,
      nguoiTrinhBay,
      hanChot: hanChot ? new Date(hanChot) : null,
      doiTuong,
      toChuyenMonId: doiTuong === "TO_CHUYEN_MON" ? toChuyenMonId : null,
      trangThai: "NHAP",
      nguoiTaoId: session.userId,
    },
  });

  if (tep) {
    await luuTepTrinhKy({
      file: tep,
      vanBanId: vanBan.id,
      nguoiTaiId: session.userId,
    });
  }

  revalidatePath("/van-ban");
  redirect(`/van-ban/${vanBan.id}`);
}

export async function phatHanhVanBan(id: string) {
  await kiemTraSoHuu(id);
  await db.vanBan.update({
    where: { id },
    data: { trangThai: "DA_PHAT_HANH", phatHanhLuc: new Date() },
  });
  revalidatePath(`/van-ban/${id}`);
  revalidatePath("/van-ban");
}

export async function phatHanhVanBanForm(formData: FormData) {
  await phatHanhVanBan(String(formData.get("id") ?? ""));
}

export async function dongVanBanForm(formData: FormData) {
  await dongVanBan(String(formData.get("id") ?? ""));
}

export async function dongVanBan(id: string) {
  await kiemTraSoHuu(id);
  await db.vanBan.update({ where: { id }, data: { trangThai: "DA_DONG" } });
  revalidatePath(`/van-ban/${id}`);
  revalidatePath("/van-ban");
}

export async function xacNhanDoc(formData: FormData) {
  const session = await requireSession();
  const vanBanId = String(formData.get("vanBanId") ?? "");

  const gv = await db.giaoVien.findFirst({ where: { userId: session.userId } });
  if (!gv) throw new Error("Tài khoản chưa liên kết hồ sơ giáo viên.");

  const vb = await db.vanBan.findUnique({ where: { id: vanBanId } });
  if (!vb || vb.trangThai === "NHAP") {
    throw new Error("Văn bản không hợp lệ.");
  }

  await db.xacNhanVanBan.upsert({
    where: { vanBanId_giaoVienId: { vanBanId, giaoVienId: gv.id } },
    update: { docLuc: new Date(), daDoc: true },
    create: { vanBanId, giaoVienId: gv.id },
  });

  revalidatePath("/form-cua-toi");
}
