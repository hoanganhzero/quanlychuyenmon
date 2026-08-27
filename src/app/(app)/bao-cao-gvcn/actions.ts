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

export async function taoBaoCao(formData: FormData) {
  const session = await requireSession();

  const gv = await db.giaoVien.findFirst({ where: { userId: session.userId } });
  if (!gv) throw new Error("Tài khoản chưa liên kết hồ sơ giáo viên.");

  const lopHocId = String(formData.get("lopHocId") ?? "");
  const thang = Number(formData.get("thang"));
  const namHocId = String(formData.get("namHocId") ?? "");

  // Chỉ được báo cáo lớp mình chủ nhiệm
  const lop = await db.lopHoc.findUnique({ where: { id: lopHocId } });
  if (!lop || lop.gvcnId !== gv.id) {
    throw new Error("Bạn không phải là GVCN của lớp này.");
  }

  const siSo = Number(formData.get("siSo") ?? 0) || null;
  const nghiCoPhep = Number(formData.get("nghiCoPhep") ?? 0) || null;
  const nghiKoPhep = Number(formData.get("nghiKoPhep") ?? 0) || null;
  const noiDung = String(formData.get("noiDung") ?? "").trim();
  const deXuat = String(formData.get("deXuat") ?? "").trim() || null;
  const guiDuyet = formData.get("guiDuyet") === "1";
  const tep = layTep(formData);

  let baoCao;
  try {
    baoCao = await db.baoCaoGVCN.create({
      data: {
        gvcnId: gv.id,
        lopHocId,
        namHocId,
        thang,
        siSo,
        nghiCoPhep,
        nghiKoPhep,
        noiDung,
        deXuat,
        trangThai: guiDuyet ? "CHO_DUYET" : "NHAP",
        ngayGui: guiDuyet ? new Date() : null,
      },
    });
  } catch {
    throw new Error(
      `Báo cáo tháng ${thang} của lớp này đã tồn tại. Hãy sửa báo cáo cũ.`
    );
  }

  if (guiDuyet) {
    await taoChuKy("BAO_CAO_GVCN", baoCao.id, "GV_SOAN", gv.hoTen);
  }
  if (tep) {
    await luuTepTrinhKy({
      file: tep,
      baoCaoId: baoCao.id,
      nguoiTaiId: session.userId,
    });
  }
  revalidatePath("/bao-cao-gvcn");
  redirect("/bao-cao-gvcn");
}

export async function suaBaoCao(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id"));

  const bc = await db.baoCaoGVCN.findUnique({
    where: { id },
    include: { tepTrinhKys: true },
  });
  if (!bc) throw new Error("Không tìm thấy báo cáo.");

  const gv = await db.giaoVien.findFirst({ where: { userId: session.userId } });
  const laChu = gv && bc.gvcnId === gv.id;
  if (!laChu && session.vaiTro !== "ADMIN") {
    throw new Error("Không có quyền sửa báo cáo này.");
  }

  const guiDuyet = formData.get("guiDuyet") === "1";
  const tep = layTep(formData);

  if (guiDuyet) await xoaChuKy("BAO_CAO_GVCN", id);

  await db.baoCaoGVCN.update({
    where: { id },
    data: {
      siSo: Number(formData.get("siSo") ?? 0) || null,
      nghiCoPhep: Number(formData.get("nghiCoPhep") ?? 0) || null,
      nghiKoPhep: Number(formData.get("nghiKoPhep") ?? 0) || null,
      noiDung: String(formData.get("noiDung") ?? "").trim(),
      deXuat: String(formData.get("deXuat") ?? "").trim() || null,
      trangThai: guiDuyet ? "CHO_DUYET" : "NHAP",
      ngayGui: guiDuyet ? new Date() : null,
    },
  });

  if (guiDuyet && gv) {
    await taoChuKy("BAO_CAO_GVCN", id, "GV_SOAN", gv.hoTen);
  }

  // Thay file đính kèm nếu tải file mới lên
  if (tep) {
    for (const old of bc.tepTrinhKys) {
      await xoaTepTrinhKy(old.id);
    }
    await luuTepTrinhKy({ file: tep, baoCaoId: id, nguoiTaiId: session.userId });
  }
  revalidatePath("/bao-cao-gvcn");
}

