import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { LABEL_TRANG_THAI } from "@/lib/utils";
import { one } from "@/lib/utils";
import TuDongIn from "./tu-dong-in";

export const metadata = { title: "In sổ báo giảng" };

export default async function InBaoGiangPage({
  searchParams,
}: PageProps<"/bao-giang/in">) {
  const sp = await searchParams;
  const thangParam = one(sp.thang);
  const namParam = one(sp.nam);
  const gvFilter = one(sp.gv);

  const session = await getSession();
  if (!session) return null;

  const homNay = new Date();
  const thang = Number(thangParam) || homNay.getMonth() + 1;
  const nam = Number(namParam) || homNay.getFullYear();

  const gvBanThan = await db.giaoVien.findFirst({ where: { userId: session.userId } });
  const laQuanLy = ["ADMIN", "BAN_GIAM_DOC", "TO_TRUONG"].includes(session.vaiTro);

  const where: Record<string, unknown> = {
    ngay: { gte: new Date(nam, thang - 1, 1), lte: new Date(nam, thang, 0) },
  };
  if (!laQuanLy) {
    where.giaoVienId = gvBanThan?.id ?? "__khongco__";
  } else if (gvFilter) {
    where.giaoVienId = gvFilter;
  } else if (session.vaiTro === "TO_TRUONG") {
    where.giaoVien = { toChuyenMonId: gvBanThan?.toChuyenMonId ?? "__khongco__" };
  }

  const rows = await db.baoGiang.findMany({
    where,
    include: { giaoVien: true, monHoc: true, lopHoc: true },
    orderBy: [{ ngay: "asc" }, { tietBatDau: "asc" }],
  });

  // Thống kê số tiết từng GV
  const tietTheoGV = new Map<string, { ten: string; soTiet: number; soBuoi: number }>();
  for (const r of rows) {
    const cur = tietTheoGV.get(r.giaoVienId) ?? { ten: r.giaoVien.hoTen, soTiet: 0, soBuoi: 0 };
    cur.soTiet += r.soTiet;
    cur.soBuoi += 1;
    tietTheoGV.set(r.giaoVienId, cur);
  }
  const thongKe = [...tietTheoGV.values()].sort((a, b) => b.soTiet - a.soTiet);
  const tongTiet = rows.reduce((s, r) => s + r.soTiet, 0);

  return (
    <div className="mx-auto max-w-5xl bg-white p-8 text-gray-900">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
        @page { size: A4 landscape; margin: 12mm; }
      `}</style>

      <TuDongIn />

      {/* Header văn bản */}
      <div className="mb-6 text-center">
        <p className="text-sm font-semibold uppercase">Sở Giáo dục & Đào tạo</p>
        <p className="text-sm font-bold uppercase border-b border-black inline-block px-8 pb-0.5">
          Trường học
        </p>
        <h1 className="mt-4 text-xl font-bold uppercase">Sổ báo giảng</h1>
        <p className="text-sm">Tháng {thang} năm {nam}</p>
      </div>

      {/* Bảng chi tiết */}
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="bg-gray-100">
            {["STT", "Ngày", "GV", "Môn", "Lớp", "Tiết", "Số tiết", "Tên bài dạy", "Trạng thái"].map((h) => (
              <th key={h} className="border border-gray-400 px-2 py-1.5 text-left font-bold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={9} className="border border-gray-400 px-2 py-4 text-center italic text-gray-500">
                Không có bản ghi nào trong tháng này.
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={r.id}>
                <td className="border border-gray-400 px-2 py-1.5">{i + 1}</td>
                <td className="border border-gray-400 px-2 py-1.5 whitespace-nowrap">
                  {String(r.ngay.getDate()).padStart(2, "0")}/{String(r.ngay.getMonth() + 1).padStart(2, "0")}
                </td>
                <td className="border border-gray-400 px-2 py-1.5">{r.giaoVien.hoTen}</td>
                <td className="border border-gray-400 px-2 py-1.5">{r.monHoc.tenMon}</td>
                <td className="border border-gray-400 px-2 py-1.5">{r.lopHoc?.ten ?? "—"}</td>
                <td className="border border-gray-400 px-2 py-1.5 text-center">{r.tietBatDau}</td>
                <td className="border border-gray-400 px-2 py-1.5 text-center">{r.soTiet}</td>
                <td className="border border-gray-400 px-2 py-1.5">{r.tenBaiDay}</td>
                <td className="border border-gray-400 px-2 py-1.5">{LABEL_TRANG_THAI[r.trangThai]}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Bảng thống kê số tiết từng GV */}
      {thongKe.length > 0 && (
        <>
          <h2 className="mt-8 mb-3 text-base font-bold uppercase">
            Thống kê số tiết dạy theo giáo viên
          </h2>
          <table className="w-full max-w-lg border-collapse text-[12px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 px-2 py-1.5 text-left">Giáo viên</th>
                <th className="border border-gray-400 px-2 py-1.5 text-center">Số lượt dạy</th>
                <th className="border border-gray-400 px-2 py-1.5 text-center">Tổng số tiết</th>
              </tr>
            </thead>
            <tbody>
              {thongKe.map((tk) => (
                <tr key={tk.ten}>
                  <td className="border border-gray-400 px-2 py-1.5">{tk.ten}</td>
                  <td className="border border-gray-400 px-2 py-1.5 text-center">{tk.soBuoi}</td>
                  <td className="border border-gray-400 px-2 py-1.5 text-center font-semibold">{tk.soTiet}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold">
                <td className="border border-gray-400 px-2 py-1.5">TỔNG CỘNG</td>
                <td className="border border-gray-400 px-2 py-1.5 text-center">{rows.length}</td>
                <td className="border border-gray-400 px-2 py-1.5 text-center">{tongTiet}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {/* Chỗ ký */}
      <div className="mt-10 flex justify-end">
        <div className="text-center text-[12px]">
          <p className="italic">Thành phố, ngày ... tháng {thang} năm {nam}</p>
          <p className="font-bold uppercase mt-1">Xác nhận của Ban Giám đốc</p>
          <p className="text-[10px]">(Ký, ghi rõ họ tên)</p>
          <div className="mt-16 border-t border-dashed border-gray-400 w-48 mx-auto" />
        </div>
      </div>
    </div>
  );
}
