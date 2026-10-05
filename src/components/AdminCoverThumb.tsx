import Image from "next/image";
import { GALLERY_PLACEHOLDER_IMAGE } from "@/lib/galleryDefaults";

export function hasCoverImage(image: string | null | undefined): image is string {
  return Boolean(image && image !== GALLERY_PLACEHOLDER_IMAGE);
}

/** Admin cover box: the image, or words explaining why there isn't one. */
export function AdminCoverThumb({
  image,
  random,
  randomBadge = false,
  className = "h-16 w-24",
  sizes = "96px",
}: {
  image: string | null | undefined;
  random: boolean;
  randomBadge?: boolean;
  className?: string;
  sizes?: string;
}) {
  return (
    <div className={`relative overflow-hidden border border-line bg-black/[0.03] ${className}`}>
      {hasCoverImage(image) ? (
        <>
          <Image src={image} alt="" fill className="object-cover" sizes={sizes} />
          {random && randomBadge ? (
            <span className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-center text-[9px] tracking-[0.12em] text-white uppercase">
              Random image
            </span>
          ) : null}
        </>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center px-1.5 text-center leading-tight">
          <span className="text-[10px] font-medium tracking-[0.12em] text-ink/80 uppercase">
            {random ? "Random image" : "No image"}
          </span>
          {random ? <span className="mt-0.5 text-[9px] text-muted">Changes each visit</span> : null}
        </div>
      )}
    </div>
  );
}
