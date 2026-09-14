import Image from "next/image";
import Link from "next/link";
import type { Post, PostCategory } from "@/db";
import { PostCategoryNav } from "@/components/PostCategoryNav";
import { postCategoryLine } from "@/lib/postDisplay";
import { postKindCopy, postPublicHref, type PostIndexHeader, type PostKind } from "@/lib/postKind";
import { formatWorkshopPrice } from "@/lib/workshopPrice";
import { WorkshopDetailsNote, WorkshopInterestButton } from "@/components/WorkshopCta";

export function PostIndexView({
  kind,
  posts,
  categories,
  activeSlug,
  header,
}: {
  kind: PostKind;
  posts: Post[];
  categories: PostCategory[];
  activeSlug?: string;
  header?: PostIndexHeader;
}) {
  const copy = postKindCopy(kind);
  const eyebrow = header?.eyebrow ?? copy.eyebrow;
  const heading = header?.heading ?? copy.heading;
  const intro = header?.intro ?? copy.intro;
  const active = categories.find((c) => c.slug === activeSlug) ?? null;
  const visible = active ? posts.filter((p) => p.category === active.name) : posts;

  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <p className="text-xs tracking-[0.22em] text-muted uppercase">{eyebrow}</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl tracking-tight md:text-5xl">{heading}</h1>
          {intro.trim() ? (
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">{intro}</p>
          ) : null}
          <PostCategoryNav kind={kind} categories={categories} activeSlug={active?.slug} ariaLabel={copy.categoryNavLabel} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
        {visible.length === 0 ? (
          <div className="border border-line bg-white/35 px-8 py-12 text-center">
            <p className="text-sm leading-relaxed text-muted">
              {active ? copy.emptyFiltered(active.name) : copy.emptyAll}
            </p>
          </div>
        ) : (
          <div className="grid gap-10">
            {visible.map((p) => {
              const href = postPublicHref(kind, p.slug);
              return (
                <article key={p.id} className="border border-line bg-white/35">
                  <div className="grid gap-0 md:grid-cols-12">
                    <Link
                      href={href}
                      className={`group focus-ring relative z-[1] ${kind === "workshop" ? "aspect-square" : "aspect-[16/10]"} block overflow-hidden bg-black/[0.03] md:col-span-5`}
                      aria-label={kind === "workshop" ? `Workshop details: ${p.title}` : `Read article: ${p.title}`}
                    >
                      {p.featuredImage ? (
                        <Image
                          src={p.featuredImage}
                          alt=""
                          fill
                          className="pointer-events-none object-cover transition-transform duration-[1.35s] ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                          sizes="(max-width: 768px) 100vw, 40vw"
                        />
                      ) : (
                        <div className="pointer-events-none flex h-full items-center justify-center text-xs tracking-wide text-muted uppercase transition-colors duration-500 ease-out group-hover:bg-black/[0.06] group-hover:text-ink/60">
                          {copy.cardPlaceholder}
                        </div>
                      )}
                    </Link>
                    <div className="space-y-4 px-8 py-10 md:col-span-7">
                      <div className="text-xs tracking-[0.18em] text-muted uppercase">{postCategoryLine(p)}</div>
                      <h2 className="font-serif text-3xl tracking-tight">
                        <Link className="hover:underline" href={href}>
                          {p.title}
                        </Link>
                      </h2>
                      {kind === "workshop" ? (
                        <>
                          <p className="text-sm tracking-wide text-ink/80">{formatWorkshopPrice(p.price)}</p>
                          <WorkshopDetailsNote sessionDates={p.sessionDates} materialsNote={p.materialsNote} />
                        </>
                      ) : null}
                      <p className="text-sm leading-relaxed text-muted">{p.excerpt}</p>
                      <div className="flex flex-wrap items-center gap-4">
                        {kind === "workshop" ? (
                          <>
                            <Link
                              href={href}
                              className="inline-flex items-center border border-line bg-transparent px-5 py-3 text-xs tracking-[0.18em] text-ink uppercase hover:bg-black/[0.03] focus-ring"
                            >
                              Workshop details
                            </Link>
                            <WorkshopInterestButton slug={p.slug} />
                          </>
                        ) : (
                          <Link className="text-xs tracking-[0.18em] text-ink/70 uppercase hover:underline" href={href}>
                            Read →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
