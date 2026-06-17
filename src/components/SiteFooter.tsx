import Link from "next/link";
import { CONTACT, SITE_DOMAIN, SITE_NAME } from "@/lib/site";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 8.5h2.5L16 12h-2v8h-3.5v-8H9V8.5h2.5V6.8c0-1 .3-2.2 1.2-3 1-.9 2.2-1.3 3.5-1.3H17v3h-2c-.7 0-1.4.1-1.4 1v1.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

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
              <a
                className="link-quiet inline-flex items-center gap-2"
                href={CONTACT.instagram}
                rel="me noreferrer"
                target="_blank"
              >
                <InstagramIcon className="shrink-0 opacity-70" />
                Instagram
              </a>
            </li>
            <li>
              <a
                className="link-quiet inline-flex items-center gap-2"
                href={CONTACT.facebook}
                rel="noreferrer"
                target="_blank"
              >
                <FacebookIcon className="shrink-0 opacity-70" />
                Facebook
              </a>
            </li>
            <li>
              <Link className="link-quiet" href="/contact">
                Contact Marcy
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
