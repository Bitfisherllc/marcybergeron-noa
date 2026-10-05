import type { ReactNode } from "react";
import { socialPlatform, type SocialPlatform } from "@/lib/socialLinks";

const stroke = { stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const paths: Record<SocialPlatform, ReactNode> = {
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" {...stroke} />
      <circle cx="12" cy="12" r="4" {...stroke} />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </>
  ),
  facebook: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" {...stroke} />
      <path d="M15.5 8H14a2 2 0 0 0-2 2v11M9.5 13h5" {...stroke} />
    </>
  ),
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" {...stroke} />
      <path d="M7.5 10.5V17M7.5 7.25v.01M11.5 17v-6.5M11.5 13.25c0-1.6 1.1-2.75 2.5-2.75s2.5 1 2.5 2.75V17" {...stroke} />
    </>
  ),
  youtube: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" {...stroke} />
      <path d="M10.5 9.5v5l4.25-2.5-4.25-2.5Z" {...stroke} />
    </>
  ),
  x: <path d="M4.5 4.5l15 15M19.5 4.5l-6.2 6.7M10.7 12.8 4.5 19.5" {...stroke} />,
  pinterest: (
    <>
      <circle cx="12" cy="12" r="9" {...stroke} />
      <path d="M11 9.5c.6-1 1.6-1.5 2.6-1.3 1.6.3 2.4 1.9 1.9 3.6-.4 1.5-1.6 2.5-2.9 2.2-.8-.2-1.3-.8-1.4-1.5M12.2 10.5 10 20" {...stroke} />
    </>
  ),
  tiktok: <path d="M13.5 3.5v11.25a3.25 3.25 0 1 1-3.25-3.25M13.5 3.5c.4 2.4 2 4 4.5 4.25" {...stroke} />,
  threads: (
    <path
      d="M16.5 8.5C15.8 6 14 4.5 11.75 4.5 8.3 4.5 6 7.6 6 12s2.3 7.5 5.75 7.5c2.7 0 4.75-1.6 4.75-4 0-2-1.6-3.25-4-3.25-1.7 0-2.75.9-2.75 2s1 1.9 2.25 1.9c2.25 0 3.25-2 3.25-5"
      {...stroke}
    />
  ),
  vimeo: <path d="M3.5 9c1.2-.9 1.9-1.6 3-1.5 1.5.2 1.6 2.2 2.1 4.6.5 2.3.9 3.9 1.6 3.9 1 0 3.4-3.5 3.6-5.1.2-1.4-.9-2-2.5-1.1.7-2.4 2.6-3.6 4.4-3.4 1.6.2 2.3 1.7 1.7 4C16.5 15 12 19.5 10.25 19.5 7.9 19.5 7.4 11 6 11c-.4 0-1.2.6-1.6.9" {...stroke} />,
  website: (
    <>
      <circle cx="12" cy="12" r="9" {...stroke} />
      <path d="M3 12h18M12 3c2.5 2.5 3.75 5.5 3.75 9S14.5 18.5 12 21c-2.5-2.5-3.75-5.5-3.75-9S9.5 5.5 12 3Z" {...stroke} />
    </>
  ),
};

export function SocialIcon({ url, size = 18, className }: { url: string; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      {paths[socialPlatform(url).key]}
    </svg>
  );
}
