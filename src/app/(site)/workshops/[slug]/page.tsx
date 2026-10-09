import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PostArticleView } from "@/components/PostArticleView";
import { getPostBySlug, listPostGalleryImages, listPublishedPosts } from "@/lib/queries";
import { parsePostKind, postPublicHref } from "@/lib/postKind";
import { normalizeRouteSlug } from "@/lib/routeSlug";
import { SITE_URL } from "@/lib/site";
import { requireWorkshopsVisible } from "@/lib/siteFeatures";
import { richTextToPlain } from "@/lib/richText";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  await requireWorkshopsVisible();
  const { slug: rawSlug } = await params;
  const slug = normalizeRouteSlug(rawSlug);
  const p = await getPostBySlug(slug);
  if (!p || !p.published || parsePostKind(p.kind) !== "workshop") return {};
  return {
    title: p.title,
    description: richTextToPlain(p.excerpt),
    alternates: { canonical: `${SITE_URL}${postPublicHref("workshop", p.slug)}` },
  };
}

export default async function WorkshopPostPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireWorkshopsVisible();
  const { slug: rawSlug } = await params;
  const slug = normalizeRouteSlug(rawSlug);
  const [p, published] = await Promise.all([getPostBySlug(slug), listPublishedPosts("workshop")]);
  if (!p || !p.published) notFound();
  const kind = parsePostKind(p.kind);
  if (kind !== "workshop") {
    redirect(postPublicHref(kind, p.slug));
  }
  const gallery = await listPostGalleryImages(p.id);
  return <PostArticleView kind="workshop" post={p} published={published} gallery={gallery} />;
}
