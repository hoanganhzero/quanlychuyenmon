import { readFile } from "fs/promises";
import { db } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { duongDanTep, formatKichThuoc } from "@/lib/upload";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";

export default async function XemFilePage({
  params,
}: PageProps<"/file/xem/[id]">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const tep = await db.tepTrinhKy.findUnique({
    where: { id },
    include: {
      vanBan: true,
      giaoAn: true,
      baoCao: { include: { lopHoc: true } },
    },
  });
  if (!tep) notFound();

  const tenHienThi =
    tep.vanBan?.trichYeu ??
    tep.giaoAn?.tieuDe ??
    (tep.baoCao
      ? `Báo cáo GVCN tháng ${tep.baoCao.thang} — lớp ${tep.baoCao.lopHoc.ten}`
      : tep.tenGoc);

  const ext = (tep.tenGoc.split(".").pop() ?? "").toLowerCase();
  const buffer = await readFile(duongDanTep(tep.tenLuu));

  let html = "";
  if (ext === "docx") {
    try {
      const mammoth = await import("mammoth");
      const ketQua = await mammoth.convertToHtml({ buffer });
      html = ketQua.value;
    } catch {
      html = "";
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Thanh công cụ */}
      <header className="bg-slate-800 text-white px-5 py-3 flex flex-wrap items-center gap-4 sticky top-0 z-10">
        <a href="javascript:history.back()" className="text-sm text-slate-300 hover:text-white">
          ← Quay lại
        </a>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{tep.tenGoc}</p>
          <p className="text-xs text-slate-400 truncate">
            {tenHienThi} · {formatKichThuoc(tep.kichThuoc)}
          </p>
        </div>
        <a
          href={`/api/tep/${tep.id}`}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium"
        >
          ⬇ Tải về
        </a>
      </header>

      {/* Nội dung */}
      <main className="flex-1 p-4 md:p-8">
        {ext === "pdf" && (
          <iframe
            src={`/api/tep/${tep.id}?inline=1`}
            title={tep.tenGoc}
            className="w-full h-[calc(100vh-120px)] min-h-[500px] rounded-xl border border-gray-300 bg-white shadow-lg"
          />
        )}

        {ext === "docx" &&
          (html ? (
            <article
              className="mx-auto max-w-[820px] bg-white rounded-xl shadow-lg border border-gray-200 px-10 py-12 docx-preview"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <KhongXemDuoc />
          ))}

        {(ext === "doc" || !["pdf", "docx"].includes(ext)) && (
          <div className="max-w-md mx-auto mt-16 bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-4xl mb-3">📄</p>
            <h2 className="font-semibold text-gray-900 mb-1">
              Không xem trước được định dạng .{ext}
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Hãy tải file về để mở bằng phần mềm Word trên máy tính.
            </p>
            <a
              href={`/api/tep/${tep.id}`}
              className="inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              ⬇ Tải file về
            </a>
          </div>
        )}
      </main>
    </div>
  );
}

function KhongXemDuoc() {
  return (
    <div className="max-w-md mx-auto mt-16 bg-white rounded-xl border border-gray-200 p-8 text-center">
      <p className="text-sm text-gray-500 mb-5">
        Không đọc được nội dung file này.
      </p>
    </div>
  );
}
