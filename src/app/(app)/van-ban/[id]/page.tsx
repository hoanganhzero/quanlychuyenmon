import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatDate, formatDateTime, LABEL_TRANG_THAI, TRANG_THAI_BADGE } from "@/lib/utils";
import { LABEL_DOI_TUONG } from "@/lib/utils";
import { DanhSachTep } from "@/components/tep-trinh-ky";
import { Badge } from "@/components/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { phatHanhVanBanForm, dongVanBanForm } from "../actions";

const LOAI_LABEL: Record<string, string> = {
  CONG_VAN: "Công văn",
  QUYET_DINH: "Quyết định",
  KE_HOACH: "Kế hoạch",
  THONG_BAO: "Thông báo",
  KHAC: "Khác",
};

export default async function ChiTietVanBanPage({
  params,
}: PageProps<"/van-ban/[id]">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const vb = await db.vanBan.findUnique({
    where: { id },
    include: {
      nguoiTao: true,
      toChuyenMon: true,
      tepTrinhKys: true,
      xacNhans: { include: { giaoVien: true } },
    },
  });
  if (!vb) notFound();

  const { danhSachGiaoVienNhan } = await import("@/lib/nhan-bao-cao");
  const nguoiNhan = await danhSachGiaoVienNhan(vb.doiTuong, vb.toChuyenMonId);
  const daXacNhanIds = new Set(vb.xacNhans.map((x) => x.giaoVienId));
  const chuaXacNhan = nguoiNhan.filter((gv) => !daXacNhanIds.has(gv.id));

  const laQuanLy =
    vb.nguoiTaoId === session.userId ||
    ["ADMIN", "BAN_GIAM_DOC"].includes(session.vaiTro);

  return (
    <div className="space-y-6 max-w-5xl">
      <Link href="/van-ban" className="text-sm text-blue-600 hover:underline">
        ← Danh sách văn bản
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-400 font-mono">{vb.soHieu ?? ""}</p>
          <h1 className="text-2xl font-bold text-gray-900">{vb.trichYeu}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {LOAI_LABEL[vb.loaiVanBan]}
            {vb.ngayBanHanh ? ` · Ban hành ${formatDate(vb.ngayBanHanh)}` : ""}
            {vb.nguoiTrinhBay ? ` · Người trình bày: ${vb.nguoiTrinhBay}` : ""}
          </p>
        </div>
        <Badge
          label={LABEL_TRANG_THAI[vb.trangThai] ?? vb.trangThai}
          color={TRANG_THAI_BADGE[vb.trangThai]}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <Info label="Đối tượng nhận" value={
          LABEL_DOI_TUONG[vb.doiTuong] + (vb.toChuyenMon ? ` · ${vb.toChuyenMon.ten}` : "")
        } />
        <Info label="Hạn xác nhận" value={formatDate(vb.hanChot)} />
        <Info label="Phát hành lúc" value={formatDateTime(vb.phatHanhLuc)} />
        <Info label="Người phát hành" value={vb.nguoiTao.hoTen} />
      </div>

      {laQuanLy && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-wrap items-center gap-3">
          {vb.trangThai === "NHAP" && (
            <form action={phatHanhVanBanForm}>
              <input type="hidden" name="id" value={vb.id} />
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                🚀 Phát hành đến giáo viên
              </button>
            </form>
          )}
          {vb.trangThai === "DA_PHAT_HANH" && (
            <>
              <form action={dongVanBanForm}>
                <input type="hidden" name="id" value={vb.id} />
                <button className="rounded-lg bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
                  🔒 Đóng xác nhận
                </button>
              </form>
              <a
                href={`/van-ban/${vb.id}/xuat-excel`}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                ⬇ Xuất Excel danh sách
              </a>
            </>
          )}
          {vb.trangThai === "DA_DONG" && (
            <a
              href={`/van-ban/${vb.id}/xuat-excel`}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              ⬇ Xuất Excel danh sách
            </a>
          )}
        </div>
      )}

      {vb.noiDung && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Nội dung</h2>
          <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
            {vb.noiDung}
          </pre>
        </div>
      )}

      {vb.tepTrinhKys.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">📎 File văn bản</h2>
          <DanhSachTep teps={vb.tepTrinhKys} />
        </div>
      )}

      {/* Danh sách xác nhận */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-green-700 mb-3">
            ✓ Đã xác nhận ({daXacNhanIds.size}/{nguoiNhan.length})
          </h2>
          <ul className="space-y-1 text-sm">
            {vb.xacNhans.map((x) => (
              <li key={x.id} className="flex justify-between">
                <span>{x.giaoVien.hoTen}</span>
                <span className="text-xs text-gray-400">{formatDateTime(x.docLuc)}</span>
              </li>
            ))}
            {daXacNhanIds.size === 0 && <li className="text-gray-400 italic">Chưa ai xác nhận.</li>}
          </ul>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-red-600 mb-3">
            ✗ Chưa xác nhận ({chuaXacNhan.length})
          </h2>
          <ul className="space-y-1 text-sm">
            {chuaXacNhan.map((gv) => (
              <li key={gv.id}>{gv.hoTen}</li>
            ))}
            {chuaXacNhan.length === 0 && nguoiNhan.length > 0 && (
              <li className="text-gray-400 italic">Tất cả đã xác nhận!</li>
            )}
            {nguoiNhan.length === 0 && (
              <li className="text-gray-400 italic">Không có người nhận phù hợp.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-medium text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}
