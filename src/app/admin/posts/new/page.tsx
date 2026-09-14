import { AdminPostNew } from "@/components/AdminPostEditor";

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return <AdminPostNew kind="news" searchParams={searchParams} />;
}
