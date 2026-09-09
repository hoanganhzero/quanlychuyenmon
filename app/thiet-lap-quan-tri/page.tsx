import { count, isNotNull } from "drizzle-orm";
import { chatGPTSignInPath, getChatGPTUser } from "@/app/chatgpt-auth";
import SetupForm from "@/app/thiet-lap-quan-tri/setup-form";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const owner = await getChatGPTUser();
  let configured = false;
  if (owner) {
    const [{ total }] = await getDb().select({ total: count() }).from(users).where(isNotNull(users.passwordHash));
    configured = Number(total) > 0;
  }
  return <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-10"><section className="w-full max-w-lg rounded-3xl border bg-white p-7 shadow-xl md:p-9"><div className="grid size-14 place-items-center rounded-2xl bg-blue-100 text-blue-700"><ShieldCheck className="size-7"/></div><h1 className="mt-5 text-2xl font-black text-slate-950">{configured ? "Tài khoản quản trị đã sẵn sàng" : "Thiết lập quản trị lần đầu"}</h1>{owner ? configured ? <><p className="mt-3 leading-7 text-slate-600">Tài khoản quản trị đã được tạo. Thầy có thể đăng nhập bằng tên tài khoản và mật khẩu vừa thiết lập.</p><a href="/login" className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-700 px-5 font-bold text-white hover:bg-blue-800">Đến trang đăng nhập</a></> : <><p className="mt-3 leading-7 text-slate-600">Chủ Site <strong>{owner.email}</strong> đang được xác minh. Hãy tạo thông tin đăng nhập riêng cho hệ thống nhà trường.</p><SetupForm defaultName={owner.displayName}/></> : <><p className="mt-3 leading-7 text-slate-600">Bước này chỉ dành cho chủ Site và chỉ thực hiện một lần.</p><a href={chatGPTSignInPath("/thiet-lap-quan-tri")} target="_top" className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-700 px-5 font-bold text-white hover:bg-blue-800">Xác nhận chủ Site bằng ChatGPT</a></>}</section></main>;
}
