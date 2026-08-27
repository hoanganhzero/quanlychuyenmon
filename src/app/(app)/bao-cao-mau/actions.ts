"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/session";
import type { KieuDuLieu, DoiTuongNhan } from "@prisma/client";

const QUYEN = ["ADMIN", "BAN_GIAM_DOC", "TO_TRUONG"] as const;

async function kiemTraSoHuu(mauId: string) {
  const session = await requireRole(...QUYEN);
  const mau = await db.mauBaoCao.findUnique({ where: { id: mauId } });
  if (!mau) throw new Error("Không tìm thấy mẫu báo cáo.");
  if (
    mau.nguoiTaoId !== session.userId &&
    !["ADMIN", "BAN_GIAM_DOC"].includes(session.vaiTro)
  ) {
    throw new AuthError("Chỉ người tạo hoặc Ban Giám đốc mới được quản lý.");
  }
  return { session, mau };
}

export interface FieldPayload {
  tenTruong: string;
  kieuDuLieu: KieuDuLieu;
  luaChon: string | null;
  batBuoc: boolean;
}

export interface MauPayload {
  id?: string;
  tieuDe: string;
  moTa?: string;
  hanChot?: string | null;
  doiTuong: DoiTuongNhan;
  toChuyenMonId?: string | null;
  fields: FieldPayload[];
}

const KIEU_HOP_LE: KieuDuLieu[] = ["TEXT", "SO", "NGAY", "CHON", "VAN_BAN_DAI"];
const DOI_TUONG_HOP_LE: DoiTuongNhan[] = [
  "TOAN_GV",
  "GVBM",
  "GVCN",
  "TO_CHUYEN_MON",
];

export async function luuMauBaoCao(payload: MauPayload) {
  const session = await requireRole(...QUYEN);

  const tieuDe = String(payload.tieuDe ?? "").trim();
  if (!tieuDe) throw new Error("Vui lòng nhập tiêu đề form.");
  const fields = Array.isArray(payload.fields) ? payload.fields : [];
  if (fields.length === 0) throw new Error("Form cần ít nhất một trường dữ liệu.");
  if (fields.length > 60) throw new Error("Tối đa 60 trường dữ liệu.");
  if (!DOI_TUONG_HOP_LE.includes(payload.doiTuong)) {
    throw new Error("Đối tượng nhận không hợp lệ.");
  }
  if (payload.doiTuong === "TO_CHUYEN_MON" && !payload.toChuyenMonId) {
    throw new Error("Vui lòng chọn tổ chuyên môn.");
  }

  const data = {
    tieuDe,
    moTa: String(payload.moTa ?? "").trim() || null,
    hanChot: payload.hanChot ? new Date(String(payload.hanChot)) : null,
    doiTuong: payload.doiTuong,
    toChuyenMonId:
      payload.doiTuong === "TO_CHUYEN_MON" ? payload.toChuyenMonId! : null,
  };

  let mauId = payload.id;

  if (mauId) {
    const { mau } = await kiemTraSoHuu(mauId);
    if (mau.trangThai !== "NHAP") {
      throw new Error("Form đã phát hành, không thể chỉnh sửa.");
    }
    // Xóa trường cũ rồi tạo lại
    await db.mauBaoCaoField.deleteMany({ where: { mauBaoCaoId: mauId } });
    await db.mauBaoCao.update({
      where: { id: mauId },
      data: {
        ...data,
        fields: {
          create: fields.slice(0, 60).map((f, i) => ({
            thuTu: i + 1,
            tenTruong: String(f.tenTruong ?? "").trim().slice(0, 120),
            kieuDuLieu: KIEU_HOP_LE.includes(f.kieuDuLieu)
              ? f.kieuDuLieu
              : "TEXT",
            luaChon: String(f.luaChon ?? "").slice(0, 500) || null,
            batBuoc: !!f.batBuoc,
          })),
        },
      },
    });
  } else {
    const mau = await db.mauBaoCao.create({
      data: {
        ...data,
        nguoiTaoId: session.userId,
        fields: {
          create: fields.slice(0, 60).map((f, i) => ({
            thuTu: i + 1,
            tenTruong: String(f.tenTruong ?? "").trim().slice(0, 120),
            kieuDuLieu: KIEU_HOP_LE.includes(f.kieuDuLieu)
              ? f.kieuDuLieu
              : "TEXT",
            luaChon: String(f.luaChon ?? "").slice(0, 500) || null,
            batBuoc: !!f.batBuoc,
          })),
        },
      },
    });
    mauId = mau.id;
  }

  revalidatePath("/bao-cao-mau");
  redirect(`/bao-cao-mau/${mauId}`);
}

export async function phatHanhMau(id: string) {
  await kiemTraSoHuu(id);
  const mau = await db.mauBaoCao.findUnique({
    where: { id },
    include: { fields: true },
  });
  if (!mau || mau.fields.length === 0) {
    throw new Error("Form cần có trường dữ liệu trước khi phát hành.");
  }
  await db.mauBaoCao.update({
    where: { id },
    data: { trangThai: "DA_PHAT_HANH", phatHanhLuc: new Date() },
  });
  revalidatePath(`/bao-cao-mau/${id}`);
  revalidatePath("/bao-cao-mau");
}

export async function dongMau(id: string) {
  await kiemTraSoHuu(id);
  await db.mauBaoCao.update({ where: { id }, data: { trangThai: "DA_DONG" } });
  revalidatePath(`/bao-cao-mau/${id}`);
  revalidatePath("/bao-cao-mau");
}

export async function moLaiMau(id: string) {
  await kiemTraSoHuu(id);
  await db.mauBaoCao.update({
    where: { id },
    data: { trangThai: "DA_PHAT_HANH" },
  });
  revalidatePath(`/bao-cao-mau/${id}`);
  revalidatePath("/bao-cao-mau");
}

export async function xoaMau(id: string) {
  await kiemTraSoHuu(id);
  await db.mauBaoCao.delete({ where: { id } });
  revalidatePath("/bao-cao-mau");
  redirect("/bao-cao-mau");
}

export async function xoaMauForm(formData: FormData) {
  await xoaMau(String(formData.get("id") ?? ""));
}

export async function phatHanhMauForm(formData: FormData) {
  await phatHanhMau(String(formData.get("id") ?? ""));
}

export async function dongMauForm(formData: FormData) {
  await dongMau(String(formData.get("id") ?? ""));
}

export async function moLaiMauForm(formData: FormData) {
  await moLaiMau(String(formData.get("id") ?? ""));
}
