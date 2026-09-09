import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quản lý chuyên môn",
  description: "Quản lý đội ngũ, lớp học, hồ sơ chuyên môn và quy trình phê duyệt",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="vi"><body>{children}</body></html>;
}
