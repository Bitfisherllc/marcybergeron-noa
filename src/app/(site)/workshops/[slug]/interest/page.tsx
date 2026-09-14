import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { submitWorkshopInterest } from "@/app/(site)/workshops/[slug]/interest/actions";
import { WorkshopInterestForm } from "@/components/WorkshopInterestForm";
import { getPostBySlug, listPublishedPosts } from "@/lib/queries";
import { parsePostKind, postPublicHref } from "@/lib/postKind";
import { normalizeRouteSlug } from "@/lib/routeSlug";
import { SITE_URL } from "@/lib/site";
import { WORKSHOP_MATERIALS_DEFAULT, WORKSHOP_PRICE_FLOOR_NOTE, workshopInterestHref } from "@/lib/workshopCopy";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = normalizeRouteSlug(rawSlug);
  const p = await getPostBySlug(slug);
  if (!p || !p.published || parsePostKind(p.kind) !== "workshop") return {};
  return {
    title: `I’m interested — ${p.title}`,
    description: `Tell Marcy you are interested in ${p.title}.`,
    alternates: { canonical: `${SITE_URL}${workshopInterestHref(p.slug)}` },
  };
}

export default async function WorkshopInterestPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = normalizeRouteSlug(rawSlug);
  const sp = await searchParams;
  const [p, published] = await Promise.all([getPostBySlug(slug), listPublishedPosts("workshop")]);
  if (!p || !p.published || parsePostKind(p.kind) !== "workshop") notFound();

  const others = published
    .filter((row) => row.slug !== p.slug)
    .map((row) => ({ slug: row.slug, title: row.title }));
  const href = postPublicHref("workshop", p.slug);

  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <p className="text-xs tracking-[0.22em] text-muted uppercase">Workshops</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl tracking-tight md:text-5xl">I&apos;m interested</h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
            A short note for Marcy about {p.title}. She will follow up about upcoming dates, or about a private or
            group session.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-14 md:px-8 md:py-16">
        <div className="border border-line bg-white/50 p-6 md:p-10">
          {sp.sent ? (
            <div role="status">
              <p className="text-xs tracking-[0.22em] text-muted uppercase">Sent</p>
              <h2 className="mt-4 font-serif text-2xl tracking-tight md:text-3xl">Thank you</h2>
              <p className="mt-5 max-w-prose text-base leading-relaxed text-muted">
                Marcy has your interest in {p.title}. She will write when she has dates, or to talk through a private
                session. {WORKSHOP_MATERIALS_DEFAULT} {WORKSHOP_PRICE_FLOOR_NOTE}
              </p>
              <Link href={href} className="mt-8 inline-flex link-quiet text-sm">
                ← Back to {p.title}
              </Link>
            </div>
          ) : (
            <>
              {sp.error === "fields" ? (
                <p className="mb-6 text-sm text-red-700">Please complete the required fields and try again.</p>
              ) : null}
              {sp.error === "send" ? (
                <p className="mb-6 text-sm text-red-700">
                  Your note was saved, but the email could not be sent. Marcy still has it in admin. You can also write
                  directly.
                </p>
              ) : null}
              <WorkshopInterestForm
                workshopTitle={p.title}
                workshopSlug={p.slug}
                otherWorkshops={others}
                action={submitWorkshopInterest}
              />
            </>
          )}
        </div>
        <p className="mt-8">
          <Link href={href} className="link-quiet text-sm">
            ← Back to {p.title}
          </Link>
        </p>
      </section>
    </div>
  );
}
