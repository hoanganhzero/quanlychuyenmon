import "server-only";
import { createHash } from "crypto";
import { db } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import type { CapKy, LoaiVanBan } from "@prisma/client";

export const CHUC_VU_THEO_CAP: Record<CapKy, string> = {
  GV_SOAN: "Giáo viên",
  TO_TRUONG: "Tổ trưởng chuyên môn",
  BAN_GIAM_DOC: "Giám đốc",
};

export const ViTriKy = {
  TOP_LEFT: "top-left" as const,
  TOP_CENTER: "top-center" as const,
  TOP_RIGHT: "top-right" as const,
  MIDDLE_LEFT: "middle-left" as const,
  CENTER: "center" as const,
  MIDDLE_RIGHT: "middle-right" as const,
  BOTTOM_LEFT: "bottom-left" as const,
  BOTTOM_CENTER: "bottom-center" as const,
  BOTTOM_RIGHT: "bottom-right" as const,
  CUSTOM: "custom" as const,
} as const;

export type ViTriKy = typeof ViTriKy[keyof typeof ViTriKy];

// Bản đồ vị trí cố định → style CSS (top/left percentage)
export const viTriKyStyles: Record<ViTriKy, { top: string; left: string }> = {
  [ViTriKy.TOP_LEFT]: { top: "10px", left: "10px" },
  [ViTriKy.TOP_CENTER]: { top: "10px", left: "50%" },
  [ViTriKy.TOP_RIGHT]: { top: "10px", left: "calc(100% - 150px)" },
  [ViTriKy.MIDDLE_LEFT]: { top: "50%", left: "10px" },
  [ViTriKy.CENTER]: { top: "50%", left: "50%" },
  [ViTriKy.MIDDLE_RIGHT]: { top: "50%", left: "calc(100% - 150px)" },
  [ViTriKy.BOTTOM_LEFT]: { top: "calc(100% - 150px)", left: "10px" },
  [ViTriKy.BOTTOM_CENTER]: { top: "calc(100% - 150px)", left: "50%" },
  [ViTriKy.BOTTOM_RIGHT]: { top: "calc(100% - 150px)", left: "calc(100% - 150px)" },
  [ViTriKy.CUSTOM]: { top: "0", left: "0" }, // mặc định sẽ được override bởi dữ liệu custom
};

/**
 * Tự động tạo chữ ký số cho văn bản:
 * - Mã xác thực SHA-256 (8 ký tự) từ thông tin bản ký
 * - Ghi nhận người ký, chức vụ, thời gian
 */
export async function taoChuKy(
  loaiVanBan: LoaiVanBan,
  vanBanId: string,
  capKy: CapKy,
  tenNguoiKyOverride?: string,
  /** Vị trí cố định ("top-left"...) hoặc custom dạng "custom-<x%>-<y%>" */
  viTriKy?: string,
  templateId?: string
) {
  const session = await requireSession();
  const kyLuc = new Date();
  const maXacThuc = createHash("sha256")
    .update(
      `${loaiVanBan}|${vanBanId}|${capKy}|${session.userId}|${kyLuc.toISOString()}`
    )
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();

  return db.chuKy.create({
    data: {
      loaiVanBan,
      vanBanId,
      capKy,
      nguoiKyId: session.userId,
      tenNguoiKy: tenNguoiKyOverride ?? session.hoTen,
      chucVu: CHUC_VU_THEO_CAP[capKy],
      maXacThuc,
      kyLuc,
      viTriKy,
      templateId,
    },
  });
}

/** Xóa toàn bộ chữ ký cũ khi soạn lại / nộp lại văn bản */
export async function xoaChuKy(loaiVanBan: LoaiVanBan, vanBanId: string) {
  await db.chuKy.deleteMany({ where: { loaiVanBan, vanBanId } });
}

/**
 * Vị trí ký tùy chỉnh được mã hóa trong chuỗi viTriKy dạng "custom-<x>-<y>"
 * với x, y là phần trăm (0-100) tính từ góc trái-trên của trang.
 */
export function maHoaViTriCustom(xPercent: number, yPercent: number): ViTriKy {
  const x = Math.max(0, Math.min(100, Math.round(xPercent * 10) / 10));
  const y = Math.max(0, Math.min(100, Math.round(yPercent * 10) / 10));
  return `custom-${x}-${y}` as ViTriKy;
}

export function laViTriCustom(viTri?: string | null): boolean {
  return !!viTri?.startsWith("custom-");
}

/** Tách phần trăm từ chuỗi custom; trả null nếu không phải custom */
export function tachViTriCustom(
  viTri?: string | null
): { xPercent: number; yPercent: number } | null {
  if (!laViTriCustom(viTri)) return null;
  const parts = (viTri as string).split("-");
  const x = Number(parts[1]);
  const y = Number(parts[2]);
  if (Number.isNaN(x) || Number.isNaN(y)) return null;
  return { xPercent: x, yPercent: y };
}
