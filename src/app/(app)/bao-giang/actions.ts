"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/session";
import { taoChuKy, xoaChuKy } from "@/lib/chuky";
import { thongBao, thongBaoVaiTro } from "@/lib/thongbao";

async function gvHienTai() {
  const session = await requireSession();
  const gv = await db.giaoVien.findFirst({ where: { userId: session.userId } });
  if (!gv) throw new Error("Tài khoản chưa liên kết hồ sơ giáo viên.");
  return gv;
}

/** Tạo hoặc sửa một dòng báo giảng. Nếu guiDuyet=1 → nộp ngay + tự ký */
export async function luuBaoGiang(formData: FormData) {
  const session = await requireSession();
  const gv = await gvHienTai();

  const id = String(formData.get("id") ?? "");
  const ngay = String(formData.get("ngay") ?? "");
  const tietBatDau = Number(formData.get("tietBatDau") ?? 1);
  const soTiet = Number(formData.get("soTiet") ?? 1);
  const tenBaiDay = String(formData.get("tenBaiDay") ?? "").trim();
  const ghiChu = String(formData.get("ghiChu") ?? "").trim() || null;
  const monHocId = String(formData.get("monHocId") ?? "");
  const lopHocId = String(formData.get("lopHocId") ?? "") || null;
  const guiDuyet = formData.get("guiDuyet") === "1";

  if (!ngay || !tenBaiDay || !monHocId) {
    throw new Error("Vui lòng chọn ngày, môn học và nhập tên bài dạy.");
  }

  if (id) {
    const bg = await db.baoGiang.findUnique({ where: { id } });
    if (!bg || bg.giaoVienId !== gv.id) throw new Error("Không có quyền sửa.");
    if (bg.trangThai === "DA_DUYET") {
      throw new Error("Bản ghi đã được phê duyệt, không thể sửa.");
    }
    if (guiDuyet) await xoaChuKy("BAO_GIANG", id);

    await db.baoGiang.update({
      where: { id },
      data: {
        ngay: new Date(ngay),
        tietBatDau,
        soTiet,
        tenBaiDay,
        ghiChu,
        monHocId,
        lopHocId,
        trangThai: guiDuyet ? "CHO_DUYET" : bg.trangThai === "TU_CHOI" ? "NHAP" : bg.trangThai,
        ngayGui: guiDuyet ? new Date() : bg.ngayGui,
        nhanXet: guiDuyet ? null : bg.nhanXet,
      },
    });

    if (guiDuyet) await taoChuKy("BAO_GIANG", id, "GV_SOAN", gv.hoTen, "center");
    revalidatePath("/bao-giang");
    redirect(`/bao-giang/${id}`);
  }

  const bg = await db.baoGiang.create({
    data: {
      ngay: new Date(ngay),
      tietBatDau,
      soTiet,
      tenBaiDay,
      ghiChu,
      giaoVienId: gv.id,
      monHocId,
      lopHocId,
      trangThai: guiDuyet ? "CHO_DUYET" : "NHAP",
      ngayGui: guiDuyet ? new Date() : null,
    },
  });

  if (guiDuyet) await taoChuKy("BAO_GIANG", bg.id, "GV_SOAN", gv.hoTen, "center");
  revalidatePath("/bao-giang");
  redirect(`/bao-giang/${bg.id}`);
}

export async function nopBaoGiangForm(formData: FormData) {
  const session = await requireSession();
  const gv = await gvHienTai();
  const id = String(formData.get("id") ?? "");

  const bg = await db.baoGiang.findUnique({ where: { id } });
  if (!bg || bg.giaoVienId !== gv.id) throw new Error("Không có quyền.");
  if (bg.trangThai !== "NHAP" && bg.trangThai !== "TU_CHOI") {
    throw new Error("Bản ghi không ở trạng thái có thể nộp.");
  }

  await xoaChuKy("BAO_GIANG", id);
  await db.baoGiang.update({
    where: { id },
    data: { trangThai: "CHO_DUYET", ngayGui: new Date(), nhanXet: null },
  });
  await taoChuKy("BAO_GIANG", id, "GV_SOAN", gv.hoTen, "center");
  // Thông báo tổ trưởng của GV + BGĐ
  const tt = gv.toChuyenMonId
    ? await db.toChuyenMon.findUnique({ where: { id: gv.toChuyenMonId }, select: { toTruong: { include: { user: true } } } })
    : null;
  if (tt?.toTruong?.user?.id) {
    await thongBao(tt.toTruong.user.id, "Sổ báo giảng chờ duyệt", `${gv.hoTen} nộp "${bg.tenBaiDay}"`, `/bao-giang/${id}`);
  }
  await thongBaoVaiTro(["ADMIN", "BAN_GIAM_DOC"], "Sổ báo giảng chờ ký", `${gv.hoTen} nộp "${bg.tenBaiDay}"`, `/bao-giang/${id}`, session.userId);
  revalidatePath("/bao-giang");
  revalidatePath(`/bao-giang/${id}`);
}

