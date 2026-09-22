import { readFile } from "node:fs/promises";
import path from "node:path";
import { getResolvedFavicon } from "@/lib/siteFavicon";

export const dynamic = "force-dynamic";

function localPublicPath(src: string): string | null {
  if (!src.startsWith("/") || src.startsWith("//")) return null;
  return path.join(process.cwd(), "public", src.replace(/^\/+/, ""));
}

export async function GET() {
  const favicon = await getResolvedFavicon();
  if (favicon.src.startsWith("https://")) {
    const remote = await fetch(favicon.src, { cache: "no-store" });
    if (!remote.ok) return new Response("Favicon unavailable", { status: 404 });
    return new Response(remote.body, {
      headers: {
        "Content-Type": remote.headers.get("Content-Type") || favicon.type,
        "Cache-Control": "public, max-age=300",
      },
    });
  }

  const filePath = localPublicPath(favicon.src);
  if (!filePath) return new Response("Favicon unavailable", { status: 404 });
  try {
    const buf = await readFile(filePath);
    return new Response(buf, {
      headers: {
        "Content-Type": favicon.type,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return new Response("Favicon unavailable", { status: 404 });
  }
}
