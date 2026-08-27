import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  formatDate,
  formatDateTime,
  LABEL_TRANG_THAI,
  TRANG_THAI_BADGE,
} from "@/lib/utils";
import {
  luuBaoGiang,
  nopBaoGiangForm,
  duyetCapToForm,
  pheDuyetCuoiForm,
  tuChoiBaoGiangForm,
  xoaBaoGiangForm,
} from "../actions";
import ChuKyBlock from "@/components/chu-ky-block";
import ChonViTriKy from "@/components/chon-vi-tri-ky";
import { DeleteButton } from "@/components/submit-button";
import { PageHeader, Badge } from "@/components/ui";
import Link from "next/link";
import { notFound } from "next/navigation";

const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default async function ChiTietBaoGiangPage({
  params,
}: PageProps<"/bao-giang/[id]">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const bg = await db.baoGiang.findUnique({
    where: { id },
    include: { giaoVien: true, monHoc: true, lopHoc: true },
  });
  if (!bg) notFound();

  const gv = await db.giaoVien.findFirst({ where: { userId: session.userId } });
  const laChuSoHao = !!gv && bg.giaoVienId === gv.id;
  const laToTruong =
    session.vaiTro === "ADMIN" || session.vaiTro === "TO_TRUONG";
  const laBGD = session.vaiTro === "ADMIN" || session.vaiTro === "BAN_GIAM_DOC";

  // Tổ trưởng chỉ duyệt GV trong tổ của mình
  let cungTo = session.vaiTro === "ADMIN";
  if (!cungTo && session.vaiTro === "TO_TRUONG" && gv) {
    cungTo = bg.giaoVien.toChuyenMonId === gv.toChuyenMonId;
  }

  // Phân công giảng dạy của chủ sổ (cho form sửa)
  const phanCongsCuaToi = await db.phanCong.findMany({
    where: { giaoVienId: bg.giaoVienId, namHoc: { dangHoatDong: true } },
    include: { monHoc: true, lopHoc: true },
  });

  // Ảnh mẫu chữ ký của người đăng nhập (kéo thả) 
  const mauChuKyCuaToi = await db.mauChuKy.findUnique({
    where: { nguoiDungId: session.userId },
  });
  const anhChuKyUrl = mauChuKyCuaToi
    ? `/api/chu-ky/${session.userId}?v=${mauChuKyCuaToi.taoLuc.getTime()}`
    : undefined;

  const coTheSua =
    laChuSoHao && (bg.trangThai === "NHAP" || bg.trangThai === "TU_CHOI");

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/bao-giang" className="text-sm text-blue-600 hover:underline">
        ← Sổ báo giảng
      </Link>

      <PageHeader title={bg.tenBaiDay}>
        <Badge
          label={LABEL_TRANG_THAI[bg.trangThai]}
          color={TRANG_THAI_BADGE[bg.trangThai]}
        />
      </PageHeader>

      <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <Info label="Ngày dạy" value={`${formatDate(bg.ngay)} · Tiết ${bg.tietBatDau}${bg.soTiet > 1 ? `→${bg.tietBatDau + bg.soTiet - 1}` : ""}`} />
        <Info label="Môn học" value={bg.monHoc.tenMon} />
        <Info label="Lớp" value={bg.lopHoc?.ten ?? "—"} />
        <Info label="Giáo viên" value={bg.giaoVien.hoTen} />
        <Info label="Nộp lúc" value={bg.ngayGui ? formatDateTime(bg.ngayGui) : "—"} />
        <Info label="Số tiết" value={String(bg.soTiet)} />
        {bg.ghiChu && (
          <div className="col-span-2 md:col-span-4">
            <Info label="Ghi chú" value={bg.ghiChu} />
          </div>
        )}
      </div>

      {bg.nhanXet && bg.trangThai === "TU_CHOI" && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          <strong>Lý do từ chối:</strong> {bg.nhanXet}
        </div>
      )}

      {/* Cấp 1 — tổ trưởng */}
      {laToTruong && cungTo && !laChuSoHao && bg.trangThai === "CHO_DUYET" && (
        <div className="bg-white rounded-xl border border-amber-200 p-5 space-y-3">
          <h3 className="font-semibold text-gray-900">
            Duyệt cấp tổ{" "}
            <span className="text-xs font-normal text-gray-400">— bước 1/2</span>
          </h3>
          <form action={duyetCapToForm} className="space-y-3">
            <input type="hidden" name="id" value={bg.id} />
            <button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
              ✓ Duyệt (cấp tổ)
            </button>
            <ChonViTriKy
              macDinh="center"
              anhChuKy={anhChuKyUrl}
              tenNguoiKy={session.hoTen}
            />
          </form>
          <form action={tuChoiBaoGiangForm} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={bg.id} />
            <input name="nhanXet" required placeholder="Lý do từ chối..."
              className="flex-1 min-w-[240px] rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
              ✕ Từ chối
            </button>
          </form>
        </div>
      )}

      {/* Cấp 2 — BGĐ */}
      {laBGD && !laChuSoHao && bg.trangThai === "CHO_BGD_DUYET" && (
        <div className="bg-white rounded-xl border border-purple-200 p-5 space-y-3">
          <h3 className="font-semibold text-gray-900">
            Phê duyệt Ban Giám đốc{" "}
            <span className="text-xs font-normal text-purple-500">— đã có chữ ký tổ trưởng ✓</span>
          </h3>
          <form action={pheDuyetCuoiForm} className="space-y-3">
            <input type="hidden" name="id" value={bg.id} />
            <button className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
              🖋 Phê duyệt (ký số cuối)
            </button>
            <ChonViTriKy
              macDinh="bottom-right"
              anhChuKy={anhChuKyUrl}
              tenNguoiKy={session.hoTen}
            />
          </form>
          <form action={tuChoiBaoGiangForm} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={bg.id} />
            <input name="nhanXet" required placeholder="Lý do từ chối..."
              className="flex-1 min-w-[240px] rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
              ✕ Từ chối
            </button>
          </form>
        </div>
      )}

      {/* Sửa nội dung */}
      {coTheSua ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Chỉnh sửa</h3>
          <form action={luuBaoGiang} className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <input type="hidden" name="id" value={bg.id} />
            <div>
              <label className={lbl}>Ngày *</label>
              <input type="date" name="ngay" required defaultValue={toDateInput(bg.ngay)} className={cls} />
            </div>
            <div>
              <label className={lbl}>Tiết bắt đầu *</label>
              <select name="tietBatDau" defaultValue={bg.tietBatDau} className={cls}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>Số tiết *</label>
              <select name="soTiet" defaultValue={bg.soTiet} className={cls}>
                {[1, 2, 3, 4].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>Môn *</label>
              <select name="monHocId" required defaultValue={bg.monHocId} className={cls}>
                {[...new Map(phanCongsCuaToi.map((pc) => [pc.monHocId, pc.monHoc])).values()].map((m) => (
                  <option key={m.id} value={m.id}>{m.tenMon}</option>
                ))}
                {!phanCongsCuaToi.some((pc) => pc.monHocId === bg.monHocId) && (
                  <option value={bg.monHocId}>{bg.monHoc.tenMon}</option>
                )}
              </select>
            </div>
            <div>
              <label className={lbl}>Lớp</label>
              <select name="lopHocId" defaultValue={bg.lopHocId ?? ""} className={cls}>
                <option value="">— Không —</option>
                {[...new Map(phanCongsCuaToi.filter((pc) => pc.lopHoc).map((pc) => [pc.lopHocId!, pc.lopHoc!])).values()].map((l) => (
                  <option key={l.id} value={l.id}>{l.ten}</option>
                ))}
                {!phanCongsCuaToi.some((pc) => pc.lopHocId === bg.lopHocId) && bg.lopHoc && (
                  <option value={bg.lopHocId ?? undefined}>{bg.lopHoc.ten}</option>
                )}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className={lbl}>Tên bài dạy *</label>
              <input name="tenBaiDay" required defaultValue={bg.tenBaiDay} className={cls} />
            </div>
            <div className="md:col-span-4">
              <label className={lbl}>Ghi chú</label>
              <input name="ghiChu" defaultValue={bg.ghiChu ?? ""} className={cls} />
            </div>
            <div className="md:col-span-4 flex flex-wrap items-center gap-3">
              <button type="submit" name="guiDuyet" value="0"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Lưu nháp
              </button>
              <button type="submit" name="guiDuyet" value="1"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Nộp trình ký
              </button>
            </div>
          </form>

          {/* Hành động phụ — ngoài form chính để tránh form lồng nhau */}
          {(laChuSoHao || session.vaiTro === "ADMIN") && (
            <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
              {laChuSoHao && (bg.trangThai === "NHAP" || bg.trangThai === "TU_CHOI") && (
                <form action={nopBaoGiangForm}>
                  <input type="hidden" name="id" value={bg.id} />
                  <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                    ✓ Nộp ngay để trình ký
                  </button>
                </form>
              )}
              {laChuSoHao && (
                <form action={xoaBaoGiangForm} className="ml-auto">
                  <input type="hidden" name="id" value={bg.id} />
                  <DeleteButton confirmText="Xóa bản ghi báo giảng này?">
                    Xóa bản ghi
                  </DeleteButton>
                </form>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* Khối chữ ký số */}
      <ChuKyBlock loaiVanBan="BAO_GIANG" vanBanId={bg.id} nguoiSoan={bg.giaoVien.hoTen} hienTemplate />
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
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const lbl = "mb-1 block text-xs font-medium text-gray-600";