export async function xoaBaoGiangForm(formData: FormData) {
  const session = await requireSession();
  const gv = await gvHienTai();
  const id = String(formData.get("id") ?? "");
  const bg = await db.baoGiang.findUnique({ where: { id } });
  if (!bg || (bg.giaoVienId !== gv.id && session.vaiTro !== "ADMIN")) {
    throw new Error("Không có quyền xóa.");
  }
  await xoaChuKy("BAO_GIANG", id);
  await db.baoGiang.delete({ where: { id } });
  revalidatePath("/bao-giang");
  redirect("/bao-giang");
}

// ---------- DUYỆT 2 CẤP ----------

async function phamViQuanLy() {
  const session = await requireRole("ADMIN", "BAN_GIAM_DOC", "TO_TRUONG");
  // Tổ trưởng chỉ quản lý giáo viên trong tổ mình
  if (session.vaiTro === "TO_TRUONG") {
    const tt = await db.giaoVien.findFirst({
      where: { userId: session.userId },
    });
    return { session, toTruongToId: tt?.toChuyenMonId ?? "__khongco__" };
  }
  return { session, toTruongToId: null };
}

/** Không cho người duyệt tự duyệt báo giảng của chính mình */
async function camTuDuyet(bgGiaoVienId: string) {
  const gv = await db.giaoVien.findFirst({
    where: { userId: (await requireSession()).userId },
  });
  if (gv && gv.id === bgGiaoVienId) {
    throw new Error("Không thể tự duyệt báo giảng của chính mình.");
  }
}

export async function duyetCapToForm(formData: FormData) {
  const { session, toTruongToId } = await phamViQuanLy();
  const id = String(formData.get("id") ?? "");

  const bg = await db.baoGiang.findUnique({
    where: { id },
    include: { giaoVien: true },
  });
  if (!bg || bg.trangThai !== "CHO_DUYET") {
    throw new Error("Bản ghi không ở trạng thái chờ duyệt của tổ trưởng.");
  }
  if (
    toTruongToId &&
    bg.giaoVien.toChuyenMonId !== toTruongToId
  ) {
    throw new Error("Giáo viên này không thuộc tổ của bạn.");
  }
  await camTuDuyet(bg.giaoVienId);

  const viTriKy = String(formData.get("viTriKy") ?? "center");
  await db.baoGiang.update({
    where: { id },
    data: { trangThai: "CHO_BGD_DUYET", nhanXet: null },
  });
  await taoChuKy("BAO_GIANG", id, "TO_TRUONG", "", viTriKy);
  await thongBao((await db.giaoVien.findUnique({ where: { id: bg.giaoVienId }, select: { userId: true } }))?.userId ?? "", "Sổ báo giảng được duyệt cấp tổ", `"${bg.tenBaiDay}" đã qua bước tổ trưởng, đang chờ Ban Giám đốc phê duyệt.`, `/bao-giang/${id}`);
  await thongBaoVaiTro(["ADMIN", "BAN_GIAM_DOC"], "Sổ báo giảng chờ phê duyệt cuối", `${bg.giaoVien.hoTen} — "${bg.tenBaiDay}"`, `/bao-giang/${id}`, session.userId);
  revalidatePath("/bao-giang");
  revalidatePath(`/bao-giang/${id}`);
}

