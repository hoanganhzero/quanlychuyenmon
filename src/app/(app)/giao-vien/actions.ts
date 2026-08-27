"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export async function themGiaoVien(formData: FormData) {
  await requireRole("ADMIN");
  const maGV = String(formData.get("maGV") ?? "").trim();
  const hoTen = String(formData.get("hoTen") ?? "").trim();
  const gioiTinh = formData.get("gioiTinh") === "nam";
  const ngaySinh = String(formData.get("ngaySinh") ?? "");
  const dienThoai = String(formData.get("dienThoai") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim().toLowerCase() || null;
  const chuyenMon = String(formData.get("chuyenMon") ?? "").trim() || null;
  const trinhDo = String(formData.get("trinhDo") ?? "").trim() || null;
  const toChuyenMonId = String(formData.get("toChuyenMonId") ?? "") || null;
  const matKhau = String(formData.get("matKhau") ?? "").trim();

  if (matKhau && matKhau.length < 6) {
    throw new Error("Mật khẩu phải có ít nhất 6 ký tự.");
  }

  // Tạo tài khoản đăng nhập (tuỳ chọn)
  let userId: string | null = null;
  if (email) {
    const existedUser = await db.user.findUnique({ where: { email } });
    if (existedUser) throw new Error("Email tài khoản đã tồn tại.");
    const tenDangNhap = String(formData.get("tenDangNhap") ?? "").trim();
    if (tenDangNhap) {
      const existedTen = await db.user.findUnique({ where: { tenDangNhap } });
      if (existedTen) throw new Error("Tên tài khoản đã được sử dụng.");
    }
    const hash = await bcrypt.hash(matKhau || "gv123456", 10);
    const user = await db.user.create({
      data: {
        email,
        matKhau: hash,
        hoTen,
        vaiTro: "GIAO_VIEN",
        ...(tenDangNhap ? { tenDangNhap } : {}),
      },
    });
    userId = user.id;
  }

  try {
    await db.giaoVien.create({
      data: {
        maGV,
        hoTen,
        gioiTinh,
        ngaySinh: ngaySinh ? new Date(ngaySinh) : null,
        dienThoai,
        email,
        chuyenMon,
        trinhDo,
        toChuyenMonId,
        userId,
      },
    });
  } catch {
    if (userId) await db.user.delete({ where: { id: userId } });
    throw new Error(
      "Không thể thêm giáo viên (mã giáo viên có thể đã tồn tại)."
    );
  }
  revalidatePath("/giao-vien");
}

/** Sửa toàn bộ thông tin hồ sơ giáo viên */
export async function suaGiaoVien(formData: FormData) {
  await requireRole("ADMIN");
  const id = String(formData.get("id"));
  const hoTen = String(formData.get("hoTen") ?? "").trim();
  const gioiTinh = formData.get("gioiTinh") === "nam";
  const ngaySinh = String(formData.get("ngaySinh") ?? "");
  const dienThoai = String(formData.get("dienThoai") ?? "").trim() || null;
  const chuyenMon = String(formData.get("chuyenMon") ?? "").trim() || null;
  const trinhDo = String(formData.get("trinhDo") ?? "").trim() || null;
  const toChuyenMonId = String(formData.get("toChuyenMonId") ?? "") || null;

  if (!hoTen) throw new Error("Vui lòng nhập họ tên.");

  await db.giaoVien.update({
    where: { id },
    data: {
      hoTen,
      gioiTinh,
      ngaySinh: ngaySinh ? new Date(ngaySinh) : null,
      dienThoai,
      chuyenMon,
      trinhDo,
      toChuyenMonId,
    },
  });

  // Cập nhật luôn tên hiển thị của tài khoản liên kết
  const gv = await db.giaoVien.findUnique({ where: { id }, include: { user: true } });
  if (gv?.userId) {
    await db.user.update({ where: { id: gv.userId }, data: { hoTen } });
  }
  revalidatePath("/giao-vien");
}

