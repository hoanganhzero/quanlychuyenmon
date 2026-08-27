import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatDate, LABEL_TRANG_THAI, TRANG_THAI_BADGE } from "@/lib/utils";
import { luuBaoGiang, nopBaoGiangForm, duyetCapToForm, pheDuyetCuoiForm, duyetLoatForm } from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader, Badge, EmptyState, Card } from "@/components/ui";
import Link from "next/link";
import { one } from "@/lib/utils";

export default async function BaoGiangPage({
  searchParams,
}: PageProps<"/bao-giang">) {
  const { thang: thangRaw, nam: namRaw, gv: gvRaw, trangthai: ttRaw } =
    await searchParams;
  const thangParam = one(thangRaw);
  const namParam = one(namRaw);
  const gvFilter = one(gvRaw);
  const ttFilter = one(ttRaw);

  const session = await getSession();
  if (!session) return null;

  const quanLy = ["ADMIN", "BAN_GIAM_DOC", "TO_TRUONG"].includes(session.vaiTro);
  const laBGD = ["ADMIN", "BAN_GIAM_DOC"].includes(session.vaiTro);

  const homNay = new Date();
  const thang = Number(thangParam) || homNay.getMonth() + 1;
  const nam = Number(namParam) || homNay.getFullYear();
  const tuNgay = new Date(nam, thang - 1, 1);
  const denNgay = new Date(nam, thang, 0);

  // ---- Phần cá nhân (nếu có hồ sơ GV) ----
  const gvHienTai = await db.giaoVien.findFirst({
    where: { userId: session.userId },
  });

  const phanCongsCuaToi = gvHienTai
    ? await db.phanCong.findMany({
        where: { giaoVienId: gvHienTai.id, namHoc: { dangHoatDong: true } },
        include: { monHoc: true, lopHoc: true },
      })
    : [];

  const cuaToi = gvHienTai
    ? await db.baoGiang.findMany({
        where: {
          giaoVienId: gvHienTai.id,
          ngay: { gte: tuNgay, lte: denNgay },
        },
        orderBy: [{ ngay: "desc" }, { tietBatDau: "asc" }],
        include: { monHoc: true, lopHoc: true },
      })
    : [];

  // ---- Phần quản lý ----
  const layQuanLyRows = async () => {
    const where: Record<string, unknown> = {
      ngay: { gte: tuNgay, lte: denNgay },
    };
    if (gvFilter) where.giaoVienId = gvFilter;
    if (ttFilter) where.trangThai = ttFilter;
    if (session!.vaiTro === "TO_TRUONG") {
      const tt = await db.giaoVien.findFirst({ where: { userId: session!.userId } });
      where.giaoVien = { toChuyenMonId: tt?.toChuyenMonId ?? "__khongco__" };
    }
    return db.baoGiang.findMany({
      where,
      orderBy: [{ ngay: "desc" }, { tietBatDau: "asc" }],
      include: { giaoVien: true, monHoc: true, lopHoc: true },
    });
  };

  const [giaoViens] = await Promise.all([
    db.giaoVien.findMany({ orderBy: { hoTen: "asc" }, select: { id: true, hoTen: true } }),
  ]);
  const quanLyRows = quanLy ? await layQuanLyRows() : [];

  const dem = { CHO_DUYET: 0, CHO_BGD_DUYET: 0, DA_DUYET: 0, TU_CHOI: 0, NHAP: 0 };
  for (const r of quanLyRows) dem[r.trangThai]++;

  // Thống kê số tiết dạy từng GV (theo dữ liệu đang lọc)
  const tietTheoGV = new Map<string, { ten: string; soTiet: number; soBuoi: number }>();
  for (const r of quanLyRows) {
    const cur = tietTheoGV.get(r.giaoVienId) ?? { ten: r.giaoVien.hoTen, soTiet: 0, soBuoi: 0 };
    cur.soTiet += r.soTiet;
    cur.soBuoi += 1;
    tietTheoGV.set(r.giaoVienId, cur);
  }
  const thongKeGV = [...tietTheoGV.values()].sort((a, b) => b.soTiet - a.soTiet);
  const tongTiet = quanLyRows.reduce((s, r) => s + r.soTiet, 0);

  const cls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const lbl = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sổ báo giảng"
        description="Giáo viên ghi bài dạy hằng ngày — tổ trưởng và Ban Giám đốc duyệt ký"
      />

      {/* Bộ lọc tháng */}
      <form method="get" className="flex flex-wrap gap-4 items-end bg-white rounded-xl border border-gray-200 p-5">
        <div>
          <label className={lbl}>Tháng</label>
          <select name="thang" defaultValue={thang} className={cls}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((t) => (
              <option key={t} value={t}>Tháng {t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={lbl}>Năm</label>
          <input type="number" name="nam" defaultValue={nam} min={2020} max={2100} className={`${cls} w-28`} />
        </div>
        {quanLy && (
          <>
            <div className="w-56">
              <label className={lbl}>Giáo viên</label>
              <select name="gv" defaultValue={gvFilter ?? ""} className={cls}>
                <option value="">— Tất cả —</option>
                {giaoViens.map((g) => (
                  <option key={g.id} value={g.id}>{g.hoTen}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>Trạng thái</label>
              <select name="trangthai" defaultValue={ttFilter ?? ""} className={cls}>
                <option value="">— Tất cả —</option>
                <option value="NHAP">Nháp</option>
                <option value="CHO_DUYET">Chờ tổ duyệt</option>
                <option value="CHO_BGD_DUYET">Chờ BGĐ phê duyệt</option>
                <option value="DA_DUYET">Đã phê duyệt</option>
                <option value="TU_CHOI">Bị từ chối</option>
              </select>
            </div>
          </>
        )}
        <div className="flex gap-2">
          <a href={`/bao-giang/xuat-csv?thang=${thang}&nam=${nam}${gvFilter ? `&gv=${gvFilter}` : ""}${ttFilter ? `&trangThai=${ttFilter}` : ""}`}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            📊 Xuất Excel (CSV)
          </a>
          <a href={`/bao-giang/in?thang=${thang}&nam=${nam}${gvFilter ? `&gv=${gvFilter}` : ""}`}
            target="_blank"
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
            🖨 In / Lưu PDF
          </a>
        </div>
        <button type="submit" className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-800">
          Xem
        </button>
      </form>

      {/* ===== QUẢN LÝ (tổ trưởng / BGĐ) ===== */}
      {quanLy && (
        <Card title={`Quản lý báo giảng — tháng ${thang}/${nam} (${quanLyRows.length} bản ghi)`}>
          {/* Thống kê + duyệt hàng loạt */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <Stat label="Chờ tổ duyệt" value={dem.CHO_DUYET} color="text-amber-600" />
            <Stat label="Chờ BGĐ phê duyệt" value={dem.CHO_BGD_DUYET} color="text-purple-600" />
            <Stat label="Đã phê duyệt" value={dem.DA_DUYET} color="text-green-600" />
            <div className="ml-auto flex flex-wrap gap-2">
              {(session.vaiTro === "TO_TRUONG" || session.vaiTro === "ADMIN") && dem.CHO_DUYET > 0 && (
                <form action={duyetLoatForm}>
                  <input type="hidden" name="cap" value="TO" />
                  <button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                    ✓ Duyệt tất cả chờ cấp tổ ({dem.CHO_DUYET})
                  </button>
                </form>
              )}
              {laBGD && dem.CHO_BGD_DUYET > 0 && (
                <form action={duyetLoatForm}>
                  <input type="hidden" name="cap" value="BGD" />
                  <button className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
                    🖋 Phê duyệt tất cả ({dem.CHO_BGD_DUYET})
                  </button>
                </form>
              )}
            </div>
          </div>

          {quanLyRows.length === 0 ? (
            <EmptyState message="Không có bản ghi báo giảng nào phù hợp bộ lọc." />
          ) : (
            <div className="overflow-x-auto">
              {/* Thống kê số tiết từng GV */}
              <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <p className="mb-3 text-sm font-semibold text-gray-800">
                  📈 Thống kê số tiết dạy — tháng {thang}/{nam} (tổng {tongTiet} tiết)
                </p>
                <div className="flex flex-wrap gap-2">
                  {thongKeGV.map((tk) => (
                    <div key={tk.ten} className="rounded-lg border border-gray-200 bg-white px-3 py-2 min-w-[150px]">
                      <p className="text-xs text-gray-500 truncate max-w-[160px]" title={tk.ten}>{tk.ten}</p>
                      <p className="text-lg font-bold text-blue-700">{tk.soTiet} <span className="text-xs font-normal text-gray-400">tiết · {tk.soBuoi} lượt</span></p>
                    </div>
                  ))}
                </div>
              </div>

              <table className="w-full text-sm min-w-[820px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs uppercase tracking-wider text-gray-500">
                    <th className="px-3 py-2">Ngày</th>
                    <th className="px-3 py-2">Giáo viên</th>
                    <th className="px-3 py-2">Tiết</th>
                    <th className="px-3 py-2">Môn · Lớp</th>
                    <th className="px-3 py-2">Bài dạy</th>
                    <th className="px-3 py-2">Trạng thái</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {quanLyRows.map((bg) => (
                    <tr key={bg.id} className="border-b border-gray-50 hover:bg-gray-50/60 align-top">
                      <td className="px-3 py-2 whitespace-nowrap">{formatDate(bg.ngay)}</td>
                      <td className="px-3 py-2">{bg.giaoVien.hoTen}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {bg.tietBatDau}
                        {bg.soTiet > 1 ? `→${bg.tietBatDau + bg.soTiet - 1}` : ""}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {bg.monHoc.tenMon}
                        {bg.lopHoc ? ` · ${bg.lopHoc.ten}` : ""}
                      </td>
                      <td className="px-3 py-2 max-w-[220px] truncate">{bg.tenBaiDay}</td>
                      <td className="px-3 py-2">
                        <Badge
                          label={LABEL_TRANG_THAI[bg.trangThai]}
                          color={TRANG_THAI_BADGE[bg.trangThai]}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-1.5">
                          <Link href={`/bao-giang/${bg.id}`} className="text-xs text-blue-600 hover:underline">
                            Chi tiết →
                          </Link>
                          {session.vaiTro !== "BAN_GIAM_DOC" && bg.trangThai === "CHO_DUYET" && (
                            <form action={duyetCapToForm}>
                              <input type="hidden" name="id" value={bg.id} />
                              <button className="rounded-md bg-green-50 border border-green-200 px-2 py-0.5 text-xs text-green-700 hover:bg-green-100">
                                ✓ Duyệt tổ
                              </button>
                            </form>
                          )}
                          {laBGD && bg.trangThai === "CHO_BGD_DUYET" && (
                            <form action={pheDuyetCuoiForm}>
                              <input type="hidden" name="id" value={bg.id} />
                              <button className="rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 text-xs text-purple-700 hover:bg-purple-100">
                                🖋 Phê duyệt
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ===== CÁ NHÂN (giáo viên) ===== */}
      {gvHienTai && (
        <>
          <Card title="📝 Ghi báo giảng nhanh">
            <form action={luuBaoGiang} className="grid grid-cols-2 md:grid-cols-6 gap-4 items-end">
              <F label="Ngày *">
                <input type="date" name="ngay" required defaultValue={`${nam}-${String(thang).padStart(2, "0")}-01`} className={cls} />
              </F>
              <F label="Tiết BD *">
                <select name="tietBatDau" defaultValue="1" className={cls}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </F>
              <F label="Số tiết *">
                <select name="soTiet" defaultValue="1" className={cls}>
                  {[1, 2, 3, 4].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </F>
              <F label="Môn *">
                <select name="monHocId" required defaultValue="" className={cls}>
                  <option value="" disabled>— Chọn —</option>
                  {[...new Map(phanCongsCuaToi.map((pc) => [pc.monHocId, pc.monHoc])).values()].map((m) => (
                    <option key={m.id} value={m.id}>{m.tenMon}</option>
                  ))}
                </select>
              </F>
              <F label="Lớp">
                <select name="lopHocId" className={cls}>
                  <option value="">— Không —</option>
                  {[...new Map(phanCongsCuaToi.filter((pc) => pc.lopHoc).map((pc) => [pc.lopHocId!, pc.lopHoc!])).values()].map((l) => (
                    <option key={l.id} value={l.id}>{l.ten}</option>
                  ))}
                </select>
              </F>
              <F label="Tên bài dạy *">
                <input name="tenBaiDay" required placeholder="Bài 12: ..." className={cls} />
              </F>
              <div className="col-span-2 md:col-span-6 flex flex-wrap items-center gap-3">
                <button type="submit" name="guiDuyet" value="0"
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Lưu nháp
                </button>
                <button type="submit" name="guiDuyet" value="1"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  Lưu &amp; nộp trình ký
                </button>
                <input name="ghiChu" placeholder="Ghi chú (HS vắng, sự cố...)..." className={`${cls} flex-1 min-w-[200px]`} />
              </div>
            </form>
          </Card>

          <Card title={`Sổ của tôi — tháng ${thang}/${nam} (${cuaToi.length})`}>
            {cuaToi.length === 0 ? (
              <EmptyState message="Bạn chưa ghi báo giảng nào trong tháng này." />
            ) : (
              <ul className="divide-y divide-gray-100">
                {cuaToi.map((bg) => (
                  <li key={bg.id} className="py-2.5 flex flex-wrap items-center gap-3">
                    <span className="w-20 text-sm font-medium">{formatDate(bg.ngay)}</span>
                    <span className="w-16 text-xs text-gray-500">T{bg.tietBatDau}{bg.soTiet > 1 ? `→${bg.tietBatDau + bg.soTiet - 1}` : ""}</span>
                    <span className="text-sm">{bg.monHoc.tenMon}{bg.lopHoc ? ` · ${bg.lopHoc.ten}` : ""}</span>
                    <Link href={`/bao-giang/${bg.id}`} className="text-sm text-blue-700 hover:underline truncate max-w-[280px]">
                      {bg.tenBaiDay}
                    </Link>
                    <Badge label={LABEL_TRANG_THAI[bg.trangThai]} color={TRANG_THAI_BADGE[bg.trangThai]} />
                    {(bg.trangThai === "NHAP" || bg.trangThai === "TU_CHOI") && (
                      <form action={nopBaoGiangForm} className="ml-auto">
                        <input type="hidden" name="id" value={bg.id} />
                        <button className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-100">
                          Nộp
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}

      {!gvHienTai && !quanLy && (
        <EmptyState message="Tài khoản chưa liên kết hồ sơ giáo viên." />
      )}
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-gray-200 px-4 py-2">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-[11px] text-gray-500">{label}</p>
    </div>
  );
}
