"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export async function themHocSinh(formData: FormData) {
  await requireRole("ADMIN");
  const maHS = String(formData.get("maHS") ?? "").trim();
  const hoTen = String(formData.get("hoTen") ?? "").trim();
  const ngaySinh = String(formData.get("ngaySinh") ?? "");
  const gioiTinh = formData.get("gioiTinh") === "nam";
  const diaChi = String(formData.get("diaChi") ?? "").trim() || null;
  const tenCha = String(formData.get("tenCha") ?? "").trim() || null;
  const tenMe = String(formData.get("tenMe") ?? "").trim() || null;
  const sdtPhuHuynh = String(formData.get("sdtPhuHuynh") ?? "").trim() || null;
  const lopHocId = String(formData.get("lopHocId") ?? "") || null;

  if (!maHS || !hoTen || !ngaySinh) {
    throw new Error("Vui lòng nhập mã học sinh, họ tên và ngày sinh.");
  }

  try {
    await db.hocSinh.create({
      data: {
        maHS,
        hoTen,
        ngaySinh: new Date(ngaySinh),
        gioiTinh,
        diaChi,
        tenCha,
        tenMe,
        sdtPhuHuynh,
        lopHocId,
      },
    });
  } catch {
    throw new Error("Mã học sinh có thể đã tồn tại.");
  }
  revalidatePath("/hoc-sinh");
}

export async function suaHocSinh(formData: FormData) {
  await requireRole("ADMIN");
  const id = String(formData.get("id"));
  const hoTen = String(formData.get("hoTen") ?? "").trim();
  const ngaySinh = String(formData.get("ngaySinh") ?? "");
  const gioiTinh = formData.get("gioiTinh") === "nam";
  const diaChi = String(formData.get("diaChi") ?? "").trim() || null;
  const tenCha = String(formData.get("tenCha") ?? "").trim() || null;
  const tenMe = String(formData.get("tenMe") ?? "").trim() || null;
  const sdtPhuHuynh = String(formData.get("sdtPhuHuynh") ?? "").trim() || null;
  if (!hoTen || !ngaySinh) throw new Error("Vui lòng nhập họ tên và ngày sinh.");

  await db.hocSinh.update({
    where: { id },
    data: {
      hoTen,
      ngaySinh: new Date(ngaySinh),
      gioiTinh,
      diaChi,
      tenCha,
      tenMe,
      sdtPhuHuynh,
    },
  });
  revalidatePath("/hoc-sinh");
}

export async function xoaHocSinh(id: string) {
  await requireRole("ADMIN");
  await db.hocSinh.delete({ where: { id } });
  revalidatePath("/hoc-sinh");
}

export async function chuyenLop(formData: FormData) {
  await requireRole("ADMIN");
  const hocSinhId = String(formData.get("hocSinhId") ?? "");
  const lopHocId = String(formData.get("lopHocId") ?? "") || null;
  await db.hocSinh.update({ where: { id: hocSinhId }, data: { lopHocId } });
  revalidatePath("/hoc-sinh");
}
