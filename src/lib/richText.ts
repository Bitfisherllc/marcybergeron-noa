/** Admin text fields store editor HTML; older rows are Markdown or plain text. Both render through `RichText`. */

const HTML_BLOCK = /^\s*<(p|h[1-6]|ul|ol|blockquote|div|hr)[\s>/]/i;

export function isRichTextHtml(value: string): boolean {
  return HTML_BLOCK.test(value);
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

/** Plain text for meta descriptions, alt text, and placeholder checks. */
export function richTextToPlain(value: string | null | undefined): string {
  if (!value) return "";
  let text = value;
  if (isRichTextHtml(text)) {
    text = text
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|h[1-6]|li|blockquote|div)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m);
  } else {
    text = text
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, "")
      .replace(/(\*\*|__|\*|_|~~)(.+?)\1/g, "$2");
  }
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

/** Element styles shared by the public renderer and the admin editor so both look the same. */
export const richTextElementClass = [
  "[&_a]:underline [&_a]:underline-offset-2",
  "[&_strong]:font-semibold",
  "[&_h2]:font-serif [&_h2]:tracking-tight [&_h2]:text-ink",
  "[&_h3]:font-serif [&_h3]:tracking-tight [&_h3]:text-ink",
  "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li>p]:my-0",
  "[&_blockquote]:border-l-2 [&_blockquote]:border-line [&_blockquote]:pl-4 [&_blockquote]:italic",
  "[&_hr]:my-6 [&_hr]:border-line",
  "[&_p:empty]:min-h-[1em]",
].join(" ");
