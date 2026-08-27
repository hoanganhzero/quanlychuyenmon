import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatDateTime } from "@/lib/utils";
import { formatKichThuoc } from "@/lib/upload";
import { uploadMauChuKyForm, xoaMauChuKyForm } from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader, Card } from "@/components/ui";

const cls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";
const lbl = "mb-1 block text-xs font-medium text-gray-600";

export default async function ChuKyCuaToiPage() {
  const session = await getSession();
  if (!session) return null;

  const mau = await db.mauChuKy.findUnique({
    where: { nguoiDungId: session.userId },
  });

  // Đếm số văn bản đã ký bằng mẫu này
  const soVanBanDaKy = mau
    ? await db.chuKy.count({ where: { nguoiKyId: session.userId } })
    : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Chữ ký của tôi"
        description="Tải lên mẫu chữ ký tay (ảnh PNG/JPG nền trắng). Mẫu này sẽ được chèn tự động vào mọi văn bản bạn ký: báo giảng, giáo án, kế hoạch, báo cáo…"
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Mẫu hiện tại */}
        <Card>
          <h3 className="mb-4 font-semibold text-gray-900">Mẫu hiện tại</h3>
          {mau ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/chu-ky/${session.userId}?v=${mau.taoLuc.getTime()}`}
                  alt={`Chữ ký ${session.hoTen}`}
                  className="max-h-32 object-contain"
                />
              </div>
              <div className="space-y-1 text-xs text-gray-500">
                <p>📄 {mau.tenGoc}</p>
                <p>
                  💾 {formatKichThuoc(mau.kichThuoc)} · Tải lúc{" "}
                  {formatDateTime(mau.taoLuc)}
                </p>
                <p>✍️ Đã ký {soVanBanDaKy} văn bản</p>
              </div>
              <form action={xoaMauChuKyForm}>
                <SubmitButton className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">
                  Xóa mẫu chữ ký
                </SubmitButton>
              </form>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-4xl">✍️</p>
              <p className="mt-2 text-sm text-gray-400">
                Chưa có mẫu chữ ký.
                <br />
                Văn bản ký sẽ hiển thị tên kiểu chữ viết tay.
              </p>
            </div>
          )}
        </Card>

        {/* Form tải lên */}
        <Card>
          <h3 className="mb-4 font-semibold text-gray-900">
            {mau ? "Thay thế mẫu chữ ký" : "Tải lên mẫu chữ ký"}
          </h3>
          <form action={uploadMauChuKyForm} className="space-y-4">
            <div>
              <label className={lbl}>Ảnh chữ ký (PNG/JPG/WebP, ≤5MB) *</label>
              <input
                type="file"
                name="file"
                required
                accept="image/png,image/jpeg,image/webp"
                className={`${cls} file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700`}
              />
              <p className="mt-2 text-xs text-gray-400">
                💡 Mẹo: Ký vào giấy trắng, chụp ảnh hoặc scan, cắt gọn rồi tải
                lên. Nền trắng sẽ tự hòa vào văn bản.
              </p>
            </div>
            <SubmitButton className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
              {mau ? "Cập nhật mẫu chữ ký" : "Tải lên"}
            </SubmitButton>
          </form>

          <div className="mt-6 rounded-lg bg-blue-50 p-4 text-xs leading-relaxed text-blue-800">
            <p className="font-semibold">Quy trình ký số trên hệ thống:</p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-4">
              <li>Bạn nộp văn bản → hệ thống tự ký mục &quot;Người soạn&quot;</li>
              <li>Tổ trưởng duyệt → ký &quot;Duyệt cấp tổ&quot;</li>
              <li>Ban Giám đốc phê duyệt → ký &quot;Phê duyệt&quot;</li>
            </ol>
            <p className="mt-2">
              Khi ký, người duyệt có thể chọn <b>vị trí đóng ký</b> trên văn
              bản (trái/căn giữa/phải dưới).
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
