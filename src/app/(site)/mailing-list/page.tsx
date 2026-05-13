import type { Metadata } from "next";
import Link from "next/link";
import { submitMailingListSignup } from "@/app/(site)/mailing-list/actions";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Mailing list — ${SITE_NAME}`,
  description: `Join ${SITE_NAME}'s mailing list for studio news, exhibitions, and occasional updates.`,
  alternates: { canonical: `${SITE_URL}/mailing-list` },
};

export default async function MailingListPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <p className="text-xs tracking-[0.22em] text-muted uppercase">Mailing list</p>
          <h1 className="mt-4 max-w-3xl font-serif text-3xl tracking-tight sm:text-4xl md:text-5xl">Stay in touch</h1>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            Add your name and email to hear about new work, open studios, and exhibitions. Your details are stored for
            studio use only; a newsletter service may be connected later.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <div className="flex flex-col items-center gap-10 md:flex-row md:items-start md:justify-start md:gap-12 lg:gap-16">
          <div className="flex w-full shrink-0 justify-center md:w-auto md:justify-start md:pt-1">
            <img
              src="/images/logo.svg"
              alt="Marcy Bergeron-Noa — hand-drawn studio mark"
              width={512}
              height={1254}
              decoding="async"
              className="h-32 w-auto max-w-[min(12rem,42vw)] object-contain brightness-0 sm:h-36 md:h-40 md:max-w-none"
            />
          </div>
          <div className="w-full max-w-lg border border-line bg-white/50 p-6 md:min-w-0">
            {sp.ok ? (
              <p className="text-sm text-ink">Thank you—you are on the list (or already were).</p>
            ) : null}
            {sp.error ? <p className="text-sm text-red-700">Please enter a valid email address.</p> : null}

            {!sp.ok ? (
              <form action={submitMailingListSignup} className="mt-2 space-y-4">
                <label className="block text-sm text-muted">
                  Name <span className="text-muted/70">(optional)</span>
                  <input name="name" className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm text-muted">
                  Email
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
                  />
                </label>
                <div className="hidden" aria-hidden="true">
                  <label>
                    Company
                    <input name="company" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>
                <button
                  className="border border-ink bg-ink px-5 py-3 text-xs tracking-[0.18em] text-paper uppercase"
                  type="submit"
                >
                  Join the list
                </button>
              </form>
            ) : (
              <p className="mt-6 text-sm text-muted">
                <Link className="link-quiet" href="/">
                  Back to home
                </Link>
                {" · "}
                <Link className="link-quiet" href="/contact">
                  Contact
                </Link>
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
