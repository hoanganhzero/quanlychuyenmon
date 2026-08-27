import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { LABEL_VAI_TRO } from "@/lib/utils";
import { dangXuat } from "@/app/actions/auth";
import Sidebar from "@/components/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const soChuaDoc = await db.thongBao.count({
    where: { userId: session.userId, daDoc: false },
  });

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex md:w-64 md:flex-col bg-slate-800 shrink-0">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
            QL
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">
              Quản lý chuyên môn
            </p>
            <p className="text-slate-400 text-xs">Trường học</p>
          </div>
        </div>
        <Sidebar vaiTro={session.vaiTro} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="md:hidden" />
          <div />
          <div className="flex items-center gap-4">
            {/* Chuông thông báo */}
            <a
              href="/thong-bao"
              className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors"
              title="Thông báo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3A6 6 0 006 11v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {soChuaDoc > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {soChuaDoc > 9 ? "9+" : soChuaDoc}
                </span>
              )}
            </a>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {session.hoTen}
              </p>
              <p className="text-xs text-gray-500">
                {LABEL_VAI_TRO[session.vaiTro]}
              </p>
            </div>
            <form action={dangXuat}>
              <button
                type="submit"
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Đăng xuất
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 p-6 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
