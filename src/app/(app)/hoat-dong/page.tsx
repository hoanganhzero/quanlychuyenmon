import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { LABEL_LOAI_HOAT_DONG, formatDate } from "@/lib/utils";
import { themHoatDong, datDiemDanhForm, xoaHoatDongForm } from "./actions";
import { SubmitButton, DeleteButton } from "@/components/submit-button";
import { PageHeader, Badge, EmptyState, Card } from "@/components/ui";

export default async function HoatDongPage() {
  const session = await getSession();
  if (!session) return null;
  const quanLy =
    session.vaiTro === "ADMIN" ||
    session.vaiTro === "TO_TRUONG" ||
    session.vaiTro === "BAN_GIAM_DOC";

  const hoatDongs = await db.hoatDongChuyenMon.findMany({
    orderBy: { ngay: "desc" },
    include: {
      toChuyenMon: true,
      thamGia: { include: { giaoVien: true }, orderBy: { giaoVien: { hoTen: "asc" } } },
    },
  });
  const tos = await db.toChuyenMon.findMany({ orderBy: { ten: "asc" } });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sinh hoạt tổ & Bồi dưỡng giáo viên"
        description="Ghi nhận các buổi sinh hoạt chuyên môn, tập huấn và điểm danh"
      />

      {quanLy && (
        <Card title="Thêm hoạt động">
          <form action={themHoatDong} className="grid grid-cols-2 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <label className={lbl}>Tiêu đề *</label>
              <input name="tieuDe" required placeholder="Sinh hoạt tháng 9: Phân tích chương trình..." className={cls} />
            </div>
            <div>
              <label className={lbl}>Loại</label>
              <select name="loai" defaultValue="SINH_HOAT_TO" className={cls}>
                {Object.entries(LABEL_LOAI_HOAT_DONG).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>Ngày *</label>
              <input type="date" name="ngay" required className={cls} />
            </div>
            <div>
              <label className={lbl}>Tổ (tuỳ chọn)</label>
              <select name="toChuyenMonId" className={cls}>
                <option value="">— Toàn trường —</option>
                {tos.map((t) => (
                  <option key={t.id} value={t.id}>{t.ten}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>Địa điểm</label>
              <input name="diaDiem" className={cls} />
            </div>
            <div className="col-span-2 md:col-span-2">
              <label className={lbl}>Nội dung chính</label>
              <input name="noiDung" className={cls} />
            </div>
            <SubmitButton>Thêm hoạt động</SubmitButton>
          </form>
        </Card>
      )}

      {hoatDongs.length === 0 ? (
        <EmptyState message="Chưa có hoạt động nào." />
      ) : (
        <div className="space-y-4">
          {hoatDongs.map((hd) => {
            const coMat = hd.thamGia.filter((t) => t.coMat).length;
            return (
              <div key={hd.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <details>
                  <summary className="cursor-pointer flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-gray-900">{hd.tieuDe}</span>
                    <Badge label={LABEL_LOAI_HOAT_DONG[hd.loai]} color="bg-indigo-100 text-indigo-800" />
                    {hd.toChuyenMon && <Badge label={hd.toChuyenMon.ten} />}
                    <Badge
                      label={`Có mặt ${coMat}/${hd.thamGia.length}`}
                      color={coMat > 0 ? "bg-green-50 text-green-700" : ""}
                    />
                    <span className="text-xs text-gray-400 ml-auto">{formatDate(hd.ngay)}{hd.diaDiem ? ` · ${hd.diaDiem}` : ""}</span>
                  </summary>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {hd.noiDung && (
                      <p className="mb-3 text-sm text-gray-600 whitespace-pre-wrap">{hd.noiDung}</p>
                    )}
                    {quanLy && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {hd.thamGia.map((t) => (
                          <form key={`${hd.id}-${t.giaoVienId}`} action={datDiemDanhForm}>
                            <input type="hidden" name="hoatDongId" value={hd.id} />
                            <input type="hidden" name="giaoVienId" value={t.giaoVienId} />
                            <input type="hidden" name="coMat" value={t.coMat ? "1" : "0"} />
                            <button
                              className={`rounded-full px-2.5 py-1 text-xs border transition-colors ${
                                t.coMat
                                  ? "bg-green-100 border-green-300 text-green-800"
                                  : "bg-white border-gray-200 text-gray-400 hover:border-green-300"
                              }`}
                              title={t.coMat ? "Bấm đánh dấu vắng" : "Bấm đánh dấu có mặt"}
                            >
                              {t.coMat ? "✓ " : ""}{t.giaoVien.hoTen}
                            </button>
                          </form>
                        ))}
                      </div>
                    )}
                    {quanLy && (
                      <form action={xoaHoatDongForm}>
                        <input type="hidden" name="id" value={hd.id} />
                        <DeleteButton confirmText={`Xóa hoạt động "${hd.tieuDe}"?`}>Xóa hoạt động</DeleteButton>
                      </form>
                    )}
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const cls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const lbl = "block text-xs font-medium text-gray-600 mb-1";
