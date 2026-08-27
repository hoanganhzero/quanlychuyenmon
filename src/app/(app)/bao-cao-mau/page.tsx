import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { LABEL_DOI_TUONG } from "@/lib/utils";
import { PageHeader, Badge, EmptyState } from "@/components/ui";
import Link from "next/link";

export default async function BaoCaoMauPage() {
  const session = await getSession();
  if (!session) return null;

  const duocXem =
    session.vaiTro === "ADMIN" || session.vaiTro === "BAN_GIAM_DOC";

  const maus = await db.mauBaoCao.findMany({
    where: duocXem ? {} : { nguoiTaoId: session.userId },
    orderBy: { taoLuc: "desc" },
    include: {
      nguoiTao: true,
      toChuyenMon: true,
      fields: true,
      phanHois: true,
    },
  });

  const mauLabel: Record<string, { label: string; color: string }> = {
    NHAP: { label: "Nháp", color: "bg-gray-100 text-gray-700" },
    DA_PHAT_HANH: { label: "Đã phát hành", color: "bg-green-100 text-green-800" },
    DA_DONG: { label: "Đã đóng", color: "bg-slate-200 text-slate-700" },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mẫu báo cáo (form)"
        description={
          duocXem
            ? "Toàn bộ form báo cáo trong trường"
            : "Các form bạn đã tạo"
        }
      >
        <Link
          href="/bao-cao-mau/tao-moi"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          🤖 Tạo từ Excel
        </Link>
      </PageHeader>

      {maus.length === 0 ? (
        <EmptyState message="Chưa có mẫu báo cáo nào. Hãy tải file Excel lên để AI tự tạo form." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Tiêu đề</th>
                <th className="px-4 py-3">Đối tượng</th>
                <th className="px-4 py-3">Số trường</th>
                <th className="px-4 py-3">Hạn chót</th>
                <th className="px-4 py-3">Phản hồi</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Người tạo</th>
              </tr>
            </thead>
            <tbody>
              {maus.map((m) => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <Link href={`/bao-cao-mau/${m.id}`} className="font-medium text-blue-700 hover:underline">
                      {m.tieuDe}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {LABEL_DOI_TUONG[m.doiTuong]}
                    {m.toChuyenMon ? ` · ${m.toChuyenMon.ten}` : ""}
                  </td>
                  <td className="px-4 py-3">{m.fields.length}</td>
                  <td className="px-4 py-3">{formatDate(m.hanChot)}</td>
                  <td className="px-4 py-3 font-medium">{m.phanHois.length}</td>
                  <td className="px-4 py-3">
                    <Badge label={mauLabel[m.trangThai].label} color={mauLabel[m.trangThai].color} />
                  </td>
                  <td className="px-4 py-3">{m.nguoiTao.hoTen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
