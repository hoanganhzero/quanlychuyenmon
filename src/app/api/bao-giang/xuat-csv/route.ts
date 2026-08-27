import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/prisma";
import { LABEL_TRANG_THAI } from "@/lib/utils";

const LABEL: Record<string, string> = LABEL_TRANG_THAI;

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const url = new URL(req.url);
  const thang = Number(url.searchParams.get("thang")) || new Date().getMonth() + 1;
  const nam = Number(url.searchParams.get("nam")) || new Date().getFullYear();
  const gvId = url.searchParams.get("gv") || undefined;

  // Phân quyền: giáo viên chỉ xuất của mình; tổ trưởng chỉ trong tổ
  const gvBanThan = await db.giaoVien.findFirst({ where: { userId: session.userId } });
  const laQuanLy = ["ADMIN", "BAN_GIAM_DOC", "TO_TRUONG"].includes(session.vaiTro);

  const where: Record<string, unknown> = {
    ngay: { gte: new Date(nam, thang - 1, 1), lte: new Date(nam, thang, 0) },
  };
  if (!laQuanLy) {
    where.giaoVienId = gvBanThan?.id ?? "__khongco__";
  } else if (gvId) {
    where.giaoVienId = gvId;
  } else if (session.vaiTro === "TO_TRUONG") {
    where.giaoVien = { toChuyenMonId: gvBanThan?.toChuyenMonId ?? "__khongco__" };
  }

  const rows = await db.baoGiang.findMany({
    where,
    include: { giaoVien: true, monHoc: true, lopHoc: true },
    orderBy: [{ ngay: "asc" }, { tietBatDau: "asc" }],
  });

  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines: string[] = [];

  // Tiêu đề báo cáo
  lines.push(esc(`SỔ BÁO GIẢNG — THÁNG ${thang}/${nam}`));
  lines.push(esc(`Xuất lúc: ${new Date().toLocaleString("vi-VN")} — Người xuất: ${session.hoTen}`));
  lines.push("");
  lines.push(
    ["STT", "Ngày", "Giáo viên", "Môn học", "Lớp", "Tiết bắt đầu", "Số tiết", "Tên bài dạy", "Trạng thái"].map(esc).join(",")
  );

  // Thống kê số tiết theo GV
  const tietTheoGV = new Map<string, number>();

  let stt = 1;
  for (const r of rows) {
    const dd = String(r.ngay.getDate()).padStart(2, "0");
    const mm = String(r.ngay.getMonth() + 1).padStart(2, "0");
    lines.push(
      [
        stt++,
        `${dd}/${mm}/${r.ngay.getFullYear()}`,
        r.giaoVien.hoTen,
        r.monHoc.tenMon,
        r.lopHoc?.ten ?? "",
        r.tietBatDau,
        r.soTiet,
        r.tenBaiDay,
        LABEL[r.trangThai] ?? r.trangThai,
      ].map(esc).join(",")
    );
    tietTheoGV.set(r.giaoVienId, (tietTheoGV.get(r.giaoVienId) ?? 0) + r.soTiet);
  }

  // Bảng tổng hợp số tiết từng GV
  lines.push("");
  lines.push(esc("TỔNG HỢP SỐ TIẾT DẠY THEO GIÁO VIÊN"));
  lines.push(["Giáo viên", "Số tiết đã dạy"].map(esc).join(","));
  const tenTheoId = new Map(rows.map((r) => [r.giaoVienId, r.giaoVien.hoTen]));
  for (const [gvIdKey, soTiet] of [...tietTheoGV.entries()].sort((a, b) => b[1] - a[1])) {
    lines.push([tenTheoId.get(gvIdKey) ?? gvIdKey, soTiet].map(esc).join(","));
  }
  lines.push([esc("TỔNG CỘNG"), rows.reduce((s, r) => s + r.soTiet, 0)].map(esc).join(","));

  // BOM UTF-8 để Excel hiển thị tiếng Việt đúng
  const csv = "\uFEFF" + lines.join("\r\n");
  const tenFile = `so-bao-giang-thang${thang}-${nam}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(tenFile)}`,
    },
  });
}
