import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { LABEL_VAI_TRO } from "@/lib/utils";
import {
  themGiaoVien,
  suaGiaoVien,
  taoTaiKhoanForm,
  datMatKhauForm,
  datVaiTroForm,
  datTenDangNhapForm,
} from "./actions";
import { xoaGiaoVienForm } from "@/app/actions/crud";
import { SubmitButton, DeleteButton } from "@/components/submit-button";
import { PageHeader, Badge, EmptyState } from "@/components/ui";

const toDateInput = (d: Date | null) =>
  d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "";

export default async function GiaoVienPage() {
  const session = await getSession();
  const isAdmin = session?.vaiTro === "ADMIN";

  const giaoViens = await db.giaoVien.findMany({
    orderBy: { maGV: "asc" },
    include: {
      toChuyenMon: true,
      user: true,
      lopChuNhiem: true,
    },
  });
  const tos = await db.toChuyenMon.findMany({ orderBy: { ten: "asc" } });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Danh sách giáo viên"
        description={`${giaoViens.length} giáo viên trong toàn trường`}
      />

      {isAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Thêm giáo viên mới</h2>
          <form action={themGiaoVien} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Mã GV *"><input name="maGV" required placeholder="GV005" className={cls} /></Field>
            <Field label="Họ và tên *"><input name="hoTen" required className={cls} /></Field>
            <Field label="Giới tính">
              <select name="gioiTinh" className={cls} defaultValue="nam">
                <option value="nam">Nam</option>
                <option value="nu">Nữ</option>
              </select>
            </Field>
            <Field label="Ngày sinh"><input type="date" name="ngaySinh" className={cls} /></Field>
            <Field label="Điện thoại"><input name="dienThoai" className={cls} /></Field>
            <Field label="Email liên hệ / tài khoản (tuỳ chọn)">
              <input type="email" name="email" placeholder="ten@truonghoc.edu.vn" className={cls} />
            </Field>
            <Field label="Tên tài khoản (tuỳ chọn)">
              <input name="tenDangNhap" placeholder="vd: lannt" pattern="[\w.\-]{3,30}" title="3-30 ký tự: chữ, số, . - _" className={cls} />
            </Field>
            <Field label="Mật khẩu đăng nhập (nếu tạo tài khoản)">
              <input type="text" name="matKhau" placeholder="Để trống = gv123456" minLength={6} className={cls} />
            </Field>
            <Field label="Chuyên môn đào tạo"><input name="chuyenMon" placeholder="Toán..." className={cls} /></Field>
            <Field label="Trình độ">
              <select name="trinhDo" className={cls}>
                <option value="">— Chọn —</option>
                <option>Đại học</option>
                <option>Cao đẳng</option>
                <option>Thạc sĩ</option>
                <option>Tiến sĩ</option>
              </select>
            </Field>
            <Field label="Tổ chuyên môn">
              <select name="toChuyenMonId" className={cls}>
                <option value="">— Chưa phân —</option>
                {tos.map((t) => (
                  <option key={t.id} value={t.id}>{t.ten}</option>
                ))}
              </select>
            </Field>
            <div className="col-span-2 md:col-span-4 flex items-center gap-3">
              <SubmitButton>Thêm giáo viên</SubmitButton>
              <p className="text-xs text-gray-400">
                Có email → tự tạo tài khoản với mật khẩu bạn nhập (mặc định gv123456)
              </p>
            </div>
          </form>
        </div>
      )}

      {giaoViens.length === 0 ? (
        <EmptyState message="Chưa có giáo viên nào." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Mã GV</th>
                <th className="px-4 py-3">Họ tên</th>
                <th className="px-4 py-3">Liên hệ</th>
                <th className="px-4 py-3">Tổ CM</th>
                <th className="px-4 py-3">Tài khoản & vai trò</th>
                {isAdmin && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {giaoViens.map((gv) => (
                <tr key={gv.id} className="border-b border-gray-50 hover:bg-gray-50/60 align-top">
                  <td className="px-4 py-3 font-mono text-xs">{gv.maGV}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {gv.hoTen}
                    <p className="text-xs text-gray-400">{gv.chuyenMon ?? "—"} · {gv.trinhDo ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <p>{gv.dienThoai ?? "—"}</p>
                    <p>{gv.email ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3">{gv.toChuyenMon?.ten ?? "—"}</td>
                  <td className="px-4 py-3">
                    {gv.user ? (
                      <div className="flex flex-col gap-1 items-start">
                        <Badge label={gv.user.email} color="bg-blue-100 text-blue-800" />
                        <Badge
                          label={gv.user.tenDangNhap ? `Tên TK: ${gv.user.tenDangNhap}` : "Chưa có tên tài khoản"}
                          color={gv.user.tenDangNhap ? "bg-teal-100 text-teal-800" : ""}
                        />
                        <Badge
                          label={LABEL_VAI_TRO[gv.user.vaiTro]}
                          color={
                            gv.user.vaiTro === "ADMIN"
                              ? "bg-red-100 text-red-800"
                              : gv.user.vaiTro === "TO_TRUONG"
                                ? "bg-emerald-100 text-emerald-800"
                                : gv.user.vaiTro === "BAN_GIAM_DOC"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-gray-100 text-gray-700"
                          }
                        />
                      </div>
                    ) : (
                      <Badge label="Chưa có tài khoản" />
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <details className="group">
                        <summary className="cursor-pointer list-none rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 inline-block">
                          ✎ Sửa
                        </summary>
                        <div className="mt-3 w-[520px] max-w-[80vw] rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
                          {/* Sửa hồ sơ */}
                          <form action={suaGiaoVien} className="grid grid-cols-2 gap-3">
                            <input type="hidden" name="id" value={gv.id} />
                            <F label="Họ tên *"><input name="hoTen" required defaultValue={gv.hoTen} className={clsS} /></F>
                            <F label="Giới tính">
                              <select name="gioiTinh" defaultValue={gv.gioiTinh ? "nam" : "nu"} className={clsS}>
                                <option value="nam">Nam</option>
                                <option value="nu">Nữ</option>
                              </select>
                            </F>
                            <F label="Ngày sinh">
                              <input type="date" name="ngaySinh" defaultValue={toDateInput(gv.ngaySinh)} className={clsS} />
                            </F>
                            <F label="Điện thoại">
                              <input name="dienThoai" defaultValue={gv.dienThoai ?? ""} className={clsS} />
                            </F>
                            <F label="Chuyên môn">
                              <input name="chuyenMon" defaultValue={gv.chuyenMon ?? ""} className={clsS} />
                            </F>
                            <F label="Trình độ">
                              <select name="trinhDo" defaultValue={gv.trinhDo ?? ""} className={clsS}>
                                <option value="">— Chọn —</option>
                                <option>Đại học</option>
                                <option>Cao đẳng</option>
                                <option>Thạc sĩ</option>
                                <option>Tiến sĩ</option>
                              </select>
                            </F>
                            <F label="Tổ chuyên môn">
                              <select name="toChuyenMonId" defaultValue={gv.toChuyenMonId ?? ""} className={clsS}>
                                <option value="">— Chưa phân —</option>
                                {tos.map((t) => (
                                  <option key={t.id} value={t.id}>{t.ten}</option>
                                ))}
                              </select>
                            </F>
                            <div className="col-span-2 flex justify-end gap-2">
                              <DeleteButton confirmText={`Xóa giáo viên ${gv.hoTen}?`}>Xóa GV</DeleteButton>
                              <SubmitButton>Lưu hồ sơ</SubmitButton>
                            </div>
                          </form>

                          {/* Quản lý tài khoản */}
                          {gv.user ? (
                            <div className="border-t border-blue-100 pt-3 grid grid-cols-2 gap-3">
                              <form action={datTenDangNhapForm} className="flex flex-col gap-2">
                                <input type="hidden" name="id" value={gv.id} />
                                <p className="text-xs font-medium text-gray-600">🪪 Tên tài khoản</p>
                                <input
                                  name="tenDangNhap"
                                  placeholder={gv.user.tenDangNhap ?? "Chưa có — vd: lannt"}
                                  defaultValue={gv.user.tenDangNhap ?? ""}
                                  pattern="[\w.\-]{3,30}"
                                  title="3-30 ký tự: chữ, số, . - _"
                                  className={clsS}
                                />
                                <button className="rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-xs text-teal-800 hover:bg-teal-100">
                                  Lưu tên tài khoản
                                </button>
                              </form>
                              <form action={datMatKhauForm} className="flex flex-col gap-2">
                                <input type="hidden" name="id" value={gv.id} />
                                <p className="text-xs font-medium text-gray-600">🔑 Đặt lại mật khẩu</p>
                                <input type="text" name="matKhau" placeholder="Mật khẩu mới (≥6 ký tự)" required minLength={6} className={clsS} />
                                <button className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800 hover:bg-amber-100">
                                  Đặt lại mật khẩu
                                </button>
                              </form>
                              <form action={datVaiTroForm} className="col-span-2 flex flex-col gap-2">
                                <input type="hidden" name="id" value={gv.id} />
                                <p className="text-xs font-medium text-gray-600">👤 Vai trò hiện tại: {LABEL_VAI_TRO[gv.user.vaiTro]}</p>
                                <div className="flex gap-2">
                                  <select name="vaiTro" defaultValue={gv.user.vaiTro} className={`${clsS} flex-1`}>
                                    <option value="GIAO_VIEN">Giáo viên</option>
                                    <option value="TO_TRUONG">Tổ trưởng chuyên môn</option>
                                    <option value="BAN_GIAM_DOC">Ban Giám đốc</option>
                                    <option value="ADMIN">Quản trị hệ thống</option>
                                  </select>
                                  <button className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs text-indigo-800 hover:bg-indigo-100 whitespace-nowrap">
                                    Cập nhật vai trò
                                  </button>
                                </div>
                              </form>
                            </div>
                          ) : (
                            <form action={taoTaiKhoanForm} className="border-t border-blue-100 pt-3 grid grid-cols-4 gap-2 items-end">
                              <input type="hidden" name="id" value={gv.id} />
                              <F label="Tên tài khoản *">
                                <input name="tenDangNhap" required pattern="[\w.\-]{3,30}" title="3-30 ký tự: chữ, số, . - _" placeholder="vd: lannt" className={clsS} />
                              </F>
                              <F label="Email *">
                                <input type="email" name="email" required defaultValue={gv.email ?? ""} className={clsS} />
                              </F>
                              <F label="Mật khẩu *">
                                <input type="text" name="matKhau" required minLength={6} defaultValue="gv123456" className={clsS} />
                              </F>
                              <button className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs text-emerald-800 hover:bg-emerald-100 h-[38px]">
                                + Tạo tài khoản
                              </button>
                            </form>
                          )}
                        </div>
                      </details>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

const F = Field;

const cls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

const clsS =
  "w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";
