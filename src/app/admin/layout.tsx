import AdminChrome from "@/app/admin/AdminChrome";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <AdminChrome>{children}</AdminChrome>;
}
