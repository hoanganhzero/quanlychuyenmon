import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  LABEL_LOAI_KE_HOACH,
  LABEL_TRANG_THAI,
  TRANG_THAI_BADGE,
  formatDateTime,
} from "@/lib/utils";
import { suaGiaoAn, tuChoiGiaoAn } from "../actions";
import { duyetGiaoAnForm, xoaGiaoAnForm, pheDuyetGiaoAnForm } from "@/app/actions/crud";
import ChuKyBlock from "@/components/chu-ky-block";
import ChonViTriKy from "@/components/chon-vi-tri-ky";
import { DanhSachTep } from "@/components/tep-trinh-ky";
import { DeleteButton } from "@/components/submit-button";
import { PageHeader, Badge } from "@/components/ui";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ChiTietGiaoAnPage({
  params,
}: PageProps<"/giao-an/[id]">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const giaoAn = await db.giaoAn.findUnique({
    where: { id },
    include: {
      giaoVien: true,
      monHoc: true,
      lopHoc: true,
      nguoiDuyet: true,
      tepTrinhKys: true,
    },
  });
  if (!giaoAn) notFound();

  const gv = await db.giaoVien.findFirst({ where: { userId: session.userId } });
  const laChuSoHao = !!gv && giaoAn.giaoVienId === gv.id;
  const laToTruong =
    session.vaiTro === "TO_TRUONG" || session.vaiTro === "ADMIN";
  const laBGD =
    session.vaiTro === "BAN_GIAM_DOC" || session.vaiTro === "ADMIN";
  const coTheSua =
    (laChuSoHao && giaoAn.trangThai !== "DA_DUYET") || session.vaiTro === "ADMIN";

  // Ảnh mẫu chữ ký của người đang đăng nhập (hiển thị khi kéo thả)
  const mauChuKyCuaToi = await db.mauChuKy.findUnique({
    where: { nguoiDungId: session.userId },
  });
  const anhChuKyUrl = mauChuKyCuaToi
    ? `/api/chu-ky/${session.userId}?v=${mauChuKyCuaToi.taoLuc.getTime()}`
    : undefined;
  // File PDF đính kèm làm nền xem trước
  const tepPdf = giaoAn.tepTrinhKys.find((t) => t.mimeType === "application/pdf");

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/giao-an" className="text-blue-600 hover:underline">
          ← Danh sách giáo án
        </Link>
      </div>

      <PageHeader title={giaoAn.tieuDe}>
        <Badge
          label={LABEL_TRANG_THAI[giaoAn.trangThai]}
          color={TRANG_THAI_BADGE[giaoAn.trangThai]}
        />
      </PageHeader>

      <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <Info label="Loại" value={LABEL_LOAI_KE_HOACH[giaoAn.loai]} />
        <Info label="Môn học" value={giaoAn.monHoc.tenMon} />
        <Info label="Lớp" value={giaoAn.lopHoc?.ten ?? "—"} />
        <Info label="Người soạn" value={giaoAn.giaoVien.hoTen} />
        <Info label="Ngày nộp" value={formatDateTime(giaoAn.ngayGui)} />
        <Info label="Cập nhật" value={formatDateTime(giaoAn.capNhatLuc)} />
        {giaoAn.nguoiDuyet && (
          <Info label="Người duyệt" value={giaoAn.nguoiDuyet.hoTen} />
        )}
      </div>

      {giaoAn.nhanXet && giaoAn.trangThai === "TU_CHOI" && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          <strong>Nhận xét của người duyệt:</strong> {giaoAn.nhanXet}
        </div>
      )}

      {/* File Word/PDF trình ký */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">
          📎 File trình ký
        </h3>
        <DanhSachTep teps={giaoAn.tepTrinhKys} coTheThayThe={coTheSua} />
      </div>

      {/* Cấp 1 — Tổ trưởng duyệt */}
      {laToTruong && giaoAn.trangThai === "CHO_DUYET" && (
        <div className="bg-white rounded-xl border border-amber-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">
            Duyệt cấp tổ <span className="text-xs font-normal text-gray-400">— bước 1/2, sau đó chuyển Ban Giám đốc</span>
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <form action={duyetGiaoAnForm} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={giaoAn.id} />
              <button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                ✓ Duyệt (cấp tổ)
              </button>
              <ChonViTriKy
                macDinh="center"
                anhChuKy={anhChuKyUrl}
                tenNguoiKy={session.hoTen}
                pdfUrl={tepPdf ? `/api/tep/${tepPdf.id}?inline=1` : undefined}
              />
            </form>
            <form action={tuChoiGiaoAn} className="flex flex-1 flex-wrap gap-2 items-center min-w-[300px]">
              <input type="hidden" name="id" value={giaoAn.id} />
              <input
                name="nhanXet"
                placeholder="Lý do từ chối / góp ý..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                required
              />
              <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                ✕ Từ chối
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Cấp 2 — Ban Giám đốc phê duyệt */}
      {laBGD && giaoAn.trangThai === "CHO_BGD_DUYET" && (
        <div className="bg-white rounded-xl border border-purple-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">
            Phê duyệt của Ban Giám đốc{" "}
            <span className="text-xs font-normal text-purple-500">— đã có chữ ký tổ trưởng ✓</span>
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <form action={pheDuyetGiaoAnForm} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={giaoAn.id} />
              <button className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
                🖋 Phê duyệt (ký số cuối)
              </button>
              <ChonViTriKy
                macDinh="bottom-right"
                anhChuKy={anhChuKyUrl}
                tenNguoiKy={session.hoTen}
                pdfUrl={tepPdf ? `/api/tep/${tepPdf.id}?inline=1` : undefined}
              />
            </form>
            <form action={tuChoiGiaoAn} className="flex flex-1 flex-wrap gap-2 items-center min-w-[300px]">
              <input type="hidden" name="id" value={giaoAn.id} />
              <input
                name="nhanXet"
                placeholder="Lý do từ chối / góp ý..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                required
              />
              <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                ✕ Từ chối
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sửa nội dung */}
      {coTheSua ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h3 className="font-semibold text-gray-900">Chỉnh sửa</h3>
          <form action={suaGiaoAn} className="space-y-5">
            <input type="hidden" name="id" value={giaoAn.id} />
            <div>
              <label className={lbl}>Tiêu đề</label>
              <input name="tieuDe" defaultValue={giaoAn.tieuDe} required className={`${cls} w-full`} />
            </div>
            <div>
              <label className={lbl}>
                Nội dung{" "}
                <span className="font-normal text-gray-400">
                  (bắt buộc nếu không có file đính kèm)
                </span>
              </label>
              <textarea
                name="noiDung"
                defaultValue={giaoAn.noiDung}
                rows={16}
                className={`${cls} w-full font-mono text-[13px] leading-relaxed`}
              />
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
              <label className={lbl}>
                📎 Thay file Word/PDF trình ký (.doc, .docx, .pdf — tối đa 100MB)
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
          {laChuSoHao && (
            <form action={xoaGiaoAnForm} className="border-t border-gray-100 pt-4">
              <input type="hidden" name="id" value={giaoAn.id} />
              <DeleteButton confirmText="Xóa giáo án này vĩnh viễn?">
                Xóa giáo án
              </DeleteButton>
            </form>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {giaoAn.noiDung ? (
            <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-gray-800">
              {giaoAn.noiDung}
            </pre>
          ) : (
            <p className="text-sm text-gray-400 italic">
              Nội dung nằm trong file đính kèm phía trên.
            </p>
          )}
        </div>
      )}

      {/* Khối chữ ký số tự động */}
      <ChuKyBlock
        loaiVanBan="GIAO_AN"
        vanBanId={giaoAn.id}
        nguoiSoan={giaoAn.giaoVien.hoTen}
      />
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

const cls =
  "rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const lbl = "block text-xs font-medium text-gray-600 mb-1";
