import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import Link from "next/link";

export default async function TongQuanPage() {
  const session = await getSession();
  if (!session) return null;

  const laQuanLy = ["ADMIN", "BAN_GIAM_DOC", "TO_TRUONG"].includes(session.vaiTro);

  const namHocHienTai = await db.namHoc.findFirst({
    where: { dangHoatDong: true },
    include: { hocKys: true },
  });

  // ===== Dashboard cho GIÁO VIÊN: công việc cá nhân =====
  if (!laQuanLy) {
    const gv = await db.giaoVien.findFirst({
      where: { userId: session.userId },
      include: { lopChuNhiem: true },
    });
    const homNay = new Date();
    const tuNgay = new Date(homNay.getFullYear(), homNay.getMonth(), 1);
    const denNgay = new Date(homNay.getFullYear(), homNay.getMonth() + 1, 0);

    const [baoGiangThang, giaoAnCuaToi] = gv
      ? await Promise.all([
          db.baoGiang.aggregate({
            where: { giaoVienId: gv.id, ngay: { gte: tuNgay, lte: denNgay } },
            _sum: { soTiet: true },
          }),
          db.giaoAn.findMany({
            where: { giaoVienId: gv.id },
            orderBy: { capNhatLuc: "desc" },
            take: 5,
          }),
        ])
      : [{ _sum: { soTiet: null } }, []];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Xin chào, {session.hoTen} 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {namHocHienTai ? `Năm học ${namHocHienTai.ten}` : "Chưa có năm học hoạt động"}
            {gv?.lopChuNhiem.length ? ` · Chủ nhiệm ${gv.lopChuNhiem.map((l) => l.ten).join(", ")}` : ""}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-3xl font-bold text-blue-700">{baoGiangThang._sum.soTiet ?? 0}</p>
            <p className="text-sm text-gray-500">Tiết đã dạy trong tháng</p>
          </div>
          <Link href="/bao-giang" className="group bg-blue-600 rounded-xl p-5 text-white hover:bg-blue-700 transition-colors">
            <p className="text-lg font-semibold">📝 Sổ báo giảng</p>
            <p className="text-sm opacity-80">Ghi bài dạy hằng ngày →</p>
          </Link>
          <Link href="/giao-an" className="group bg-slate-800 rounded-xl p-5 text-white hover:bg-slate-900 transition-colors">
            <p className="text-lg font-semibold">📚 Giáo án & kế hoạch</p>
            <p className="text-sm opacity-80">Trình ký tổ trưởng / BGĐ →</p>
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Giáo án gần đây của bạn</h2>
          {giaoAnCuaToi.length === 0 ? (
            <p className="text-sm text-gray-400">Bạn chưa soạn giáo án nào. <Link href="/giao-an" className="text-blue-600 hover:underline">Soạn ngay →</Link></p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {giaoAnCuaToi.map((ga) => (
                <li key={ga.id} className="py-2 flex items-center justify-between gap-3">
                  <Link href={`/giao-an/${ga.id}`} className="text-sm text-gray-800 hover:text-blue-700 truncate">
                    {ga.tieuDe}
                  </Link>
                  <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                    ga.trangThai === "DA_DUYET" ? "bg-green-100 text-green-700"
                    : ga.trangThai === "TU_CHOI" ? "bg-red-100 text-red-700"
                    : ga.trangThai === "NHAP" ? "bg-gray-100 text-gray-600"
                    : "bg-amber-100 text-amber-700"
                  }`}>
                    {ga.trangThai === "DA_DUYET" ? "Đã duyệt" : ga.trangThai === "TU_CHOI" ? "Bị từ chối" : ga.trangThai === "NHAP" ? "Nháp" : "Đang chờ duyệt"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/diem" className="rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-300 hover:shadow-md transition-all">
            <p className="font-medium text-gray-900">📊 Nhập điểm số</p>
          </Link>
          <Link href="/chu-ky-cua-toi" className="rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-300 hover:shadow-md transition-all">
            <p className="font-medium text-gray-900">✍️ Chữ ký của tôi</p>
          </Link>
          <Link href="/form-cua-toi" className="rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-300 hover:shadow-md transition-all">
            <p className="font-medium text-gray-900">📋 Việc được giao</p>
          </Link>
        </div>
      </div>
    );
  }

  // ===== Dashboard cho QUẢN LÝ =====
  const [soGiaoVien, soLopHoc, soHocSinh, soMonHoc, giaoAnChoDuyet, baoCaoChoDuyet, baoGiangChoTo] =
    await Promise.all([
      db.giaoVien.count(),
      db.lopHoc.count({ where: namHocHienTai ? { namHocId: namHocHienTai.id } : {} }),
      db.hocSinh.count({ where: { trangThai: "DANG_HOC" } }),
      db.monHoc.count(),
      db.giaoAn.count({ where: { trangThai: { in: ["CHO_DUYET", "CHO_BGD_DUYET"] } } }),
      db.baoCaoGVCN.count({ where: { trangThai: { in: ["CHO_DUYET", "CHO_BGD_DUYET"] } } }),
      db.baoGiang.count({ where: { trangThai: { in: ["CHO_DUYET", "CHO_BGD_DUYET"] } } }),
    ]);

  const cards = [
    { label: "Giáo viên", value: soGiaoVien, href: "/giao-vien", color: "bg-blue-500" },
    { label: "Lớp học (năm hiện tại)", value: soLopHoc, href: "/lop-hoc", color: "bg-emerald-500" },
    { label: "Học sinh đang học", value: soHocSinh, href: "/hoc-sinh", color: "bg-violet-500" },
    { label: "Môn học", value: soMonHoc, href: "/mon-hoc", color: "bg-amber-500" },
    { label: "Giáo án chờ duyệt", value: giaoAnChoDuyet, href: "/giao-an", color: "bg-rose-500" },
    { label: "Sổ báo giảng chờ ký", value: baoGiangChoTo, href: "/bao-giang", color: "bg-indigo-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Xin chào, {session.hoTen} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {namHocHienTai
            ? `Năm học hiện tại: ${namHocHienTai.ten}`
            : "Chưa có năm học nào được kích hoạt — hãy thêm trong mục Năm học."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg ${c.color} opacity-90 group-hover:opacity-100`} />
              <div>
                <p className="text-2xl font-bold text-gray-900">{c.value}</p>
                <p className="text-sm text-gray-500">{c.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Học kỳ đang chạy</h2>
          {namHocHienTai?.hocKys.find((hk) => hk.dangChay) ? (
            <p className="text-gray-700">
              {namHocHienTai.hocKys.find((hk) => hk.dangChay)?.ten} — năm học{" "}
              {namHocHienTai.ten}
            </p>
          ) : (
            <p className="text-sm text-gray-400">
              Chưa kích hoạt học kỳ nào.
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Việc cần xử lý</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/giao-an" className="text-blue-600 hover:underline">
                • Duyệt {giaoAnChoDuyet} giáo án đang chờ
              </Link>
            </li>
            <li>
              <Link href="/bao-giang" className="text-blue-600 hover:underline">
                • Ký {baoGiangChoTo} bản ghi sổ báo giảng đang chờ
              </Link>
            </li>
            <li>
              <Link href="/bao-cao-gvcn" className="text-blue-600 hover:underline">
                • Xem {baoCaoChoDuyet} báo cáo GVCN chờ duyệt
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
