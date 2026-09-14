import { AdminPostEdit } from "@/components/AdminPostEditor";

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  return <AdminPostEdit kind="news" id={id} searchParams={searchParams} />;
}
