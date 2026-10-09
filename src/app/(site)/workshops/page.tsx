import type { Metadata } from "next";
import { PostIndexView } from "@/components/PostIndexView";
import { getResolvedPostIndexCopy } from "@/lib/postIndexCopy";
import { listPostCategories, listPublishedPosts } from "@/lib/queries";
import { postKindCopy } from "@/lib/postKind";
import { SITE_URL } from "@/lib/site";
import { requireWorkshopsVisible } from "@/lib/siteFeatures";

export const revalidate = 300;

const copy = postKindCopy("workshop");

export async function generateMetadata(): Promise<Metadata> {
  await requireWorkshopsVisible();
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: { canonical: `${SITE_URL}/workshops` },
  };
}

export default async function WorkshopsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  await requireWorkshopsVisible();
  const { category: categorySlug } = await searchParams;
  const [posts, categories, header] = await Promise.all([
    listPublishedPosts("workshop"),
    listPostCategories("workshop"),
    getResolvedPostIndexCopy("workshop"),
  ]);
  return (
    <PostIndexView kind="workshop" posts={posts} categories={categories} activeSlug={categorySlug} header={header} />
  );
}