/** Cấp 1 — Tổ trưởng chuyên môn duyệt */
export async function duyetBaoCao(formData: FormData) {
  await requireRole("TO_TRUONG", "ADMIN");
  const session = await requireSession();
  const id = String(formData.get("id"));
  const bc = await db.baoCaoGVCN.findUnique({ where: { id } });
  if (!bc || bc.trangThai !== "CHO_DUYET") {
    throw new Error("Báo cáo không ở trạng thái chờ duyệt của tổ trưởng.");
  }
  // Cấm tự duyệt báo cáo của chính mình
  const gvBanThan = await db.giaoVien.findFirst({
    where: { userId: (await requireSession()).userId },
  });
  if (gvBanThan && bc.gvcnId === gvBanThan.id) {
    throw new Error("Không thể tự duyệt báo cáo của chính mình.");
  }
  const viTriKy = String(formData.get("viTriKy") ?? "center");
  await db.baoCaoGVCN.update({
    where: { id },
    data: { trangThai: "CHO_BGD_DUYET", nhanXet: null },
  });
  await taoChuKy("BAO_CAO_GVCN", id, "TO_TRUONG", "", viTriKy);
  const chu = await db.giaoVien.findUnique({ where: { id: bc.gvcnId }, select: { userId: true, hoTen: true } });
  if (chu?.userId) {
    await thongBao(chu.userId, "Báo cáo GVCN được duyệt cấp tổ", `Báo cáo tháng ${bc.thang} đang chờ Ban Giám đốc.`, `/bao-cao-gvcn/${id}`);
  }
  await thongBaoVaiTro(["ADMIN", "BAN_GIAM_DOC"], "Báo cáo GVCN chờ phê duyệt", `${chu?.hoTen ?? "GVCN"} — tháng ${bc.thang}`, `/bao-cao-gvcn/${id}`, session.userId);
  revalidatePath("/bao-cao-gvcn");
}

/** Cấp 2 — Ban Giám đốc phê duyệt cuối cùng */
export async function pheDuyetBaoCao(formData: FormData) {
  await requireRole("BAN_GIAM_DOC", "ADMIN");
  const session = await requireSession();
  const id = String(formData.get("id"));
  const bc = await db.baoCaoGVCN.findUnique({ where: { id } });
  if (!bc || bc.trangThai !== "CHO_BGD_DUYET") {
    throw new Error("Báo cáo phải được tổ trưởng duyệt trước khi Ban Giám đốc phê duyệt.");
  }
  // Cấm tự duyệt
  const gvBanThan = await db.giaoVien.findFirst({
    where: { userId: (await requireSession()).userId },
  });
  if (gvBanThan && bc.gvcnId === gvBanThan.id) {
    throw new Error("Không thể tự duyệt báo cáo của chính mình.");
  }
  const viTriKy = String(formData.get("viTriKy") ?? "bottom-right");
  await db.baoCaoGVCN.update({
    where: { id },
    data: { trangThai: "DA_DUYET", nhanXet: null },
  });
  await taoChuKy("BAO_CAO_GVCN", id, "BAN_GIAM_DOC", "", viTriKy);
  const chu = await db.giaoVien.findUnique({ where: { id: bc.gvcnId }, select: { userId: true } });
  if (chu?.userId) {
    await thongBao(chu.userId, "✅ Báo cáo GVCN được phê duyệt", `Báo cáo tháng ${bc.thang} đã đủ chữ ký.`, `/bao-cao-gvcn/${id}`);
  }
  revalidatePath("/bao-cao-gvcn");
}

export async function tuChoiBaoCao(formData: FormData) {
  await requireRole("TO_TRUONG", "BAN_GIAM_DOC", "ADMIN");
  const session = await requireSession();
  const id = String(formData.get("id"));
  const nhanXet = String(formData.get("nhanXet") ?? "").trim();
  if (!nhanXet) throw new Error("Vui lòng nhập nhận xét.");

  const bc = await db.baoCaoGVCN.findUnique({ where: { id } });
  if (
    !bc ||
    (bc.trangThai !== "CHO_DUYET" && bc.trangThai !== "CHO_BGD_DUYET")
  ) {
    throw new Error("Báo cáo không ở trạng thái có thể từ chối.");
  }

  await db.baoCaoGVCN.update({
    where: { id },
    data: { trangThai: "TU_CHOI", nhanXet },
  });
  await xoaChuKy("BAO_CAO_GVCN", id);
  const chu = await db.giaoVien.findUnique({ where: { id: bc.gvcnId }, select: { userId: true } });
  if (chu?.userId) {
    await thongBao(chu.userId, "❌ Báo cáo GVCN bị từ chối", `Tháng ${bc.thang}: ${nhanXet}`, `/bao-cao-gvcn/${id}`);
  }
  revalidatePath("/bao-cao-gvcn");
}
