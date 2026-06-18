import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeriesGalleryView } from "@/components/SeriesGalleryView";
import { isPrivateGallery } from "@/lib/privateGalleries";
import { getSeriesByAccessToken } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const s = await getSeriesByAccessToken(token);
  if (!s || !isPrivateGallery(s)) return {};
  return {
    title: `${s.title} — Private gallery`,
    description: s.excerpt,
    robots: { index: false, follow: false },
  };
}

export default async function PrivateGalleryPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const s = await getSeriesByAccessToken(token);
  if (!s || !isPrivateGallery(s)) notFound();

  return <SeriesGalleryView series={s} variant="private" />;
}
