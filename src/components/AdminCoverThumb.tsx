import Image from "next/image";
import { GALLERY_PLACEHOLDER_IMAGE } from "@/lib/galleryDefaults";

export function hasCoverImage(image: string | null | undefined): image is string {
  return Boolean(image && image !== GALLERY_PLACEHOLDER_IMAGE);
}

/** Admin cover box: the image, or words explaining why there isn't one. */
export function AdminCoverThumb({
  image,
  className = "h-16 w-24",
  sizes = "96px",
}: {
  image: string | null | undefined;
  className?: string;
  sizes?: string;
}) {
  return (
    <div className={`relative overflow-hidden border border-line bg-black/[0.03] ${className}`}>
      {hasCoverImage(image) ? (
        <Image src={image} alt="" fill className="object-cover" sizes={sizes} />
      ) : (
        <div className="flex h-full w-full items-center justify-center px-1.5 text-center leading-tight">
          <span className="text-[10px] font-medium tracking-[0.12em] text-ink/80 uppercase">No image</span>
        </div>
      )}
    </div>
  );
}
