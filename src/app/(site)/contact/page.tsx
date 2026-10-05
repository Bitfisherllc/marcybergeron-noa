import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { RichText } from "@/components/RichText";
import { SocialIcon } from "@/components/SocialIcon";
import { createFormChallenge } from "@/lib/formGuard";
import { buildArtworkInquiryMessage } from "@/lib/artworkInquiry";
import { phoneHref } from "@/lib/contactDefaults";
import { getSiteContact } from "@/lib/contactPage";
import { buildSeriesInquiryMessage } from "@/lib/seriesInquiry";
import { getArtwork, getArtworkGalleryMeta, getSeriesBySlug } from "@/lib/queries";
import { normalizeRouteSlug } from "@/lib/routeSlug";
import { SITE_URL } from "@/lib/site";
import { socialLinkLabel } from "@/lib/socialLinks";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact Marcy Bergeron-Noa",
  description:
    "Email, phone, studio location, and social links for abstract artist Marcy Bergeron-Noa at Porter Mill Studios in Beverly, MA.",
  alternates: { canonical: `${SITE_URL}/contact` },
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string; artwork?: string; series?: string }>;
}) {
  const sp = await searchParams;
  const formError = sp.error === "send" ? "send" : sp.error ? "fields" : null;
  const artworkId = String(sp.artwork ?? "").trim();
  const seriesSlug = normalizeRouteSlug(String(sp.series ?? ""));
  const contact = await getSiteContact();

  let defaultMessage = "";
  const inquiryPiece = artworkId ? await getArtwork(artworkId) : null;
  const inquirySeries = !inquiryPiece && seriesSlug ? await getSeriesBySlug(seriesSlug) : null;

  if (inquiryPiece) {
    const meta = await getArtworkGalleryMeta([artworkId]);
    defaultMessage = buildArtworkInquiryMessage(inquiryPiece, meta.get(artworkId));
  } else if (inquirySeries) {
    defaultMessage = buildSeriesInquiryMessage(inquirySeries);
  }

  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          {contact.eyebrow ? (
            <p className="text-xs tracking-[0.22em] text-muted uppercase">{contact.eyebrow}</p>
          ) : null}
          <div className="mt-4 flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between sm:gap-10 lg:gap-14">
            <div className="min-w-0 flex-1">
              <h1 className="max-w-3xl font-serif text-3xl tracking-tight sm:text-4xl md:text-5xl">{contact.title}</h1>
              <RichText
                content={contact.intro}
                spacing="[&>*+*]:mt-4"
                className="mt-6 max-w-2xl text-sm leading-relaxed text-muted sm:text-base [&_a]:font-medium [&_a]:text-ink/90"
              />
            </div>
            <div className="flex shrink-0 justify-start sm:justify-end">
              <img
                src="/images/logo.svg"
                alt="Marcy Bergeron-Noa — hand-drawn studio mark"
                width={512}
                height={1254}
                decoding="async"
                fetchPriority="high"
                className="h-36 w-auto object-contain brightness-0 sm:h-44 md:h-52"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
          <div className="space-y-10 lg:col-span-5">
            <div>
              <h2 className="font-serif text-2xl tracking-tight">Direct</h2>
              <div className="mt-5 h-px w-16 bg-line" />
              <dl className="mt-8 space-y-4 text-sm">
                <div>
                  <dt className="text-xs tracking-[0.18em] text-muted uppercase">Email</dt>
                  <dd className="mt-2">
                    <a className="link-quiet" href={`mailto:${contact.email}`}>
                      {contact.email}
                    </a>
                  </dd>
                </div>
                {contact.phone ? (
                  <div>
                    <dt className="text-xs tracking-[0.18em] text-muted uppercase">Phone</dt>
                    <dd className="mt-2">
                      <a className="link-quiet" href={phoneHref(contact.phone)}>
                        {contact.phone}
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>

            {contact.studioLines.length > 0 ? (
              <div>
                <h2 className="font-serif text-2xl tracking-tight">Studio</h2>
                <div className="mt-5 h-px w-16 bg-line" />
                <address className="mt-8 space-y-1 text-sm not-italic leading-relaxed text-muted">
                  {contact.studioLines.map((l, i) => (
                    <div key={`${i}-${l}`}>{l}</div>
                  ))}
                </address>
              </div>
            ) : null}

            {contact.socialLinks.length > 0 ? (
              <div>
                <h2 className="font-serif text-2xl tracking-tight">Social</h2>
                <div className="mt-5 h-px w-16 bg-line" />
                <ul className="mt-8 flex flex-wrap gap-5">
                  {contact.socialLinks.map((link) => (
                    <li key={link.url}>
                      <a
                        className="inline-flex text-ink/80 transition-colors hover:text-ink focus-ring rounded-sm"
                        href={link.url}
                        rel="me noreferrer"
                        target="_blank"
                        aria-label={socialLinkLabel(link)}
                        title={socialLinkLabel(link)}
                      >
                        <SocialIcon url={link.url} size={28} />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="space-y-8 lg:col-span-7">
            <div className="border border-line bg-white/50 p-6 md:p-8" id="message">
              {sp.sent ? (
                <div role="status">
                  <p className="text-xs tracking-[0.22em] text-muted uppercase">Message sent</p>
                  <h2 className="mt-4 font-serif text-2xl tracking-tight md:text-3xl">Thank you</h2>
                  <p className="mt-5 max-w-prose text-base leading-relaxed text-muted">
                    Your note is on its way to the studio. A confirmation is also going to the email address you
                    shared. Marcy will read your message and reply as soon as she can.
                  </p>
                  <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">
                    If you think of anything else, you are welcome to send another message, or write directly to{" "}
                    <a className="link-quiet text-ink/90" href={`mailto:${contact.email}`}>
                      {contact.email}
                    </a>
                    .
                  </p>
                  <Link
                    href="/contact"
                    className="mt-8 inline-flex items-center border border-ink bg-ink px-5 py-3 text-xs tracking-[0.18em] text-paper uppercase hover:bg-ink/90 focus-ring"
                  >
                    Send another message
                  </Link>
                </div>
              ) : (
                <>
                  <h2 className="font-serif text-2xl tracking-tight">Send a message</h2>
                  <p className="mt-3 text-sm text-muted">
                    Your message is emailed to the studio at {contact.email}. For urgent requests, email directly.
                  </p>

                  {inquiryPiece ? (
                    <p className="mt-4 text-sm text-muted">
                      Inquiring about <span className="text-ink/90">{inquiryPiece.title}</span>. The message below is a
                      starting point—you can edit it before sending.
                    </p>
                  ) : null}
                  {inquirySeries ? (
                    <p className="mt-4 text-sm text-muted">
                      Inquiring about the <span className="text-ink/90">{inquirySeries.title}</span> series. The message
                      below is a starting point—you can edit it before sending.
                    </p>
                  ) : null}

                  {formError === "fields" ? (
                    <p className="mt-4 text-sm text-red-700">Please complete all fields and try again.</p>
                  ) : null}
                  {formError === "send" ? (
                    <p className="mt-4 text-sm text-red-700">
                      Your message was saved, but the email could not be sent. Please try again or email directly.
                    </p>
                  ) : null}

                  <ContactForm
                    challenge={createFormChallenge()}
                    artworkId={artworkId && inquiryPiece ? artworkId : undefined}
                    seriesSlug={seriesSlug && inquirySeries ? seriesSlug : undefined}
                    defaultMessage={defaultMessage}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
