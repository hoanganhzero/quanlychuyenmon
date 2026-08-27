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
  const mau = await db.mauBaoCao.findUnique({
    where: { id },
    include: {
      fields: { orderBy: { thuTu: "asc" } },
      phanHois: {
        include: {
          giaoVien: true,
          giaTris: true,
        },
      },
    },
  });
  if (!mau) {
    return NextResponse.json({ error: "Không tìm thấy form" }, { status: 404 });
  }
  if (
    mau.nguoiTaoId !== session.userId &&
    !["ADMIN", "BAN_GIAM_DOC"].includes(session.vaiTro)
  ) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  // Hàng tiêu đề
  const header = ["STT", "Họ và tên", "Mã GV", ...mau.fields.map((f) => f.tenTruong), "Thời gian nộp"];
  const aoa: (string | number | null)[][] = [header];

  mau.phanHois
    .slice()
    .sort((a, b) => a.giaoVien.hoTen.localeCompare(b.giaoVien.hoTen, "vi"))
    .forEach((ph, i) => {
      const row: (string | number | null)[] = [
        i + 1,
        ph.giaoVien.hoTen,
        ph.giaoVien.maGV,
      ];
      for (const f of mau.fields) {
        const g = ph.giaTris.find((x) => x.fieldId === f.id);
        row.push(g?.giaTri ?? "");
      }
      row.push(
        new Date(ph.guiLuc).toLocaleString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      );
      aoa.push(row);
    });

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  // Độ rộng cột theo tiêu đề dài nhất
  ws["!cols"] = header.map((h, ci) => ({
    wch:
      Math.min(
        45,
        Math.max(
          h.length + 2,
          ...aoa.slice(1).map((r) => String(r[ci] ?? "").length + 2)
        )
      ) || 10,
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ket qua");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const tenTep = `${mau.tieuDe.replace(/[^\p{L}\p{N} ]/gu, "").trim() || "ket-qua"} - ket qua.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(tenTep)}`,
    },
  });
}
