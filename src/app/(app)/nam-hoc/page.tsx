import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { themNamHoc } from "./actions";
import {
  kichHoatNamHocForm,
  xoaNamHocForm,
  batDauHocKyForm,
} from "@/app/actions/crud";
import { SubmitButton, DeleteButton } from "@/components/submit-button";
import { PageHeader, Badge, EmptyState } from "@/components/ui";

export default async function NamHocPage() {
  const session = await getSession();
  const isAdmin = session?.vaiTro === "ADMIN";

  const namHocs = await db.namHoc.findMany({
    orderBy: { ten: "desc" },
    include: { hocKys: { orderBy: { thuTu: "asc" } }, lops: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Năm học & Học kỳ"
        description="Quản lý các năm học, học kỳ của trường"
      />

      {isAdmin && (
        <Card title="Thêm năm học mới">
          <form action={themNamHoc} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tên năm học *</label>
              <input name="ten" required placeholder="2027-2028" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ngày bắt đầu *</label>
              <input type="date" name="ngayBatDau" required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ngày kết thúc *</label>
              <input type="date" name="ngayKetThuc" required className={inputCls} />
            </div>
            <SubmitButton>Thêm năm học</SubmitButton>
          </form>
        </Card>
      )}

      {namHocs.length === 0 ? (
        <EmptyState message="Chưa có năm học nào." />
      ) : (
        <div className="space-y-4">
          {namHocs.map((nh) => (
            <div key={nh.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">{nh.ten}</h3>
                  {nh.dangHoatDong && <Badge label="Đang hoạt động" color="bg-green-100 text-green-800" />}
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(nh.ngayBatDau)} → {formatDate(nh.ngayKetThuc)} · {nh.lops.length} lớp
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    {!nh.dangHoatDong && (
                      <form action={kichHoatNamHocForm}>
                        <input type="hidden" name="id" value={nh.id} />
                        <button className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">
                          Kích hoạt
                        </button>
                      </form>
                    )}
                    <form action={xoaNamHocForm}>
                      <input type="hidden" name="id" value={nh.id} />
                      <DeleteButton confirmText={`Xóa năm học ${nh.ten} cùng toàn bộ dữ liệu liên quan?`}>
                        Xóa
                      </DeleteButton>
                    </form>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                {nh.hocKys.map((hk) => (
                  <div
                    key={hk.id}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2"
                  >
                    <span className="text-sm font-medium text-gray-800">{hk.ten}</span>
                    {hk.dangChay && (
                      <Badge label="Đang chạy" color="bg-emerald-100 text-emerald-800" />
                    )}
                    {isAdmin && !hk.dangChay && (
                      <form action={batDauHocKyForm}>
                        <input type="hidden" name="id" value={hk.id} />
                        <button
                          type="submit"
                          className="text-xs text-blue-600 hover:underline font-medium"
                        >
                          Bắt đầu
                        </button>
                      </form>
                    )}
                  </div>
                ))}
                {nh.hocKys.length === 0 && (
                  <p className="text-sm text-gray-400">Chưa có học kỳ nào.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

function Card({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${""}`}>
      {title && (
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{title}</h2>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
