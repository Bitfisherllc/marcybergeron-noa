import type { PostKind } from "@/lib/postKind";

export const STARTER_NEWS_CATEGORIES = [
  { name: "In The Studio", slug: "in-the-studio" },
  { name: "Juried Exhibitions", slug: "juried-exhibitions" },
] as const;

export const STARTER_WORKSHOP_CATEGORIES = [
  { name: "Upcoming", slug: "upcoming" },
  { name: "Past", slug: "past" },
] as const;

export const STARTER_POST_CATEGORIES = STARTER_NEWS_CATEGORIES;

export function starterCategoriesForKind(kind: PostKind) {
  return kind === "workshop" ? STARTER_WORKSHOP_CATEGORIES : STARTER_NEWS_CATEGORIES;
}

export function slugifyPostCategory(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "category";
}
