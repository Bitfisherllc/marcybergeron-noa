import type { Metadata } from "next";
import Link from "next/link";
import { submitContact } from "@/app/(site)/contact/actions";
import { CONTACT, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Marcy Bergeron-Noa",
  description:
    "Email, phone, studio location, and social links for abstract artist Marcy Bergeron-Noa at Porter Mill Studios in Beverly, MA.",
  alternates: { canonical: `${SITE_URL}/contact` },
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <p className="text-xs tracking-[0.22em] text-muted uppercase">Contact</p>
          <div className="mt-4 flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between sm:gap-10 lg:gap-14">
            <div className="min-w-0 flex-1">
              <h1 className="max-w-3xl font-serif text-3xl tracking-tight sm:text-4xl md:text-5xl">Reach the studio</h1>
              <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                For availability, commissions, and exhibition inquiries, email is the most reliable path. Phone messages
                are welcome for time-sensitive notes.
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                <Link href="/directions" className="link-quiet font-medium text-ink/90">
                  Directions &amp; map
                </Link>
                {" "}
                — driving, transit, and an interactive map, plus (if you choose) approximate distance from your
                current location in the browser.
              </p>
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
                    <a className="link-quiet" href={`mailto:${CONTACT.email}`}>
                      {CONTACT.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs tracking-[0.18em] text-muted uppercase">Phone</dt>
                  <dd className="mt-2">
                    <a className="link-quiet" href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}>
                      {CONTACT.phone}
                    </a>
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h2 className="font-serif text-2xl tracking-tight">Studio</h2>
              <div className="mt-5 h-px w-16 bg-line" />
              <address className="mt-8 space-y-1 text-sm not-italic leading-relaxed text-muted">
                {CONTACT.studioLines.map((l) => (
                  <div key={l}>{l}</div>
                ))}
              </address>
            </div>

            <div>
              <h2 className="font-serif text-2xl tracking-tight">Social</h2>
              <div className="mt-5 h-px w-16 bg-line" />
              <ul className="mt-8 space-y-3 text-sm">
                <li>
                  <a className="link-quiet" href={CONTACT.instagram} rel="me noreferrer" target="_blank">
                    Instagram
                  </a>
                </li>
                <li>
                  <a className="link-quiet" href={CONTACT.facebook} rel="noreferrer" target="_blank">
                    Facebook
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-8 lg:col-span-7">
            <div className="border border-line bg-white/50 p-6">
              <h2 className="font-serif text-2xl tracking-tight">Send a message</h2>
              <p className="mt-3 text-sm text-muted">
                This form stores a message for follow-up. For time-sensitive requests, email directly.
              </p>

              {sp.sent ? <p className="mt-4 text-sm text-ink">Thank you—your message was received.</p> : null}
              {sp.error ? <p className="mt-4 text-sm text-red-700">Please complete all fields and try again.</p> : null}

              <form action={submitContact} className="mt-6 space-y-4">
                <label className="block text-sm text-muted">
                  Name
                  <input name="name" required className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm text-muted">
                  Email
                  <input name="email" type="email" required className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm text-muted">
                  Message
                  <textarea name="message" required rows={6} className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
                </label>
                <button className="border border-ink bg-ink px-5 py-3 text-xs tracking-[0.18em] text-paper uppercase" type="submit">
                  Send
                </button>
              </form>
            </div>

            <p className="text-xs text-muted">
              Legacy reference site:{" "}
              <a className="link-quiet" href="https://www.mbergeronnoa.com/">
                mbergeronnoa.com
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
