import { redirect } from "next/navigation";

export const metadata = { title: "Tra cứu chữ ký số" };

export default async function XacThucIndex({
  searchParams,
}: {
  searchParams: Promise<{ ma?: string }>;
}) {
  const { ma } = await searchParams;
  if (ma && ma.trim()) redirect(`/xac-thuc/${encodeURIComponent(ma.trim())}`);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
        <p className="text-5xl">🔍</p>
        <h1 className="mt-3 text-xl font-bold text-gray-900">Xác thực chữ ký số</h1>
        <p className="mt-2 text-sm text-gray-500">
          Nhập mã xác thực (8 ký tự) in trên văn bản để kiểm tra tính hợp lệ.
        </p>
        <form action="/xac-thuc" method="get" className="mt-6 flex gap-2">
          <input
            name="ma"
            required
            maxLength={12}
            placeholder="VD: 3F9A21C4"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="rounded-lg bg-slate-800 px-5 py-2.5 font-medium text-white hover:bg-slate-900">
            Tra cứu
          </button>
        </form>
      </div>
    </div>
  );
}
