import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatDate, LABEL_TRANG_THAI_HS, one } from "@/lib/utils";
import { themHocSinh, suaHocSinh, chuyenLop } from "./actions";
import { xoaHocSinhForm } from "@/app/actions/crud";
import { SubmitButton, DeleteButton } from "@/components/submit-button";
import { PageHeader, Badge, EmptyState } from "@/components/ui";

export default async function HocSinhPage({
  searchParams,
}: PageProps<"/hoc-sinh">) {
  const { lop: lopRaw } = await searchParams;
  const lopFilter = one(lopRaw);
  const session = await getSession();
  const isAdmin = session?.vaiTro === "ADMIN";

  const namHoc = await db.namHoc.findFirst({ where: { dangHoatDong: true } });
  if (!namHoc) {
    return (
      <div className="space-y-6">
        <PageHeader title="Học sinh" />
        <EmptyState message="Chưa có năm học đang hoạt động." />
      </div>
    );
  }

  const lops = await db.lopHoc.findMany({
    where: { namHocId: namHoc.id },
    orderBy: [{ khoi: "asc" }, { ten: "asc" }],
  });

  const hocSinhs = await db.hocSinh.findMany({
    where: { lopHocId: lopFilter },
    orderBy: [{ hoTen: "asc" }],
    include: { lopHoc: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Học sinh"
        description={`${hocSinhs.length} học sinh`}
      />

      {/* Bộ lọc lớp */}
      <div className="flex flex-wrap gap-2">
        <a
          href="/hoc-sinh"
          className={`rounded-lg px-3 py-1.5 text-sm border transition-colors ${
            !lopFilter
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          }`}
        >
          Tất cả
        </a>
        {lops.map((lop) => (
          <a
            key={lop.id}
            href={`/hoc-sinh?lop=${lop.id}`}
            className={`rounded-lg px-3 py-1.5 text-sm border transition-colors ${
              lopFilter === lop.id
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {lop.ten}
          </a>
        ))}
      </div>

      {isAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Thêm học sinh</h2>
          <form action={themHocSinh} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <F label="Mã HS *"><input name="maHS" required placeholder="HS010" className={cls} /></F>
            <F label="Họ tên *"><input name="hoTen" required className={cls} /></F>
            <F label="Ngày sinh *"><input type="date" name="ngaySinh" required className={cls} /></F>
            <F label="Giới tính">
              <select name="gioiTinh" defaultValue="nam" className={cls}>
                <option value="nam">Nam</option>
                <option value="nu">Nữ</option>
              </select>
            </F>
            <F label="Lớp">
              <select name="lopHocId" className={cls} defaultValue={lopFilter ?? ""}>
                <option value="">— Chọn lớp —</option>
                {lops.map((l) => (
                  <option key={l.id} value={l.id}>{l.ten}</option>
                ))}
              </select>
            </F>
            <F label="Địa chỉ"><input name="diaChi" className={cls} /></F>
            <F label="Tên cha/mẹ"><input name="tenCha" placeholder="Họ tên phụ huynh" className={cls} /></F>
            <F label="SĐT phụ huynh"><input name="sdtPhuHuynh" className={cls} /></F>
            <div className="col-span-2 md:col-span-4">
              <SubmitButton>Thêm học sinh</SubmitButton>
            </div>
          </form>
        </div>
      )}

      {hocSinhs.length === 0 ? (
        <EmptyState message="Không có học sinh nào phù hợp bộ lọc." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Mã HS</th>
                <th className="px-4 py-3">Họ tên</th>
                <th className="px-4 py-3">Ngày sinh</th>
                <th className="px-4 py-3">GT</th>
                <th className="px-4 py-3">Lớp</th>
                <th className="px-4 py-3">Trạng thái</th>
                {isAdmin && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {hocSinhs.map((hs) => (
                <tr key={hs.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                  <td className="px-4 py-3 font-mono text-xs">{hs.maHS}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{hs.hoTen}</td>
                  <td className="px-4 py-3">{formatDate(hs.ngaySinh)}</td>
                  <td className="px-4 py-3">{hs.gioiTinh ? "Nam" : "Nữ"}</td>
                  <td className="px-4 py-3">
                    {isAdmin && hs.lopHocId ? (
                      <form action={chuyenLop} className="flex gap-1 items-center">
                        <input type="hidden" name="hocSinhId" value={hs.id} />
                        <select name="lopHocId" defaultValue={hs.lopHocId ?? ""} className="rounded-md border border-gray-300 px-1.5 py-1 text-xs">
                          {lops.map((l) => (
                            <option key={l.id} value={l.id}>{l.ten}</option>
                          ))}
                        </select>
                        <button className="text-xs text-blue-600 hover:underline font-medium">Chuyển</button>
                      </form>
                    ) : (
                      hs.lopHoc?.ten ?? "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      label={LABEL_TRANG_THAI_HS[hs.trangThai]}
                      color={hs.trangThai === "DANG_HOC" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                    />
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <details className="text-right">
                        <summary className="cursor-pointer list-none rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 inline-block">
                          ✎ Sửa
                        </summary>
                        <div className="mt-2 text-left w-[420px] max-w-[70vw] rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
                          <form action={suaHocSinh} className="grid grid-cols-2 gap-3">
                            <input type="hidden" name="id" value={hs.id} />
                            <F label="Họ tên *"><input name="hoTen" required defaultValue={hs.hoTen} className={clsS} /></F>
                            <F label="Ngày sinh *"><input type="date" name="ngaySinh" required defaultValue={toDateInput(hs.ngaySinh)} className={clsS} /></F>
                            <F label="Giới tính">
                              <select name="gioiTinh" defaultValue={hs.gioiTinh ? "nam" : "nu"} className={clsS}>
                                <option value="nam">Nam</option>
                                <option value="nu">Nữ</option>
                              </select>
                            </F>
                            <F label="Địa chỉ"><input name="diaChi" defaultValue={hs.diaChi ?? ""} className={clsS} /></F>
                            <F label="Tên cha/mẹ"><input name="tenCha" defaultValue={hs.tenCha ?? ""} placeholder="Họ tên phụ huynh" className={clsS} /></F>
                            <F label="SĐT phụ huynh"><input name="sdtPhuHuynh" defaultValue={hs.sdtPhuHuynh ?? ""} className={clsS} /></F>
                            <div className="col-span-2 flex justify-end gap-2">
                              <DeleteButton confirmText={`Xóa học sinh ${hs.hoTen}?`}>Xóa HS</DeleteButton>
                              <SubmitButton>Lưu</SubmitButton>
                            </div>
                          </form>
                          {hs.lopHocId && (
                            <form action={chuyenLop} className="flex items-center gap-2 border-t border-blue-100 pt-3">
                              <input type="hidden" name="hocSinhId" value={hs.id} />
                              <span className="text-xs text-gray-600">Chuyển lớp:</span>
                              <select name="lopHocId" defaultValue={hs.lopHocId ?? ""} className={clsS}>
                                {lops.map((l) => (
                                  <option key={l.id} value={l.id}>{l.ten}</option>
                                ))}
                              </select>
                              <button className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1.5 text-xs text-indigo-800 hover:bg-indigo-100">
                                Chuyển
                              </button>
                            </form>
                          )}
                        </div>
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

const clsS =
  "w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";

function toDateInput(d: Date | null) {
  if (!d) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
