import { AdminPostsManager } from "@/components/AdminPostsManager";

export default async function AdminWorkshopsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  return <AdminPostsManager kind="workshop" searchParams={searchParams} />;
}
