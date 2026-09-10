import type { Metadata } from "next";
import Link from "next/link";
import { ProseMarkdown } from "@/components/ProseMarkdown";
import { CONTACT, SITE_NAME, SITE_URL } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: `Privacy Policy — ${SITE_NAME}`,
  description: `${SITE_NAME} does not sell or share your information. Join the mailing list optionally, and unsubscribe at any time.`,
  alternates: { canonical: `${SITE_URL}/privacy` },
};

const POLICY = `This site is run by **${SITE_NAME}** for studio visitors, collectors, and friends of the work. This policy explains, in plain language, what we collect and how we treat it.

## We do not share your information

We **do not sell, rent, or share** your name, email, or messages with third parties for their marketing. Information you send us is used only to run this studio site and to stay in touch about the work—new paintings, exhibitions, open studios, and replies to your inquiries.

## Mailing list

Joining the mailing list is **optional**. If you sign up, we store the name you give (if any) and your email so we can send occasional studio updates.

**You can unsubscribe at any time.** There is no lock-in and no extra steps. Email [${CONTACT.email}](mailto:${CONTACT.email}) and ask to be removed; we will take you off the list promptly. If a newsletter service is added later, each message will also include an easy unsubscribe link.

We do not send frequent promotional mail. Updates are occasional and related to the studio.

## Other information we may receive

- **Contact form:** name, email, and the message you write, so we can reply.
- **Directions page:** if you choose to share your location in the browser, that stays on your device to estimate distance to the studio. We do not store it.
- **Site hosting:** the website and database are hosted by trusted providers who process data only as needed to keep the site running.

We do not use visitor information for advertising networks.

## Questions

If you have a privacy question, want a copy of what we have on file, or want something deleted, email [${CONTACT.email}](mailto:${CONTACT.email}).
`;

export default function PrivacyPage() {
  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <p className="text-xs tracking-[0.22em] text-muted uppercase">Privacy</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl tracking-tight md:text-5xl">Privacy Policy</h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
            How this studio site treats the information you choose to share—and how to leave the mailing list whenever
            you like.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <div className="max-w-3xl">
          <ProseMarkdown content={POLICY} variant="article" />
          <p className="mt-12 text-sm text-muted">
            <Link href="/mailing-list" className="link-quiet">
              Join the mailing list
            </Link>
            {" · "}
            <Link href="/contact" className="link-quiet">
              Contact
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
