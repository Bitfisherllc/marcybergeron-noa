import Link from "next/link";
import { CONTACT, SITE_DOMAIN, SITE_NAME } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3 md:px-8">
        <div>
          <div className="font-serif text-xl tracking-tight">{SITE_NAME}</div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Abstract paintings and series-based work. Studio at Porter Mill, Beverly, Massachusetts.
          </p>
          <p className="mt-4">
            <Link className="link-quiet text-sm" href="/mailing-list">
              Join the mailing list
            </Link>
          </p>
        </div>
        <div className="text-sm leading-relaxed text-muted">
          <div className="font-medium text-ink">Studio</div>
          <div className="mt-2 space-y-1">
            {CONTACT.studioLines.map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
          <div className="mt-4 space-y-1">
            <a className="link-quiet" href={`mailto:${CONTACT.email}`}>
              {CONTACT.email}
            </a>
            <div>
              <a className="link-quiet" href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}>
                {CONTACT.phone}
              </a>
            </div>
          </div>
        </div>
        <div className="text-sm text-muted">
          <div className="font-medium text-ink">Connect</div>
          <ul className="mt-3 space-y-2">
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
            <li>
              <Link className="link-quiet" href="/contact">
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-6 text-xs text-muted md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <span>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</span>
            <img
              src="/images/sig.svg"
              alt="Signature — Marcy Bergeron-Noa"
              width={1448}
              height={385}
              className="h-6 max-w-[9rem] object-contain object-left opacity-[0.72] sm:h-7 sm:max-w-[11rem] md:max-w-[13rem]"
            />
          </div>
          <div className="flex flex-col gap-2 text-muted/90 md:items-end">
            <span>{SITE_DOMAIN}</span>
            <Link className="link-quiet text-muted/80 hover:text-ink/80" href="/admin">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