export async function pheDuyetCuoiForm(formData: FormData) {
  await requireRole("ADMIN", "BAN_GIAM_DOC");
  const id = String(formData.get("id") ?? "");
  const bg = await db.baoGiang.findUnique({ where: { id } });
  if (!bg || bg.trangThai !== "CHO_BGD_DUYET") {
    throw new Error("Bản ghi phải được tổ trưởng duyệt trước.");
  }
  await camTuDuyet(bg.giaoVienId);
  const viTriKy = String(formData.get("viTriKy") ?? "bottom-right");
  await db.baoGiang.update({
    where: { id },
    data: { trangThai: "DA_DUYET", nhanXet: null },
  });
  await taoChuKy("BAO_GIANG", id, "BAN_GIAM_DOC", "", viTriKy);
  await thongBao((await db.giaoVien.findUnique({ where: { id: bg.giaoVienId }, select: { userId: true } }))?.userId ?? "", "✅ Sổ báo giảng được phê duyệt", `"${bg.tenBaiDay}" đã được Ban Giám đốc ký số cuối.`, `/bao-giang/${id}`);
  revalidatePath("/bao-giang");
  revalidatePath(`/bao-giang/${id}`);
}

export async function tuChoiBaoGiangForm(formData: FormData) {
  await requireRole("ADMIN", "BAN_GIAM_DOC", "TO_TRUONG");
  const id = String(formData.get("id") ?? "");
  const nhanXet = String(formData.get("nhanXet") ?? "").trim();
  if (!nhanXet) throw new Error("Vui lòng nhập lý do từ chối.");

  const bg = await db.baoGiang.findUnique({ where: { id } });
  if (
    !bg ||
    (bg.trangThai !== "CHO_DUYET" && bg.trangThai !== "CHO_BGD_DUYET")
  ) {
    throw new Error("Không thể từ chối bản ghi này.");
  }
  await db.baoGiang.update({
    where: { id },
    data: { trangThai: "TU_CHOI", nhanXet },
  });
  await xoaChuKy("BAO_GIANG", id);
  await thongBao((await db.giaoVien.findUnique({ where: { id: bg.giaoVienId }, select: { userId: true } }))?.userId ?? "", "❌ Sổ báo giảng bị từ chối", `"${bg.tenBaiDay}": ${nhanXet}`, `/bao-giang/${id}`);
  revalidatePath("/bao-giang");
  revalidatePath(`/bao-giang/${id}`);
}

// ---------- DUYỆT HÀNG LOẠT ----------

export async function duyetLoatForm(formData: FormData) {
  const { session, toTruongToId } = await phamViQuanLy();
  const cap = String(formData.get("cap") ?? "TO"); // TO | BGD

  const where = {
    trangThai: cap === "BGD" ? ("CHO_BGD_DUYET" as const) : ("CHO_DUYET" as const),
    ...(cap === "BGD"
      ? {}
      : toTruongToId
        ? { giaoVien: { toChuyenMonId: toTruongToId } }
        : {}),
  };

  // Loại trừ bản ghi của chính người duyệt (cấm tự duyệt)
  const gvBanThan = await db.giaoVien.findFirst({
    where: { userId: session.userId },
  });

  const ds = await db.baoGiang.findMany({
    where: { ...where, ...(gvBanThan ? { giaoVienId: { not: gvBanThan.id } } : {}) },
    include: { giaoVien: true },
  });

  for (const bg of ds) {
    await db.baoGiang.update({
      where: { id: bg.id },
      data: {
        trangThai: cap === "BGD" ? "DA_DUYET" : "CHO_BGD_DUYET",
        nhanXet: null,
      },
    });
    await taoChuKy(
      "BAO_GIANG",
      bg.id,
      cap === "BGD" ? "BAN_GIAM_DOC" : "TO_TRUONG",
      "",
      cap === "BGD" ? "bottom-right" : "center"
    );
    await thongBao(
      bg.giaoVien.userId ?? "",
      cap === "BGD" ? "✅ Sổ báo giảng được phê duyệt" : "Sổ báo giảng được duyệt cấp tổ",
      `"${bg.tenBaiDay}" ${cap === "BGD" ? "đã được Ban Giám đốc ký số cuối." : "đang chờ Ban Giám đốc phê duyệt."}`,
      `/bao-giang/${bg.id}`
    );
  }

  revalidatePath("/bao-giang");
}
