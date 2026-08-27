import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { suaBaoCao } from "../actions";
import ChuKyBlock from "@/components/chu-ky-block";
import { DanhSachTep } from "@/components/tep-trinh-ky";
import { PageHeader } from "@/components/ui";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function SuaBaoCaoPage({
  params,
}: PageProps<"/bao-cao-gvcn/[id]">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const bc = await db.baoCaoGVCN.findUnique({
    where: { id },
    include: { lopHoc: true, gvcn: true, tepTrinhKys: true },
  });
  if (!bc) notFound();

  const coTheSua =
    bc.trangThai !== "DA_DUYET" &&
    (session.vaiTro === "ADMIN" || bc.gvcn.userId === session.userId);

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/bao-cao-gvcn" className="text-sm text-blue-600 hover:underline">
        ← Danh sách báo cáo
      </Link>
      <PageHeader
        title={`Sửa báo cáo tháng ${bc.thang} — lớp ${bc.lopHoc.ten}`}
      />

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {coTheSua ? (
          <form action={suaBaoCao} className="space-y-5">
          <input type="hidden" name="id" value={bc.id} />

          <div className="grid grid-cols-3 gap-5">
            <div>
              <label className={lbl}>Sĩ số</label>
              <input type="number" name="siSo" min={0} defaultValue={bc.siSo ?? ""} className={cls} />
            </div>
            <div>
              <label className={lbl}>Nghỉ có phép</label>
              <input type="number" name="nghiCoPhep" min={0} defaultValue={bc.nghiCoPhep ?? ""} className={cls} />
            </div>
            <div>
              <label className={lbl}>Nghỉ không phép</label>
              <input type="number" name="nghiKoPhep" min={0} defaultValue={bc.nghiKoPhep ?? ""} className={cls} />
            </div>
          </div>

          <div>
            <label className={lbl}>Tình hình lớp trong tháng</label>
            <textarea name="noiDung" rows={8} defaultValue={bc.noiDung ?? ""}
              className={`${cls} w-full`} />
          </div>

          <div>
            <label className={lbl}>Đề xuất / kiến nghị</label>
            <textarea name="deXuat" rows={3} defaultValue={bc.deXuat ?? ""}
              className={`${cls} w-full`} />
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
            <label className={lbl}>
              📎 Thay file Word/PDF (.doc, .docx, .pdf — tối đa 100MB)
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
        ) : (
          <p className="text-sm text-gray-500 italic">
            Báo cáo đã được phê duyệt hoặc bạn không có quyền chỉnh sửa.
          </p>
        )}
      </div>

      {/* File Word/PDF đính kèm */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">📎 File trình ký</h3>
        <DanhSachTep teps={bc.tepTrinhKys} coTheThayThe={coTheSua} />
      </div>

      {/* Khối chữ ký số tự động */}
      <ChuKyBlock
        loaiVanBan="BAO_CAO_GVCN"
        vanBanId={bc.id}
        nguoiSoan={bc.gvcn.hoTen}
      />
    </div>
  );
}

const cls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const lbl = "block text-xs font-medium text-gray-600 mb-1";
