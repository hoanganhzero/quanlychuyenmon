import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "qlcm_session";

export function proxy(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/tong-quan/:path*",
    "/giao-vien/:path*",
    "/hoc-sinh/:path*",
    "/lop-hoc/:path*",
    "/mon-hoc/:path*",
    "/giao-an/:path*",
    "/diem/:path*",
    "/thoi-khoa-bieu/:path*",
    "/phan-cong/:path*",
    "/to-chuyen-mon/:path*",
    "/hoat-dong/:path*",
    "/bao-cao-gvcn/:path*",
    "/gio-giang/:path*",
    "/nam-hoc/:path*",
    "/tai-khoan/:path*",
    "/bao-cao-mau/:path*",
    "/form-cua-toi/:path*",
    "/van-ban/:path*",
    "/file/:path*",
    "/bao-giang/:path*",
    "/chu-ky-cua-toi/:path*",
    "/thong-bao/:path*",
  ],
};
