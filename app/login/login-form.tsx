"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginForm() {
  const [busy, setBusy] = useState(false); const [show, setShow] = useState(false); const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError(""); const form = new FormData(event.currentTarget);
    try { const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: form.get("username"), password: form.get("password") }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Không thể đăng nhập."); window.location.assign("/"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể đăng nhập."); setBusy(false); }
  };
  return <form onSubmit={submit} className="mt-7 grid gap-4"><label className="grid gap-1.5 text-sm font-semibold">Tên tài khoản<Input name="username" autoComplete="username" autoCapitalize="none" minLength={3} maxLength={40} required placeholder="Ví dụ: hoanganh"/></label><label className="grid gap-1.5 text-sm font-semibold">Mật khẩu<div className="relative"><Input name="password" type={show ? "text" : "password"} autoComplete="current-password" minLength={8} maxLength={128} required className="pr-11"/><button type="button" aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-500">{show ? <EyeOff className="size-5"/> : <Eye className="size-5"/>}</button></div></label>{error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}<Button disabled={busy} className="mt-1 min-h-12 bg-blue-700 text-base font-bold hover:bg-blue-800">{busy ? <Loader2 className="animate-spin"/> : <ArrowRight/>}Đăng nhập</Button></form>;
}
