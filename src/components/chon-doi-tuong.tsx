"use client";

import { useState } from "react";

export function ChonDoiTuong({
  tos,
  inputCls,
}: {
  tos: { id: string; ten: string }[];
  inputCls: string;
}) {
  const [doiTuong, setDoiTuong] = useState("TOAN_GV");
  const [toId, setToId] = useState("");

  return (
    <>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Gửi cho ai? *
        </label>
        <select
          name="doiTuong"
          value={doiTuong}
          onChange={(e) => setDoiTuong(e.target.value)}
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
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Chọn tổ chuyên môn *
          </label>
          <select
            name="toChuyenMonId"
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            required
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
    </>
  );
}
