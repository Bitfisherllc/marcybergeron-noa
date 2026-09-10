"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { Artwork } from "@/db";
import { AdminFilePicker } from "@/components/AdminFilePicker";
import { HERO_SLIDESHOW_MAX, type HeroSlideshowSlot } from "@/lib/featuredArtwork";

export type AdminHeroLiveSlide = {
  src: string;
  title: string;
};

export type AdminSlideshowPiece = Pick<Artwork, "id" | "title" | "image"> & {
  label?: string;
};

type SlideshowAdminVariant = "gallery" | "home";

type AdminHeroSlideshowFieldProps = {
  pieces: AdminSlideshowPiece[];
  slots: HeroSlideshowSlot[];
  liveSlides: AdminHeroLiveSlide[];
  usingRandom: boolean;
  variant?: SlideshowAdminVariant;
  fieldPrefix?: string;
};

const COPY: Record<
  SlideshowAdminVariant,
  {
    legend: string;
    hint: string;
    paintingLabel: string;
    emptyPaintings: string;
    afterSaveEmpty: string;
    liveEmpty: string;
    previewLive: string;
    emptySlotRandom: string;
  }
> = {
  gallery: {
    legend: "Gallery page slideshow",
    hint: "Large image beside About on this gallery page. One image stays as a single photo; two or three become a slideshow. You do not have to fill every slot. Upload a photo, pick one already on the site, or choose a painting from this gallery. This is separate from the rotating card on the main Portfolio page.",
    paintingLabel: "Or painting in this gallery",
    emptyPaintings: "Add paintings if you want to pick from this gallery’s works.",
    afterSaveEmpty: "After you save, the gallery page will show random images from this gallery.",
    liveEmpty:
      "No slideshow images are chosen. The gallery page currently shows random paintings from this gallery. You can pick one image, or two or three for a slideshow, or leave this unchosen.",
    previewLive: "On the gallery page",
    emptySlotRandom: "Random from this gallery",
  },
  home: {
    legend: "Home page slideshow",
    hint: "Large image beside the opening text on the home page. One image stays as a single photo; two or three become a slideshow. You do not have to fill every slot. Upload a photo, pick one already on the site, or choose a painting. If none are chosen, the home page uses the automatic mix of series and artwork images.",
    paintingLabel: "Or painting from a gallery",
    emptyPaintings: "Add paintings if you want to pick from your galleries.",
    afterSaveEmpty: "After you save, the home page will use the automatic mix of series and artwork images.",
    liveEmpty:
      "No slideshow images are chosen. The home page currently uses the automatic mix of series and artwork images. You can pick one image, or two or three for a slideshow, or leave this unchosen.",
    previewLive: "On the home page",
    emptySlotRandom: "Automatic mix",
  },
};

type SlotDraft = {
  pickerSrc: string;
  artworkId: string;
  initialSrc: string;
  initialArtworkId: string;
};

function imageFileLabel(src: string): string {
  try {
    const path = src.startsWith("http") ? new URL(src).pathname : src;
    return decodeURIComponent(path.split("/").filter(Boolean).pop() || "a custom photo");
  } catch {
    return "a custom photo";
  }
}

function isBlobPreviewSrc(src: string) {
  return src.startsWith("blob:") || src.startsWith("data:");
}

function isRemoteSrc(src: string) {
  return src.startsWith("http://") || src.startsWith("https://");
}

function slotSavedImage(
  slot: HeroSlideshowSlot,
  byId: Map<string, Pick<Artwork, "id" | "title" | "image">>,
): string {
  return slot.image || (slot.artworkId ? (byId.get(slot.artworkId)?.image ?? "") : "");
}

function resolvedSlotSrc(
  draft: SlotDraft,
  byId: Map<string, Pick<Artwork, "id" | "title" | "image">>,
): string {
  const painting = draft.artworkId ? (byId.get(draft.artworkId)?.image ?? "") : "";
  if (draft.pickerSrc.startsWith("blob:") || draft.pickerSrc.startsWith("data:")) return draft.pickerSrc;
  if (draft.pickerSrc && draft.pickerSrc !== draft.initialSrc) return draft.pickerSrc;
  if (painting) return painting;
  return draft.pickerSrc;
}

function slotLabel(
  src: string,
  artworkId: string,
  byId: Map<string, Pick<Artwork, "id" | "title" | "image">>,
): string {
  if (artworkId) {
    const piece = byId.get(artworkId);
    if (piece) return piece.title;
  }
  const match = [...byId.values()].find((piece) => piece.image === src);
  if (match) return match.title;
  if (src && !isBlobPreviewSrc(src)) return imageFileLabel(src);
  if (src) return "New upload";
  return "";
}

function notifyFormDirty(form: HTMLFormElement | null) {
  if (!form) return;
  form.dispatchEvent(new Event("input", { bubbles: true }));
  form.dispatchEvent(new Event("change", { bubbles: true }));
}

