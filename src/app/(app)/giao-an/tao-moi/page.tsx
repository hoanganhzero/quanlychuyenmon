import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { LABEL_LOAI_KE_HOACH } from "@/lib/utils";
import { taoGiaoAn } from "../actions";
import { PageHeader } from "@/components/ui";

export default async function TaoMoiGiaoAnPage() {
  const session = await getSession();
  const gv = session
    ? await db.giaoVien.findFirst({ where: { userId: session.userId } })
    : null;

  const namHoc = await db.namHoc.findFirst({ where: { dangHoatDong: true } });
  const phanCongs = gv
    ? await db.phanCong.findMany({
        where: {
          giaoVienId: gv.id,
          ...(namHoc ? { namHocId: namHoc.id } : {}),
        },
        include: { monHoc: true, lopHoc: true },
      })
    : [];

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Soạn giáo án / kế hoạch dạy học"
        description={
          gv
            ? `Người soạn: ${gv.hoTen}`
            : "Tài khoản của bạn chưa liên kết hồ sơ giáo viên."
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form action={taoGiaoAn} className="space-y-5">
          <div>
            <label className={lbl}>Tiêu đề *</label>
            <input
              name="tieuDe"
              required
              placeholder="Bài 1: Cánh én thông báo mùa xuân"
              className={`${cls} w-full`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={lbl}>Loại</label>
              <select name="loai" className={cls}>
                {Object.entries(LABEL_LOAI_KE_HOACH).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>Gắn với phân công dạy (môn + lớp)</label>
              <select name="phanCongId" className={cls}>
                <option value="">— Không gắn —</option>
                {phanCongs.map((pc) => (
                  <option key={pc.id} value={pc.id}>
                    {pc.monHoc.tenMon} · {pc.lopHoc.ten}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={lbl}>
              Nội dung{" "}
              <span className="font-normal text-gray-400">
                (bắt buộc nếu không đính kèm file)
              </span>
            </label>
            <textarea
              name="noiDung"
              rows={16}
              placeholder={
                "I. MỤC TIÊU\n1. Kiến thức...\n\nII. ĐỒ DÙNG DẠY HỌC\n\nIII. CÁC HOẠT ĐỘNG DẠY HỌC..."
              }
              className={`${cls} w-full font-mono text-[13px] leading-relaxed`}
            />
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
            <label className={lbl}>
              📎 File Word/PDF trình ký{" "}
              <span className="font-normal text-gray-400">
                (.doc, .docx, .pdf — tối đa 100MB)
              </span>
            </label>
            <input
              type="file"
              name="tep"
              accept=".doc,.docx,.pdf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className={`${cls} w-full file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-white file:text-sm file:cursor-pointer bg-white`}
            />
            <p className="mt-1.5 text-xs text-gray-500">
              File sẽ được gửi kèm để Tổ trưởng và Ban Giám đốc xem khi trình ký.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              name="guiDuyet"
              value="0"
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Lưu nháp
            </button>
            <button
              type="submit"
              name="guiDuyet"
              value="1"
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Nộp để duyệt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const cls =
  "rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const lbl = "block text-xs font-medium text-gray-600 mb-1";
