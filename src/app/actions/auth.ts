"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";

export type LoginState = { error?: string };

export async function dangNhap(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const tenDangNhap = String(formData.get("tenDangNhap") ?? "").trim();
  const matKhau = String(formData.get("matKhau") ?? "");

  if (!tenDangNhap || !matKhau) {
    return { error: "Vui lòng nhập tên tài khoản/email và mật khẩu." };
  }

  // Cho phép đăng nhập bằng tên tài khoản hoặc email
  const user = await db.user.findFirst({
    where: {
      OR: [
        { tenDangNhap: tenDangNhap },
        { email: tenDangNhap.toLowerCase() },
      ],
    },
  });
  if (!user || !user.hoatDong) {
    return { error: "Tài khoản hoặc mật khẩu không đúng." };
  }

  const hopLe = await bcrypt.compare(matKhau, user.matKhau);
  if (!hopLe) {
    return { error: "Tài khoản hoặc mật khẩu không đúng." };
  }

  await createSession({
    userId: user.id,
    email: user.email,
    hoTen: user.hoTen,
    vaiTro: user.vaiTro,
  });

  redirect("/tong-quan");
}

export async function dangXuat() {
  await destroySession();
  redirect("/login");
}
