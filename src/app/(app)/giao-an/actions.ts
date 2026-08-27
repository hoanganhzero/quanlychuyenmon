"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/session";
import { taoChuKy, xoaChuKy } from "@/lib/chuky";
import { thongBao, thongBaoVaiTro } from "@/lib/thongbao";
import { luuTepTrinhKy, xoaTepTrinhKy } from "@/lib/upload";

function layTep(formData: FormData): File | null {
  const entry = formData.get("tep");
  return entry instanceof File && entry.size > 0 ? entry : null;
}

export async function taoGiaoAn(formData: FormData) {
  const session = await requireSession();
  const tieuDe = String(formData.get("tieuDe") ?? "").trim();
  const loai = String(formData.get("loai") ?? "GIAO_AN");
  const noiDung = String(formData.get("noiDung") ?? "").trim();
  const phanCongId = String(formData.get("phanCongId") ?? "") || null;
  const guiDuyet = formData.get("guiDuyet") === "1";
  const tep = layTep(formData);

  let monHocId = "";
  if (phanCongId) {
    const pc = await db.phanCong.findUnique({ where: { id: phanCongId } });
    monHocId = pc?.monHocId ?? "";
  }
  if (!monHocId) {
    const firstMon = await db.monHoc.findFirst();
    monHocId = firstMon!.id;
  }

  const gv = await db.giaoVien.findFirst({
    where: { userId: session.userId },
  });
  if (!gv) throw new Error("Tài khoản chưa liên kết với hồ sơ giáo viên.");

  const giaoAn = await db.giaoAn.create({
    data: {
      tieuDe,
      loai: loai as "GIAO_AN" | "KE_HOACH_BAI_DAY" | "KE_HOACH_CHU_DE",
      noiDung,
      giaoVienId: gv.id,
      monHocId,
      phanCongId,
      trangThai: guiDuyet ? "CHO_DUYET" : "NHAP",
      ngayGui: guiDuyet ? new Date() : null,
    },
  });

  // Lưu file Word/PDF trình ký (nếu có)
  if (tep) {
    await luuTepTrinhKy({
      file: tep,
      giaoAnId: giaoAn.id,
      nguoiTaiId: session.userId,
    });
  }

  // Tự động ký với tư cách người soàn khi nộp - lưu vị trí ký
  const viTriKy = String(formData.get("viTriKy") ?? "center");
  if (guiDuyet) {
    await taoChuKy("GIAO_AN", giaoAn.id, "GV_SOAN", gv.hoTen, viTriKy);
    await thongBaoVaiTro(["ADMIN", "BAN_GIAM_DOC", "TO_TRUONG"], "Giáo án chờ duyệt", `${gv.hoTen} nộp "${tieuDe}"`, `/giao-an/${giaoAn.id}`, session.userId);
  }

  revalidatePath("/giao-an");
  redirect("/giao-an");
}

export async function suaGiaoAn(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id"));
  const tieuDe = String(formData.get("tieuDe") ?? "").trim();
  const noiDung = String(formData.get("noiDung") ?? "").trim();
  const guiDuyet = formData.get("guiDuyet") === "1";
  const tep = layTep(formData);

  const giaoAn = await db.giaoAn.findUnique({
    where: { id },
    include: { tepTrinhKys: true },
  });
  if (!giaoAn) throw new Error("Không tìm thấy giáo án.");

  if (!noiDung && !tep && giaoAn.tepTrinhKys.length === 0) {
    throw new Error("Vui lòng nhập nội dung HOẶC đính kèm file Word/PDF.");
  }

  const gv = await db.giaoVien.findFirst({ where: { userId: session.userId } });
  const laChuSoHao = gv && giaoAn.giaoVienId === gv.id;
  const laQuanLy =
    session.vaiTro === "ADMIN" ||
    session.vaiTro === "TO_TRUONG" ||
    session.vaiTro === "BAN_GIAM_DOC";
  if (!laChuSoHao && !laQuanLy) throw new Error("Không có quyền sửa.");
  if (giaoAn.trangThai === "DA_DUYET" && !laQuanLy) {
    throw new Error("Giáo án đã được phê duyệt, không thể chỉnh sửa.");
  }

  // Nộp lại → hủy chữ ký cũ, quay về đầu quy trình
  if (guiDuyet) await xoaChuKy("GIAO_AN", id);

  await db.giaoAn.update({
    where: { id },
    data: {
      tieuDe,
      noiDung,
      trangThai: guiDuyet ? "CHO_DUYET" : "NHAP",
      ngayGui: guiDuyet ? new Date() : null,
      nhanXet: null,
    },
  });

  // Thay file đính kèm nếu tải file mới lên
  if (tep) {
    for (const old of giaoAn.tepTrinhKys) {
      await xoaTepTrinhKy(old.id);
    }
    await luuTepTrinhKy({ file: tep, giaoAnId: id, nguoiTaiId: session.userId });
  }

  if (guiDuyet && gv) {
    const viTriKy = String(formData.get("viTriKy") ?? "center");
    await taoChuKy("GIAO_AN", id, "GV_SOAN", gv.hoTen, viTriKy);
  }
  revalidatePath(`/giao-an/${id}`);
  revalidatePath("/giao-an");
}

