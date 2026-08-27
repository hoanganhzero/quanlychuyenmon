import { db } from "@/lib/prisma";
import { LABEL_TRANG_THAI } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = { title: "Xác thực chữ ký số" };

const LABEL_LOAI: Record<string, string> = {
  GIAO_AN: "Giáo án / Kế hoạch dạy học",
  BAO_CAO_GVCN: "Báo cáo chủ nhiệm",
  BAO_GIANG: "Sổ báo giảng",
};

/** Đường dẫn chi tiết theo loại văn bản */
function lienKetVanBan(loai: string, vanBanId: string) {
  switch (loai) {
    case "GIAO_AN":
      return `/giao-an/${vanBanId}`;
    case "BAO_CAO_GVCN":
      return `/bao-cao-gvcn/${vanBanId}`;
    case "BAO_GIANG":
      return `/bao-giang/${vanBanId}`;
    default:
      return "/";
  }
}

export default async function XacThucPage({
  params,
}: {
  params: Promise<{ maXT: string }>;
}) {
  const { maXT } = await params;
  const chuKy = await db.chuKy.findFirst({
    where: { maXacThuc: maXT.toUpperCase() },
    include: { nguoiKy: true },
  });

  // Lấy trạng thái văn bản tương ứng
  let trangThai: string | null = null;
  if (chuKy) {
    if (chuKy.loaiVanBan === "GIAO_AN") {
      trangThai = (await db.giaoAn.findUnique({ where: { id: chuKy.vanBanId }, select: { trangThai: true } }))?.trangThai ?? null;
    } else if (chuKy.loaiVanBan === "BAO_CAO_GVCN") {
      trangThai = (await db.baoCaoGVCN.findUnique({ where: { id: chuKy.vanBanId }, select: { trangThai: true } }))?.trangThai ?? null;
    } else if (chuKy.loaiVanBan === "BAO_GIANG") {
      trangThai = (await db.baoGiang.findUnique({ where: { id: chuKy.vanBanId }, select: { trangThai: true } }))?.trangThai ?? null;
    }
  }

  const hopLe = !!chuKy && trangThai === "DA_DUYET";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className={`px-8 py-6 text-white text-center ${hopLe ? "bg-emerald-600" : chuKy ? "bg-amber-500" : "bg-red-600"}`}>
          <p className="text-4xl">{hopLe ? "✅" : chuKy ? "⏳" : "❌"}</p>
          <h1 className="mt-2 text-xl font-bold">
            {!chuKy
              ? "Mã xác thực không tồn tại"
              : hopLe
                ? "Chữ ký HỢP LỆ"
                : "Chữ ký có nhưng văn bản CHƯA hoàn tất duyệt"}
          </h1>
          <p className="text-sm opacity-90 mt-1">Hệ thống xác thực chữ ký số</p>
        </div>

        {chuKy ? (
          <div className="px-8 py-6 space-y-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <ThongTin label="Mã xác thực" value={chuKy.maXacThuc} mono />
              <ThongTin label="Loại văn bản" value={LABEL_LOAI[chuKy.loaiVanBan] ?? chuKy.loaiVanBan} />
              <ThongTin label="Người ký" value={chuKy.tenNguoiKy} />
              <ThongTin label="Chức vụ khi ký" value={chuKy.chucVu} />
              <ThongTin
                label="Thời gian ký"
                value={chuKy.kyLuc.toLocaleString("vi-VN")}
              />
              <ThongTin
                label="Trạng thái văn bản"
                value={trangThai ? (LABEL_TRANG_THAI[trangThai] ?? trangThai) : "Không tìm thấy văn bản"}
              />
            </div>

            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-xs text-gray-500 leading-relaxed">
              Mã xác thực được sinh bằng thuật toán băm SHA-256 từ thông tin bản ký
              (loại văn bản, người ký, thời điểm). Văn bản có trạng thái{" "}
              <b>&quot;Đã phê duyệt&quot;</b> nghĩa là đã đủ chữ ký qua các cấp.
            </div>

            <div className="flex gap-3">
              <Link
                href={lienKetVanBan(chuKy.loaiVanBan, chuKy.vanBanId)}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 text-center"
              >
                Xem văn bản →
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 text-center"
              >
                Đăng nhập hệ thống
              </Link>
            </div>
          </div>
        ) : (
          <div className="px-8 py-6 space-y-4">
            <p className="text-sm text-gray-600">
              Mã <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{maXT}</span> không
              khớp với bất kỳ chữ ký nào trong hệ thống. Vui lòng kiểm tra lại mã in trên văn bản.
            </p>
            <form action="/xac-thuc" method="get" className="flex gap-2">
              <input
                name="ma"
                placeholder="Nhập mã cần tra (8 ký tự)"
                maxLength={12}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900">
                Tra cứu
              </button>
            </form>
          </div>
        )}

        <div className="px-8 pb-6 text-center">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">
            ← Trang chủ trường học
          </Link>
        </div>
      </div>
    </div>
  );
}

function ThongTin({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`font-medium text-gray-900 ${mono ? "font-mono text-emerald-700" : ""}`}>
        {value}
      </p>
    </div>
  );
}
