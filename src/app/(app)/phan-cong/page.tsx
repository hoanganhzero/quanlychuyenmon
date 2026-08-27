import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { themPhanCong } from "./actions";
import { xoaPhanCongForm } from "@/app/actions/crud";
import { SubmitButton, DeleteButton } from "@/components/submit-button";
import { PageHeader, EmptyState } from "@/components/ui";

export default async function PhanCongPage() {
  const session = await getSession();
  const duocQuanLy =
    session?.vaiTro === "ADMIN" || session?.vaiTro === "TO_TRUONG";

  const namHoc = await db.namHoc.findFirst({ where: { dangHoatDong: true } });
  if (!namHoc) {
    return (
      <div className="space-y-6">
        <PageHeader title="Phân công giảng dạy" />
        <EmptyState message="Chưa có năm học đang hoạt động." />
      </div>
    );
  }

  const phanCongs = await db.phanCong.findMany({
    where: { namHocId: namHoc.id },
    orderBy: [{ lopHoc: { khoi: "asc" } }, { lopHoc: { ten: "asc" } }],
    include: {
      giaoVien: true,
      monHoc: true,
      lopHoc: true,
      _count: { select: { tkb: true } },
    },
  });

  const [giaoViens, monHocs, lops] = await Promise.all([
    db.giaoVien.findMany({ orderBy: { hoTen: "asc" } }),
    db.monHoc.findMany({ orderBy: { tenMon: "asc" } }),
    db.lopHoc.findMany({
      where: { namHocId: namHoc.id },
      orderBy: [{ khoi: "asc" }, { ten: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phân công giảng dạy"
        description={`Năm học ${namHoc.ten} — ${phanCongs.length} phân công`}
      />

      {duocQuanLy && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Thêm phân công</h2>
          <form action={themPhanCong} className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
            <F label="Giáo viên *">
              <select name="giaoVienId" required defaultValue="" className={cls}>
                <option value="" disabled>— Chọn —</option>
                {giaoViens.map((gv) => (
                  <option key={gv.id} value={gv.id}>{gv.hoTen}</option>
                ))}
              </select>
            </F>
            <F label="Môn học *">
              <select name="monHocId" required defaultValue="" className={cls}>
                <option value="" disabled>— Chọn —</option>
                {monHocs.map((m) => (
                  <option key={m.id} value={m.id}>{m.tenMon}</option>
                ))}
              </select>
            </F>
            <F label="Lớp *">
              <select name="lopHocId" required defaultValue="" className={cls}>
                <option value="" disabled>— Chọn —</option>
                {lops.map((l) => (
                  <option key={l.id} value={l.id}>{l.ten}</option>
                ))}
              </select>
            </F>
            <F label="Tiết/tuần">
              <input type="number" name="soTietTuan" min={0} max={20} defaultValue={0} className={cls} />
            </F>
            <SubmitButton>Thêm</SubmitButton>
          </form>
        </div>
      )}

      {phanCongs.length === 0 ? (
        <EmptyState message="Chưa có phân công giảng dạy nào." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Lớp</th>
                <th className="px-4 py-3">Môn học</th>
                <th className="px-4 py-3">Giáo viên</th>
                <th className="px-4 py-3">Tiết/tuần</th>
                <th className="px-4 py-3">Đã xếp TKB</th>
                {duocQuanLy && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {phanCongs.map((pc) => (
                <tr key={pc.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                  <td className="px-4 py-3 font-semibold">{pc.lopHoc.ten}</td>
                  <td className="px-4 py-3">{pc.monHoc.tenMon}</td>
                  <td className="px-4 py-3">{pc.giaoVien.hoTen}</td>
                  <td className="px-4 py-3">{pc.soTietTuan || "—"}</td>
                  <td className="px-4 py-3">{pc._count.tkb} tiết</td>
                  {duocQuanLy && (
                    <td className="px-4 py-3 text-right">
                      <form action={xoaPhanCongForm}>
                        <input type="hidden" name="id" value={pc.id} />
                        <DeleteButton confirmText="Xóa phân công này?">Xóa</DeleteButton>
                      </form>
                    </td>
                  )}
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
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

const cls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