function formatNameList(names: string[]): string {
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function SlidePreview({
  src,
  pending,
  emptyLabel,
}: {
  src: string;
  pending: boolean;
  emptyLabel: string;
}) {
  return (
    <div
      className={`relative aspect-[4/5] overflow-hidden border bg-black/[0.03] ${
        pending ? "border-ink ring-1 ring-ink/30" : "border-line"
      }`}
    >
      {src ? (
        isBlobPreviewSrc(src) || isRemoteSrc(src) ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob and remote URLs
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <Image src={src} alt="" fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
        )
      ) : (
        <div className="flex h-full items-center justify-center p-4 text-center text-xs leading-relaxed text-muted">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}

export function AdminHeroSlideshowField({
  pieces,
  slots,
  liveSlides,
  usingRandom,
  variant = "gallery",
  fieldPrefix = "heroSlide",
}: AdminHeroSlideshowFieldProps) {
  const copy = COPY[variant];
  const padded = useMemo(
    () => Array.from({ length: HERO_SLIDESHOW_MAX }, (_, i) => slots[i] ?? { artworkId: null, image: null }),
    [slots],
  );
  const byId = useMemo(() => new Map(pieces.map((piece) => [piece.id, piece])), [pieces]);
  const [drafts, setDrafts] = useState<SlotDraft[]>(() =>
    padded.map((slot) => {
      const initialSrc = slotSavedImage(slot, byId);
      return {
        pickerSrc: initialSrc,
        artworkId: slot.artworkId ?? "",
        initialSrc,
        initialArtworkId: slot.artworkId ?? "",
      };
    }),
  );

  const hasEdits = drafts.some(
    (draft) => draft.pickerSrc !== draft.initialSrc || draft.artworkId !== draft.initialArtworkId,
  );
  const displaySrcs = Array.from({ length: HERO_SLIDESHOW_MAX }, (_, i) => {
    if (hasEdits) return resolvedSlotSrc(drafts[i]!, byId);
    if (!usingRandom) return drafts[i]?.initialSrc ?? "";
    return liveSlides[i]?.src ?? "";
  });
  const displayNames = displaySrcs
    .map((src, i) => {
      if (!src) return "";
      if (!hasEdits && liveSlides[i]?.title) return liveSlides[i]!.title;
      return slotLabel(src, hasEdits ? drafts[i]!.artworkId : drafts[i]!.initialArtworkId, byId);
    })
    .filter(Boolean);
  const chosenCount = displaySrcs.filter(Boolean).length;

  function updateDraft(index: number, patch: Partial<SlotDraft>) {
    setDrafts((prev) => {
      const next = [...prev];
      next[index] = { ...next[index]!, ...patch };
      return next;
    });
  }

  return (
    <fieldset className="space-y-4 border border-line bg-paper/40 p-4">
      <legend className="px-1 text-sm font-medium text-ink">{copy.legend}</legend>
      <p className="text-xs leading-relaxed text-muted">{copy.hint}</p>
      <p className="text-sm leading-relaxed text-ink">
        {hasEdits ? (
          chosenCount === 0 ? (
            <>{copy.afterSaveEmpty}</>
          ) : chosenCount === 1 ? (
            <>Preview of the single image that will show after you save: {displayNames[0]}.</>
          ) : (
            <>
              Preview of the {chosenCount}-image slideshow that will show after you save: {formatNameList(displayNames)}.
            </>
          )
        ) : usingRandom ? (
          <>{copy.liveEmpty}</>
        ) : chosenCount === 1 ? (
          <>Currently showing a single image: {displayNames[0]}.</>
        ) : (
          <>Currently showing a {chosenCount}-image slideshow: {formatNameList(displayNames)}.</>
        )}
      </p>
      {hasEdits ? (
        <p className="text-sm leading-relaxed text-red-700">
          This preview is not live yet. Use the red SAVE button below this section to update the{" "}
          {variant === "home" ? "home" : "gallery"} page.
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-3">
        {displaySrcs.map((src, i) => (
          <div key={`preview-${i}`}>
            <p className="mb-2 text-xs tracking-wide text-muted uppercase">
              {hasEdits ? "Preview" : copy.previewLive} · {i + 1}
            </p>
            <SlidePreview
              src={src}
              pending={hasEdits && Boolean(src)}
              emptyLabel={
                hasEdits ? "Not used after save" : usingRandom ? copy.emptySlotRandom : "Not used"
              }
            />
          </div>
        ))}
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        {drafts.map((draft, i) => {
          const existingImage = draft.initialSrc;
          return (
            <div key={i} className="space-y-3">
              <p className="text-sm text-muted">Image {i + 1} (optional)</p>
              <input type="hidden" name={`${fieldPrefix}${i}Initial`} value={existingImage} />
              <AdminFilePicker
                name={`${fieldPrefix}${i}`}
                existingValue={existingImage}
                label="Upload or choose from the site"
                buttonLabel="Upload image"
                allowClear
                preview="none"
                onPreviewChange={(src) => updateDraft(i, { pickerSrc: src })}
              />
              {pieces.length > 0 ? (
                <label className="block text-sm text-muted">
                  {copy.paintingLabel}
                  <select
                    name={`${fieldPrefix}Artwork${i}`}
                    value={draft.artworkId}
                    onChange={(e) => {
                      updateDraft(i, { artworkId: e.target.value });
                      notifyFormDirty(e.currentTarget.form);
                    }}
                    className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm text-ink"
                  >
                    <option value="">— None —</option>
                    {pieces.map((piece) => (
                      <option key={piece.id} value={piece.id}>
                        {piece.label ?? piece.title}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="text-xs text-muted">{copy.emptyPaintings}</p>
              )}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
