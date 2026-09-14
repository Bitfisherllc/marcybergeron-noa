/** Hide seed/admin placeholder copy until real gallery text is entered. */

export function isPlaceholderGalleryExcerpt(excerpt: string): boolean {
  const text = excerpt.trim();
  if (!text) return true;
  if (/^placeholder series/i.test(text)) return true;
  if (/will be filled in as this body of work takes shape/i.test(text)) return true;
  if (/^Works in /i.test(text)) return true;
  if (/^Works from /i.test(text)) return true;
  return false;
}

export function isPlaceholderGalleryStatement(content: string): boolean {
  const text = content.trim();
  if (!text) return true;
  if (/reserved as a placeholder gallery on the site/i.test(text)) return true;
  if (/replace this statement, featured image, and works in the admin/i.test(text)) return true;
  return false;
}

export function publicGalleryExcerpt(excerpt: string): string | null {
  if (isPlaceholderGalleryExcerpt(excerpt)) return null;
  return excerpt.trim();
}

export function publicGalleryStatement(content: string): string | null {
  if (isPlaceholderGalleryStatement(content)) return null;
  return content.trim();
}
