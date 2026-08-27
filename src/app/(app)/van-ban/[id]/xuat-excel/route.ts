import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const { id } = await params;
  const vb = await db.vanBan.findUnique({
    where: { id },
    include: {
      xacNhans: { include: { giaoVien: true } },
    },
  });
  if (!vb) {
    return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  }
  if (
    vb.nguoiTaoId !== session.userId &&
    !["ADMIN", "BAN_GIAM_DOC"].includes(session.vaiTro)
  ) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const xnMap = new Map(
    vb.xacNhans.map((x) => [x.giaoVienId, x.docLuc] as const)
  );

  const aoa: (string | number)[][] = [
    [
      "STT",
      "Họ và tên",
      "Mã GV",
      "Tổ chuyên môn",
      "Xác nhận đã đọc",
      "Thời gian xác nhận",
    ],
  ];

  // Lấy toàn bộ giáo viên (người nhận) — đơn giản liệt kê mọi GV
  const giaoViens = await db.giaoVien.findMany({
    orderBy: { hoTen: "asc" },
    include: { toChuyenMon: true },
  });

  giaoViens.forEach((gv, i) => {
    const docLuc = xnMap.get(gv.id);
    aoa.push([
      i + 1,
      gv.hoTen,
      gv.maGV,
      gv.toChuyenMon?.ten ?? "",
      docLuc ? "Đã xác nhận" : "Chưa xác nhận",
      docLuc
        ? new Date(docLuc).toLocaleString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "",
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{ wch: 6 }, { wch: 30 }, { wch: 10 }, { wch: 25 }, { wch: 16 }, { wch: 20 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Xac nhan");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const tenTep = `xac-nhan-${(vb.soHieu ?? vb.trichYeu).replace(/[^\p{L}\p{N} ]/gu, "").slice(0, 40)}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(tenTep)}`,
    },
  });
}
