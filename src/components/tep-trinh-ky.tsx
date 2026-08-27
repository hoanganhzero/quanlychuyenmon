import type { TepTrinhKy } from "@prisma/client";
import { formatKichThuoc } from "@/lib/upload";

function IconFile({ ext }: { ext: string }) {
  const color =
    ext === "pdf" ? "bg-red-500" : ext === "docx" ? "bg-blue-500" : "bg-blue-600";
  return (
    <div
      className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center text-white text-[10px] font-bold uppercase shrink-0`}
    >
      {ext || "file"}
    </div>
  );
}

export function DanhSachTep({
  teps,
  coTheThayThe = false,
}: {
  teps: TepTrinhKy[];
  coTheThayThe?: boolean;
}) {
  if (teps.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic">Chưa có file đính kèm.</p>
    );
  }
  return (
    <ul className="space-y-2">
      {teps.map((tep) => {
        const ext = (tep.tenGoc.split(".").pop() ?? "").toLowerCase();
        return (
          <li
            key={tep.id}
            className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50"
          >
            <IconFile ext={ext} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {tep.tenGoc}
              </p>
              <p className="text-xs text-gray-400">
                {formatKichThuoc(tep.kichThuoc)} ·{" "}
                {new Date(tep.taiLuc).toLocaleDateString("vi-VN")}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {ext === "pdf" || ext === "docx" ? (
                <a
                  href={`/file/xem/${tep.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                >
                  👁 Xem trực tuyến
                </a>
              ) : null}
              <a
                href={`/api/tep/${tep.id}`}
                className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
              >
                ⬇ Tải về
              </a>
            </div>
          </li>
        );
      })}
      {coTheThayThe && teps.length > 0 && (
        <li className="text-xs text-gray-400">
          Tải file mới lên sẽ thay thế file hiện tại.
        </li>
      )}
    </ul>
  );
}
