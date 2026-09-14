import { AdminPostsManager } from "@/components/AdminPostsManager";

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  return <AdminPostsManager kind="news" searchParams={searchParams} />;
}
