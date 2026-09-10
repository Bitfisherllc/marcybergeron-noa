"use client";

import Image from "next/image";
import { useLayoutEffect, useState } from "react";

type ListingPick = {
  src: string;
  alt: string;
  width: number | null | undefined;
  height: number | null | undefined;
};

const cache = new Map<string, ListingPick>();

type Props = {
  galleryId: string;
  src: string;
  alt: string;
  width?: number | null;
  height?: number | null;
  sizes: string;
  imageClassName?: string;
};

export function GalleryListingImage({
  galleryId,
  src,
  alt,
  width,
  height,
  sizes,
  imageClassName = "",
}: Props) {
  const [pick, setPick] = useState<ListingPick>(() => {
    if (typeof window === "undefined") return { src, alt, width, height };
    return cache.get(galleryId) ?? { src, alt, width, height };
  });

  useLayoutEffect(() => {
    const cached = cache.get(galleryId);
    if (cached) {
      setPick(cached);
      return;
    }
    const next = { src, alt, width, height };
    cache.set(galleryId, next);
    setPick(next);
  }, [galleryId, src, alt, width, height]);

  return (
    <div className="overflow-hidden bg-black/[0.03]">
      {pick.src.startsWith("/") ? (
        <Image
          src={pick.src}
          alt={pick.alt}
          width={pick.width || 800}
          height={pick.height || 1000}
          sizes={sizes}
          className={`h-auto w-full max-w-full ${imageClassName}`}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- remote listing URLs
        <img src={pick.src} alt={pick.alt} className={`mx-auto block h-auto w-full max-w-full ${imageClassName}`} />
      )}
    </div>
  );
}
