/** Build image alt text from slide copy shown on the home hero. */
export function heroSlideAlt(title: string, subtitle: string): string {
  const parts = [title.trim(), subtitle.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(" — ") : "Homepage slideshow image";
}

export type HeroSlide = {
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  href?: string;
};

export function toHeroSlide(src: string, title = "", subtitle = "", alt?: string, href?: string): HeroSlide {
  const link = href?.trim();
  return {
    src,
    title,
    subtitle,
    alt: alt?.trim() || heroSlideAlt(title, subtitle),
    href: link || undefined,
  };
}
