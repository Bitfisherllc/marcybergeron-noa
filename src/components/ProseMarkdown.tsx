import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

/** Indented lines after a blank break inside seeded gallery HTML were parsed as markdown code blocks. */
function normalizePostGalleryHtml(content: string): string {
  return content
    .replace(
      /<p class="mt-3 text-sm leading-relaxed text-muted">/g,
      '<div class="mt-3 text-sm leading-relaxed text-muted">',
    )
    .replace(
      /<p class="mt-3 text-sm leading-relaxed text-ink\/50 italic">/g,
      '<div class="mt-3 text-sm leading-relaxed text-ink/50 italic">',
    )
    .replace(
      /(<div class="mt-3 text-sm leading-relaxed text-(?:muted|ink\/50 italic)">[\s\S]*?)<\/p>/g,
      "$1</div>",
    )
    .replace(/\n    \n    <(?:p|div) class="mt-3 text-sm leading-relaxed/g, '\n    <div class="mt-3 text-sm leading-relaxed');
}

const sharedMarkdown =
  "[&_h2]:font-serif [&_h2]:tracking-tight [&_h2]:text-ink [&_h2:first-child]:mt-0 [&_p]:text-muted [&_p_img]:mx-auto [&_p_img]:block [&_p_img]:max-h-[min(70vh,640px)] [&_p_img]:w-auto [&_p_img]:max-w-full [&_p_img]:border [&_p_img]:border-line [&_p_img]:bg-black/[0.03] [&_p_img]:object-contain [&_strong]:text-ink";

/** `article` matches news post layout: full column width, looser vertical rhythm like About. */
export function ProseMarkdown({
  content,
  variant = "default",
}: {
  content: string;
  variant?: "default" | "article";
}) {
  const layout =
    variant === "article"
      ? `max-w-none w-full space-y-6 text-base leading-relaxed text-muted [&_h2]:mt-10 [&_h2]:text-2xl md:[&_h2]:text-3xl [&_h2]:scroll-mt-24 [&_h3]:mt-8 [&_h3]:font-serif [&_h3]:text-xl [&_h3]:tracking-tight [&_h3]:text-ink [&_ul]:my-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_li]:my-0 [&_p_img]:my-6 [&_.post-gallery]:my-10`
      : `max-w-prose space-y-4 text-sm leading-relaxed text-muted [&_h2]:mt-10 [&_h2]:text-2xl [&_li]:my-1 [&_p_img]:my-2 [&_.post-gallery]:my-12`;

  return (
    <div className={`${layout} ${sharedMarkdown}`}>
      <ReactMarkdown rehypePlugins={[rehypeRaw]}>
        {variant === "article" ? normalizePostGalleryHtml(content) : content}
      </ReactMarkdown>
    </div>
  );
}
