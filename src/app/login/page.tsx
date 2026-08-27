"use client";

import { dangNhap, type LoginState } from "@/app/actions/auth";
import { useActionState } from "react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-800 px-4">
      <LoginForm />
    </div>
  );
}

function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    dangNhap,
    {}
  );

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center mb-4">
          <svg
            className="w-9 h-9 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Quản lý chuyên môn trường học
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Đăng nhập để sử dụng hệ thống
        </p>
      </div>

      <form action={formAction} className="space-y-5">
        <div>
          <label
            htmlFor="tenDangNhap"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Tên tài khoản hoặc Email
          </label>
          <input
            id="tenDangNhap"
            name="tenDangNhap"
            type="text"
            required
            autoComplete="username"
            placeholder="vd: admin hoặc admin@truonghoc.edu.vn"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label
            htmlFor="matKhau"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Mật khẩu
          </label>
          <input
            id="matKhau"
            name="matKhau"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {state.error && (
          <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {pending ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-gray-400">
        Đăng nhập bằng tên tài khoản hoặc email ·{" "}
        <a href="/xac-thuc" className="text-blue-500 hover:underline">
          🔍 Xác thực chữ ký số
        </a>
      </p>
    </div>
  );
}
