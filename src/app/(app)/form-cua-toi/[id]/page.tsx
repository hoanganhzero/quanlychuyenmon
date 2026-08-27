import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { nopForm } from "../actions";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader, Badge, EmptyState, Card } from "@/components/ui";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function DienFormPage({
  params,
}: PageProps<"/form-cua-toi/[id]">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const gv = await db.giaoVien.findFirst({ where: { userId: session.userId } });
  if (!gv) {
    return (
      <div className="space-y-6">
        <PageHeader title="Điền form" />
        <EmptyState message="Tài khoản chưa liên kết hồ sơ giáo viên." />
      </div>
    );
  }

  const mau = await db.mauBaoCao.findUnique({
    where: { id },
    include: {
      nguoiTao: true,
      fields: { orderBy: { thuTu: "asc" } },
    },
  });
  if (!mau || mau.trangThai === "NHAP") notFound();

  const phanHoi = await db.phanHoiBaoCao.findUnique({
    where: { mauBaoCaoId_giaoVienId: { mauBaoCaoId: id, giaoVienId: gv.id } },
    include: { giaTris: true },
  });

  const giaTriMap = new Map<string, string>();
  for (const g of phanHoi?.giaTris ?? []) {
    giaTriMap.set(g.fieldId, g.giaTri ?? "");
  }

  const daDong = mau.trangThai === "DA_DONG";
  const quaHan = mau.hanChot && new Date(mau.hanChot) < new Date();

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const lbl = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/form-cua-toi" className="text-sm text-blue-600 hover:underline">
        ← Việc được giao
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{mau.tieuDe}</h1>
          {mau.moTa && (
            <p className="mt-1 text-sm text-gray-500 whitespace-pre-wrap">{mau.moTa}</p>
          )}
          <p className="mt-2 text-xs text-gray-400">
            Người gửi: {mau.nguoiTao.hoTen} · Hạn chót: {formatDate(mau.hanChot)}
          </p>
        </div>
        {daDong ? (
          <Badge label="Đã đóng" color="bg-slate-200 text-slate-700" />
        ) : phanHoi ? (
          <Badge label="✓ Đã nộp" color="bg-green-100 text-green-800" />
        ) : quaHan ? (
          <Badge label="Quá hạn" color="bg-red-100 text-red-700" />
        ) : null}
      </div>

      {daDong && !phanHoi ? (
        <EmptyState message="Form đã đóng, không nhận phản hồi nữa." />
      ) : (
        <Card>
          <form action={nopForm} className="space-y-5">
            <input type="hidden" name="mauBaoCaoId" value={id} />

            {mau.fields.map((f, i) => {
              const val = giaTriMap.get(f.id) ?? "";
              return (
                <div key={f.id}>
                  <label className={lbl}>
                    <span className="text-gray-400 mr-1">{i + 1}.</span>
                    {f.tenTruong}
                    {f.batBuoc && <span className="text-red-500"> *</span>}
                    {f.kieuDuLieu !== "TEXT" && f.kieuDuLieu !== "VAN_BAN_DAI" && (
                      <span className="ml-1.5 text-[10px] uppercase text-gray-300">
                        {f.kieuDuLieu}
                      </span>
                    )}
                  </label>

                  {f.kieuDuLieu === "VAN_BAN_DAI" && (
                    <textarea
                      name={`f_${f.id}`}
                      rows={4}
                      defaultValue={val}
                      required={f.batBuoc}
                      disabled={daDong}
                      className={inputCls}
                    />
                  )}
                  {f.kieuDuLieu === "CHON" && (
                    <select
                      name={`f_${f.id}`}
                      defaultValue={val}
                      required={f.batBuoc}
                      disabled={daDong}
                      className={inputCls}
                    >
                      <option value="">— Chọn —</option>
                      {(f.luaChon ?? "")
                        .split("|")
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((op) => (
                          <option key={op} value={op}>
                            {op}
                          </option>
                        ))}
                      {/* giữ giá trị cũ nếu ngoài danh sách */}
                      {val && !(f.luaChon ?? "").includes(val) && (
                        <option value={val}>{val}</option>
                      )}
                    </select>
                  )}
                  {f.kieuDuLieu === "NGAY" && (
                    <input
                      type="date"
                      name={`f_${f.id}`}
                      defaultValue={val.slice(0, 10)}
                      required={f.batBuoc}
                      disabled={daDong}
                      className={inputCls}
                    />
                  )}
                  {f.kieuDuLieu === "SO" && (
                    <input
                      type="number"
                      step="any"
                      name={`f_${f.id}`}
                      defaultValue={val}
                      required={f.batBuoc}
                      disabled={daDong}
                      className={inputCls}
                    />
                  )}
                  {(f.kieuDuLieu === "TEXT") && (
                    <input
                      type="text"
                      name={`f_${f.id}`}
                      defaultValue={val}
                      required={f.batBuoc}
                      disabled={daDong}
                      className={inputCls}
                    />
                  )}
                </div>
              );
            })}

            {!daDong && (
              <div className="flex items-center gap-3 pt-2">
                <SubmitButton>
                  {phanHoi ? "Cập nhật phản hồi" : "Nộp form"}
                </SubmitButton>
                {phanHoi && (
                  <span className="text-xs text-gray-400">
                    Bạn đã nộp — có thể nộp lại để cập nhật.
                  </span>
                )}
              </div>
            )}
          </form>
        </Card>
      )}
    </div>
  );
}
