"use client";

import { useEffect } from "react";

/** Tự mở hộp thoại in sau khi trang tải xong */
export default function TuDongIn() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="no-print mb-4 flex items-center gap-3">
      <button
        onClick={() => window.print()}
        className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
      >
        🖨 In ngay / Lưu PDF
      </button>
      <button
        onClick={() => window.close()}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Đóng
      </button>
      <p className="text-xs text-gray-400">
        Mẹo: trong hộp thoại in chọn &quot;Save as PDF&quot; để lưu file.
      </p>
    </div>
  );
}
