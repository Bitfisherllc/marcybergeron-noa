import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogPostGalleryLightbox } from "@/components/BlogPostGalleryLightbox";
import { ProseMarkdown } from "@/components/ProseMarkdown";
import { getPostBySlug, getPublishedPostNext } from "@/lib/queries";
import { SITE_URL } from "@/lib/site";

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
  const p = await getPostBySlug(slug);
  if (!p || !p.published) notFound();
  const nextPost = await getPublishedPostNext(slug);

  return (
    <article>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <p className="text-xs tracking-[0.22em] text-muted uppercase">{p.category}</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl tracking-tight md:text-5xl">{p.title}</h1>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted">
            Published{" "}
            {new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(
              p.publishedAt ?? p.updatedAt,
            )}
          </p>
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
        {nextPost ? (
          <div className="mt-12 border-t border-line pt-10">
            <Link
              href={`/news/${nextPost.slug}`}
              className="focus-ring group flex items-start justify-between gap-6 rounded-sm py-1 transition-colors hover:bg-black/[0.02]"
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs tracking-[0.22em] text-muted uppercase">Next article</div>
                <div className="mt-3 font-serif text-xl leading-snug tracking-tight text-ink underline decoration-transparent decoration-1 underline-offset-[0.2em] transition-[text-decoration-color] group-hover:decoration-black/25 md:text-2xl">
                  {nextPost.title}
                </div>
              </div>
              <span
                className="mt-7 shrink-0 text-ink/35 transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:text-ink/55"
                aria-hidden
              >
                <svg width="40" height="12" viewBox="0 0 40 12" fill="none" className="block">
                  <path
                    d="M0 6h34M28 1l6 5-6 5"
                    stroke="currentColor"
                    strokeWidth="1.125"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </Link>
          </div>
        ) : null}
        <div className={`border-t border-line pt-10 ${nextPost ? "mt-10" : "mt-12"}`}>
          <Link href="/news" className="link-quiet text-sm">
            ← Back to news
          </Link>
        </div>
      </section>
    </article>
  );
}
