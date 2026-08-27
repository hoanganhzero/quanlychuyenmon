"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type VaiTro = "ADMIN" | "BAN_GIAM_DOC" | "TO_TRUONG" | "GIAO_VIEN";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  /** Vai trò được thấy; bỏ trống = tất cả */
  vaiTros?: VaiTro[];
}

const NAV_GROUPS: { tieuDe: string; items: NavItem[] }[] = [
  {
    tieuDe: "Tổng quan",
    items: [
      { href: "/tong-quan", label: "Bảng điều khiển", icon: "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" },
    ],
  },
  {
    tieuDe: "Danh mục",
    items: [
      { href: "/nam-hoc", label: "Năm học & học kỳ", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", vaiTros: ["ADMIN"] },
      { href: "/giao-vien", label: "Giáo viên", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", vaiTros: ["ADMIN", "BAN_GIAM_DOC", "TO_TRUONG"] },
      { href: "/mon-hoc", label: "Môn học", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.247m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", vaiTros: ["ADMIN", "BAN_GIAM_DOC", "TO_TRUONG"] },
      { href: "/to-chuyen-mon", label: "Tổ chuyên môn", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", vaiTros: ["ADMIN", "BAN_GIAM_DOC", "TO_TRUONG"] },
      { href: "/lop-hoc", label: "Lớp học", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", vaiTros: ["ADMIN", "BAN_GIAM_DOC", "TO_TRUONG"] },
      { href: "/hoc-sinh", label: "Học sinh", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", vaiTros: ["ADMIN", "BAN_GIAM_DOC", "TO_TRUONG"] },
    ],
  },
  {
    tieuDe: "Chuyên môn",
    items: [
      { href: "/phan-cong", label: "Phân công giảng dạy", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", vaiTros: ["ADMIN", "BAN_GIAM_DOC", "TO_TRUONG"] },
      { href: "/thoi-khoa-bieu", label: "Thời khóa biểu", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", vaiTros: ["ADMIN", "BAN_GIAM_DOC", "TO_TRUONG"] },
      { href: "/giao-an", label: "Giáo án & kế hoạch", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.247m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
      { href: "/hoat-dong", label: "Sinh hoạt & bồi dưỡng", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zm5-6h4", vaiTros: ["ADMIN", "BAN_GIAM_DOC", "TO_TRUONG"] },
      { href: "/van-ban", label: "Triển khai văn bản", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
      { href: "/bao-cao-mau", label: "Form báo cáo (AI)", icon: "M9 17v-2m3 2v-6m3 2v-3M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
    ],
  },
  {
    tieuDe: "Giảng dạy",
    items: [
      { href: "/diem", label: "Điểm số", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", vaiTros: ["ADMIN", "GIAO_VIEN", "TO_TRUONG"] },
      { href: "/bao-cao-gvcn", label: "Báo cáo GVCN", icon: "M9 17v-2m3 2v-6m3 2v-3m-6 8h6a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
      { href: "/gio-giang", label: "Giờ giấc giảng dạy", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", vaiTros: ["ADMIN", "GIAO_VIEN"] },
      { href: "/bao-giang", label: "Sổ báo giảng", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
      { href: "/chu-ky-cua-toi", label: "Chữ ký của tôi", icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" },
      { href: "/form-cua-toi", label: "Việc được giao", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h2m-2 4h2m-6 4l2 2 4-4" },
    ],
  },
];

export default function Sidebar({ vaiTro }: { vaiTro: VaiTro }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-5 p-4 overflow-y-auto">
      {NAV_GROUPS.map((group) => {
        const items = group.items.filter(
          (it) => !it.vaiTros || it.vaiTros.includes(vaiTro)
        );
        if (items.length === 0) return null;
        return (
          <div key={group.tieuDe}>
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {group.tieuDe}
            </p>
            <ul className="space-y-1">
              {items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        active
                          ? "bg-blue-600 text-white font-medium"
                          : "text-slate-300 hover:bg-slate-700/60 hover:text-white"
                      }`}
                    >
                      <svg
                        className="w-5 h-5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d={item.icon}
                        />
                      </svg>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
