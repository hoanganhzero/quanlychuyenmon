import { db } from "@/lib/prisma";
import type { LoaiVanBan, CapKy } from "@prisma/client";
import { formatDateTime } from "@/lib/utils";
import { tachViTriCustom } from "@/lib/chuky";

export const ViTriKy = {
  TOP_LEFT: "top-left" as const,
  TOP_CENTER: "top-center" as const,
  TOP_RIGHT: "top-right" as const,
  MIDDLE_LEFT: "middle-left" as const,
  CENTER: "center" as const,
  MIDDLE_RIGHT: "middle-right" as const,
  BOTTOM_LEFT: "bottom-left" as const,
  BOTTOM_CENTER: "bottom-center" as const,
  BOTTOM_RIGHT: "bottom-right" as const,
  CUSTOM: "custom" as const,
} as const;

export type ViTriKy = typeof ViTriKy[keyof typeof ViTriKy];

// Bản đồ vị trí cố định → style CSS (top/left percentage)
export const viTriKyStyles: Record<ViTriKy, { top: string; left: string }> = {
  [ViTriKy.TOP_LEFT]: { top: "10px", left: "10px" },
  [ViTriKy.TOP_CENTER]: { top: "10px", left: "50%" },
  [ViTriKy.TOP_RIGHT]: { top: "10px", left: "calc(100% - 150px)" },
  [ViTriKy.MIDDLE_LEFT]: { top: "50%", left: "10px" },
  [ViTriKy.CENTER]: { top: "50%", left: "50%" },
  [ViTriKy.MIDDLE_RIGHT]: { top: "50%", left: "calc(100% - 150px)" },
  [ViTriKy.BOTTOM_LEFT]: { top: "calc(100% - 150px)", left: "10px" },
  [ViTriKy.BOTTOM_CENTER]: { top: "calc(100% - 150px)", left: "50%" },
  [ViTriKy.BOTTOM_RIGHT]: { top: "calc(100% - 150px)", left: "calc(100% - 150px)" },
  [ViTriKy.CUSTOM]: { top: "0", left: "0" },
};

/**
 * Khối chữ ký đơn giản - hỗ trợ vị trí ký linh hoạt
 * - 9 vị trí cố định hoặc tùy chỉnh (X% từ left, Y% từ top)
 * - Hiển thị ảnh chữ ký thật hoặc fallback chữ viết tay
 */
function SigCol({
  tieuDe,
  chucVu,
  daKy,
  ten,
  thoiGian,
  maXacThuc,
  viTriKy,
}: {
  tieuDe: string;
  chucVu: string;
  daKy: boolean;
  ten?: string;
  thoiGian?: string;
  maXacThuc?: string;
  viTriKy?: ViTriKy;
}) {
  // Tính style dựa trên vị trí ký
  const positionStyle = viTriKy
    ? viTriKy === ViTriKy.CUSTOM
      ? { top: "0", left: "0" }
      : viTriKyStyles[viTriKy] ?? viTriKyStyles[ViTriKy.CENTER]
    : { top: "0", left: "0" };

  return (
    <div
      className={`rounded-lg border p-4 text-center ${daKy ? "border-emerald-300 bg-white" : "border-gray-200 bg-white/50"}`}
      style={positionStyle === viTriKyStyles[ViTriKy.CENTER]
        ? {}
        : { position: "relative", top: positionStyle.top, left: positionStyle.left }}
    >
      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-700">
        {tieuDe}
      </p>

      {daKy ? (
        <>
          {/* Hiện vị trí ký tùy chỉnh */}
          {viTriKy === ViTriKy.CUSTOM && (
            <div className="mt-2 flex gap-2 text-xs text-gray-500">
              <input
                type="number"
                min="0"
                max="100"
                step="5"
                value="50"
                readOnly
                className="rounded-border border-gray-300 px-2 py-1 w-20 text-center"
                style={{ border: "none" }}
              /> %
              <span>từ trái</span>
              <input
                type="number"
                min="0"
                max="100"
                step="5"
                value="50"
                readOnly
                className="rounded-border border-gray-300 px-2 py-1 w-20 text-center"
                style={{ border: "none" }}
              /> %
              <span>từ trên</span>
            </div>
          )}

          <p
            className="mt-3 text-xl text-indigo-800 leading-none"
            style={{ fontFamily: "'Segoe Script', 'Brush Script MT', cursive", position: "relative", top: positionStyle.top, left: positionStyle.left }}
          >
            {ten}
          </p>
          <div className="my-2 border-t border-gray-800" style={{ top: positionStyle.top }} />
          <p className="mt-1 text-[11px] font-medium text-gray-700" style={{ top: positionStyle.top }}>
            {ten}
          </p>
          <p className="text-[11px] text-gray-500" style={{ top: positionStyle.top }}>
            {chucVu}
          </p>
          <p className="mt-1 text-[10px] text-gray-400" style={{ top: positionStyle.top }}>
            Ký lúc: {thoiGian ?? "—"}
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-emerald-700" style={{ top: positionStyle.top }}>
            Mã XT: {maXacThuc} ✓
          </p>
        </>
      ) : (
        <>
          <p className="mt-6 text-xs text-gray-300">(Chưa ký)</p>
          <div className="my-2 border-t border-dashed border-transparent" />
          <p className="text-[11px] italic text-gray-400">{chucVu}</p>
          <p className="mt-1 text-[10px] text-gray-300">Ký, ghi rõ họ tên</p>
        </>
      )}
    </div>
  );
}

