/** Hide seed/admin placeholder copy until real gallery text is entered. */

export function publicGalleryExcerpt(excerpt: string): string | null {
  const text = excerpt.trim();
  if (!text) return null;
  if (/^placeholder series/i.test(text)) return null;
  if (/will be filled in as this body of work takes shape/i.test(text)) return null;
  return excerpt.trim();
}

export function publicGalleryStatement(content: string): string | null {
  const text = content.trim();
  if (!text) return null;
  if (/reserved as a placeholder gallery on the site/i.test(text)) return null;
  if (/replace this statement, featured image, and works in the admin/i.test(text)) return null;
  return content.trim();
}
