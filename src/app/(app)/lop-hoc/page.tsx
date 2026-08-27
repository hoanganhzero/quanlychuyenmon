import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { themLop, suaLop, ganGvcn } from "./actions";
import { xoaLopForm } from "@/app/actions/crud";
import { SubmitButton, DeleteButton } from "@/components/submit-button";
import { PageHeader, EmptyState } from "@/components/ui";
import Link from "next/link";

export default async function LopHocPage() {
  const session = await getSession();
  const isAdmin = session?.vaiTro === "ADMIN";

  const namHoc = await db.namHoc.findFirst({ where: { dangHoatDong: true } });
  if (!namHoc) {
    return (
      <div className="space-y-6">
        <PageHeader title="Lớp học" />
        <EmptyState message="Chưa có năm học đang hoạt động. Hãy vào mục “Năm học” để thêm." />
      </div>
    );
  }

  const lops = await db.lopHoc.findMany({
    where: { namHocId: namHoc.id },
    orderBy: [{ khoi: "asc" }, { ten: "asc" }],
    include: {
      gvcn: true,
      _count: { select: { hocSinhs: true, phanCongs: true } },
    },
  });
  const giaoViens = await db.giaoVien.findMany({ orderBy: { hoTen: "asc" } });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lớp học"
        description={`Năm học ${namHoc.ten} — ${lops.length} lớp`}
      />

      {isAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Thêm lớp mới</h2>
          <form action={themLop} className="flex flex-wrap gap-4 items-end">
            <div className="w-32">
              <label className={lbl}>Tên lớp *</label>
              <input name="ten" required placeholder="3A" className={cls} />
            </div>
            <div className="w-32">
              <label className={lbl}>Khối *</label>
              <select name="khoi" required defaultValue="" className={cls}>
                <option value="" disabled>— Chọn —</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((k) => (
                  <option key={k} value={k}>Khối {k}</option>
                ))}
              </select>
            </div>
            <div className="w-64">
              <label className={lbl}>Giáo viên chủ nhiệm</label>
              <select name="gvcnId" className={cls}>
                <option value="">— Chưa phân —</option>
                {giaoViens.map((gv) => (
                  <option key={gv.id} value={gv.id}>{gv.hoTen}</option>
                ))}
              </select>
            </div>
            <SubmitButton>Thêm lớp</SubmitButton>
          </form>
        </div>
      )}

      {lops.length === 0 ? (
        <EmptyState message="Chưa có lớp học nào trong năm học này." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Lớp</th>
                <th className="px-4 py-3">Khối</th>
                <th className="px-4 py-3">GVCN</th>
                <th className="px-4 py-3">Sĩ số</th>
                <th className="px-4 py-3">Phân công</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {lops.map((lop) => (
                <tr key={lop.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                  <td className="px-4 py-3 font-semibold text-gray-900">{lop.ten}</td>
                  <td className="px-4 py-3">Khối {lop.khoi}</td>
                  <td className="px-4 py-3">
                    {isAdmin ? (
                      <form action={ganGvcn} className="flex gap-2">
                        <input type="hidden" name="lopId" value={lop.id} />
                        <select
                          name="gvcnId"
                          defaultValue={lop.gvcnId ?? ""}
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                        >
                          <option value="">— Chọn GVCN —</option>
                          {giaoViens.map((gv) => (
                            <option key={gv.id} value={gv.id}>{gv.hoTen}</option>
                          ))}
                        </select>
                        <button type="submit" className="text-xs text-blue-600 font-medium hover:underline">
                          Lưu
                        </button>
                      </form>
                    ) : (
                      lop.gvcn?.hoTen ?? "—"
                    )}
                  </td>
                  <td className="px-4 py-3">{lop._count.hocSinhs} HS</td>
                  <td className="px-4 py-3">{lop._count.phanCongs} phân công</td>
                  <td className="px-4 py-3 flex gap-2 justify-end">
                    <Link
                      href={`/hoc-sinh?lop=${lop.id}`}
                      className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Học sinh
                    </Link>
                    {isAdmin && (
                      <details className="inline-block text-right">
                        <summary className="cursor-pointer list-none rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">
                          ✎ Sửa
                        </summary>
                        <div className="absolute right-6 z-10 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-3 shadow-lg space-y-2">
                          <form action={suaLop} className="space-y-2">
                            <input type="hidden" name="id" value={lop.id} />
                            <input name="ten" required defaultValue={lop.ten} className={`${cls} w-full`} />
                            <select name="khoi" defaultValue={lop.khoi} className={`${cls} w-full`}>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((k) => (
                                <option key={k} value={k}>Khối {k}</option>
                              ))}
                            </select>
                            <SubmitButton>Lưu</SubmitButton>
                          </form>
                          <form action={xoaLopForm}>
                            <input type="hidden" name="id" value={lop.id} />
                            <DeleteButton confirmText={`Xóa lớp ${lop.ten}?`}>Xóa lớp</DeleteButton>
                          </form>
                        </div>
                      </details>
                    )}
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

const cls =
  "rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const lbl = "block text-xs font-medium text-gray-600 mb-1";
