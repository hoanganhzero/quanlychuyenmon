export const LABEL_VAI_TRO: Record<string, string> = {
  ADMIN: "Quản trị viên",
  BAN_GIAM_DOC: "Ban Giám đốc",
  TO_TRUONG: "Tổ trưởng chuyên môn",
  GIAO_VIEN: "Giáo viên",
};

export const LABEL_LOAI_KE_HOACH: Record<string, string> = {
  GIAO_AN: "Giáo án",
  KE_HOACH_BAI_DAY: "Kế hoạch bài dạy",
  KE_HOACH_CHU_DE: "Kế hoạch chủ đề",
};

export const LABEL_TRANG_THAI: Record<string, string> = {
  NHAP: "Nháp",
  CHO_DUYET: "Chờ tổ duyệt",
  CHO_BGD_DUYET: "Chờ BGĐ phê duyệt",
  DA_DUYET: "Đã phê duyệt",
  TU_CHOI: "Từ chối",
  DA_PHAT_HANH: "Đã phát hành",
  DA_DONG: "Đã đóng",
};

export const LABEL_LOAI_DIEM: Record<string, string> = {
  MIENG: "Điểm miệng",
  LAN_1: "Bài kiểm tra 15 phút",
  GIUA_KY: "Giữa kỳ",
  CUOI_KY: "Cuối kỳ",
  DANH_GIA: "Đánh giá (Đ/CĐ)",
};

export const LABEL_LOAI_HOAT_DONG: Record<string, string> = {
  SINH_HOAT_TO: "Sinh hoạt tổ",
  BOI_DUONG: "Bồi dưỡng giáo viên",
  HOI_THAO: "Hội thảo / tập huấn",
  DAY_TRUC_TIEP: "Dạy trực tiếp (dạy mẫu)",
};

export const LABEL_TRANG_THAI_HS: Record<string, string> = {
  DANG_HOC: "Đang học",
  BAO_LUU: "Bảo lưu",
  CHUYEN_TRUONG: "Chuyển trường",
  NGHI_HOC: "Nghỉ học",
};

export const THU_TRONG_TUAN: Record<number, string> = {
  2: "Thứ 2",
  3: "Thứ 3",
  4: "Thứ 4",
  5: "Thứ 5",
  6: "Thứ 6",
  7: "Thứ 7",
  8: "Chủ nhật",
};

export const LABEL_DOI_TUONG: Record<string, string> = {
  TOAN_GV: "Toàn bộ giáo viên",
  GVBM: "Giáo viên bộ môn (không chủ nhiệm)",
  GVCN: "Giáo viên chủ nhiệm",
  TO_CHUYEN_MON: "Theo tổ chuyên môn",
};

export const LABEL_KIEU_DU_LIEU: Record<string, string> = {
  TEXT: "Văn bản ngắn",
  SO: "Số",
  NGAY: "Ngày",
  CHON: "Lựa chọn",
  VAN_BAN_DAI: "Văn bản dài",
};

export function one<T>(v: T | T[] | undefined): T | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toDateInput(d: Date | string | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export const TRANG_THAI_BADGE: Record<string, string> = {
  NHAP: "bg-gray-100 text-gray-700",
  CHO_DUYET: "bg-amber-100 text-amber-800",
  CHO_BGD_DUYET: "bg-purple-100 text-purple-800",
  DA_DUYET: "bg-green-100 text-green-800",
  TU_CHOI: "bg-red-100 text-red-700",
  DA_PHAT_HANH: "bg-green-100 text-green-800",
  DA_DONG: "bg-slate-200 text-slate-700",
};
