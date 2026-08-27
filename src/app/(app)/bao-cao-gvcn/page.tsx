import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  LABEL_TRANG_THAI,
  TRANG_THAI_BADGE,
  formatDateTime,
  one,
} from "@/lib/utils";
import ChonViTriKy from "@/components/chon-vi-tri-ky";
import Link from "next/link";
import { PageHeader, Badge, EmptyState } from "@/components/ui";

export default async function BaoCaoGVCNPage({
  searchParams,
}: PageProps<"/bao-cao-gvcn">) {
  const sp = await searchParams;
  const ttFilter = one(sp.trangthai);
  const session = await getSession();
  if (!session) return null;

  const laToTruong =
    session.vaiTro === "TO_TRUONG" || session.vaiTro === "ADMIN";
  const laBGD = session.vaiTro === "BAN_GIAM_DOC" || session.vaiTro === "ADMIN";

  const namHoc = await db.namHoc.findFirst({ where: { dangHoatDong: true } });
  if (!namHoc) {
    return (
      <div className="space-y-6">
        <PageHeader title="Báo cáo GVCN" />
        <EmptyState message="Chưa có năm học đang hoạt động." />
      </div>
    );
  }

  const gvBanThan = await db.giaoVien.findFirst({
    where: { userId: session.userId },
  });

  // Phạm vi: GVCN chỉ thấy báo cáo của mình; tổ trưởng thấy tổ mình; BGĐ/Admin tất cả
  let phamVi: Record<string, unknown> = {};
  if (!laToTruong && !laBGD) {
    phamVi = gvBanThan ? { gvcnId: gvBanThan.id } : { gvcnId: "__khongco__" };
  } else if (session.vaiTro === "TO_TRUONG") {
    phamVi = {
      gvcn: { toChuyenMonId: gvBanThan?.toChuyenMonId ?? "__khongco__" },
    };
  }

  const baoCaos = await db.baoCaoGVCN.findMany({
    where: {
      namHocId: namHoc.id,
      ...(ttFilter ? { trangThai: ttFilter as never } : {}),
      ...phamVi,
    },
    orderBy: [{ thang: "desc" }],
    include: { lopHoc: true, gvcn: true },
  });

  const dem = { CHO_DUYET: 0, CHO_BGD_DUYET: 0, DA_DUYET: 0, TU_CHOI: 0, NHAP: 0 };
  for (const b of baoCaos) dem[b.trangThai]++;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Báo cáo chủ nhiệm hàng tháng"
        description={`Năm học ${namHoc.ten} — ${baoCaos.length} báo cáo trong phạm vi của bạn`}
      />

      {/* Bộ lọc trạng thái */}
      <div className="flex flex-wrap gap-2">
        <FilterLink href="/bao-cao-gvcn" label="Tất cả" active={!ttFilter} />
        <FilterLink href="/bao-cao-gvcn?trangthai=CHO_DUYET" label={`Chờ tổ duyệt (${dem.CHO_DUYET})`} active={ttFilter === "CHO_DUYET"} />
        <FilterLink href="/bao-cao-gvcn?trangthai=CHO_BGD_DUYET" label={`Chờ BGĐ (${dem.CHO_BGD_DUYET})`} active={ttFilter === "CHO_BGD_DUYET"} />
        <FilterLink href="/bao-cao-gvcn?trangthai=DA_DUYET" label={`Đã duyệt (${dem.DA_DUYET})`} active={ttFilter === "DA_DUYET"} />
        <FilterLink href="/bao-cao-gvcn?trangthai=TU_CHOI" label={`Bị từ chối (${dem.TU_CHOI})`} active={ttFilter === "TU_CHOI"} />
      </div>

      {baoCaos.length === 0 ? (
        <EmptyState message="Không có báo cáo nào phù hợp." />
      ) : (
        <div className="space-y-3">
          {baoCaos.map((bc) => (
            <div key={bc.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-bold text-gray-900 w-20">
                  Tháng {bc.thang}
                </span>
                <span className="text-sm text-gray-700">
                  Lớp {bc.lopHoc.ten} · GVCN {bc.gvcn.hoTen}
                </span>
                <Badge
                  label={LABEL_TRANG_THAI[bc.trangThai]}
                  color={TRANG_THAI_BADGE[bc.trangThai]}
                />
                <Link
                  href={`/bao-cao-gvcn/${bc.id}`}
                  className="ml-auto text-xs text-blue-600 hover:underline"
                >
                  Chi tiết & chữ ký →
                </Link>
              </div>

              <BaoCaoDetail id={bc.id} vaiTro={session.vaiTro} hoTen={session.hoTen} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function BaoCaoDetail({
  id,
  vaiTro,
  hoTen,
}: {
  id: string;
  vaiTro: "ADMIN" | "BAN_GIAM_DOC" | "TO_TRUONG" | "GIAO_VIEN";
  hoTen?: string;
}) {
  const { tuChoiBaoCao } = await import("./actions");
  const { duyetBaoCaoForm, pheDuyetBaoCaoForm } = await import("@/app/actions/crud");
  const bc = await db.baoCaoGVCN.findUnique({
    where: { id },
    include: { lopHoc: true },
  });
  if (!bc) return null;

  const laToTruong = vaiTro === "TO_TRUONG" || vaiTro === "ADMIN";
  const laBGD = vaiTro === "BAN_GIAM_DOC" || vaiTro === "ADMIN";

  return (
    <div className="px-5 pb-5 pt-3 mt-3 border-t border-gray-100 space-y-4">
      <div className="grid grid-cols-3 gap-4 text-sm">
        <Stat label="Sĩ số" value={`${bc.siSo ?? "—"}`} />
        <Stat label="Nghỉ có phép" value={`${bc.nghiCoPhep ?? "—"}`} />
        <Stat label="Nghỉ không phép" value={`${bc.nghiKoPhep ?? "—"}`} />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">Tình hình lớp</p>
        <p className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">
          {bc.noiDung || "(không có)"}
        </p>
      </div>
      {bc.deXuat && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Đề xuất</p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{bc.deXuat}</p>
        </div>
      )}
      {bc.nhanXet && bc.trangThai === "TU_CHOI" && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
          <strong>Nhận xét:</strong> {bc.nhanXet}
        </p>
      )}

      {/* Cấp 1 — Tổ trưởng */}
      {laToTruong && bc.trangThai === "CHO_DUYET" && (
        <div className="flex flex-wrap gap-2 items-start rounded-lg border border-amber-200 bg-amber-50/40 p-3">
          <span className="text-xs font-medium text-amber-800 w-full">
            Duyệt cấp tổ (bước 1/2)
          </span>
          <form action={duyetBaoCaoForm} className="flex flex-col gap-2 items-start">
            <input type="hidden" name="id" value={bc.id} />
            <button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
              ✓ Duyệt (cấp tổ)
            </button>
            <ChonViTriKy macDinh="center" tenNguoiKy={hoTen ?? "Chữ ký"} />
          </form>
          <form action={tuChoiBaoCao} className="flex flex-1 flex-wrap gap-2 min-w-[280px]">
            <input type="hidden" name="id" value={bc.id} />
            <input name="nhanXet" required placeholder="Lý do từ chối..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
              ✕ Từ chối
            </button>
          </form>
        </div>
      )}

      {/* Cấp 2 — BGĐ */}
      {laBGD && bc.trangThai === "CHO_BGD_DUYET" && (
        <div className="flex flex-wrap gap-2 items-start rounded-lg border border-purple-200 bg-purple-50/40 p-3">
          <span className="text-xs font-medium text-purple-700 w-full">
            Phê duyệt Ban Giám đốc (đã có chữ ký tổ trưởng ✓)
          </span>
          <form action={pheDuyetBaoCaoForm} className="flex flex-col gap-2 items-start">
            <input type="hidden" name="id" value={bc.id} />
            <button className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
              🖋 Phê duyệt (ký số cuối)
            </button>
            <ChonViTriKy macDinh="bottom-right" tenNguoiKy={hoTen ?? "Chữ ký"} />
          </form>
          <form action={tuChoiBaoCao} className="flex flex-1 flex-wrap gap-2 min-w-[280px]">
            <input type="hidden" name="id" value={bc.id} />
            <input name="nhanXet" required placeholder="Lý do từ chối..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
              ✕ Từ chối
            </button>
          </form>
        </div>
      )}

      {bc.ngayGui && (
        <p className="text-[11px] text-gray-400">
          Nộp lúc {formatDateTime(bc.ngayGui)}
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2">
      <p className="text-base font-bold text-gray-900">{value}</p>
      <p className="text-[11px] text-gray-500">{label}</p>
    </div>
  );
}

function FilterLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <a
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm border transition-colors ${
        active
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
      }`}
    >
      {label}
    </a>
  );
}
