import { chatGPTSignOutPath, getChatGPTUser } from "@/app/chatgpt-auth";
import { Clock3, LogOut } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PendingAccountPage() {
  const user = await getChatGPTUser();
  return <main className="grid min-h-screen place-items-center bg-slate-100 px-4"><section className="w-full max-w-lg rounded-3xl border bg-white p-8 text-center shadow-xl"><div className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-100 text-amber-700"><Clock3 className="size-8"/></div><h1 className="mt-5 text-2xl font-black">Tài khoản chưa được kích hoạt</h1><p className="mt-3 leading-7 text-slate-600">Email <strong>{user?.email ?? "đang đăng nhập"}</strong> chưa có trong danh sách tài khoản hoặc đã bị khóa. Vui lòng liên hệ quản trị viên nhà trường.</p><a href={chatGPTSignOutPath("/login")} target="_top" className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-5 font-semibold text-slate-700 hover:bg-slate-50"><LogOut className="size-4"/>Đăng xuất và đổi tài khoản</a></section></main>;
}
