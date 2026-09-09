"use client";

import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SetupForm({ defaultName }: { defaultName: string }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setError(""); const data = new FormData(event.currentTarget); if (data.get("password") !== data.get("confirmPassword")) { setError("Mật khẩu nhập lại chưa khớp."); setBusy(false); return; } const response = await fetch("/api/auth/bootstrap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.get("name"), username: data.get("username"), password: data.get("password") }) }); const result = await response.json(); if (response.status === 409) { window.location.assign("/login"); return; } if (!response.ok) { setError(result.error || "Không thể thiết lập tài khoản."); setBusy(false); return; } window.location.assign("/"); };
  return <form onSubmit={submit} className="mt-6 grid gap-4"><label className="grid gap-1.5 text-sm font-semibold">Họ và tên<Input name="name" defaultValue={defaultName} required/></label><label className="grid gap-1.5 text-sm font-semibold">Tên tài khoản<Input name="username" autoCapitalize="none" autoComplete="username" minLength={3} maxLength={40} required placeholder="Ví dụ: admin"/></label><label className="grid gap-1.5 text-sm font-semibold">Mật khẩu<Input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required/></label><label className="grid gap-1.5 text-sm font-semibold">Nhập lại mật khẩu<Input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required/></label>{error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}<Button disabled={busy} className="min-h-12 bg-blue-700 font-bold hover:bg-blue-800">{busy&&<Loader2 className="animate-spin"/>}Tạo tài khoản quản trị</Button></form>;
}
