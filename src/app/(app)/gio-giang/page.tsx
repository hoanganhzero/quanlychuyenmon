import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatDate, toDateInput, one } from "@/lib/utils";
import { themGioDay } from "./actions";
import { xoaGioDayForm } from "@/app/actions/crud";
import { SubmitButton, DeleteButton } from "@/components/submit-button";
import { PageHeader, Badge, EmptyState } from "@/components/ui";

export default async function GioGiangPage({
  searchParams,
}: PageProps<"/gio-giang">) {
  const {
    gv: gvRaw,
    thang: thangRaw,
    nam: namRaw,
  } = await searchParams;

  const gvFilter = one(gvRaw);
  const thangParam = one(thangRaw);
  const namParam = one(namRaw);

  const session = await getSession();
  const laQuanLy =
    session?.vaiTro === "ADMIN" || session?.vaiTro === "TO_TRUONG";

  const giaoViens = await db.giaoVien.findMany({ orderBy: { hoTen: "asc" } });
  const gvHienTai = session
    ? await db.giaoVien.findFirst({ where: { userId: session.userId } })
    : null;

  // Giáo viên thường chỉ xem nhật ký của mình
  const gvId =
    !laQuanLy && gvHienTai
      ? gvHienTai.id
      : gvFilter && giaoViens.some((g) => g.id === gvFilter)
        ? gvFilter
        : null;

  const homNay = new Date();
  const thang = Number(thangParam) || homNay.getMonth() + 1;
  const nam = Number(namParam) || homNay.getFullYear();
  const tuNgay = new Date(nam, thang - 1, 1);
  const denNgay = new Date(nam, thang, 0);

  const nhatKys = await db.gioGiang.findMany({
    where: {
      ...(gvId ? { giaoVienId: gvId } : {}),
      ngay: { gte: tuNgay, lte: denNgay },
    },
    orderBy: [{ ngay: "desc" }, { tiet: "asc" }],
    include: {
      giaoVien: true,
      lopHoc: true,
      phanCong: { include: { monHoc: true } },
    },
  });

  const tongSoTietDay = nhatKys
    .filter((n) => n.daDay)
    .reduce((s, n) => s + n.soTiet, 0);
  const tongSoTietVang = nhatKys
    .filter((n) => !n.daDay)
    .reduce((s, n) => s + n.soTiet, 0);

  const phanCongsCuaToi = gvHienTai
    ? await db.phanCong.findMany({
        where: {
          giaoVienId: gvHienTai.id,
          namHoc: { dangHoatDong: true },
        },
        include: { monHoc: true, lopHoc: true },
      })
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Giờ giấc giảng dạy"
        description="Nhật ký giảng dạy hằng ngày của giáo viên"
      />

      {/* Bộ lọc */}
      <form method="get" className="flex flex-wrap gap-4 items-end bg-white rounded-xl border border-gray-200 p-5">
        {laQuanLy && (
          <div className="w-64">
            <label className={lbl}>Giáo viên</label>
            <select name="gv" defaultValue={gvId ?? ""} className={cls}>
              <option value="">— Tất cả giáo viên —</option>
              {giaoViens.map((g) => (
                <option key={g.id} value={g.id}>{g.hoTen}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className={lbl}>Tháng</label>
          <select name="thang" defaultValue={thang} className={cls}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((t) => (
              <option key={t} value={t}>Tháng {t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={lbl}>Năm</label>
          <input type="number" name="nam" defaultValue={nam} min={2020} max={2100} className={`${cls} w-28`} />
        </div>
        <button type="submit" className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-800">
          Xem
        </button>
      </form>

      {/* Thống kê */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard color="bg-blue-500" label="Tiết đã dạy (tháng)" value={tongSoTietDay} />
        <StatCard color="bg-red-400" label="Tiết nghỉ/vắng (tháng)" value={tongSoTietVang} />
        <StatCard color="bg-emerald-500" label="Số bản ghi" value={nhatKys.length} />
      </div>

      {/* Form thêm */}
      {(!laQuanLy || gvHienTai || session?.vaiTro === "ADMIN") && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Ghi nhận giờ dạy</h2>
          <form action={themGioDay} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {session?.vaiTro !== "ADMIN" && (
              <input type="hidden" name="giaoVienId" value={gvId ?? ""} />
            )}
            {session?.vaiTro === "ADMIN" && (
              <F label="Giáo viên *">
                <select name="giaoVienId" required defaultValue="" className={cls}>
                  <option value="" disabled>— Chọn —</option>
                  {giaoViens.map((g) => (
                    <option key={g.id} value={g.id}>{g.hoTen}</option>
                  ))}
                </select>
              </F>
            )}
            <F label="Ngày *">
              <input type="date" name="ngay" required defaultValue={toDateInput(homNay)} className={cls} />
            </F>
            <F label="Tiết *">
              <select name="tiet" required defaultValue="" className={cls}>
                <option value="" disabled>— Chọn —</option>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((t) => (
                  <option key={t} value={t}>Tiết {t}</option>
                ))}
              </select>
            </F>
            <F label="Số tiết">
              <input type="number" name="soTiet" min={1} max={4} defaultValue={1} className={cls} />
            </F>
            {phanCongsCuaToi.length > 0 && (
              <F label="Phân công dạy (nếu có)">
                <select name="phanCongId" className={cls}>
                  <option value="">— Không gắn —</option>
                  {phanCongsCuaToi.map((pc) => (
                    <option key={pc.id} value={pc.id}>
                      {pc.monHoc.tenMon} · {pc.lopHoc.ten}
                    </option>
                  ))}
                </select>
              </F>
            )}
            <F label="Trạng thái">
              <select name="daDay" defaultValue="1" className={cls}>
                <option value="1">Đã dạy</option>
                <option value="0">Vắng / nghỉ</option>
              </select>
            </F>
            <F label="Lý do vắng">
              <input name="lyDoVang" placeholder="Ốm, họp..." className={cls} />
            </F>
            <F label="Ghi chú">
              <input name="ghiChu" className={cls} />
            </F>
            <div className="col-span-2 md:col-span-4">
              <SubmitButton>Ghi nhận</SubmitButton>
            </div>
          </form>
        </div>
      )}

      {/* Danh sách */}
      {nhatKys.length === 0 ? (
        <EmptyState message="Không có nhật ký giảng dạy trong tháng này." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Ngày</th>
                {laQuanLy && <th className="px-4 py-3">Giáo viên</th>}
                <th className="px-4 py-3">Tiết</th>
                <th className="px-4 py-3">Môn · Lớp</th>
                <th className="px-4 py-3">Số tiết</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {nhatKys.map((nk) => (
                <tr key={nk.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                  <td className="px-4 py-3">{formatDate(nk.ngay)}</td>
                  {laQuanLy && <td className="px-4 py-3">{nk.giaoVien.hoTen}</td>}
                  <td className="px-4 py-3">Tiết {nk.tiet}</td>
                  <td className="px-4 py-3">
                    {nk.phanCong
                      ? `${nk.phanCong.monHoc.tenMon} · ${nk.lopHoc?.ten ?? ""}`
                      : nk.ghiChu || "—"}
                  </td>
                  <td className="px-4 py-3">{nk.soTiet}</td>
                  <td className="px-4 py-3">
                    {nk.daDay ? (
                      <Badge label="Đã dạy" color="bg-green-100 text-green-800" />
                    ) : (
                      <Badge label={`Vắng${nk.lyDoVang ? `: ${nk.lyDoVang}` : ""}`} color="bg-red-100 text-red-700" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={xoaGioDayForm}>
                      <input type="hidden" name="id" value={nk.id} />
                      <DeleteButton confirmText="Xóa bản ghi này?">Xóa</DeleteButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={lbl}>{label}</label>
      {children}
    </div>
  );
}

function StatCard({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg ${color}`} />
      <div>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

const cls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const lbl = "block text-xs font-medium text-gray-600 mb-1";
