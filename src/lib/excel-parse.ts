import * as XLSX from "xlsx";
import type { KieuDuLieu } from "@prisma/client";

export interface TruongDuDoan {
  tenTruong: string;
  kieuDuLieu: KieuDuLieu;
  luaChon: string | null;
  batBuoc: boolean;
}

export interface KetQuaPhanTich {
  tenSheet: string;
  soDongDuLieu: number;
  fields: TruongDuDoan[];
}

const RE_SO = /^-?\d+([.,]\d+)?$/;
const RE_NGAY = /^(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{4}-\d{2}-\d{2})/;

function laNgay(v: unknown): boolean {
  if (v instanceof Date) return true;
  return RE_NGAY.test(String(v).trim());
}

function laSo(v: unknown): boolean {
  if (typeof v === "number") return true;
  return RE_SO.test(String(v).trim());
}

function vanHoa(v: unknown): string {
  return String(v ?? "").trim();
}

/**
 * "AI" phân tích file Excel mẫu:
 * - Tự tìm dòng tiêu đề (dòng có nhiều ô dữ liệu nhất trong 10 dòng đầu)
 * - Tự suy đoán kiểu dữ liệu từng cột từ dữ liệu mẫu:
 *   số / ngày / danh sách chọn / văn bản dài / văn bản
 */
export function phanTichExcel(buffer: Buffer): KetQuaPhanTich {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const tenSheet = wb.SheetNames[0];
  const ws = wb.Sheets[tenSheet];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    blankrows: false,
    defval: null,
  });

  if (rows.length === 0) throw new Error("File Excel trống.");

  // Tìm dòng tiêu đề: trong 10 dòng đầu, chọn dòng có nhiều ô không rỗng nhất (>=2)
  let headerIdx = 0;
  let maxCells = 0;
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const count = rows[i].filter((c) => vanHoa(c) !== "").length;
    if (count > maxCells) {
      maxCells = count;
      headerIdx = i;
    }
  }
  if (maxCells < 2) throw new Error("Không tìm thấy dòng tiêu đề phù hợp.");

  const headerRow = rows[headerIdx];
  const cotChiSo: number[] = [];
  const fields: TruongDuDoan[] = [];

  headerRow.forEach((cell, colIdx) => {
    const ten = vanHoa(cell);
    if (ten !== "") cotChiSo.push(colIdx);
  });
  if (cotChiSo.length === 0) throw new Error("Dòng tiêu đề trống.");

  // Thu thập mẫu dữ liệu mỗi cột
  const samplesMap = new Map<number, unknown[]>();
  for (const colIdx of cotChiSo) samplesMap.set(colIdx, []);
  for (
    let i = headerIdx + 1;
    i < rows.length && i <= headerIdx + 40;
    i++
  ) {
    for (const colIdx of cotChiSo) {
      const v = rows[i]?.[colIdx];
      if (vanHoa(v) !== "") samplesMap.get(colIdx)!.push(v);
    }
  }

  for (const colIdx of cotChiSo) {
    const tenTruong = vanHoa(headerRow[colIdx]).slice(0, 120);
    const samples = samplesMap.get(colIdx)!;

    let kieuDuLieu: KieuDuLieu = "TEXT";
    let luaChon: string | null = null;

    if (samples.length === 0) {
      kieuDuLieu = "TEXT";
    } else {
      const tatCaLaSo = samples.every(laSo);
      const tatCaLaNgay = samples.every(laNgay);
      const distinct = [...new Set(samples.map((v) => vanHoa(v)))].filter(
        (s) => s !== ""
      );
      const maxLen = Math.max(...samples.map((v) => vanHoa(v).length));
      // Nếu mọi giá trị đều khác nhau → khả năng cao là định danh (tên, mã...)
      // chứ không phải danh mục lựa chọn
      const tatCaPhanBiet = distinct.length === samples.length;

      if (tatCaLaNgay) kieuDuLieu = "NGAY";
      else if (tatCaLaSo) kieuDuLieu = "SO";
      else if (
        distinct.length >= 2 &&
        distinct.length <= 8 &&
        samples.length >= 3 &&
        !tatCaPhanBiet &&
        maxLen <= 60
      ) {
        kieuDuLieu = "CHON";
        luaChon = distinct.join(" | ");
      } else if (maxLen > 100) kieuDuLieu = "VAN_BAN_DAI";
      else kieuDuLieu = "TEXT";
    }

    fields.push({ tenTruong, kieuDuLieu, luaChon, batBuoc: false });
  }

  return {
    tenSheet,
    soDongDuLieu: rows.length - headerIdx - 1,
    fields,
  };
}
