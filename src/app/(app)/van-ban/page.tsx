import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { LABEL_DOI_TUONG } from "@/lib/utils";
import { PageHeader, Badge, EmptyState } from "@/components/ui";
import Link from "next/link";

const LOAI_LABEL: Record<string, string> = {
  CONG_VAN: "Công văn",
  QUYET_DINH: "Quyết định",
  KE_HOACH: "Kế hoạch",
  THONG_BAO: "Thông báo",
  KHAC: "Khác",
};

export default async function VanBanPage() {
  const session = await getSession();
  if (!session) return null;

  const duocXem =
    session.vaiTro === "ADMIN" || session.vaiTro === "BAN_GIAM_DOC";

  const ds = await db.vanBan.findMany({
    where: duocXem ? {} : { nguoiTaoId: session.userId },
    orderBy: { taoLuc: "desc" },
    include: {
      nguoiTao: true,
      toChuyenMon: true,
      xacNhans: true,
      tepTrinhKys: true,
    },
  });

  const mauLabel: Record<string, { label: string; color: string }> = {
    NHAP: { label: "Nháp", color: "bg-gray-100 text-gray-700" },
    DA_PHAT_HANH: { label: "Đã triển khai", color: "bg-green-100 text-green-800" },
    DA_DONG: { label: "Đã đóng", color: "bg-slate-200 text-slate-700" },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Triển khai văn bản"
        description={
          duocXem
            ? "Phát hành công văn, kế hoạch, quyết định... đến giáo viên và theo dõi xác nhận"
            : "Các văn bản bạn đã phát hành"
        }
      >
        <Link
          href="/van-ban/tao-moi"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Triển khai văn bản
        </Link>
      </PageHeader>

      {ds.length === 0 ? (
        <EmptyState message="Chưa có văn bản nào." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Số hiệu</th>
                <th className="px-4 py-3">Trích yếu</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3">Đối tượng</th>
                <th className="px-4 py-3">Hạn chót</th>
                <th className="px-4 py-3">Xác nhận</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {ds.map((vb) => (
                <tr key={vb.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                  <td className="px-4 py-3 font-mono text-xs">{vb.soHieu ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Link href={`/van-ban/${vb.id}`} className="font-medium text-blue-700 hover:underline">
                      {vb.trichYeu}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{LOAI_LABEL[vb.loaiVanBan]}</td>
                  <td className="px-4 py-3">
                    {LABEL_DOI_TUONG[vb.doiTuong]}
                    {vb.toChuyenMon ? ` · ${vb.toChuyenMon.ten}` : ""}
                  </td>
                  <td className="px-4 py-3">{formatDate(vb.hanChot)}</td>
                  <td className="px-4 py-3 font-medium">{vb.xacNhans.length} GV</td>
                  <td className="px-4 py-3">
                    <Badge
                      label={mauLabel[vb.trangThai].label}
                      color={mauLabel[vb.trangThai].color}
                    />
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
