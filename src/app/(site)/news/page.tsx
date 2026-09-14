import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PostIndexView } from "@/components/PostIndexView";
import { getResolvedPostIndexCopy } from "@/lib/postIndexCopy";
import { listPostCategories, listPublishedPosts } from "@/lib/queries";
import { postKindCopy } from "@/lib/postKind";
import { SITE_URL } from "@/lib/site";

export const revalidate = 300;

const copy = postKindCopy("news");

export const metadata: Metadata = {
  title: copy.metaTitle,
  description: copy.metaDescription,
  alternates: { canonical: `${SITE_URL}/news` },
};

export default async function NewsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: categorySlug } = await searchParams;
  if (categorySlug === "workshops") redirect("/workshops");
  const [posts, categories, header] = await Promise.all([
    listPublishedPosts("news"),
    listPostCategories("news"),
    getResolvedPostIndexCopy("news"),
  ]);
  return <PostIndexView kind="news" posts={posts} categories={categories} activeSlug={categorySlug} header={header} />;
}
