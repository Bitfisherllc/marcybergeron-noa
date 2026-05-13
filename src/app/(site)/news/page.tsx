import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listPublishedPosts } from "@/lib/queries";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "News",
  description: "Exhibitions, studio updates, and announcements from Marcy Bergeron-Noa.",
  alternates: { canonical: `${SITE_URL}/news` },
};

function formatDate(d: Date | null | undefined) {
  if (!d) return "";
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(d);
}

export default async function NewsIndexPage() {
  const posts = await listPublishedPosts();

  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <p className="text-xs tracking-[0.22em] text-muted uppercase">News</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl tracking-tight md:text-5xl">Journal</h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
            Exhibitions, studio notes, new work, press, and teaching updates—published here as posts are added in
            the admin area.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
        {posts.length === 0 ? (
          <div className="border border-line bg-white/35 px-8 py-12 text-center">
            <p className="text-sm leading-relaxed text-muted">
              No published posts yet. When you are ready, add your first entry in the site admin under Posts.
            </p>
          </div>
        ) : (
          <div className="grid gap-10">
            {posts.map((p) => (
              <article key={p.id} className="border border-line bg-white/35">
                <div className="grid gap-0 md:grid-cols-12">
                  <Link
                    href={`/news/${p.slug}`}
                    className="group focus-ring relative aspect-[16/10] block overflow-hidden bg-black/[0.03] md:col-span-5"
                    aria-label={`Read article: ${p.title}`}
                  >
                    {p.featuredImage ? (
                      <Image
                        src={p.featuredImage}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-[1.35s] ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                        sizes="(max-width: 768px) 100vw, 40vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs tracking-wide text-muted uppercase transition-colors duration-500 ease-out group-hover:bg-black/[0.06] group-hover:text-ink/60">
                        Post
                      </div>
                    )}
                  </Link>
                  <div className="space-y-4 px-8 py-10 md:col-span-7">
                    <div className="text-xs tracking-[0.18em] text-muted uppercase">
                      {p.category} · {formatDate(p.publishedAt ?? p.updatedAt)}
                    </div>
                    <h2 className="font-serif text-3xl tracking-tight">
                      <Link className="hover:underline" href={`/news/${p.slug}`}>
                        {p.title}
                      </Link>
                    </h2>
                    <p className="text-sm leading-relaxed text-muted">{p.excerpt}</p>
                    <Link className="text-xs tracking-[0.18em] text-ink/70 uppercase hover:underline" href={`/news/${p.slug}`}>
                      Read →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