export async function xoaGiaoAn(id: string) {
  const session = await requireSession();
  const giaoAn = await db.giaoAn.findUnique({ where: { id } });
  if (!giaoAn) return;

  const gv = await db.giaoVien.findFirst({ where: { userId: session.userId } });
  const laChuSoHao = gv && giaoAn.giaoVienId === gv.id;
  if (!laChuSoHao && session.vaiTro !== "ADMIN") {
    throw new Error("Không có quyền xóa.");
  }
  await xoaChuKy("GIAO_AN", id);
  // Xóa các file đính kèm trên đĩa
  for (const tep of await db.tepTrinhKy.findMany({ where: { giaoAnId: id } })) {
    await xoaTepTrinhKy(tep.id);
  }
  await db.giaoAn.delete({ where: { id } });
  revalidatePath("/giao-an");
  redirect("/giao-an");
}

/** Cấp 1 — Tổ trưởng chuyên môn duyệt */
export async function duyetGiaoAn(formData: FormData) {
  await requireRole("TO_TRUONG", "ADMIN");
  const session = await requireSession();
  const id = String(formData.get("id"));
  const giaoAn = await db.giaoAn.findUnique({ where: { id } });
  if (!giaoAn || giaoAn.trangThai !== "CHO_DUYET") {
    throw new Error("Giáo án không ở trạng thái chờ duyệt của tổ trưởng.");
  }
  const viTriKy = String(formData.get("viTriKy") ?? "center");
  await db.giaoAn.update({
    where: { id },
    data: { trangThai: "CHO_BGD_DUYET", nhanXet: null },
  });
  await taoChuKy("GIAO_AN", id, "TO_TRUONG", "", viTriKy);
  const chu = await db.giaoAn.findUnique({ where: { id }, select: { giaoVien: true, tieuDe: true } });
  if (chu) {
    await thongBao(chu.giaoVien.userId ?? "", "Giáo án được duyệt cấp tổ", `"${chu.tieuDe}" đang chờ Ban Giám đốc phê duyệt.`, `/giao-an/${id}`);
    await thongBaoVaiTro(["ADMIN", "BAN_GIAM_DOC"], "Giáo án chờ phê duyệt cuối", `${chu.giaoVien.hoTen} — "${chu.tieuDe}"`, `/giao-an/${id}`, session.userId);
  }
  revalidatePath(`/giao-an/${id}`);
  revalidatePath("/giao-an");
}

/** Cấp 2 — Ban Giám đốc phê duyệt cuối cùng */
export async function pheDuyetGiaoAn(formData: FormData) {
  await requireRole("BAN_GIAM_DOC", "ADMIN");
  const session = await requireSession();
  const id = String(formData.get("id"));
  const giaoAn = await db.giaoAn.findUnique({ where: { id } });
  if (!giaoAn || giaoAn.trangThai !== "CHO_BGD_DUYET") {
    throw new Error("Giáo án phải được tổ trưởng duyệt trước khi Ban Giám đốc phê duyệt.");
  }
  const viTriKy = String(formData.get("viTriKy") ?? "bottom-right");
  await db.giaoAn.update({
    where: { id },
    data: { trangThai: "DA_DUYET", nhanXet: null },
  });
  await taoChuKy("GIAO_AN", id, "BAN_GIAM_DOC", "", viTriKy);
  const chu = await db.giaoAn.findUnique({ where: { id }, select: { giaoVien: true, tieuDe: true } });
  if (chu) {
    await thongBao(chu.giaoVien.userId ?? "", "✅ Giáo án được phê duyệt", `"${chu.tieuDe}" đã đủ chữ ký Ban Giám đốc.`, `/giao-an/${id}`);
  }
  revalidatePath(`/giao-an/${id}`);
  revalidatePath("/giao-an");
}

export async function tuChoiGiaoAn(formData: FormData) {
  const session = await requireRole("TO_TRUONG", "BAN_GIAM_DOC", "ADMIN");
  const id = String(formData.get("id"));
  const nhanXet = String(formData.get("nhanXet") ?? "").trim();
  if (!nhanXet) throw new Error("Vui lòng nhập nhận xét khi từ chối.");

  const giaoAn = await db.giaoAn.findUnique({ where: { id } });
  if (
    !giaoAn ||
    (giaoAn.trangThai !== "CHO_DUYET" && giaoAn.trangThai !== "CHO_BGD_DUYET")
  ) {
    throw new Error("Giáo án không ở trạng thái có thể từ chối.");
  }

  await db.giaoAn.update({
    where: { id },
    data: { trangThai: "TU_CHOI", nhanXet },
  });
  // Từ chối → hủy chữ ký, giáo viên phải soạn lại
  await xoaChuKy("GIAO_AN", id);
  const chu = await db.giaoVien.findUnique({ where: { id: giaoAn.giaoVienId }, select: { userId: true } });
  if (chu?.userId) {
    await thongBao(chu.userId, "❌ Giáo án bị từ chối", `"${giaoAn.tieuDe}": ${nhanXet}`, `/giao-an/${id}`);
  }
  revalidatePath(`/giao-an/${id}`);
  revalidatePath("/giao-an");
}