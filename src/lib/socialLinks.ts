export type SocialLink = { label: string; url: string };

export type SocialPlatform =
  | "instagram"
  | "facebook"
  | "linkedin"
  | "youtube"
  | "x"
  | "pinterest"
  | "tiktok"
  | "threads"
  | "vimeo"
  | "website";

const PLATFORMS: { key: SocialPlatform; label: string; hosts: string[] }[] = [
  { key: "instagram", label: "Instagram", hosts: ["instagram.com", "instagr.am"] },
  { key: "facebook", label: "Facebook", hosts: ["facebook.com", "fb.com", "fb.me"] },
  { key: "linkedin", label: "LinkedIn", hosts: ["linkedin.com"] },
  { key: "youtube", label: "YouTube", hosts: ["youtube.com", "youtu.be"] },
  { key: "x", label: "X", hosts: ["x.com", "twitter.com"] },
  { key: "pinterest", label: "Pinterest", hosts: ["pinterest.com", "pin.it"] },
  { key: "tiktok", label: "TikTok", hosts: ["tiktok.com"] },
  { key: "threads", label: "Threads", hosts: ["threads.net", "threads.com"] },
  { key: "vimeo", label: "Vimeo", hosts: ["vimeo.com"] },
];

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function socialPlatform(url: string): { key: SocialPlatform; label: string } {
  const host = hostOf(url);
  const match = PLATFORMS.find((p) => p.hosts.some((h) => host === h || host.endsWith(`.${h}`)));
  return match ? { key: match.key, label: match.label } : { key: "website", label: host || "Website" };
}

/** Adds https:// when missing; returns "" for anything that is not a web address. */
export function normalizeSocialUrl(raw: string): string {
  const value = raw.trim();
  if (!value || /\s/.test(value)) return "";
  const withProtocol = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value.replace(/^\/+/, "")}`;
  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    if (!url.hostname.includes(".")) return "";
    return url.toString();
  } catch {
    return "";
  }
}

export function socialLinkLabel(link: SocialLink): string {
  return link.label.trim() || socialPlatform(link.url).label;
}

export function parseSocialLinks(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const url = normalizeSocialUrl(String((item as { url?: unknown }).url ?? ""));
    if (!url) return [];
    return [{ url, label: String((item as { label?: unknown }).label ?? "").trim() }];
  });
}
