import { chatGPTSignInPath } from "@/app/chatgpt-auth";
import LoginForm from "@/app/login/login-form";
import { LockKeyhole, School, ShieldCheck, UserRoundCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <main className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 px-4 py-10 text-white">
    <section className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 shadow-2xl backdrop-blur md:grid md:grid-cols-[1.1fr_.9fr]">
      <div className="p-7 md:p-12"><div className="mb-10 flex items-center gap-3"><div className="grid size-12 place-items-center rounded-2xl bg-cyan-400 font-black text-blue-950">CM</div><div><h1 className="text-xl font-bold">Quản lý chuyên môn</h1><p className="text-sm text-cyan-100">Trung tâm GDNN–GDTX Khu vực 1</p></div></div><h2 className="max-w-xl text-3xl font-black leading-tight md:text-5xl">Không gian làm việc chuyên môn thống nhất</h2><p className="mt-5 max-w-xl text-base leading-7 text-blue-100">Quản lý đội ngũ, lớp học, hồ sơ trình ký và thông báo trong một hệ thống bảo mật.</p><div className="mt-9 grid gap-3 text-sm text-cyan-50"><p className="flex items-center gap-3"><ShieldCheck className="size-5 text-cyan-300"/>Phân quyền Quản trị, Ban Giám đốc, Tổ trưởng, Giáo viên</p><p className="flex items-center gap-3"><LockKeyhole className="size-5 text-cyan-300"/>Tài khoản phải được quản trị viên tạo trước</p><p className="flex items-center gap-3"><School className="size-5 text-cyan-300"/>Dữ liệu lưu riêng trên hệ thống nhà trường</p></div></div>
      <div className="flex flex-col justify-center bg-white p-7 text-slate-900 md:p-12"><UserRoundCheck className="size-11 text-blue-700"/><h2 className="mt-5 text-2xl font-black">Đăng nhập hệ thống</h2><p className="mt-3 leading-7 text-slate-600">Dùng tên tài khoản và mật khẩu do quản trị viên nhà trường cấp.</p><LoginForm/><p className="mt-5 text-sm leading-6 text-slate-500">Nếu chưa có tài khoản hoặc quên mật khẩu, vui lòng liên hệ quản trị viên.</p><a href={chatGPTSignInPath("/thiet-lap-quan-tri")} target="_top" className="mt-4 text-center text-sm font-semibold text-blue-700 underline-offset-4 hover:underline">Thiết lập quản trị lần đầu</a></div>
    </section>
  </main>;
}
