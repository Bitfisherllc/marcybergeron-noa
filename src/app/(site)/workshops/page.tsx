import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Workshops",
  description: "Workshops with Marcy Bergeron-Noa—dates and details will be posted here.",
  alternates: { canonical: `${SITE_URL}/workshops` },
};

export default function WorkshopsPage() {
  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <p className="text-xs tracking-[0.22em] text-muted uppercase">Workshops</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl tracking-tight md:text-5xl">Workshops</h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
            Details about upcoming workshops will appear here.
          </p>
        </div>
      </section>
    </div>
  );
}
