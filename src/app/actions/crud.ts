"use server";

import { kichHoatNamHoc, xoaNamHoc, batDauHocKy } from "@/app/(app)/nam-hoc/actions";
import { xoaGiaoVien } from "@/app/(app)/giao-vien/actions";
import { xoaMonHoc } from "@/app/(app)/mon-hoc/actions";
import { xoaTo } from "@/app/(app)/to-chuyen-mon/actions";
import { xoaLop } from "@/app/(app)/lop-hoc/actions";
import { xoaHocSinh } from "@/app/(app)/hoc-sinh/actions";
import { xoaPhanCong } from "@/app/(app)/phan-cong/actions";
import { xoaTietHoc } from "@/app/(app)/thoi-khoa-bieu/actions";
import { duyetGiaoAn, xoaGiaoAn, pheDuyetGiaoAn } from "@/app/(app)/giao-an/actions";
import { duyetBaoCao, pheDuyetBaoCao } from "@/app/(app)/bao-cao-gvcn/actions";
import { xoaGioDay } from "@/app/(app)/gio-giang/actions";

function id(fd: FormData): string {
  return String(fd.get("id") ?? "");
}

export async function kichHoatNamHocForm(fd: FormData) {
  await kichHoatNamHoc(id(fd));
}
export async function xoaNamHocForm(fd: FormData) {
  await xoaNamHoc(id(fd));
}
export async function batDauHocKyForm(fd: FormData) {
  await batDauHocKy(id(fd));
}
export async function xoaGiaoVienForm(fd: FormData) {
  await xoaGiaoVien(id(fd));
}
export async function xoaMonHocForm(fd: FormData) {
  await xoaMonHoc(id(fd));
}
export async function xoaToForm(fd: FormData) {
  await xoaTo(id(fd));
}
export async function xoaLopForm(fd: FormData) {
  await xoaLop(id(fd));
}
export async function xoaHocSinhForm(fd: FormData) {
  await xoaHocSinh(id(fd));
}
export async function xoaPhanCongForm(fd: FormData) {
  await xoaPhanCong(id(fd));
}
export async function xoaTietHocForm(fd: FormData) {
  await xoaTietHoc(id(fd));
}
export async function duyetGiaoAnForm(fd: FormData) {
  await duyetGiaoAn(fd);
}
export async function pheDuyetGiaoAnForm(fd: FormData) {
  await pheDuyetGiaoAn(fd);
}
export async function xoaGiaoAnForm(fd: FormData) {
  await xoaGiaoAn(id(fd));
}
export async function duyetBaoCaoForm(fd: FormData) {
  await duyetBaoCao(fd);
}
export async function pheDuyetBaoCaoForm(fd: FormData) {
  await pheDuyetBaoCao(fd);
}
export async function xoaGioDayForm(fd: FormData) {
  await xoaGioDay(id(fd));
}
