import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  LABEL_LOAI_KE_HOACH,
  LABEL_TRANG_THAI,
  TRANG_THAI_BADGE,
  formatDateTime,
  one,
} from "@/lib/utils";
import Link from "next/link";
import { PageHeader, Badge, EmptyState } from "@/components/ui";

export default async function GiaoAnPage({
  searchParams,
}: PageProps<"/giao-an">) {
  const { trangthai: ttRaw, cuatoi: cuaToiRaw } = await searchParams;
  const ttFilter = one(ttRaw);
  const cuaToi = one(cuaToiRaw);
  const session = await getSession();

  const gv = session
    ? await db.giaoVien.findFirst({ where: { userId: session.userId } })
    : null;
  const laQuanLy =
    session?.vaiTro === "ADMIN" || session?.vaiTro === "TO_TRUONG";

  const giaoAns = await db.giaoAn.findMany({
    where: {
      ...(ttFilter
        ? {
            trangThai: ttFilter as
              | "NHAP"
              | "CHO_DUYET"
              | "CHO_BGD_DUYET"
              | "DA_DUYET"
              | "TU_CHOI",
          }
        : {}),
      ...(cuaToi && gv ? { giaoVienId: gv.id } : {}),
      ...(laQuanLy ? {} : { giaoVienId: gv?.id ?? "__khongco__" }),
    },
    orderBy: { capNhatLuc: "desc" },
    include: {
      giaoVien: true,
      monHoc: true,
      lopHoc: true,
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Giáo án & Kế hoạch dạy học">
        <Link
          href="/giao-an/tao-moi"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Soạn mới
        </Link>
      </PageHeader>

      {/* Bộ lọc */}
      <div className="flex flex-wrap gap-2">
        <FilterLink href="/giao-an" active={!ttFilter && !cuaToi} label="Tất cả" />
        <FilterLink href="/giao-an?trangthai=CHO_DUYET" active={ttFilter === "CHO_DUYET"} label="Chờ tổ duyệt" />
        <FilterLink href="/giao-an?trangthai=CHO_BGD_DUYET" active={ttFilter === "CHO_BGD_DUYET"} label="Chờ BGĐ phê duyệt" />
        <FilterLink href="/giao-an?trangthai=DA_DUYET" active={ttFilter === "DA_DUYET"} label="Đã phê duyệt" />
        <FilterLink href="/giao-an?trangthai=TU_CHOI" active={ttFilter === "TU_CHOI"} label="Bị từ chối" />
        {gv && (
          <FilterLink href="/giao-an?cuatoi=1" active={cuaToi === "1"} label="Của tôi" />
        )}
      </div>

      {giaoAns.length === 0 ? (
        <EmptyState message="Không có giáo án nào phù hợp." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Tiêu đề</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3">Môn / Lớp</th>
                <th className="px-4 py-3">Người soạn</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Cập nhật</th>
              </tr>
            </thead>
            <tbody>
              {giaoAns.map((ga) => (
                <tr key={ga.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <Link href={`/giao-an/${ga.id}`} className="font-medium text-blue-700 hover:underline">
                      {ga.tieuDe}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{LABEL_LOAI_KE_HOACH[ga.loai]}</td>
                  <td className="px-4 py-3">
                    {ga.monHoc.tenMon}
                    {ga.lopHoc ? ` · ${ga.lopHoc.ten}` : ""}
                  </td>
                  <td className="px-4 py-3">{ga.giaoVien.hoTen}</td>
                  <td className="px-4 py-3">
                    <Badge
                      label={LABEL_TRANG_THAI[ga.trangThai]}
                      color={TRANG_THAI_BADGE[ga.trangThai]}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {formatDateTime(ga.capNhatLuc)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterLink({ href, label, active }: { href: string; label: string; active: boolean }) {
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
