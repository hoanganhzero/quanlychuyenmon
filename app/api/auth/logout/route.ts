import { clearSessionCookie, destroySession } from "@/lib/session";

export async function POST() {
  await destroySession();
  return clearSessionCookie(Response.json({ ok: true }));
}
