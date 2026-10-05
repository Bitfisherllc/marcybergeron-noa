import AdminChrome from "@/app/admin/AdminChrome";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getAdminSession } from "@/lib/auth";
import { countUnreadInbox } from "@/lib/inbox";

/** Admin reads Postgres; never prerender at build (avoids failing CI / builds without Docker). */
export const dynamic = "force-dynamic";

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  const inboxCount = session ? await countUnreadInbox() : 0;

  return (
    <AdminChrome header={<SiteHeader admin />} footer={<SiteFooter />} inboxCount={inboxCount}>
      {children}
    </AdminChrome>
  );
}
