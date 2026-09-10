export const STARTER_POST_CATEGORIES = [
  { name: "In The Studio", slug: "in-the-studio" },
  { name: "Workshops", slug: "workshops" },
  { name: "Juried Exhibitions", slug: "juried-exhibitions" },
] as const;

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