/** Tạo tài khoản đăng nhập cho giáo viên chưa có */
export async function taoTaiKhoanForm(formData: FormData) {
  await requireRole("ADMIN");
  const gvId = String(formData.get("id"));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const tenDangNhap = String(formData.get("tenDangNhap") ?? "").trim();
  const matKhau = String(formData.get("matKhau") ?? "").trim();
  if (!email) throw new Error("Vui lòng nhập email.");
  if (matKhau.length < 6) throw new Error("Mật khẩu phải có ít nhất 6 ký tự.");

  const gv = await db.giaoVien.findUnique({ where: { id: gvId } });
  if (!gv) throw new Error("Không tìm thấy giáo viên.");
  if (gv.userId) throw new Error("Giáo viên này đã có tài khoản.");
  const existedUser = await db.user.findUnique({ where: { email } });
  if (existedUser) throw new Error("Email đã được sử dụng.");
  if (tenDangNhap) {
    const existedTen = await db.user.findUnique({ where: { tenDangNhap } });
    if (existedTen) throw new Error("Tên tài khoản đã được sử dụng.");
  }

  const hash = await bcrypt.hash(matKhau, 10);
  const user = await db.user.create({
    data: {
      email,
      matKhau: hash,
      hoTen: gv.hoTen,
      vaiTro: "GIAO_VIEN",
      ...(tenDangNhap ? { tenDangNhap } : {}),
    },
  });
  await db.giaoVien.update({ where: { id: gvId }, data: { userId: user.id, email } });
  revalidatePath("/giao-vien");
}

/** Đặt / đổi tên tài khoản (đăng nhập thay email) */
export async function datTenDangNhapForm(formData: FormData) {
  await requireRole("ADMIN");
  const gvId = String(formData.get("id"));
  const tenDangNhap = String(formData.get("tenDangNhap") ?? "").trim();

  const gv = await db.giaoVien.findUnique({ where: { id: gvId } });
  if (!gv?.userId) throw new Error("Giáo viên này chưa có tài khoản.");

  if (tenDangNhap) {
    if (!/^[\w.\-]{3,30}$/.test(tenDangNhap)) {
      throw new Error(
        "Tên tài khoản 3-30 ký tự, chỉ gồm chữ, số, dấu chấm, gạch ngang/gạch dưới."
      );
    }
    const existed = await db.user.findFirst({
      where: { tenDangNhap, NOT: { id: gv.userId } },
    });
    if (existed) throw new Error("Tên tài khoản đã được sử dụng.");
  }

  await db.user.update({
    where: { id: gv.userId },
    data: { tenDangNhap: tenDangNhap || null },
  });
  revalidatePath("/giao-vien");
}

/** Đặt lại mật khẩu cho tài khoản của giáo viên */
export async function datMatKhauForm(formData: FormData) {
  await requireRole("ADMIN");
  const gvId = String(formData.get("id"));
  const matKhau = String(formData.get("matKhau") ?? "").trim();
  if (matKhau.length < 6) throw new Error("Mật khẩu phải có ít nhất 6 ký tự.");

  const gv = await db.giaoVien.findUnique({ where: { id: gvId } });
  if (!gv?.userId) throw new Error("Giáo viên này chưa có tài khoản.");
  const hash = await bcrypt.hash(matKhau, 10);
  await db.user.update({ where: { id: gv.userId }, data: { matKhau: hash } });
  revalidatePath("/giao-vien");
}

/** Gán vai trò cho tài khoản giáo viên (Admin / Tổ trưởng / Giáo viên / BGĐ) */
export async function datVaiTroForm(formData: FormData) {
  await requireRole("ADMIN");
  const gvId = String(formData.get("id"));
  const vaiTro = String(formData.get("vaiTro")) as
    | "ADMIN"
    | "BAN_GIAM_DOC"
    | "TO_TRUONG"
    | "GIAO_VIEN";

  const gv = await db.giaoVien.findUnique({ where: { id: gvId } });
  if (!gv?.userId) throw new Error("Giáo viên này chưa có tài khoản.");
  await db.user.update({ where: { id: gv.userId }, data: { vaiTro } });
  revalidatePath("/giao-vien");
}

export async function xoaGiaoVien(id: string) {
  await requireRole("ADMIN");
  const gv = await db.giaoVien.findUnique({ where: { id } });
  await db.giaoVien.delete({ where: { id } });
  if (gv?.userId) await db.user.delete({ where: { id: gv.userId } }).catch(() => {});
  revalidatePath("/giao-vien");
}
