import Image from "next/image";
import { getPublicImageDimensions } from "@/lib/imageDimensions";

type Props = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  /** Extra classes on the outer frame (e.g. border). */
  frameClassName?: string;
  /** Applied to the image element when dimensions are known (e.g. hover zoom). */
  imageClassName?: string;
};

/**
 * Gallery images at their natural aspect ratio for local files under `public/`.
 * Remote URLs use a plain `img` so the browser can lay out from intrinsic dimensions.
 */
export async function IntrinsicGalleryImage({
  src,
  alt,
  sizes,
  priority,
  frameClassName = "",
  imageClassName = "",
}: Props) {
  if (!src.startsWith("/")) {
    return (
      <div className={`overflow-hidden bg-black/[0.03] ${frameClassName}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- remote URLs: intrinsic sizing without known dimensions */}
        <img
          src={src}
          alt={alt}
          className={`mx-auto block h-auto w-full max-w-full ${imageClassName}`}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      </div>
    );
  }

  const dim = await getPublicImageDimensions(src);
  if (dim) {
    return (
      <div className={`overflow-hidden bg-black/[0.03] ${frameClassName}`}>
        <Image
          src={src}
          alt={alt}
          width={dim.width}
          height={dim.height}
          sizes={sizes}
          priority={priority}
          className={`h-auto w-full max-w-full ${imageClassName}`}
        />
      </div>
    );
  }

  return (
    <div className={`relative aspect-[4/5] w-full overflow-hidden bg-black/[0.03] ${frameClassName}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-contain ${imageClassName}`}
      />
    </div>
  );
}
