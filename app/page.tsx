import Dashboard from "@/app/dashboard";
import { requireAppUser } from "@/lib/current-user";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    const user = await requireAppUser();
    return <Dashboard identity={{ displayName: user.name, email: user.email }} />;
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "UNAUTHORIZED" || code === "ACCOUNT_DISABLED") redirect("/login");
    throw error;
  }
}
