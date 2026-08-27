import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { PageHeader, Badge, EmptyState, Card } from "@/components/ui";
import { xacNhanDoc } from "../van-ban/actions";

export default async function FormCuaToiPage({
  searchParams,
}: PageProps<"/form-cua-toi">) {
  const session = await getSession();
  if (!session) return null;

  const gv = await db.giaoVien.findFirst({
    where: { userId: session.userId },
    include: {
      lopChuNhiem: { include: { namHoc: true } },
    },
  });
  const laGVCN =
    !!gv && gv.lopChuNhiem.some((l) => l.namHoc.dangHoatDong);

  // ---- Forms được giao ----
  const forms = await db.mauBaoCao.findMany({
    where: { trangThai: { in: ["DA_PHAT_HANH", "DA_DONG"] } },
    orderBy: [{ hanChot: "asc" }, { phatHanhLuc: "desc" }],
    include: {
      nguoiTao: true,
      fields: true,
      phanHois: true,
    },
  });

  const formsNhanDuoc = forms.filter((m) => {
    switch (m.doiTuong) {
      case "TOAN_GV":
        return true;
      case "GVCN":
        return laGVCN;
      case "GVBM":
        return !!gv && !laGVCN;
      case "TO_CHUYEN_MON":
        return m.toChuyenMonId && gv?.toChuyenMonId === m.toChuyenMonId;
    }
  });

  const daNopMap = new Map<string, Date>();
  for (const m of formsNhanDuoc) {
    const ph = gv ? m.phanHois.find((p) => p.giaoVienId === gv.id) : null;
    if (ph) daNopMap.set(m.id, ph.guiLuc);
  }

  // ---- Văn bản triển khai được giao ----
  const vanBans = await db.vanBan.findMany({
    where: { trangThai: { in: ["DA_PHAT_HANH", "DA_DONG"] } },
    orderBy: { phatHanhLuc: "desc" },
    include: {
      nguoiTao: true,
      toChuyenMon: true,
      xacNhans: true,
      tepTrinhKys: true,
    },
  });

  const vbNhanDuoc = vanBans.filter((vb) => {
    switch (vb.doiTuong) {
      case "TOAN_GV":
        return true;
      case "GVCN":
        return laGVCN;
      case "GVBM":
        return !!gv && !laGVCN;
      case "TO_CHUYEN_MON":
        return vb.toChuyenMonId && gv?.toChuyenMonId === vb.toChuyenMonId;
    }
  });

  const daXacNhanMap = new Map<string, Date>();
  for (const vb of vbNhanDuoc) {
    const xn = gv ? vb.xacNhans.find((x) => x.giaoVienId === gv.id) : null;
    if (xn) daXacNhanMap.set(vb.id, xn.docLuc);
  }

  const homNay = new Date();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Việc được giao"
        description={
          gv
            ? `Giáo viên: ${gv.hoTen}`
            : "Tài khoản chưa liên kết hồ sơ giáo viên."
        }
      />

      {/* FORM BÁO CÁO */}
      <h2 className="text-lg font-semibold text-gray-800">📋 Form báo cáo ({formsNhanDuoc.length})</h2>
      {formsNhanDuoc.length === 0 ? (
        <EmptyState message="Hiện chưa có form báo cáo nào được gửi đến bạn." />
      ) : (
        <div className="space-y-3">
          {formsNhanDuoc.map((m) => {
            const daNop = daNopMap.has(m.id);
            const quaHan = m.hanChot && new Date(m.hanChot) < homNay && !daNop;
            return (
              <Card key={m.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/form-cua-toi/${m.id}`}
                      className="font-semibold text-blue-700 hover:underline"
                    >
                      {m.tieuDe}
                    </Link>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Người gửi: {m.nguoiTao.hoTen} · Hạn chót:{" "}
                      {formatDate(m.hanChot)} ·{" "}
                      <span className={daNop ? "" : ""}>{m.fields.length}</span>{" "}
                      trường dữ liệu
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {daNop ? (
                      <Badge label="✓ Đã nộp" color="bg-green-100 text-green-800" />
                    ) : quaHan ? (
                      <Badge label="Quá hạn" color="bg-red-100 text-red-700" />
                    ) : (
                      <Badge label="Chưa nộp" color="bg-amber-100 text-amber-800" />
                    )}
                    <Link
                      href={`/form-cua-toi/${m.id}`}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                        daNop
                          ? "border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {daNop ? "Xem / sửa" : "Điền form"}
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* VĂN BẢN TRIỂN KHAI */}
      <h2 className="text-lg font-semibold text-gray-800 pt-2">
        📄 Văn bản triển khai ({vbNhanDuoc.length})
      </h2>
      {vbNhanDuoc.length === 0 ? (
        <EmptyState message="Không có văn bản nào cần xác nhận." />
      ) : (
        <div className="space-y-3">
          {vbNhanDuoc.map((vb) => {
            const daDoc = daXacNhanMap.has(vb.id);
            const quaHan =
              vb.hanChot && new Date(vb.hanChot) < homNay && !daDoc;
            return (
              <Card key={vb.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">
                      {vb.soHieu && (
                        <span className="text-gray-400 mr-1">{vb.soHieu}/</span>
                      )}
                      {vb.trichYeu}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Người gửi: {vb.nguoiTao.hoTen}
                      {vb.hanChot ? ` · Hạn xác nhận: ${formatDate(vb.hanChot)}` : ""}
                      {vb.tepTrinhKys.length > 0 ? ` · ${vb.tepTrinhKys.length} file đính kèm` : ""}
                    </p>
                    {vb.noiDung && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-blue-600">
                          Xem nội dung
                        </summary>
                        <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-800">
                          {vb.noiDung}
                        </pre>
                      </details>
                    )}
                    {vb.tepTrinhKys.length > 0 && (
                      <ul className="mt-2 space-y-1.5">
                        {vb.tepTrinhKys.map((tep) => {
                          const ext = (tep.tenGoc.split(".").pop() ?? "").toLowerCase();
                          return (
                            <li key={tep.id} className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs text-gray-500">{tep.tenGoc}</span>
                              {(ext === "pdf" || ext === "docx") && (
                                <a
                                  href={`/file/xem/${tep.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-block rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                                >
                                  👁 Xem trực tuyến
                                </a>
                              )}
                              <a
                                href={`/api/tep/${tep.id}`}
                                className="inline-block rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                              >
                                ⬇ Tải về
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {daDoc ? (
                      <>
                        <Badge label="✓ Đã xác nhận" color="bg-green-100 text-green-800" />
                        <span className="text-[10px] text-gray-400">
                          {formatDate(daXacNhanMap.get(vb.id))}
                        </span>
                      </>
                    ) : (
                      <>
                        {quaHan && <Badge label="Quá hạn" color="bg-red-100 text-red-700" />}
                        <form action={xacNhanDoc}>
                          <input type="hidden" name="vanBanId" value={vb.id} />
                          <button className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700">
                            ✓ Tôi đã đọc và hiểu
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
