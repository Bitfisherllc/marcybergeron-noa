import Link from "next/link";
import type { PostCategory } from "@/db";

export function NewsCategoryNav({
  categories,
  activeSlug,
}: {
  categories: PostCategory[];
  activeSlug?: string;
}) {
  if (categories.length === 0) return null;

  const linkClass = (active: boolean) =>
    `text-xs tracking-[0.18em] uppercase transition ${
      active ? "text-ink underline decoration-ink/30 underline-offset-8" : "text-muted hover:text-ink"
    }`;

  return (
    <nav aria-label="Filter posts by category" className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
      <Link href="/news" className={linkClass(!activeSlug)}>
        All
      </Link>
      {categories.map((c) => (
        <Link key={c.id} href={`/news?category=${encodeURIComponent(c.slug)}`} className={linkClass(activeSlug === c.slug)}>
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
