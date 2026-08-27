import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { themMonHoc, suaMonHoc } from "./actions";
import { xoaMonHocForm } from "@/app/actions/crud";
import { SubmitButton, DeleteButton } from "@/components/submit-button";
import { PageHeader, EmptyState } from "@/components/ui";

export default async function MonHocPage() {
  const session = await getSession();
  const isAdmin = session?.vaiTro === "ADMIN";

  const monHocs = await db.monHoc.findMany({
    orderBy: { tenMon: "asc" },
    include: { _count: { select: { phanCongs: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Danh mục môn học"
        description={`${monHocs.length} môn học`}
      />

      {isAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <form action={themMonHoc} className="flex flex-wrap gap-4 items-end">
            <div className="w-40">
              <label className="block text-xs font-medium text-gray-600 mb-1">Mã môn *</label>
              <input name="maMon" required placeholder="TOAN" className={cls} />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">Tên môn *</label>
              <input name="tenMon" required placeholder="Toán" className={cls} />
            </div>
            <SubmitButton>Thêm môn học</SubmitButton>
          </form>
        </div>
      )}

      {monHocs.length === 0 ? (
        <EmptyState message="Chưa có môn học nào." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Mã</th>
                <th className="px-4 py-3">Tên môn học</th>
                <th className="px-4 py-3">Số phân công</th>
                {isAdmin && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {monHocs.map((m) => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                  <td className="px-4 py-3 font-mono text-xs">{m.maMon}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{m.tenMon}</td>
                  <td className="px-4 py-3">{m._count.phanCongs}</td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <details className="group text-right">
                        <summary className="cursor-pointer list-none rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 inline-block">
                          ✎ Sửa
                        </summary>
                        <form action={suaMonHoc} className="mt-2 flex flex-wrap items-center gap-2 text-left">
                          <input type="hidden" name="id" value={m.id} />
                          <input name="maMon" required defaultValue={m.maMon} className={`${cls} w-24`} />
                          <input name="tenMon" required defaultValue={m.tenMon} className={`${cls} w-44`} />
                          <SubmitButton>Lưu</SubmitButton>
                        </form>
                        <form action={xoaMonHocForm} className="mt-2">
                          <input type="hidden" name="id" value={m.id} />
                          <DeleteButton confirmText={`Xóa môn ${m.tenMon}?`}>Xóa môn</DeleteButton>
                        </form>
                      </details>
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

const cls =
  "rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
