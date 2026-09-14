import { AdminPostNew } from "@/components/AdminPostEditor";

export default async function NewWorkshopPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return <AdminPostNew kind="workshop" searchParams={searchParams} />;
}
