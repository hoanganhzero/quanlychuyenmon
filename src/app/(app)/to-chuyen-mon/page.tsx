import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { themTo, suaTo, datToTruong } from "./actions";
import { xoaToForm } from "@/app/actions/crud";
import { SubmitButton, DeleteButton } from "@/components/submit-button";
import { PageHeader, Badge, EmptyState } from "@/components/ui";

export default async function ToChuyenMonPage() {
  const session = await getSession();
  const isAdmin = session?.vaiTro === "ADMIN";

  const tos = await db.toChuyenMon.findMany({
    orderBy: { ten: "asc" },
    include: {
      toTruong: true,
      thanhViens: true,
    },
  });
  const giaoViens = await db.giaoVien.findMany({ orderBy: { hoTen: "asc" } });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tổ chuyên môn"
        description="Danh sách các tổ chuyên môn và thành viên"
      />

      {isAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <form action={themTo} className="flex flex-wrap gap-4 items-end">
            <div className="w-64">
              <label className={lbl}>Tên tổ *</label>
              <input name="ten" required placeholder="Tổ Khoa học xã hội" className={cls} />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className={lbl}>Mô tả</label>
              <input name="moTa" className={cls} />
            </div>
            <SubmitButton>Thêm tổ</SubmitButton>
          </form>
        </div>
      )}

      {tos.length === 0 ? (
        <EmptyState message="Chưa có tổ chuyên môn nào." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tos.map((to) => (
            <div key={to.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{to.ten}</h3>
                  {to.moTa && <p className="text-sm text-gray-500">{to.moTa}</p>}
                </div>
                {isAdmin && (
                  <details className="text-right">
                    <summary className="cursor-pointer list-none rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100">
                      ✎ Sửa
                    </summary>
                    <div className="mt-2 space-y-2 text-left w-56">
                      <form action={suaTo} className="space-y-2 rounded-lg border border-gray-200 p-3 bg-gray-50">
                        <input type="hidden" name="id" value={to.id} />
                        <input name="ten" required defaultValue={to.ten} className={`${cls} w-full`} />
                        <input name="moTa" defaultValue={to.moTa ?? ""} placeholder="Mô tả" className={`${cls} w-full`} />
                        <SubmitButton>Lưu</SubmitButton>
                      </form>
                      <form action={xoaToForm}>
                        <input type="hidden" name="id" value={to.id} />
                        <DeleteButton confirmText={`Xóa tổ ${to.ten}?`}>Xóa tổ</DeleteButton>
                      </form>
                    </div>
                  </details>
                )}
              </div>

              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Tổ trưởng</p>
                {to.toTruong ? (
                  <Badge label={to.toTruong.hoTen} color="bg-emerald-100 text-emerald-800" />
                ) : (
                  <span className="text-sm text-gray-400">Chưa phân công</span>
                )}
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Thành viên ({to.thanhViens.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {to.thanhViens.map((gv) => (
                    <Badge key={gv.id} label={gv.hoTen} />
                  ))}
                </div>
              </div>

              {isAdmin && (
                <form
                  action={datToTruong}
                  className="mt-4 flex gap-2 items-center border-t border-gray-100 pt-3"
                >
                  <input type="hidden" name="toId" value={to.id} />
                  <select name="giaoVienId" defaultValue={to.toTruong?.id ?? ""} className={`${cls} flex-1`}>
                    <option value="">— Chọn tổ trưởng —</option>
                    {giaoViens.map((gv) => (
                      <option key={gv.id} value={gv.id}>{gv.hoTen}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                  >
                    Cập nhật
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const cls =
  "rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const lbl = "block text-xs font-medium text-gray-600 mb-1";
