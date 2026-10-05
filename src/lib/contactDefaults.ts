import { CONTACT } from "@/lib/site";
import type { SocialLink } from "@/lib/socialLinks";

export type SiteContact = {
  /** Fixed: the contact form delivers to this mailbox. */
  email: string;
  eyebrow: string;
  title: string;
  intro: string;
  phone: string;
  studioLines: string[];
  socialLinks: SocialLink[];
  directionsEyebrow: string;
  directionsTitle: string;
  directionsIntro: string;
};

export const CONTACT_PAGE_ID = "default";

export const CONTACT_PAGE_PARTS = ["heading", "details", "social", "directions"] as const;
export type ContactPagePart = (typeof CONTACT_PAGE_PARTS)[number];

export const SITE_CONTACT_DEFAULTS: SiteContact = {
  email: CONTACT.email,
  eyebrow: "Contact",
  title: "Reach the studio",
  intro: [
    "For availability, commissions, and exhibition inquiries, email is the most reliable path. Phone messages are welcome for time-sensitive notes.",
    "",
    "[Directions & map](/directions) — driving, transit, and an interactive map, plus (if you choose) approximate distance from your current location in the browser.",
  ].join("\n"),
  phone: CONTACT.phone,
  studioLines: [...CONTACT.studioLines],
  socialLinks: [{ label: "Instagram", url: CONTACT.instagram }],
  directionsEyebrow: "Visit",
  directionsTitle: "Directions to the studio",
  directionsIntro:
    "The map below is interactive in your browser. Use your device location (optional) to see approximate straight-line distance, then open Google or Apple Maps for turn-by-turn directions.",
};

export function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
