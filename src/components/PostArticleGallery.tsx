import type { PostGalleryImage } from "@/db";
import { GalleryLightboxProvider, GalleryLightboxTrigger } from "@/components/GalleryLightbox";
import { IntrinsicGalleryImage } from "@/components/IntrinsicGalleryImage";
import { slideFromPostGalleryImage } from "@/lib/gallerySlides";

export function PostArticleGallery({ images }: { images: PostGalleryImage[] }) {
  if (images.length === 0) return null;

  const slides = images.map(slideFromPostGalleryImage);

  return (
    <section className="border-t border-line bg-white/35">
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <h2 className="font-serif text-3xl tracking-tight">Gallery</h2>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          Click an image to view it larger.
        </p>
        <GalleryLightboxProvider slides={slides}>
          <div className="mt-12 grid gap-10 sm:grid-cols-2 sm:items-start lg:grid-cols-3">
            {images.map((img, i) => {
              const label = img.caption.trim() || img.alt.trim() || `Gallery image ${i + 1}`;
              return (
                <figure key={img.id}>
                  <GalleryLightboxTrigger index={i} label={`Enlarge: ${label}`}>
                    <IntrinsicGalleryImage
                      src={img.image}
                      alt={img.alt.trim() || label}
                      width={img.imageWidth}
                      height={img.imageHeight}
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </GalleryLightboxTrigger>
                  {img.caption.trim() ? (
                    <figcaption className="mt-4 text-sm leading-relaxed text-muted">{img.caption.trim()}</figcaption>
                  ) : null}
                </figure>
              );
            })}
          </div>
        </GalleryLightboxProvider>
      </div>
    </section>
  );
}
