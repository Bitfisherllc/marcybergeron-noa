import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";
import { richTextElementClass } from "@/lib/richText";

export const richTextRemarkPlugins = [remarkBreaks];
export const richTextRehypePlugins = [rehypeRaw];

export const richTextComponents: Components = {
  a({ href, children }) {
    if (href?.startsWith("/")) return <Link href={href}>{children}</Link>;
    if (!href || !/^https?:/i.test(href)) return <a href={href}>{children}</a>;
    return (
      <a href={href} rel="noreferrer" target="_blank">
        {children}
      </a>
    );
  },
};

const linklessComponents: Components = {
  a({ children }) {
    return <span>{children}</span>;
  },
};

/** Renders admin text (editor HTML, or older Markdown / plain text) with line breaks and formatting. */
export function RichText({
  content,
  className = "",
  spacing = "[&>*+*]:mt-[0.75em]",
  insideLink = false,
}: {
  content: string | null | undefined;
  className?: string;
  /** Gap between paragraphs and other blocks. */
  spacing?: string;
  /** Inside a clickable card: render links as plain text so anchors are not nested. */
  insideLink?: boolean;
}) {
  if (!content?.trim()) return null;
  return (
    <div className={`${spacing} [&_h2]:text-2xl [&_h3]:text-xl ${richTextElementClass} ${className}`}>
      <ReactMarkdown
        remarkPlugins={richTextRemarkPlugins}
        rehypePlugins={richTextRehypePlugins}
        components={insideLink ? linklessComponents : richTextComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
