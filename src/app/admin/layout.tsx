import AdminChrome from "@/app/admin/AdminChrome";
import { getAdminSession } from "@/lib/auth";
import { countContactMessages } from "@/lib/contactMessages";

/** Admin reads Postgres; never prerender at build (avoids failing CI / builds without Docker). */
export const dynamic = "force-dynamic";

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const [session, contactCount] = await Promise.all([getAdminSession(), countContactMessages()]);

  return <AdminChrome contactCount={session ? contactCount : 0}>{children}</AdminChrome>;
}
