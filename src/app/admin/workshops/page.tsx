import { AdminPostsManager } from "@/components/AdminPostsManager";
import { AdminWorkshopsVisibilityForm } from "@/components/AdminWorkshopsVisibilityForm";
import { getWorkshopsPublicForAdmin } from "@/lib/siteFeatures";

export default async function AdminWorkshopsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const [{ saved }, enabled] = await Promise.all([searchParams, getWorkshopsPublicForAdmin()]);
  return (
    <AdminPostsManager
      kind="workshop"
      searchParams={searchParams}
      settings={<AdminWorkshopsVisibilityForm enabled={enabled} saved={saved} />}
    />
  );
}
