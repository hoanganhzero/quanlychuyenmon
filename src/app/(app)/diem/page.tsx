import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { one } from "@/lib/utils";
import { luuDiem } from "./actions";
import { PageHeader, EmptyState } from "@/components/ui";

export default async function DiemPage({
  searchParams,
}: PageProps<"/diem">) {
  const { lop: lopRaw, mon: monRaw, hocky: hkRaw } = await searchParams;
  const lopParam = one(lopRaw);
  const monParam = one(monRaw);
  const hkParam = one(hkRaw);

  const namHoc = await db.namHoc.findFirst({
    where: { dangHoatDong: true },
    include: { hocKys: { orderBy: { thuTu: "asc" } } },
  });
  if (!namHoc || namHoc.hocKys.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Điểm số" />
        <EmptyState message="Chưa có năm học/học kỳ nào." />
      </div>
    );
  }

  const session = await getSession();
  const laGiaoVien = session?.vaiTro === "GIAO_VIEN";

  const gv = laGiaoVien && session
    ? await db.giaoVien.findFirst({ where: { userId: session.userId } })
    : null;
  const phanCongsCuaToi = gv
    ? await db.phanCong.findMany({
        where: { giaoVienId: gv.id, namHocId: namHoc.id },
        include: { monHoc: true, lopHoc: true },
      })
    : [];

  const lops = await db.lopHoc.findMany({
    where: { namHocId: namHoc.id },
    orderBy: [{ khoi: "asc" }, { ten: "asc" }],
  });
  if (lops.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Điểm số" />
        <EmptyState message="Chưa có lớp học nào." />
      </div>
    );
  }

  // Giáo viên chỉ xem được các lớp mình dạy
  const lopDuocPhep = laGiaoVien
    ? [...new Set(phanCongsCuaToi.map((pc) => pc.lopHocId))]
    : lops.map((l) => l.id);
  const lopsHienThi = lops.filter((l) => lopDuocPhep.includes(l.id));

  if (lopsHienThi.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Điểm số" />
        <EmptyState message="Bạn chưa được phân công dạy lớp nào." />
      </div>
    );
  }

  const lopId = lopParam && lopsHienThi.some((l) => l.id === lopParam)
    ? lopParam
    : lopsHienThi[0].id;

  const monsCuaLop = await db.phanCong.findMany({
    where: {
      lopHocId: lopId,
      namHocId: namHoc.id,
      ...(laGiaoVien && gv ? { giaoVienId: gv.id } : {}),
    },
    include: { monHoc: true },
  });
  const dsMon = [...new Map(monsCuaLop.map((m) => [m.monHocId, m.monHoc])).values()];
  if (dsMon.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Điểm số" />
        <EmptyState message="Lớp này chưa có môn học nào được phân công cho bạn." />
      </div>
    );
  }

  const monId = monParam && dsMon.some((m) => m.id === monParam)
    ? monParam
    : dsMon[0].id;

  const hocsKys = namHoc.hocKys;
  const hkMacDinh = hocsKys.find((hk) => hk.dangChay) ?? hocsKys[0];
  const hocKyId = hkParam && hocsKys.some((h) => h.id === hkParam)
    ? hkParam
    : hkMacDinh.id;

  const hocSinhs = await db.hocSinh.findMany({
    where: { lopHocId: lopId, trangThai: "DANG_HOC" },
    orderBy: { hoTen: "asc" },
    include: {
      diems: {
        where: { monHocId: monId, hocKyId },
      },
    },
  });

  const diemMap = new Map<string, Map<string, (typeof hocSinhs)[0]["diems"][0]>>();
  for (const hs of hocSinhs) {
    const m = new Map<string, (typeof hocSinhs)[0]["diems"][0]>();
    for (const d of hs.diems) m.set(d.loaiDiem, d);
    diemMap.set(hs.id, m);
  }

  function tb(hsId: string): string {
    const m = diemMap.get(hsId);
    const values = ["MIENG", "LAN_1", "GIUA_KY", "CUOI_KY"]
      .map((k) => m?.get(k)?.giaTri)
      .filter((v): v is number => typeof v === "number");
    if (values.length === 0) return "—";
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý điểm số" />

      {/* Bộ chọn */}
      <form method="get" className="flex flex-wrap gap-4 items-end bg-white rounded-xl border border-gray-200 p-5">
        <Sel label="Lớp" name="lop" value={lopId}>
          {lopsHienThi.map((l) => (
            <option key={l.id} value={l.id}>{l.ten}</option>
          ))}
        </Sel>
        <Sel label="Môn học" name="mon" value={monId}>
          {dsMon.map((m) => (
            <option key={m.id} value={m.id}>{m.tenMon}</option>
          ))}
        </Sel>
        <Sel label="Học kỳ" name="hocky" value={hocKyId}>
          {hocsKys.map((hk) => (
            <option key={hk.id} value={hk.id}>
              {hk.ten}
              {hk.dangChay ? " (đang chạy)" : ""}
            </option>
          ))}
        </Sel>
        <button type="submit" className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-800">
          Xem
        </button>
      </form>

      {/* Bảng điểm */}
      <form action={luuDiem}>
        <input type="hidden" name="lopHocId" value={lopId} />
        <input type="hidden" name="monHocId" value={monId} />
        <input type="hidden" name="hocKyId" value={hocKyId} />

        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Học sinh</th>
                <th className="px-4 py-3 w-24">Miệng</th>
                <th className="px-4 py-3 w-24">15 phút</th>
                <th className="px-4 py-3 w-24">Giữa kỳ</th>
                <th className="px-4 py-3 w-24">Cuối kỳ</th>
                <th className="px-4 py-3 w-28">Đánh giá Đ/CĐ</th>
                <th className="px-4 py-3 w-20">TB</th>
              </tr>
            </thead>
            <tbody>
              {hocSinhs.map((hs, i) => {
                const m = diemMap.get(hs.id)!;
                return (
                  <tr key={hs.id} className="border-b border-gray-50 hover:bg-gray-50/40">
                    <td className="px-4 py-2 font-medium text-gray-900">
                      <span className="text-gray-400 mr-2">{i + 1}.</span>
                      {hs.hoTen}
                    </td>
                    <DiemCell name={`diem__${hs.id}__MIENG`} val={m.get("MIENG")?.giaTri} />
                    <DiemCell name={`diem__${hs.id}__LAN_1`} val={m.get("LAN_1")?.giaTri} />
                    <DiemCell name={`diem__${hs.id}__GIUA_KY`} val={m.get("GIUA_KY")?.giaTri} />
                    <DiemCell name={`diem__${hs.id}__CUOI_KY`} val={m.get("CUOI_KY")?.giaTri} />
                    <td className="px-3 py-2">
                      <select
                        name={`diem__${hs.id}__DANH_GIA`}
                        defaultValue={m.get("DANH_GIA")?.ketQua ?? ""}
                        className={cellCls}
                      >
                        <option value="">—</option>
                        <option value="Đạt">Đạt</option>
                        <option value="Chưa đạt">Chưa đạt</option>
                      </select>
                    </td>
                    <td className="px-4 py-2 font-semibold text-blue-700">{tb(hs.id)}</td>
                  </tr>
                );
              })}
              {hocSinhs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                    Lớp chưa có học sinh.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {hocSinhs.length > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Lưu toàn bộ điểm
            </button>
            <span className="text-xs text-gray-400">
              Để trống ô nào sẽ xóa điểm ở ô đó. Thang điểm 0–10.
            </span>
          </div>
        )}
      </form>
    </div>
  );
}

function DiemCell({ name, val }: { name: string; val: number | null | undefined }) {
  return (
    <td className="px-3 py-2">
      <input
        type="number"
        step="0.25"
        min={0}
        max={10}
        defaultValue={val ?? ""}
        name={name}
        className={`${cellCls} w-16`}
      />
    </td>
  );
}

function Sel({
  label,
  name,
  value,
  children,
}: {
  label: string;
  name: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select name={name} defaultValue={value} className={cellCls}>
        {children}
      </select>
    </div>
  );
}

const cellCls =
  "rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
