import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RichText } from "@/components/RichText";
import { StudioDirectionsLinks, StudioLocationPanel } from "@/components/StudioDirectionsClient";
import { getSiteContact } from "@/lib/contactPage";
import { SITE_URL, STUDIO } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Directions — Porter Mill Studios",
  description:
    "Map and directions to Marcy Bergeron-Noa’s studio at Porter Mill, 95 Rantoul St., Beverly, MA — with optional browser location for distance.",
  alternates: { canonical: `${SITE_URL}/directions` },
};

export default async function DirectionsPage() {
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(STUDIO.mapsSearchQuery)}&output=embed&z=16`;
  const contact = await getSiteContact();

  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto max-w-3xl px-5 py-14 md:px-8 md:py-16">
          <Breadcrumbs
            items={[
              { label: "Contact", href: "/contact" },
              { label: "Directions", href: "/directions" },
            ]}
            className="mb-8"
          />
          {contact.directionsEyebrow ? (
            <p className="text-xs tracking-[0.22em] text-muted uppercase">{contact.directionsEyebrow}</p>
          ) : null}
          <h1 className="mt-4 font-serif text-4xl tracking-tight md:text-5xl">{contact.directionsTitle}</h1>
          <address className="mt-6 space-y-1 text-sm not-italic leading-relaxed text-muted">
            {contact.studioLines.map((l, i) => (
              <div key={`${i}-${l}`}>{l}</div>
            ))}
          </address>
          <RichText
            content={contact.directionsIntro}
            className="mt-6 max-w-prose text-sm leading-relaxed text-muted"
          />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-12 md:px-8 md:py-16">
        <figure className="mx-auto w-full">
          <figcaption className="mb-4 flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-3">
            <span className="text-xs tracking-[0.22em] text-muted uppercase">Studio location</span>
            <span className="text-xs leading-relaxed text-muted/85">Drag the map to explore · scroll to zoom</span>
          </figcaption>

          <div className="relative border border-line bg-gradient-to-b from-white/70 to-paper shadow-[0_1px_0_rgba(31,31,31,0.05)]">
            <div className="p-2 sm:p-3">
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#e4dfd4] ring-1 ring-ink/[0.06]">
                <iframe
                  title="Map — Porter Mill Studios, Beverly, MA"
                  src={mapSrc}
                  className="absolute inset-0 h-full w-full border-0 [filter:sepia(0.08)_saturate(0.86)_contrast(0.93)_brightness(1.04)]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
                {/* Warm paper cast + soft vignette; pointer-events none so the map stays fully interactive */}
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-b from-paper/35 via-transparent to-paper/50 mix-blend-multiply"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-0 shadow-[inset_0_0_100px_rgba(250,248,245,0.55),inset_0_0_0_1px_rgba(31,31,31,0.04)]"
                  aria-hidden
                />
              </div>
            </div>

            <StudioLocationPanel />
          </div>
        </figure>

        <StudioDirectionsLinks />
      </section>
    </div>
  );
}
