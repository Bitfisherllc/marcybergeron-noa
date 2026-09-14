import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PostArticleView } from "@/components/PostArticleView";
import { getPostBySlug, listPostGalleryImages, listPublishedPosts } from "@/lib/queries";
import { parsePostKind, postPublicHref } from "@/lib/postKind";
import { normalizeRouteSlug } from "@/lib/routeSlug";
import { SITE_URL } from "@/lib/site";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = normalizeRouteSlug(rawSlug);
  const p = await getPostBySlug(slug);
  if (!p || !p.published || parsePostKind(p.kind) !== "news") return {};
  return {
    title: p.title,
    description: p.excerpt,
    alternates: { canonical: `${SITE_URL}${postPublicHref("news", p.slug)}` },
  };
}

export default async function NewsPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = normalizeRouteSlug(rawSlug);
  const [p, published] = await Promise.all([getPostBySlug(slug), listPublishedPosts("news")]);
  if (!p || !p.published) notFound();
  const kind = parsePostKind(p.kind);
  if (kind !== "news") {
    redirect(postPublicHref(kind, p.slug));
  }
  const gallery = await listPostGalleryImages(p.id);
  return <PostArticleView kind="news" post={p} published={published} gallery={gallery} />;
}