/**
 * ChuKyBlock reusable cho mọi loại văn bản:
 * - Hiển thị 3 khối: Người soan, Tổ trưởng, BGĐ
 * - Mỗi khối hỗ trợ 9 vị trí cố định + tùy chỉnh (input % X,Y)
 * - Auto-query chuKys theo loaiVanBan + vanBanId
 */
interface Props {
  loaiVanBan: LoaiVanBan;
  vanBanId: string;
  nguoiSoan: string;
  hienTemplate?: boolean; // hiển thị area upload template cho Admin/TT/BGD
}

export default async function ChuKyBlock({
  loaiVanBan,
  vanBanId,
  nguoiSoan,
  hienTemplate = false,
}: Props) {
  const chuKys = await db.chuKy.findMany({
    where: { loaiVanBan, vanBanId },
    orderBy: { kyLuc: "asc" },
    include: { nguoiKy: { include: { mauChuKy: true } } },
  });

  const sigGV = chuKys.find((c) => c.capKy === "GV_SOAN");
  const sigTT = chuKys.find((c) => c.capKy === "TO_TRUONG");
  const sigBGD = chuKys.find((c) => c.capKy === "BAN_GIAM_DOC");

  const anhChuKy = (userId: string) =>
    `/api/chu-ky/${userId}?v=${Date.now()}`;

  // --- Bản đồ vị trí ký trên trang giấy giả lập ---
  const viTriTrenGiay = (viTri?: string | null): { left: string; top: string } => {
    const custom = tachViTriCustom(viTri);
    if (custom) return { left: `${custom.xPercent}%`, top: `${custom.yPercent}%` };
    switch (viTri) {
      case "top-left": return { left: "12%", top: "10%" };
      case "top-center": return { left: "50%", top: "10%" };
      case "top-right": return { left: "85%", top: "10%" };
      case "middle-left": return { left: "12%", top: "50%" };
      case "bottom-right": return { left: "82%", top: "86%" };
      case "bottom-center": return { left: "50%", top: "86%" };
      case "bottom-left": return { left: "12%", top: "86%" };
      default: return { left: "70%", top: "78%" }; // center → chỗ ký truyền thống
    }
  };

  const cacChuKyDaKy = chuKys.filter((c) =>
    c.capKy !== null && [sigGV, sigTT, sigBGD].some((s) => s?.id === c.id)
  );

  const banDoViTri = cacChuKyDaKy.length > 0 ? (
    <div className="mt-5">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400 text-center">
        Vị trí chữ ký trên văn bản
      </p>
      <div className="relative mx-auto w-full max-w-sm aspect-[210/297] rounded-lg border border-gray-200 bg-white shadow-inner overflow-hidden">
        {/* Giả lập nội dung */}
        <div className="absolute inset-0 p-[8%] pointer-events-none">
          <div className="h-2.5 w-2/3 bg-slate-200 rounded mb-1" />
          <div className="h-1.5 w-1/4 bg-slate-100 rounded mb-4" />
          <div className="space-y-1.5">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="h-1 bg-gray-100 rounded" style={{ width: `${90 - (i % 5) * 11}%` }} />
            ))}
          </div>
        </div>
        {/* Chữ ký theo vị trí */}
        {cacChuKyDaKy.map((c) => {
          const vt = viTriTrenGiay(c.viTriKy);
          return (
            <div key={c.id} className="absolute -translate-x-1/2 -translate-y-1/2 text-center" style={vt}>
              {c.nguoiKy.mauChuKy ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={`/api/chu-ky/${c.nguoiKyId}?v=${c.kyLuc.getTime()}`} alt={`Chữ ký ${c.tenNguoiKy}`}
                  className="w-16 h-auto opacity-90" />
              ) : (
                <span
                  className="block text-[13px] leading-none text-indigo-800 whitespace-nowrap"
                  style={{ fontFamily: "'Segoe Script', 'Brush Script MT', cursive" }}
                >
                  {c.tenNguoiKy}
                </span>
              )}
              <span className="block text-[7px] text-gray-500 border-t border-gray-700 mt-0.5 pt-0.5">
                {c.chucVu}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-center text-[10px] text-gray-400 mt-1.5">
        Mô phỏng bố cục chữ ký trên trang — dùng “Kéo thả chọn vị trí” khi duyệt để đặt chính xác.
      </p>
    </div>
  ) : null;

  // --- Gợi ý tải mẫu chữ ký nếu người soạn chưa có ---
  const templateUpload = hienTemplate ? (
    <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-center">
      <p className="text-xs text-gray-500">
        Muốn chữ ký tay của bạn xuất hiện ở đây?{" "}
        <a href="/chu-ky-cua-toi" className="font-medium text-blue-600 hover:underline">
          Tải lên mẫu chữ ký →
        </a>
      </p>
    </div>
  ) : null;

  return (
    <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-gray-50/60 p-5">
      <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-widest text-gray-400">
        Chữ ký số — hệ thống tự động xác thực
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SigCol
          tieuDe="NGƯỜI SOẠN"
          chucVu="Giáo viên"
          daKy={!!sigGV}
          ten={sigGV?.tenNguoiKy ?? nguoiSoan}
          thoiGian={sigGV ? formatDateTime(sigGV.kyLuc) : undefined}
          maXacThuc={sigGV?.maXacThuc}
          viTriKy={sigGV?.viTriKy as ViTriKy | undefined}
        />
        <SigCol
          tieuDe="DUYỆT CẤP TỔ"
          chucVu="Tổ trưởng chuyên môn"
          daKy={!!sigTT}
          ten={sigTT?.tenNguoiKy}
          thoiGian={sigTT ? formatDateTime(sigTT.kyLuc) : undefined}
          maXacThuc={sigTT?.maXacThuc}
          viTriKy={sigTT?.viTriKy as ViTriKy | undefined}
        />
        <SigCol
          tieuDe="PHÊ DUYỆT"
          chucVu="Ban Giám đốc"
          daKy={!!sigBGD}
          ten={sigBGD?.tenNguoiKy}
          thoiGian={sigBGD ? formatDateTime(sigBGD.kyLuc) : undefined}
          maXacThuc={sigBGD?.maXacThuc}
          viTriKy={sigBGD?.viTriKy as ViTriKy | undefined}
        />
      </div>
      {banDoViTri}
      {templateUpload}
    </div>
  );
}