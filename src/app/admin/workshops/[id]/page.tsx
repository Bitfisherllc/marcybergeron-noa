import { AdminPostEdit } from "@/components/AdminPostEditor";

export default async function EditWorkshopPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  return <AdminPostEdit kind="workshop" id={id} searchParams={searchParams} />;
}
