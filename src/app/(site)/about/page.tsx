import type { Metadata } from "next";
import Image from "next/image";
import { ProseMarkdown } from "@/components/ProseMarkdown";
import { SITE_URL } from "@/lib/site";
import { getResolvedAboutPortrait, getResolvedAboutSection } from "@/lib/aboutPage";

export const metadata: Metadata = {
  title: "About Marcy Bergeron-Noa",
  description:
    "Biography, artist statement, education, exhibitions, and affiliations for abstract painter Marcy Bergeron-Noa.",
  alternates: { canonical: `${SITE_URL}/about` },
};

function AboutBlock({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h2 className="font-serif text-3xl tracking-tight">{title}</h2>
      <div className="mt-5 h-px w-16 bg-line" />
      <div className="mt-8">
        <ProseMarkdown content={content} />
      </div>
    </div>
  );
}

export default async function AboutPage() {
  const [hero, artistStatement, biography, education, exhibitions, affiliations, studio, portrait] = await Promise.all([
    getResolvedAboutSection("hero"),
    getResolvedAboutSection("artist_statement"),
    getResolvedAboutSection("biography"),
    getResolvedAboutSection("education"),
    getResolvedAboutSection("exhibitions"),
    getResolvedAboutSection("affiliations"),
    getResolvedAboutSection("studio"),
    getResolvedAboutPortrait(),
  ]);

  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          {hero.eyebrow ? (
            <p className="text-xs tracking-[0.22em] text-muted uppercase">{hero.eyebrow}</p>
          ) : null}
          <h1 className="mt-4 max-w-3xl font-serif text-4xl tracking-tight md:text-5xl">{hero.title}</h1>
          {hero.body ? (
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">{hero.body}</p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            <div className="relative aspect-[3/4] overflow-hidden border border-line bg-black/[0.03]">
              <Image
                src={portrait.image}
                alt={portrait.alt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
                priority
              />
            </div>
          </div>
          <div className="space-y-12 lg:col-span-7">
            <AboutBlock title={artistStatement.title} content={artistStatement.body} />
            <AboutBlock title={biography.title} content={biography.body} />
            <AboutBlock title={education.title} content={education.body} />
            <AboutBlock title={exhibitions.title} content={exhibitions.body} />
            <AboutBlock title={affiliations.title} content={affiliations.body} />
            <div className="border-t border-line pt-10 text-sm leading-relaxed text-muted">
              <div className="font-medium text-ink">{studio.title}</div>
              <div className="mt-3">
                <ProseMarkdown content={studio.body} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
