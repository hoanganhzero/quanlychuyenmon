import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { taoBaoCao } from "../actions";
import { PageHeader, EmptyState } from "@/components/ui";
import Link from "next/link";

export default async function TaoBaoCaoPage() {
  const session = await getSession();
  const gv = session
    ? await db.giaoVien.findFirst({
        where: { userId: session.userId },
        include: {
          lopChuNhiem: { include: { namHoc: true, hocSinhs: true } },
        },
      })
    : null;

  const lops = (gv?.lopChuNhiem ?? []).filter(
    (l) => l.namHoc.dangHoatDong
  );

  if (lops.length === 0) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Link href="/bao-cao-gvcn" className="text-sm text-blue-600 hover:underline">
          ← Danh sách báo cáo
        </Link>
        <PageHeader title="Viết báo cáo tháng" />
        <EmptyState message="Bạn hiện không chủ nhiệm lớp nào nên không thể viết báo cáo." />
      </div>
    );
  }

  const thangHienTai = new Date().getMonth() + 1;
  const namHocId = lops[0].namHocId;

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/bao-cao-gvcn" className="text-sm text-blue-600 hover:underline">
        ← Danh sách báo cáo
      </Link>
      <PageHeader title="Viết báo cáo GVCN hàng tháng" />

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form action={taoBaoCao} className="space-y-5">
          <input type="hidden" name="namHocId" value={namHocId} />

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={lbl}>Lớp chủ nhiệm *</label>
              <select name="lopHocId" required className={cls}>
                {lops.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.ten} ({l.hocSinhs.length} HS)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>Tháng *</label>
              <select name="thang" defaultValue={thangHienTai} required className={cls}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((t) => (
                  <option key={t} value={t}>Tháng {t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            <div>
              <label className={lbl}>Sĩ số</label>
              <input type="number" name="siSo" min={0} className={cls} />
            </div>
            <div>
              <label className={lbl}>Nghỉ có phép</label>
              <input type="number" name="nghiCoPhep" min={0} className={cls} />
            </div>
            <div>
              <label className={lbl}>Nghỉ không phép</label>
              <input type="number" name="nghiKoPhep" min={0} className={cls} />
            </div>
          </div>

          <div>
            <label className={lbl}>Tình hình lớp trong tháng</label>
            <textarea
              name="noiDung"
              rows={8}
              placeholder={"- Chất lượng giảng dạy, học tập...\n- Ý thức kỷ luật...\n- Hoạt động phong trào..."}
              className={`${cls} w-full`}
            />
          </div>

          <div>
            <label className={lbl}>Đề xuất / kiến nghị</label>
            <textarea name="deXuat" rows={3} className={`${cls} w-full`} />
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
            <label className={lbl}>
              📎 File Word/PDF kèm theo{" "}
              <span className="font-normal text-gray-400">
                (.doc, .docx, .pdf — tối đa 100MB, tuỳ chọn)
              </span>
            </label>
            <input
              type="file"
              name="tep"
              accept=".doc,.docx,.pdf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className={`${cls} w-full file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-white file:text-sm file:cursor-pointer bg-white`}
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" name="guiDuyet" value="0"
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Lưu nháp
            </button>
            <button type="submit" name="guiDuyet" value="1"
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Nộp để duyệt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const cls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const lbl = "block text-xs font-medium text-gray-600 mb-1";
