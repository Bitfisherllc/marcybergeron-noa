import Image from "next/image";
import Link from "next/link";
import type { Post, PostGalleryImage } from "@/db";
import { BlogPostGalleryLightbox } from "@/components/BlogPostGalleryLightbox";
import { HomeJournalSlider } from "@/components/HomeJournalSlider";
import { PostArticleGallery } from "@/components/PostArticleGallery";
import { ProseMarkdown } from "@/components/ProseMarkdown";
import { formatPostDate, postCategoryLine } from "@/lib/postDisplay";
import { postKindCopy, postPublicBasePath, postPublicHref, type PostKind } from "@/lib/postKind";
import { formatWorkshopPrice } from "@/lib/workshopPrice";
import { SITE_IMAGE_QUALITY } from "@/lib/imageQuality";
import { WorkshopDetailsNote, WorkshopInterestButton } from "@/components/WorkshopCta";

export function PostArticleView({
  kind,
  post: p,
  published,
  gallery,
}: {
  kind: PostKind;
  post: Post;
  published: Post[];
  gallery: PostGalleryImage[];
}) {
  const copy = postKindCopy(kind);
  const indexHref = postPublicBasePath(kind);
  const currentIndex = published.findIndex((row) => row.slug === p.slug);
  const morePostsRaw =
    currentIndex === -1
      ? published
      : [...published.slice(currentIndex + 1), ...published.slice(0, currentIndex)];
  const morePosts = morePostsRaw.map((row) => ({
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: postCategoryLine(row, "short"),
    featuredImage: row.featuredImage,
    href: postPublicHref(kind, row.slug),
  }));

  return (
    <article>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <p className="text-xs tracking-[0.22em] text-muted uppercase">{p.category}</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl tracking-tight md:text-5xl">{p.title}</h1>
          {kind === "workshop" ? (
            <div className="mt-6 max-w-2xl space-y-4">
              <p className="text-sm leading-relaxed text-muted">Cost {formatWorkshopPrice(p.price)}</p>
              <WorkshopDetailsNote sessionDates={p.sessionDates} materialsNote={p.materialsNote} />
              <WorkshopInterestButton slug={p.slug} />
            </div>
          ) : null}
          {p.showDate ? (
            <p
              className={`max-w-2xl text-sm leading-relaxed text-muted ${kind === "workshop" ? "mt-2" : "mt-6"}`}
            >
              Published {formatPostDate(p.publishedAt ?? p.updatedAt)}
            </p>
          ) : null}
        </div>
      </section>

      {kind !== "workshop" && p.featuredImage ? (
        <section className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-14">
          <div className="relative aspect-[16/9] overflow-hidden border border-line bg-black/[0.03]">
            <Image src={p.featuredImage} alt="" fill className="object-cover" priority quality={SITE_IMAGE_QUALITY} sizes="(max-width:1200px) 100vw, 1152px" />
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
        {kind === "workshop" ? (
          <div className="mt-12 border-t border-line pt-10">
            <p className="text-sm leading-relaxed text-muted">
              If you would like to be kept in mind for this class, a private group, or a solo session, send Marcy a
              short note.
            </p>
            <WorkshopInterestButton slug={p.slug} className="mt-6" />
          </div>
        ) : null}
      </section>

      <PostArticleGallery images={gallery} />

      {morePosts.length > 0 ? (
        <section className="border-t border-line bg-white/35">
          <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs tracking-[0.22em] text-muted uppercase">{copy.moreEyebrow}</p>
                <h2 className="mt-3 font-serif text-3xl tracking-tight">{copy.nextHeading}</h2>
              </div>
              <Link href={indexHref} className="link-quiet shrink-0 text-sm tracking-wide">
                {copy.viewAll}
              </Link>
            </div>
            <div className="-mx-5 md:-mx-8">
              <HomeJournalSlider
                key={p.slug}
                posts={morePosts}
                ariaLabel={copy.moreAria}
                emptyLabel={copy.cardPlaceholder}
              />
            </div>
            <div className="mt-12 border-t border-line pt-10">
              <Link href={indexHref} className="link-quiet text-sm">
                {copy.back}
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-5 pb-14 md:px-8 md:pb-16">
          <div className="border-t border-line pt-10">
            <Link href={indexHref} className="link-quiet text-sm">
              {copy.back}
            </Link>
          </div>
        </section>
      )}
    </article>
  );
}
