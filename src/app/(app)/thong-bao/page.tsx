import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatDateTime } from "@/lib/utils";
import { daDocForm, docHetForm, xoaHetForm } from "./actions";
import { PageHeader, EmptyState } from "@/components/ui";

const ICON: Record<string, string> = {
  "✅": "border-emerald-200 bg-emerald-50/50",
  "❌": "border-red-200 bg-red-50/50",
};

export default async function ThongBaoPage() {
  const session = await getSession();
  if (!session) return null;

  const danhSach = await db.thongBao.findMany({
    where: { userId: session.userId },
    orderBy: { taoLuc: "desc" },
    take: 100,
  });
  const chuaDoc = danhSach.filter((t) => !t.daDoc).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Thông báo"
        description={chuaDoc > 0 ? `${chuaDoc} thông báo chưa đọc` : "Bạn đã đọc hết thông báo"}
      />

      {danhSach.length > 0 && (
        <div className="flex gap-2">
          {chuaDoc > 0 && (
            <form action={docHetForm}>
              <button className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100">
                Đánh dấu tất cả đã đọc
              </button>
            </form>
          )}
          <form action={xoaHetForm}>
            <button className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100">
              Xóa tất cả
            </button>
          </form>
        </div>
      )}

      {danhSach.length === 0 ? (
        <EmptyState message="Chưa có thông báo nào." />
      ) : (
        <ul className="space-y-2">
          {danhSach.map((t) => {
            const icon = Object.keys(ICON).find((k) => t.tieuDe.startsWith(k)) ?? "";
            return (
              <li
                key={t.id}
                className={`rounded-xl border p-4 flex items-start gap-3 ${
                  t.daDoc ? "border-gray-200 bg-white opacity-70" : icon ? ICON[icon] : "border-blue-200 bg-blue-50/40"
                }`}
              >
                {!t.daDoc && <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${t.daDoc ? "text-gray-500" : "font-semibold text-gray-900"}`}>
                    {t.tieuDe}
                  </p>
                  {t.noiDung && (
                    <p className="text-xs text-gray-600 mt-0.5 break-words">{t.noiDung}</p>
                  )}
                  <p className="text-[11px] text-gray-400 mt-1">{formatDateTime(t.taoLuc)}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {t.lienKet && (
                    <a
                      href={t.lienKet}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      Mở →
                    </a>
                  )}
                  {!t.daDoc && (
                    <form action={daDocForm}>
                      <input type="hidden" name="id" value={t.id} />
                      <button className="text-[11px] text-gray-400 hover:text-gray-700">Đã đọc</button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
