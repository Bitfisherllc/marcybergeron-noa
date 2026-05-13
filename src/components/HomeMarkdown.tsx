"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";

type Props = {
  markdown: string;
  className?: string;
};

export function HomeMarkdown({ markdown, className = "" }: Props) {
  if (!markdown.trim()) return null;
  return (
    <div className={`text-sm leading-relaxed text-muted [&_p+p]:mt-6 ${className}`}>
      <ReactMarkdown
        components={{
          a({ href, children }) {
            if (href?.startsWith("/")) {
              return (
                <Link href={href} className="link-quiet">
                  {children}
                </Link>
              );
            }
            return (
              <a href={href} className="link-quiet" rel="noreferrer" target="_blank">
                {children}
              </a>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
