import type { Metadata } from "next";
import Link from "next/link";
import { IntrinsicGalleryImage } from "@/components/IntrinsicGalleryImage";
import { listMediumGalleries } from "@/lib/queries";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Medium",
  description:
    "Browse Marcy Bergeron-Noa’s work by medium—oil and cold wax, works on paper, encaustic, mixed medium and collage, sculpture, and three-dimensional works.",
  alternates: { canonical: `${SITE_URL}/medium` },
};

export default async function MediumPage() {
  const galleries = await listMediumGalleries();

  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <p className="text-xs tracking-[0.22em] text-muted uppercase">Portfolio</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl tracking-tight md:text-5xl">Medium</h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
            The work organized by material and process—each gallery a doorway into paintings, works on paper,
            encaustic, collage, and sculpture.
          </p>
        </div>
      </section>

      <section className="border-t border-line bg-white/35">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
          {galleries.length === 0 ? (
            <p className="text-center text-sm text-muted">Medium galleries will appear here once they are published.</p>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {galleries.map((s) => (
                <article key={s.id} className="group border border-line bg-white/40">
                  <Link href={`/art/${s.slug}`} className="focus-ring block">
                    <IntrinsicGalleryImage
                      src={s.featuredImage}
                      alt={`${s.title} — featured artwork`}
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      imageClassName="transition duration-500 group-hover:scale-[1.01]"
                    />
                    <div className="px-6 py-7">
                      <h2 className="font-serif text-3xl tracking-tight">{s.title}</h2>
                      {s.excerpt ? (
                        <p className="mt-3 text-sm leading-relaxed text-muted">{s.excerpt}</p>
                      ) : null}
                      <span className="mt-3 inline-flex text-xs tracking-[0.18em] text-ink/70 uppercase">
                        Open gallery →
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
