import { GalleryLightboxProvider, GalleryLightboxTrigger } from "@/components/GalleryLightbox";
import { IntrinsicGalleryImage } from "@/components/IntrinsicGalleryImage";
import {
  severityLabel,
  type ImageResolutionItem,
  type ImageResolutionReport,
  type ImageResolutionSeverity,
} from "@/lib/imageResolutionReport";

function severityClass(severity: ImageResolutionSeverity): string {
  if (severity === "critical") return "text-ink";
  if (severity === "high") return "text-ink/80";
  return "text-muted";
}

function ItemRow({ item, index }: { item: ImageResolutionItem; index: number }) {
  const pixels = `${item.width} × ${item.height} px`;
  const weight = item.kb != null ? `${item.kb} KB` : null;

  return (
    <article className="grid gap-5 border-t border-line py-8 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-8">
      <GalleryLightboxTrigger index={index} label={`Enlarge to check quality: ${item.title}`}>
        <IntrinsicGalleryImage
          src={item.src}
          alt={item.alt}
          width={item.width}
          height={item.height}
          sizes="(max-width: 640px) 70vw, 176px"
          frameClassName="border border-line bg-white/40"
        />
      </GalleryLightboxTrigger>
      <div className="min-w-0">
        <p className={`text-xs tracking-[0.18em] uppercase ${severityClass(item.severity)}`}>
          {severityLabel(item.severity)}
        </p>
        <h3 className="mt-2 font-serif text-2xl tracking-tight">{item.title}</h3>
        <dl className="mt-4 space-y-2 text-sm leading-relaxed">
          <div>
            <dt className="text-xs tracking-[0.18em] text-muted uppercase">File</dt>
            <dd className="mt-1 break-all text-ink/85">{item.fileName}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-[0.18em] text-muted uppercase">Original size</dt>
            <dd className="mt-1 text-ink/85">
              {pixels}
              {weight ? ` · ${weight}` : ""}
            </dd>
          </div>
        </dl>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">{item.why}</p>
        {item.alsoIn.length ? (
          <p className="mt-3 text-sm text-muted">Also appears in {item.alsoIn.join(", ")}.</p>
        ) : null}
        <p className="mt-4 text-xs tracking-[0.18em] text-ink/55 uppercase">Click the photo to enlarge</p>
      </div>
    </article>
  );
}

export function ImageResolutionReportView({ report }: { report: ImageResolutionReport }) {
  const { counts, series } = report;

  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <p className="text-xs tracking-[0.22em] text-muted uppercase">Unlisted review</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl tracking-tight md:text-5xl">Image resolution</h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
            This page is not in the menu or the sitemap. It lists every photo that is smaller than the site
            displays it, so the file looks soft. Click any image to open it large — that is how visitors see
            it when they enlarge a work.
          </p>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            A photo looks sharp only when it has at least as many pixels as the screen is drawing. Gallery
            tiles are about 360px wide (about 720px on a Retina screen). The enlarged view is often
            1,000–1,600px (about 2,000–3,200px on Retina). Smaller files are stretched, and stretching cannot
            add texture.
          </p>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            If you see other images on the site that look soft, it may not be because the file is too small.
            A photograph can already be out of focus at the original size, or it may have been enlarged
            (upscaled) before it was sent to me. Adding pixels later cannot restore sharpness that was never
            in the picture.
          </p>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            Please send a new export for each work below: longest side 2,400–3,200 pixels (3,000 is a good
            target), JPEG or WebP, from the original camera file or scan — not a thumbnail from the old
            site. Same crop is fine; we only need more pixels.
          </p>
          <p className="mt-8 text-sm text-muted">
            <span className="font-medium text-ink">{counts.critical}</span> replace first
            <span className="text-line"> · </span>
            <span className="font-medium text-ink">{counts.high}</span> soft when clicked
            <span className="text-line"> · </span>
            <span className="font-medium text-ink">{counts.medium}</span> slightly soft when enlarged
            <span className="text-line"> · </span>
            {counts.total} listed of {counts.artworkTotal} artworks
          </p>
        </div>
      </section>

      <nav className="border-b border-line bg-white/35" aria-label="Series in this report">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-x-5 gap-y-2 px-5 py-5 text-sm md:px-8">
          {series.map((group) => (
            <a key={group.slug} className="link-quiet" href={`#${group.anchor}`}>
              {group.title}
              <span className="text-muted"> ({group.items.length})</span>
            </a>
          ))}
        </div>
      </nav>

      {series.map((group) => (
        <section key={group.slug} id={group.anchor} className="scroll-mt-24 border-b border-line">
          <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
            <h2 className="font-serif text-3xl tracking-tight">{group.title}</h2>
            <p className="mt-2 text-sm text-muted">{group.items.length} files below display size.</p>
            <GalleryLightboxProvider slides={group.items.map((item) => item.slide)}>
              <div className="mt-4">
                {group.items.map((item, index) => (
                  <ItemRow key={item.id} item={item} index={index} />
                ))}
              </div>
            </GalleryLightboxProvider>
          </div>
        </section>
      ))}
    </div>
  );
}
