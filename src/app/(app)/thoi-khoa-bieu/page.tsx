import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { THU_TRONG_TUAN, one } from "@/lib/utils";
import { themTietHoc } from "./actions";
import { xoaTietHocForm } from "@/app/actions/crud";
import { DeleteButton } from "@/components/submit-button";
import { PageHeader, EmptyState } from "@/components/ui";

const TIETS = Array.from({ length: 10 }, (_, i) => i + 1);
const THUS = [2, 3, 4, 5, 6, 7];

export default async function ThoiKhoaBieuPage({
  searchParams,
}: PageProps<"/thoi-khoa-bieu">) {
  const { lop: lopRaw, hocky: hkRaw } = await searchParams;
  const lopParam = one(lopRaw);
  const hkParam = one(hkRaw);
  const session = await getSession();
  const duocSua = session?.vaiTro === "ADMIN" || session?.vaiTro === "TO_TRUONG";

  const namHoc = await db.namHoc.findFirst({
    where: { dangHoatDong: true },
    include: { hocKys: { orderBy: { thuTu: "asc" } } },
  });
  if (!namHoc || namHoc.hocKys.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Thời khóa biểu" />
        <EmptyState message="Chưa có năm học/học kỳ nào." />
      </div>
    );
  }

  const lops = await db.lopHoc.findMany({
    where: { namHocId: namHoc.id },
    orderBy: [{ khoi: "asc" }, { ten: "asc" }],
  });
  if (lops.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Thời khóa biểu" />
        <EmptyState message="Chưa có lớp học nào." />
      </div>
    );
  }

  const lopId = lopParam && lops.some((l) => l.id === lopParam)
    ? lopParam
    : lops[0].id;
  const hocsKys = namHoc.hocKys;
  const hkDangChay = hocsKys.find((hk) => hk.dangChay) ?? hocsKys[0];
  const hocKyId = hkParam && hocsKys.some((h) => h.id === hkParam)
    ? hkParam
    : hkDangChay.id;

  const tkb = await db.thoiKhoaBieu.findMany({
    where: { lopHocId: lopId, hocKyId },
    include: {
      phanCong: {
        include: { giaoVien: true, monHoc: true },
      },
    },
  });

  const phanCongsCuaLop = await db.phanCong.findMany({
    where: { lopHocId: lopId, namHocId: namHoc.id },
    include: { giaoVien: true, monHoc: true },
    orderBy: [{ monHoc: { tenMon: "asc" } }],
  });

  const map = new Map<string, typeof tkb[number]>();
  for (const t of tkb) map.set(`${t.thu}-${t.tiet}`, t);

  return (
    <div className="space-y-6">
      <PageHeader title="Thời khóa biểu" />

      {/* Bộ chọn lớp & học kỳ */}
      <form method="get" className="flex flex-wrap gap-4 items-end bg-white rounded-xl border border-gray-200 p-5">
        <div>
          <label className={lbl}>Lớp</label>
          <select name="lop" defaultValue={lopId} className={cls}>
            {lops.map((l) => (
              <option key={l.id} value={l.id}>{l.ten}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={lbl}>Học kỳ</label>
          <select name="hocky" defaultValue={hocKyId} className={cls}>
            {hocsKys.map((hk) => (
              <option key={hk.id} value={hk.id}>
                {hk.ten}
                {hk.dangChay ? " (đang chạy)" : ""}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-800">
          Xem
        </button>
      </form>

      {/* Lưới TKB */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-3 text-left text-xs uppercase text-gray-500 w-20">Tiết</th>
              {THUS.map((t) => (
                <th key={t} className="px-3 py-3 text-left text-xs uppercase text-gray-500">
                  {THU_TRONG_TUAN[t]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIETS.map((tiet) => (
              <tr key={tiet} className="border-b border-gray-50">
                <td className="px-3 py-2 font-semibold text-gray-500">{tiet}</td>
                {THUS.map((thu) => {
                  const cell = map.get(`${thu}-${tiet}`);
                  if (!cell) {
                    return (
                      <td key={thu} className="px-3 py-2">
                        {duocSua ? (
                          <span className="text-xs text-gray-300">— trống —</span>
                        ) : null}
                      </td>
                    );
                  }
                  return (
                    <td key={thu} className="px-3 py-2">
                      <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-1.5 flex items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-blue-900 text-sm leading-tight">
                            {cell.phanCong.monHoc.tenMon}
                          </p>
                          <p className="text-xs text-blue-600">
                            {cell.phanCong.giaoVien.hoTen}
                          </p>
                        </div>
                        {duocSua && (
                          <form action={xoaTietHocForm}>
                            <input type="hidden" name="id" value={cell.id} />
                            <DeleteButton confirmText={`Xóa tiết ${cell.phanCong.monHoc.tenMon}?`}>
                              ×
                            </DeleteButton>
                          </form>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Thêm tiết */}
      {duocSua && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">
            Xếp tiết vào thời khóa biểu ({lops.find((l) => l.id === lopId)?.ten})
          </h2>
          <form action={themTietHoc} className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
            <input type="hidden" name="lopHocId" value={lopId} />
            <input type="hidden" name="hocKyId" value={hocKyId} />
            <F label="Phân công dạy *">
              <select name="phanCongId" required defaultValue="" className={cls}>
                <option value="" disabled>— Chọn giáo viên + môn —</option>
                {phanCongsCuaLop.map((pc) => (
                  <option key={pc.id} value={pc.id}>
                    {pc.monHoc.tenMon} — {pc.giaoVien.hoTen}
                  </option>
                ))}
              </select>
            </F>
            <F label="Thứ *">
              <select name="thu" required defaultValue="" className={cls}>
                <option value="" disabled>— Chọn —</option>
                {THUS.map((t) => (
                  <option key={t} value={t}>{THU_TRONG_TUAN[t]}</option>
                ))}
              </select>
            </F>
            <F label="Tiết *">
              <select name="tiet" required defaultValue="" className={cls}>
                <option value="" disabled>— Chọn —</option>
                {TIETS.map((t) => (
                  <option key={t} value={t}>Tiết {t}</option>
                ))}
              </select>
            </F>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Xếp tiết
            </button>
          </form>
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

const cls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const lbl = "block text-xs font-medium text-gray-600 mb-1";
