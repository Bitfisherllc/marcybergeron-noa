export type AdminEditTarget = {
  href: string;
  label: string;
};

export function normalizeAdminPath(pathname: string): string {
  return (pathname.split("?")[0] || "/").replace(/\/$/, "") || "/";
}

/** Public pages and gallery/post/artwork editors need a database lookup for the bar. */
export function needsRemoteAdminBarState(pathname: string): boolean {
  if (!pathname.startsWith("/admin") || pathname.startsWith("/admin/login")) return true;
  return resolveLiveViewTargetSync(pathname) === null;
}

/** Sync preview target for common admin screens (no database). */
export function resolveLiveViewTargetSync(pathname: string): AdminEditTarget | null {
  const path = normalizeAdminPath(pathname);
  if (!path.startsWith("/admin") || path.startsWith("/admin/login")) return null;
  if (path === "/admin" || path === "/admin/home" || path === "/admin/inbox") {
    return { href: "/", label: "View home page" };
  }
  if (path === "/admin/about") return { href: "/about", label: "View about page" };
  if (path === "/admin/series" || path === "/admin/series/new") return { href: "/medium", label: "View portfolio" };
  if (path === "/admin/artworks/new") return { href: "/medium", label: "View portfolio" };
  if (path === "/admin/posts" || path === "/admin/posts/new") return { href: "/news", label: "View news" };
  if (path === "/admin/workshops" || path === "/admin/workshops/new") {
    return { href: "/workshops", label: "View workshops" };
  }
  if (path === "/admin/workshop-inquiries") return { href: "/workshops", label: "View workshops" };
  if (path === "/admin/mailing-list") return { href: "/mailing-list", label: "View signup page" };
  if (path === "/admin/contact" || path === "/admin/contact-page") return { href: "/contact", label: "View contact page" };
  return null;
}
