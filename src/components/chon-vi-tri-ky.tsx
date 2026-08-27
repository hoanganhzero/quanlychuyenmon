"use client";

import { useRef, useState } from "react";

interface Props {
  /** Tên select/input ẩn chứa giá trị vị trí — phải nằm trong <form> cha */
  tenTruong?: string;
  /** Giá trị mặc định khi không bật tùy chỉnh */
  macDinh?: string;
  /** Ảnh chữ ký để hiển thị khi kéo (URL) */
  anhChuKy?: string;
  /** Tên người ký hiển thị nếu chưa có ảnh */
  tenNguoiKy?: string;
  /** URL file PDF đính kèm (nếu có) làm nền xem trước */
  pdfUrl?: string;
}

/**
 * Chọn vị trí ký tùy chỉnh bằng cách KÉO-THẢ lên trang giấy A4 giả lập
 * (hoặc đè lên bản xem trước PDF). Xuất giá trị "custom-<x>-<y>" (%).
 */
export default function ChonViTriKy({
  tenTruong = "viTriKy",
  macDinh = "center",
  anhChuKy,
  tenNguoiKy = "Chữ ký",
  pdfUrl,
}: Props) {
  const [batTuChinh, setBatTuChinh] = useState(false);
  const [pos, setPos] = useState({ xPercent: 70, yPercent: 80 });
  const khung = useRef<HTMLDivElement>(null);
  const dangKeo = useRef(false);

  function capNhatTuSuKien(clientX: number, clientY: number) {
    const el = khung.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setPos({
      xPercent: Math.max(0, Math.min(100, Math.round(x * 10) / 10)),
      yPercent: Math.max(0, Math.min(100, Math.round(y * 10) / 10)),
    });
  }

  function batDauKeo(e: React.PointerEvent) {
    e.preventDefault();
    dangKeo.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function dangKeoChay(e: React.PointerEvent) {
    if (!dangKeo.current) return;
    capNhatTuSuKien(e.clientX, e.clientY);
  }
  function ketThucKeo() {
    dangKeo.current = false;
  }

  function bamVaoGiay(e: React.MouseEvent) {
    if (!batTuChinh) return;
    capNhatTuSuKien(e.clientX, e.clientY);
  }

  return (
    <div className="w-full">
      {/* Bật/tắt chế độ tùy chỉnh */}
      <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={batTuChinh}
          onChange={(e) => setBatTuChinh(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        🖱 Kéo thả chọn vị trí bất kỳ trên trang
      </label>

      {/* Giá trị gửi kèm form */}
      <input type="hidden" name={tenTruong} value={batTuChinh ? `custom-${pos.xPercent}-${pos.yPercent}` : macDinh} />

      {batTuChinh && (
        <div className="mt-3 space-y-2">
          <p className="text-[11px] text-gray-400">
            Nhấp hoặc kéo chữ ký đến vị trí mong muốn · Hiện tại: trái {pos.xPercent}% — trên {pos.yPercent}%
          </p>
          <div
            ref={khung}
            onClick={bamVaoGiay}
            className={`relative w-full aspect-[210/297] rounded-lg border-2 border-dashed overflow-hidden bg-white ${
              pdfUrl ? "" : "shadow-inner"
            } ${dangKeo.current ? "cursor-grabbing" : "cursor-crosshair"}`}
          >
            {/* Nền PDF nếu văn bản có file */}
            {pdfUrl && (
              <iframe
                src={`${pdfUrl}#toolbar=0&view=FitH`}
                title="Xem trước văn bản"
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
            )}

            {/* Khung giấy giả lập khi không có PDF */}
            {!pdfUrl && (
              <div className="absolute inset-0 p-[8%] pointer-events-none">
                <div className="h-2 w-1/2 bg-gray-200 rounded mb-4" />
                <div className="space-y-1.5">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <div key={i} className="h-1 bg-gray-100 rounded" style={{ width: `${88 - (i % 4) * 12}%` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Con trỏ chữ ký kéo được */}
            <div
              onPointerDown={batDauKeo}
              onPointerMove={dangKeoChay}
              onPointerUp={ketThucKeo}
              className="absolute w-24 select-none touch-none cursor-grab active:cursor-grabbing"
              style={{
                left: `${pos.xPercent}%`,
                top: `${pos.yPercent}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {anhChuKy ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={anhChuKy}
                  alt="Chữ ký"
                  draggable={false}
                  className="w-full h-auto drop-shadow-md ring-2 ring-blue-400/60 rounded"
                />
              ) : (
                <span
                  className="block text-center text-lg leading-none text-indigo-800 bg-white/70 rounded px-1"
                  style={{ fontFamily: "'Segoe Script', 'Brush Script MT', cursive" }}
                >
                  {tenNguoiKy}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
