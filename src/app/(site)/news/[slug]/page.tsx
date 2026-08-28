import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogPostGalleryLightbox } from "@/components/BlogPostGalleryLightbox";
import { HomeJournalSlider } from "@/components/HomeJournalSlider";
import { ProseMarkdown } from "@/components/ProseMarkdown";
import { getPostBySlug, listPublishedPosts } from "@/lib/queries";
import { formatPostDate, postCategoryLine } from "@/lib/postDisplay";
import { SITE_URL } from "@/lib/site";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPostBySlug(slug);
  if (!p || !p.published) return {};
  return {
    title: p.title,
    description: p.excerpt,
    alternates: { canonical: `${SITE_URL}/news/${p.slug}` },
  };
}

export default async function NewsPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [p, published] = await Promise.all([getPostBySlug(slug), listPublishedPosts()]);
  if (!p || !p.published) notFound();

  const currentIndex = published.findIndex((post) => post.slug === slug);
  const morePostsRaw =
    currentIndex === -1
      ? published
      : [...published.slice(currentIndex + 1), ...published.slice(0, currentIndex)];
  const morePosts = morePostsRaw.map((post) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: postCategoryLine(post, "short"),
    featuredImage: post.featuredImage,
  }));

  return (
    <article>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <p className="text-xs tracking-[0.22em] text-muted uppercase">{p.category}</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl tracking-tight md:text-5xl">{p.title}</h1>
          {p.showDate ? (
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted">
              Published {formatPostDate(p.publishedAt ?? p.updatedAt)}
            </p>
          ) : null}
        </div>
      </section>

      {p.featuredImage ? (
        <section className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-14">
          <div className="relative aspect-[16/9] overflow-hidden border border-line bg-black/[0.03]">
            <Image src={p.featuredImage} alt="" fill className="object-cover" priority sizes="(max-width:1200px) 100vw, 1152px" />
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <BlogPostGalleryLightbox>
          <ProseMarkdown content={p.content} variant="article" />
        </BlogPostGalleryLightbox>
        {p.tags ? (
          <p className="mt-12 text-xs text-muted">
            <span className="tracking-[0.18em] uppercase">Tags</span>
            <span className="text-ink/80"> · {p.tags}</span>
          </p>
        ) : null}
      </section>

      {morePosts.length > 0 ? (
        <section className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs tracking-[0.22em] text-muted uppercase">News</p>
                <h2 className="mt-3 font-serif text-3xl tracking-tight">More articles</h2>
              </div>
              <Link href="/news" className="link-quiet shrink-0 text-sm tracking-wide">
                View all posts →
              </Link>
            </div>
            <div className="-mx-5 md:-mx-8">
              <HomeJournalSlider
                key={slug}
                posts={morePosts}
                ariaLabel="More news articles"
                emptyLabel="News"
              />
            </div>
            <div className="mt-12 border-t border-line pt-10">
              <Link href="/news" className="link-quiet text-sm">
                ← Back to news
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-5 pb-14 md:px-8 md:pb-16">
          <div className="border-t border-line pt-10">
            <Link href="/news" className="link-quiet text-sm">
              ← Back to news
            </Link>
          </div>
        </section>
      )}
    </article>
  );
}
