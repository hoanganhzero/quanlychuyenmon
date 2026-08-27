import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { taoVanBan } from "../actions";
import { SubmitButton } from "@/components/submit-button";
import { ChonDoiTuong } from "@/components/chon-doi-tuong";
import { PageHeader } from "@/components/ui";

export default async function TaoVanBanPage() {
  const session = await getSession();
  if (!session) return null;

  if (!["ADMIN", "BAN_GIAM_DOC", "TO_TRUONG"].includes(session.vaiTro)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Triển khai văn bản" />
        <p className="text-sm text-gray-500">
          Chỉ Tổ trưởng chuyên môn và Ban Giám đốc có quyền triển khai văn bản.
        </p>
      </div>
    );
  }

  const tos = await db.toChuyenMon.findMany({
    orderBy: { ten: "asc" },
    select: { id: true, ten: true },
  });

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const lbl = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Triển khai văn bản đến giáo viên"
        description="Công văn / quyết định / kế hoạch — giáo viên sẽ xác nhận đã đọc"
      />

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form action={taoVanBan} className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={lbl}>Số hiệu</label>
              <input name="soHieu" placeholder="15/KH-TH" className={inputCls} />
            </div>
            <div>
              <label className={lbl}>Loại văn bản</label>
              <select name="loaiVanBan" defaultValue="CONG_VAN" className={inputCls}>
                <option value="CONG_VAN">Công văn</option>
                <option value="QUYET_DINH">Quyết định</option>
                <option value="KE_HOACH">Kế hoạch</option>
                <option value="THONG_BAO">Thông báo</option>
                <option value="KHAC">Khác</option>
              </select>
            </div>
          </div>

          <div>
            <label className={lbl}>Trích yếu nội dung *</label>
            <input
              name="trichYeu"
              required
              placeholder="Về việc tổ chức hội thi giáo viên dạy giỏi cấp trường..."
              className={inputCls}
            />
          </div>

          <div>
            <label className={lbl}>
              Nội dung{" "}
              <span className="font-normal text-gray-400">(nếu không dùng file)</span>
            </label>
            <textarea name="noiDung" rows={8} className={inputCls} />
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
            <label className={lbl}>
              📎 File văn bản Word/PDF{" "}
              <span className="font-normal text-gray-400">
                (.doc, .docx, .pdf — tối đa 100MB)
              </span>
            </label>
            <input
              type="file"
              name="tep"
              accept=".doc,.docx,.pdf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className={`${inputCls} file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-white file:text-sm file:cursor-pointer bg-white`}
            />
          </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className={lbl}>Ngày ban hành</label>
                <input type="date" name="ngayBanHanh" className={inputCls} />
              </div>
              <div>
                <label className={lbl}>Người trình bày</label>
                <input name="nguoiTrinhBay" placeholder="Trân trọng..." className={inputCls} />
              </div>
              <div>
                <label className={lbl}>Hạn chót xác nhận đã đọc</label>
                <input type="date" name="hanChot" className={inputCls} />
              </div>
            </div>

            <ChonDoiTuong tos={tos.map((t) => ({ id: t.id, ten: t.ten }))} inputCls={inputCls} />

            <SubmitButton>Lưu bản nháp</SubmitButton>
        </form>
      </div>
    </div>
  );
}
