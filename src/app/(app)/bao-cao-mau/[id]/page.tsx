import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  formatDate,
  formatDateTime,
  LABEL_TRANG_THAI,
  TRANG_THAI_BADGE,
} from "@/lib/utils";
import { danhSachGiaoVienNhan } from "@/lib/nhan-bao-cao";
import { LABEL_KIEU_DU_LIEU, LABEL_DOI_TUONG } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { DeleteButton } from "@/components/submit-button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { phatHanhMauForm, dongMauForm, moLaiMauForm, xoaMauForm } from "../actions";
import { SubmitButton } from "@/components/submit-button";

export default async function ChiTietMauBaoCaoPage({
  params,
}: PageProps<"/bao-cao-mau/[id]">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const mau = await db.mauBaoCao.findUnique({
    where: { id },
    include: {
      nguoiTao: true,
      toChuyenMon: true,
      fields: { orderBy: { thuTu: "asc" } },
      phanHois: true,
    },
  });
  if (!mau) notFound();

  const nguoiNhan = await danhSachGiaoVienNhan(mau.doiTuong, mau.toChuyenMonId);
  const daNopIds = new Set(mau.phanHois.map((p) => p.giaoVienId));
  const chuaNop = nguoiNhan.filter((gv) => !daNopIds.has(gv.id));
  const laQuanLy =
    mau.nguoiTaoId === session.userId ||
    ["ADMIN", "BAN_GIAM_DOC"].includes(session.vaiTro);

  return (
    <div className="space-y-6 max-w-5xl">
      <Link href="/bao-cao-mau" className="text-sm text-blue-600 hover:underline">
        ← Danh sách mẫu báo cáo
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{mau.tieuDe}</h1>
          {mau.moTa && <p className="mt-1 text-sm text-gray-500">{mau.moTa}</p>}
        </div>
        <Badge
          label={LABEL_TRANG_THAI[mau.trangThai] ?? mau.trangThai}
          color={TRANG_THAI_BADGE[mau.trangThai]}
        />
      </div>

      {/* Thông tin */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <Info label="Đối tượng nhận" value={
          LABEL_DOI_TUONG[mau.doiTuong] + (mau.toChuyenMon ? ` · ${mau.toChuyenMon.ten}` : "")
        } />
        <Info label="Hạn chót" value={formatDate(mau.hanChot)} />
        <Info label="Phát hành lúc" value={formatDateTime(mau.phatHanhLuc)} />
        <Info label="Người tạo" value={mau.nguoiTao.hoTen} />
      </div>

      {/* Hành động quản lý */}
      {laQuanLy && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-wrap items-center gap-3">
          {mau.trangThai === "NHAP" && (
            <>
              <form action={phatHanhMauForm}>
                <input type="hidden" name="id" value={mau.id} />
                <SubmitButton>🚀 Phát hành đến giáo viên</SubmitButton>
              </form>
              <Link
                href={`/bao-cao-mau/${mau.id}/sua`}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Chỉnh sửa
              </Link>
            </>
          )}
          {mau.trangThai === "DA_PHAT_HANH" && (
            <>
              <form action={dongMauForm}>
                <input type="hidden" name="id" value={mau.id} />
                <button className="rounded-lg bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
                  🔒 Đóng nhận phản hồi
                </button>
              </form>
              <a
                href={`/bao-cao-mau/${mau.id}/xuat-excel`}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                ⬇ Xuất Excel kết quả
              </a>
            </>
          )}
          {mau.trangThai === "DA_DONG" && (
            <>
              <form action={moLaiMauForm}>
                <input type="hidden" name="id" value={mau.id} />
                <button className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100">
                  Mở lại
                </button>
              </form>
              <a
                href={`/bao-cao-mau/${mau.id}/xuat-excel`}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                ⬇ Xuất Excel kết quả
              </a>
            </>
          )}
          <form action={xoaMauForm}>
            <input type="hidden" name="id" value={mau.id} />
            <DeleteButton confirmText="Xóa form này cùng mọi phản hồi?">
              Xóa form
            </DeleteButton>
          </form>
        </div>
      )}

      {/* Các trường dữ liệu */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-3">
          Các trường dữ liệu ({mau.fields.length})
        </h2>
        <ol className="space-y-1.5 text-sm">
          {mau.fields.map((f, i) => (
            <li key={f.id} className="flex items-center gap-2">
              <span className="text-gray-400 w-6">{i + 1}.</span>
              <span className="font-medium text-gray-800">{f.tenTruong}</span>
              <Badge label={LABEL_KIEU_DU_LIEU[f.kieuDuLieu]} />
              {f.batBuoc && <Badge label="Bắt buộc" color="bg-red-50 text-red-600" />}
              {f.kieuDuLieu === "CHON" && f.luaChon && (
                <span className="text-xs text-gray-400">({f.luaChon})</span>
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* Tiến độ phản hồi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-green-700 mb-3">
            ✓ Đã nộp ({daNopIds.size}/{nguoiNhan.length})
          </h2>
          <ul className="space-y-1 text-sm">
            {nguoiNhan.filter((gv) => daNopIds.has(gv.id)).map((gv) => {
              const ph = mau.phanHois.find((p) => p.giaoVienId === gv.id);
              return (
                <li key={gv.id} className="flex justify-between">
                  <span>{gv.hoTen}</span>
                  <span className="text-xs text-gray-400">{formatDateTime(ph?.guiLuc)}</span>
                </li>
              );
            })}
            {daNopIds.size === 0 && <li className="text-gray-400 italic">Chưa ai nộp.</li>}
          </ul>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-red-600 mb-3">
            ✗ Chưa nộp ({chuaNop.length})
          </h2>
          <ul className="space-y-1 text-sm">
            {chuaNop.map((gv) => (
              <li key={gv.id}>{gv.hoTen}</li>
            ))}
            {chuaNop.length === 0 && <li className="text-gray-400 italic">Tuyệt vời — tất cả đã nộp!</li>}
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
