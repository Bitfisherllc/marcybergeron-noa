import AdminChrome from "@/app/admin/AdminChrome";

/** Admin reads Postgres; never prerender at build (avoids failing CI / builds without Docker). */
export const dynamic = "force-dynamic";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <AdminChrome>{children}</AdminChrome>;
}
