"use client";

import { useState, useTransition } from "react";
import type { DoiTuongNhan, KieuDuLieu } from "@prisma/client";
import { luuMauBaoCao } from "@/app/(app)/bao-cao-mau/actions";
import { LABEL_KIEU_DU_LIEU } from "@/lib/utils";

interface FieldDraft {
  tenTruong: string;
  kieuDuLieu: KieuDuLieu;
  luaChon: string | null;
  batBuoc: boolean;
}

export interface BuilderInitial {
  id?: string;
  tieuDe: string;
  moTa: string;
  hanChot: string;
  doiTuong: DoiTuongNhan;
  toChuyenMonId: string;
  fields: FieldDraft[];
}

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

export default function FormBuilder({
  tos,
  initial,
}: {
  tos: { id: string; ten: string }[];
  initial?: BuilderInitial;
}) {
  const [tieuDe, setTieuDe] = useState(initial?.tieuDe ?? "");
  const [moTa, setMoTa] = useState(initial?.moTa ?? "");
  const [hanChot, setHanChot] = useState(initial?.hanChot ?? "");
  const [doiTuong, setDoiTuong] = useState<DoiTuongNhan>(
    initial?.doiTuong ?? "TOAN_GV"
  );
  const [toId, setToId] = useState(initial?.toChuyenMonId ?? "");
  const [fields, setFields] = useState<FieldDraft[]>(
    initial?.fields ?? []
  );
  const [dangPhanTich, setDangPhanTich] = useState(false);
  const [baoLoi, setBaoLoi] = useState("");
  const [thongBaoAI, setThongBaoAI] = useState("");
  const [pending, startTransition] = useTransition();

  async function handleUpload(file: File) {
    setBaoLoi("");
    setThongBaoAI("");
    setDangPhanTich(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/bao-cao-mau/phan-tich", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setBaoLoi(data.error ?? "Không đọc được file.");
        return;
      }
      if (!tieuDe) setTieuDe(file.name.replace(/\.(xlsx|xls)$/i, ""));
      setFields(data.fields as FieldDraft[]);
      setThongBaoAI(
        `🤖 AI đã phân tích sheet "${data.tenSheet}" và nhận diện ${data.fields.length} trường dữ liệu từ ${data.soDongDuLieu} dòng mẫu. Bạn có thể chỉnh sửa trước khi gửi.`
      );
    } catch {
      setBaoLoi("Lỗi kết nối khi phân tích file.");
    } finally {
      setDangPhanTich(false);
    }
  }

  function suaField(i: number, patch: Partial<FieldDraft>) {
    setFields((fs) => fs.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  }
  function diChuyen(i: number, huong: -1 | 1) {
    const j = i + huong;
    if (j < 0 || j >= fields.length) return;
    setFields((fs) => {
      const copy = [...fs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  function luu() {
    setBaoLoi("");
    startTransition(async () => {
      try {
        await luuMauBaoCao({
          id: initial?.id,
          tieuDe,
          moTa,
          hanChot: hanChot || null,
          doiTuong,
          toChuyenMonId: toId || null,
          fields,
        });
      } catch (e) {
        setBaoLoi(e instanceof Error ? e.message : "Lỗi lưu form.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Bước 1: Upload */}
      {!initial && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-1">
            Bước 1 — Tải lên file Excel mẫu
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            Hàng đầu tiên (hoặc hàng có nhiều dữ liệu nhất) sẽ được hiểu là tiêu
            đề cột; AI tự suy đoán kiểu dữ liệu từng cột từ các dòng bên dưới.
          </p>
          <input
            type="file"
            accept=".xlsx,.xls"
            disabled={dangPhanTich}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
            }}
            className={`${inputCls} file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-white file:text-sm file:cursor-pointer bg-white`}
          />
          {dangPhanTich && (
            <p className="mt-2 text-sm text-blue-600">🤖 Đang phân tích...</p>
          )}
        </div>
      )}

      {thongBaoAI && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          {thongBaoAI}
        </div>
      )}

      {(initial || fields.length > 0) && (
        <>
          {/* Bước 2: thông tin form */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">
              Bước 2 — Thông tin form &amp; đối tượng nhận
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Tiêu đề form *</label>
                <input
                  value={tieuDe}
                  onChange={(e) => setTieuDe(e.target.value)}
                  placeholder="VD: Báo cáo chuyên môn tháng 9"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={lbl}>Hạn chót nộp</label>
                <input
                  type="date"
                  value={hanChot}
                  onChange={(e) => setHanChot(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="md:col-span-2">
                <label className={lbl}>Mô tả / hướng dẫn</label>
                <textarea
                  value={moTa}
                  onChange={(e) => setMoTa(e.target.value)}
                  rows={2}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={lbl}>Gửi cho ai? *</label>
                <select
                  value={doiTuong}
                  onChange={(e) => setDoiTuong(e.target.value as DoiTuongNhan)}
                  className={inputCls}
                >
                  <option value="TOAN_GV">Toàn bộ giáo viên</option>
                  <option value="GVBM">
                    Giáo viên bộ môn (không chủ nhiệm)
                  </option>
                  <option value="GVCN">Giáo viên chủ nhiệm</option>
                  <option value="TO_CHUYEN_MON">Một tổ chuyên môn</option>
                </select>
              </div>
              {doiTuong === "TO_CHUYEN_MON" && (
                <div>
                  <label className={lbl}>Chọn tổ *</label>
                  <select
                    value={toId}
                    onChange={(e) => setToId(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">— Chọn tổ —</option>
                    {tos.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.ten}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Bước 3: các trường dữ liệu */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">
                Bước 3 — Các trường dữ liệu ({fields.length})
              </h2>
              <button
                onClick={() =>
                  setFields((fs) => [
                    ...fs,
                    { tenTruong: "", kieuDuLieu: "TEXT", luaChon: null, batBuoc: false },
                  ])
                }
                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
              >
                + Thêm trường
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((f, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-2 items-center rounded-lg border border-gray-100 p-3 bg-gray-50/50"
                >
                  <span className="col-span-1 text-center text-xs font-bold text-gray-400">
                    {i + 1}
                  </span>
                  <input
                    value={f.tenTruong}
                    onChange={(e) => suaField(i, { tenTruong: e.target.value })}
                    placeholder="Tên trường..."
                    className={`${inputCls} col-span-4`}
                  />
                  <select
                    value={f.kieuDuLieu}
                    onChange={(e) =>
                      suaField(i, { kieuDuLieu: e.target.value as KieuDuLieu })
                    }
                    className={`${inputCls} col-span-2`}
                  >
                    {Object.entries(LABEL_KIEU_DU_LIEU).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <input
                    value={f.luaChon ?? ""}
                    onChange={(e) => suaField(i, { luaChon: e.target.value })}
                    placeholder="Lựa chọn (phân cách bằng |)"
                    disabled={f.kieuDuLieu !== "CHON"}
                    className={`${inputCls} col-span-2 disabled:bg-gray-100`}
                  />
                  <label className="col-span-1 flex items-center justify-center gap-1 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={f.batBuoc}
                      onChange={(e) => suaField(i, { batBuoc: e.target.checked })}
                    />
                    Bắt buộc
                  </label>
                  <div className="col-span-1 flex flex-col items-center gap-0.5">
                    <button
                      onClick={() => diChuyen(i, -1)}
                      className="text-[10px] leading-none text-gray-400 hover:text-blue-600"
                      title="Lên"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => diChuyen(i, 1)}
                      className="text-[10px] leading-none text-gray-400 hover:text-blue-600"
                      title="Xuống"
                    >
                      ▼
                    </button>
                  </div>
                  <button
                    onClick={() => setFields((fs) => fs.filter((_, j) => j !== i))}
                    className="col-span-1 text-red-500 hover:text-red-700 text-xl leading-none"
                    title="Xóa trường"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {baoLoi && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {baoLoi}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={luu}
              disabled={pending}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {pending ? "Đang lưu..." : "💾 Lưu form"}
            </button>
            <p className="self-center text-xs text-gray-400">
              Sau khi lưu bạn vẫn ở trạng thái NHÁP — xem lại rồi bấm
              &quot;Phát hành&quot; để gửi đến giáo viên.
            </p>
          </div>
        </>
      )}

      {baoLoi && !fields.length && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {baoLoi}
        </p>
      )}
    </div>
  );
}

const lbl = "block text-xs font-medium text-gray-600 mb-1";
