import Link from "next/link";
import type { PostCategory } from "@/db";
import { postPublicBasePath, type PostKind } from "@/lib/postKind";

export function PostCategoryNav({
  kind,
  categories,
  activeSlug,
  ariaLabel,
}: {
  kind: PostKind;
  categories: PostCategory[];
  activeSlug?: string;
  ariaLabel: string;
}) {
  if (categories.length === 0) return null;

  const indexHref = postPublicBasePath(kind);
  const linkClass = (active: boolean) =>
    `text-xs tracking-[0.18em] uppercase transition ${
      active ? "text-ink underline decoration-ink/30 underline-offset-8" : "text-muted hover:text-ink"
    }`;

  return (
    <nav aria-label={ariaLabel} className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
      <Link href={indexHref} className={linkClass(!activeSlug)}>
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`${indexHref}?category=${encodeURIComponent(c.slug)}`}
          className={linkClass(activeSlug === c.slug)}
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
