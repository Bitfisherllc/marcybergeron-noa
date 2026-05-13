import type { Metadata } from "next";
import Image from "next/image";
import { ProseMarkdown } from "@/components/ProseMarkdown";
import { CONTACT, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Marcy Bergeron-Noa",
  description:
    "Biography, artist statement, education, exhibitions, and affiliations for abstract painter Marcy Bergeron-Noa.",
  alternates: { canonical: `${SITE_URL}/about` },
};

const statement = `Marcy Bergeron-Noa’s abstract paintings move between observation and intuition—layering encaustic, oil, cold wax, and pastel to build surfaces that reward slow looking.

Her work is organized in series that trace recurring questions: how we find direction, what rests beneath the visible, where solace lives in landscape and memory, and how rhythm appears in small daily shifts.`;

const bio = `Marcy Bergeron-Noa is a Massachusetts-based abstract artist working primarily in encaustic, oil, and cold wax. Her practice is grounded in continued study and studio discipline, with a focus on material depth, restrained color, and tactile surfaces.

She maintains a studio at Porter Mill in Beverly, MA, where she develops bodies of work as discrete series—each with its own language, but connected by an ongoing search for clarity and connection.`;

const education = `## Education, workshops, and classes

- Peabody Essex Museum — Still life drawing (2001)
- Montserrat College of Art Continuing Education, Beverly, MA (2006–2012) — oil (still life and figure), pastel, landscape in acrylic, acrylic painting, mixed media with Maria Malatesta, encaustic with Kim Bernard
- Truro Center for the Arts, Truro, MA — International Encaustic Conference (2007–2020), including pre/post conference workshops with Tracy Spadafora, Sandi Miot, Lia Rothstein, Laura Moriarty, and others
- Annual Maine Encaustic Retreat — with Kim Bernard (2011–2015) and Dietland Vander Schaaf (2015–2019)
- Introduction to Cold Wax — San Miguel de Allende, MX (3/2020) with Jerry McLaughlin
- Cold Wax Academy (9/2020–present) with Jerry McLaughlin & Rebecca Crowell`;

const exhibitions = `## Selected exhibitions

- Porter Mill Gallery — curator and contributor, “A Common Thread, 4 Artists: 1 Connection” (Beverly, MA)
- Porter Mill Gallery — “Celebrating Small Works” (Beverly, MA)
- Marblehead Arts Association Gallery — “Emerging New Artists Show” (Marblehead, MA)
- Berta Walker Gallery — “Learning/Medium/Opportunity” (Provincetown, MA)`;

const affiliations = `## Affiliations (juried member)

- Marblehead Arts Association
- Rocky Neck Cultural Center
- Cambridge Arts Association
- Yellow Chair Salon`;

export default function AboutPage() {
  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <p className="text-xs tracking-[0.22em] text-muted uppercase">About</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl tracking-tight md:text-5xl">Marcy Bergeron-Noa</h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
            Abstract painter working in encaustic, oil, cold wax, and pastel—based in Beverly, Massachusetts.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            <div className="relative aspect-[3/4] overflow-hidden border border-line bg-black/[0.03]">
              <Image
                src="/images/bio.webp"
                alt="Portrait of Marcy Bergeron-Noa in the studio"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
                priority
              />
            </div>
          </div>
          <div className="space-y-12 lg:col-span-7">
            <div>
              <h2 className="font-serif text-3xl tracking-tight">Artist statement</h2>
              <div className="mt-5 h-px w-16 bg-line" />
              <div className="mt-8">
                <ProseMarkdown content={statement} />
              </div>
            </div>
            <div>
              <h2 className="font-serif text-3xl tracking-tight">Biography</h2>
              <div className="mt-5 h-px w-16 bg-line" />
              <div className="mt-8">
                <ProseMarkdown content={bio} />
              </div>
            </div>
            <div>
              <ProseMarkdown content={education} />
            </div>
            <div>
              <ProseMarkdown content={exhibitions} />
            </div>
            <div>
              <ProseMarkdown content={affiliations} />
            </div>
            <div className="border-t border-line pt-10 text-sm leading-relaxed text-muted">
              <div className="font-medium text-ink">Studio</div>
              <div className="mt-3 space-y-1">
                {CONTACT.studioLines.map((l) => (
                  <div key={l}>{l}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
